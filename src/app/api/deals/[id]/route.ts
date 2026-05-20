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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      quantity, pricePerBushel, basis,
      cropYear, futuresMonth, futuresYear, hedged,
      status, dealDate, notes, dealType,
    } = body

    const qty = parseFloat(quantity)
    const futuresPrice = parseFloat(pricePerBushel)
    const basisVal = basis !== '' && basis != null ? parseFloat(basis) : null
    const cashPrice = basisVal != null ? futuresPrice + basisVal : futuresPrice
    const total = qty * cashPrice

    // Read current deal to decide whether to generate a contract number
    const current = await prisma.deal.findUnique({ where: { id } })

    let contractNumber = current?.contractNumber ?? null
    if (status === 'COMPLETED' && !contractNumber && dealType) {
      contractNumber = await generateContractNumber(dealType as 'PURCHASE' | 'SALE')
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        quantity: qty,
        pricePerBushel: futuresPrice,
        basis: basisVal,
        totalValue: total,
        status,
        contractNumber,
        cropYear: cropYear || null,
        futuresMonth: futuresMonth || null,
        futuresYear: futuresYear || null,
        hedged: hedged || null,
        dealDate: dealDate ? new Date(dealDate) : undefined,
        notes: notes || null,
      },
      include: { contact: true },
    })
    return NextResponse.json(deal)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
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
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
