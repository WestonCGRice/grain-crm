import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { quantity, pricePerBushel, status, dealDate, notes } = body

    const qty = parseFloat(quantity)
    const price = parseFloat(pricePerBushel)
    const total = qty * price

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        quantity: qty,
        pricePerBushel: price,
        totalValue: total,
        status,
        dealDate: dealDate ? new Date(dealDate) : undefined,
        notes: notes || null,
      },
      include: { contact: true },
    })
    return NextResponse.json(deal)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}
