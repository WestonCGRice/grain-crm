import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

const DISPATCH_INCLUDE = {
  truck: { select: { id: true, number: true } },
  driver: { select: { id: true, name: true } },
  pickupLocation: { select: { id: true, name: true } },
  deliveryLocation: { select: { id: true, name: true } },
}

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') // YYYY-MM-DD

  let where = {}
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`)
    const end = new Date(`${date}T23:59:59.999Z`)
    where = { startTime: { gte: start, lte: end } }
  }

  const dispatches = await prisma.dispatch.findMany({
    where,
    include: DISPATCH_INCLUDE,
    orderBy: { startTime: 'asc' },
  })
  return NextResponse.json(dispatches)
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { truckId, driverId, commodity, pickupLocationId, deliveryLocationId, startTime, durationMinutes, notes } = await req.json()
    if (!truckId || !driverId || !commodity || !pickupLocationId || !deliveryLocationId || !startTime) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    const dispatch = await prisma.dispatch.create({
      data: {
        truckId, driverId, commodity,
        pickupLocationId, deliveryLocationId,
        startTime: new Date(startTime),
        durationMinutes: durationMinutes ?? 90,
        notes: notes || null,
      },
      include: DISPATCH_INCLUDE,
    })
    return NextResponse.json(dispatch, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create dispatch' }, { status: 500 })
  }
}
