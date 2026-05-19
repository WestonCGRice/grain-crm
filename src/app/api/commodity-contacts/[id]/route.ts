import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { interestLevel, estimatedVolume, notes } = body

    const row = await prisma.commodityContact.update({
      where: { id },
      data: {
        interestLevel,
        estimatedVolume: estimatedVolume ? parseFloat(estimatedVolume) : null,
        notes: notes || null,
      },
      include: { contact: true },
    })
    return NextResponse.json(row)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update commodity contact' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.commodityContact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to remove contact from commodity' }, { status: 500 })
  }
}
