import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const UNFILLED_STATUSES = ['PENDING', 'COMPLETED', 'COMPLETED_UNFILLED']

export async function GET() {
  try {
    const [
      totalOriginationContacts,
      totalSalesContacts,
      totalUnfilledPurchaseContracts,
      totalUnfilledSalesContracts,
      contactsByStatus,
      dealsByCommodity,
      recentContacts,
      recentDeals,
    ] = await Promise.all([
      prisma.contact.count({ where: { contactType: 'ORIGINATION' } }),
      prisma.contact.count({ where: { contactType: 'CUSTOMER' } }),
      prisma.deal.count({ where: { dealType: 'PURCHASE', status: { in: UNFILLED_STATUSES as never[] }, deletedAt: null } }),
      prisma.deal.count({ where: { dealType: 'SALE', status: { in: UNFILLED_STATUSES as never[] }, deletedAt: null } }),
      prisma.contact.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.deal.groupBy({ by: ['commodity'], _count: { id: true }, _sum: { totalValue: true } }),
      prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, company: true, status: true, createdAt: true },
      }),
      prisma.deal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { contact: { select: { firstName: true, lastName: true } } },
      }),
    ])

    return NextResponse.json({
      totalOriginationContacts,
      totalSalesContacts,
      totalUnfilledPurchaseContracts,
      totalUnfilledSalesContracts,
      contactsByStatus,
      dealsByCommodity,
      recentContacts,
      recentDeals,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
