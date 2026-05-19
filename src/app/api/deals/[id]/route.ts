import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { quantity, pricePerBushel, basis, futuresMonth, hedged, status, dealDate, notes } = body

    const qty = parseFloat(quantity)
    const futuresPrice = parseFloat(pricePerBushel)
    const basisVal = basis !== '' && basis != null ? parseFloat(basis) : null

    const cashPrice = basisVal != null ? futuresPrice + basisVal : futuresPrice
    const total = qty * cashPrice

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        quantity: qty,
        pricePerBushel: futuresPrice,
        basis: basisVal,
        totalValue: total,
        status,
        futuresMonth: futuresMonth || null,
        hedged: hedged || null,
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
