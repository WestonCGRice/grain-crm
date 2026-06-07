import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { sendContractNotificationEmail } from '@/lib/email'
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contactId = searchParams.get('contactId')
    const commodity = searchParams.get('commodity')
    const status = searchParams.get('status')
    const statuses = searchParams.get('statuses')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const statusFilter = statuses
      ? { status: { in: statuses.split(',') as never[] } }
      : status
        ? { status: status as never }
        : {}

    const deals = await prisma.deal.findMany({
      where: {
        ...(contactId ? { contactId } : {}),
        ...(commodity ? { commodity: commodity as never } : {}),
        ...statusFilter,
        ...(!includeDeleted ? { deletedAt: null } : {}),
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
    const session = await auth()
    const userId = session?.user?.id

    const body = await req.json()
    const {
      contactId, commodity, quantity, pricePerBushel, basis,
      cropYear, futuresMonth, futuresYear, orderEntered, hedged,
      status, dealDate, notes, dealType,
      pickedUpLocationId, deliveredLocationId,
    } = body

    const qty = parseFloat(quantity)
    const futuresPrice = parseFloat(pricePerBushel)
    const basisVal = basis !== '' && basis != null ? parseFloat(basis) : null
    const cashPrice = basisVal != null ? futuresPrice + basisVal : futuresPrice
    const total = qty * cashPrice

    let contractNumber: string | null = null
    const isCompleted = COMPLETED_STATUSES.includes(status)
    if (isCompleted && dealType) {
      contractNumber = await generateContractNumber(dealType as 'PURCHASE' | 'SALE')
    }

    const deal = await prisma.deal.create({
      data: {
        contactId, commodity,
        quantity: qty, pricePerBushel: futuresPrice, basis: basisVal,
        totalValue: total,
        status: status ?? 'PENDING',
        contractNumber,
        cropYear: cropYear || null, futuresMonth: futuresMonth || null,
        futuresYear: futuresYear || null, orderEntered: orderEntered || null,
        hedged: hedged || null,
        dealDate: dealDate ? new Date(dealDate) : new Date(),
        notes: notes || null,
        dealType: dealType || null,
        pickedUpLocationId: pickedUpLocationId || null,
        deliveredLocationId: deliveredLocationId || null,
      },
      include: { contact: true },
    })

    // Audit log
    if (userId) {
      await prisma.contractAuditLog.create({
        data: {
          dealId: deal.id,
          userId,
          action: 'CREATED',
          toStatus: deal.status,
          contractNumber: deal.contractNumber,
          commodity: deal.commodity,
          contactName: `${deal.contact.firstName} ${deal.contact.lastName}`,
        },
      })
    }

    // Auto-create/update futures contract for hedged sales
    await upsertFuturesContract(deal)

    // Contract notification emails
    try {
      const notifyUsers = await prisma.user.findMany({
        where: { contractNotifications: true, email: { not: null } },
        select: { email: true },
      })
      const emails = notifyUsers.map((u) => u.email!).filter(Boolean)
      if (emails.length > 0) {
        const cashPriceDisplay = basisVal != null ? String(futuresPrice + basisVal) : null
        await sendContractNotificationEmail(emails, {
          dealLabel: dealType === 'SALE' ? 'Sell Grain' : 'Purchase Grain',
          contractNumber: deal.contractNumber,
          commodity: deal.commodity,
          contactName: `${deal.contact.firstName} ${deal.contact.lastName}`,
          quantity: String(qty),
          futuresPrice: String(futuresPrice),
          basis: basisVal != null ? String(basisVal) : null,
          cashPrice: cashPriceDisplay,
          totalValue: String(total),
          cropYear: deal.cropYear,
          futuresMonth: deal.futuresMonth,
          futuresYear: deal.futuresYear,
          hedged: deal.hedged,
          status: deal.status,
          dealDate: deal.dealDate.toISOString().slice(0, 10),
          notes: deal.notes,
        })
      }
    } catch (emailErr) {
      console.error('[email] Failed to send contract notification:', emailErr)
    }

    return NextResponse.json(deal, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
