import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function generateContractNumber(dealType: 'PURCHASE' | 'SALE'): Promise<string> {
  const prefix = dealType === 'PURCHASE' ? '1' : '9'
  const startNum = dealType === 'PURCHASE' ? 10000001 : 90000001

  const latest = await prisma.deal.findFirst({
    where: { contractNumber: { startsWith: prefix } },
    orderBy: { contractNumber: 'desc' },
  })

  if (!latest?.contractNumber) return String(startNum)
  return String(parseInt(latest.contractNumber, 10) + 1)
}

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
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      contactId, commodity, quantity, pricePerBushel, basis,
      cropYear, futuresMonth, futuresYear, hedged,
      status, dealDate, notes, dealType,
    } = body

    const qty = parseFloat(quantity)
    const futuresPrice = parseFloat(pricePerBushel)
    const basisVal = basis !== '' && basis != null ? parseFloat(basis) : null
    const cashPrice = basisVal != null ? futuresPrice + basisVal : futuresPrice
    const total = qty * cashPrice

    let contractNumber: string | null = null
    if (status === 'COMPLETED' && dealType) {
      contractNumber = await generateContractNumber(dealType as 'PURCHASE' | 'SALE')
    }

    const deal = await prisma.deal.create({
      data: {
        contactId,
        commodity,
        quantity: qty,
        pricePerBushel: futuresPrice,
        basis: basisVal,
        totalValue: total,
        status: status ?? 'PENDING',
        contractNumber,
        cropYear: cropYear || null,
        futuresMonth: futuresMonth || null,
        futuresYear: futuresYear || null,
        hedged: hedged || null,
        dealDate: dealDate ? new Date(dealDate) : new Date(),
        notes: notes || null,
      },
      include: { contact: true },
    })
    return NextResponse.json(deal, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
