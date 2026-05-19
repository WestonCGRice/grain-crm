import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const commodity = searchParams.get('commodity')
    if (!commodity) {
      return NextResponse.json({ error: 'commodity param required' }, { status: 400 })
    }

    const rows = await prisma.commodityContact.findMany({
      where: { commodity: commodity as never },
      include: {
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch commodity contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contactId, commodity, interestLevel, estimatedVolume, notes } = body

    const existing = await prisma.commodityContact.findUnique({
      where: { contactId_commodity: { contactId, commodity } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Contact already assigned to this commodity' }, { status: 409 })
    }

    const row = await prisma.commodityContact.create({
      data: {
        contactId,
        commodity,
        interestLevel: interestLevel ?? 'MEDIUM',
        estimatedVolume: estimatedVolume ? parseFloat(estimatedVolume) : null,
        notes: notes || null,
      },
      include: { contact: true },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to assign contact to commodity' }, { status: 500 })
  }
}
