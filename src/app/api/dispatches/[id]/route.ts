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

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { truckId, driverId, commodity, pickupLocationId, deliveryLocationId, startTime, durationMinutes, notes } = body
  const dispatch = await prisma.dispatch.update({
    where: { id },
    data: {
      ...(truckId !== undefined ? { truckId } : {}),
      ...(driverId !== undefined ? { driverId } : {}),
      ...(commodity !== undefined ? { commodity } : {}),
      ...(pickupLocationId !== undefined ? { pickupLocationId } : {}),
      ...(deliveryLocationId !== undefined ? { deliveryLocationId } : {}),
      ...(startTime !== undefined ? { startTime: new Date(startTime) } : {}),
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
    },
    include: DISPATCH_INCLUDE,
  })
  return NextResponse.json(dispatch)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.dispatch.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
