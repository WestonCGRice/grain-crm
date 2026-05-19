import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contactId = searchParams.get('contactId')
    const commodity = searchParams.get('commodity')

    const deals = await prisma.deal.findMany({
      where: {
        ...(contactId ? { contactId } : {}),
        ...(commodity ? { commodity: commodity as never } : {}),
      },
      include: { contact: true },
      orderBy: { dealDate: 'desc' },
    })
    return NextResponse.json(deals)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contactId, commodity, quantity, pricePerBushel, basis, futuresMonth, hedged, status, dealDate, notes } = body

    const qty = parseFloat(quantity)
    const futuresPrice = parseFloat(pricePerBushel)
    const basisVal = basis !== '' && basis != null ? parseFloat(basis) : null

    const cashPrice = basisVal != null ? futuresPrice + basisVal : futuresPrice
    const total = qty * cashPrice

    const deal = await prisma.deal.create({
      data: {
        contactId,
        commodity,
        quantity: qty,
        pricePerBushel: futuresPrice,
        basis: basisVal,
        totalValue: total,
        status: status ?? 'PENDING',
        futuresMonth: futuresMonth || null,
        hedged: hedged || null,
        dealDate: dealDate ? new Date(dealDate) : new Date(),
        notes: notes || null,
      },
      include: { contact: true },
    })
    return NextResponse.json(deal, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}
