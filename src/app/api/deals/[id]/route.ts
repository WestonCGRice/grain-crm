import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { upsertFuturesContract } from '@/lib/futures'

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

const COMPLETED_STATUSES = ['COMPLETED', 'COMPLETED_UNFILLED', 'COMPLETED_FILLED', 'SETTLED']

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const { id } = await params
    const body = await req.json()
    const {
      quantity, pricePerBushel, basis,
      cropYear, futuresMonth, futuresYear, orderEntered, hedged,
      status, dealDate, notes, dealType,
      pickedUpLocationId, deliveredLocationId,
    } = body

    const qty = parseFloat(quantity)
    const futuresPrice = parseFloat(pricePerBushel)
    const basisVal = basis !== '' && basis != null ? parseFloat(basis) : null
    const cashPrice = basisVal != null ? futuresPrice + basisVal : futuresPrice
    const total = qty * cashPrice

    const current = await prisma.deal.findUnique({
      where: { id },
      include: { contact: true },
    })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let contractNumber = current.contractNumber ?? null
    const isCompleted = COMPLETED_STATUSES.includes(status)
    if (isCompleted && !contractNumber && dealType) {
      contractNumber = await generateContractNumber(dealType as 'PURCHASE' | 'SALE')
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        quantity: qty, pricePerBushel: futuresPrice, basis: basisVal,
        totalValue: total, status, contractNumber,
        cropYear: cropYear || null, futuresMonth: futuresMonth || null,
        futuresYear: futuresYear || null, orderEntered: orderEntered || null,
        hedged: hedged || null,
        dealDate: dealDate ? new Date(dealDate) : undefined,
        notes: notes || null,
        pickedUpLocationId: pickedUpLocationId !== undefined ? (pickedUpLocationId || null) : undefined,
        deliveredLocationId: deliveredLocationId !== undefined ? (deliveredLocationId || null) : undefined,
      },
      include: { contact: true },
    })

    // Auto-create/update/delete futures contract for hedged sales
    await upsertFuturesContract(deal)

    // Audit log when status changes
    if (userId && current.status !== status) {
      await prisma.contractAuditLog.create({
        data: {
          dealId: deal.id,
          userId,
          action: 'STATUS_CHANGED',
          fromStatus: current.status,
          toStatus: status,
          contractNumber: deal.contractNumber,
          commodity: deal.commodity,
          contactName: `${deal.contact.firstName} ${deal.contact.lastName}`,
        },
      })
    }

    return NextResponse.json(deal)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

// Restore a deleted contract to a specified status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const { id } = await params
    const { status } = await req.json()

    const current = await prisma.deal.findUnique({
      where: { id },
      include: { contact: true },
    })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const deal = await prisma.deal.update({
      where: { id },
      data: { status: status ?? 'PENDING', deletedAt: null },
    })

    if (userId) {
      await prisma.contractAuditLog.create({
        data: {
          dealId: deal.id,
          userId,
          action: 'RESTORED',
          fromStatus: 'DELETED',
          toStatus: deal.status,
          contractNumber: current.contractNumber,
          commodity: current.commodity,
          contactName: `${current.contact.firstName} ${current.contact.lastName}`,
        },
      })
    }

    return NextResponse.json(deal)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to restore contract' }, { status: 500 })
  }
}

// Soft delete — moves contract to DELETED status, sets deletedAt
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const { id } = await params
    const current = await prisma.deal.findUnique({
      where: { id },
      include: { contact: true },
    })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    })

    if (userId) {
      await prisma.contractAuditLog.create({
        data: {
          dealId: deal.id,
          userId,
          action: 'DELETED',
          fromStatus: current.status,
          toStatus: 'DELETED',
          contractNumber: current.contractNumber,
          commodity: current.commodity,
          contactName: `${current.contact.firstName} ${current.contact.lastName}`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
