import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ commodity: string }> }
) {
  try {
    const { commodity } = await params
    const comm = commodity.toUpperCase() as 'CORN' | 'SOYBEANS' | 'RICE'

    const [contacts, deals, interactions] = await Promise.all([
      prisma.commodityContact.findMany({
        where: { commodity: comm },
        include: { contact: true },
      }),
      prisma.deal.findMany({
        where: { commodity: comm },
        include: { contact: true },
        orderBy: { dealDate: 'asc' },
      }),
      prisma.interaction.findMany({
        where: { contact: { commodityContacts: { some: { commodity: comm } } } },
        orderBy: { date: 'asc' },
      }),
    ])

    // Monthly deal aggregation for chart
    const monthlyMap = new Map<string, { volume: number; value: number; count: number }>()
    for (const deal of deals) {
      const key = deal.dealDate.toISOString().slice(0, 7)
      const prev = monthlyMap.get(key) ?? { volume: 0, value: 0, count: 0 }
      monthlyMap.set(key, {
        volume: prev.volume + Number(deal.quantity),
        value: prev.value + Number(deal.totalValue),
        count: prev.count + 1,
      })
    }
    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))

    // Status breakdown
    const statusMap = new Map<string, number>()
    for (const deal of deals) {
      statusMap.set(deal.status, (statusMap.get(deal.status) ?? 0) + 1)
    }
    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

    // Interest level breakdown
    const interestMap = new Map<string, number>()
    for (const c of contacts) {
      interestMap.set(c.interestLevel, (interestMap.get(c.interestLevel) ?? 0) + 1)
    }
    const interestBreakdown = Array.from(interestMap.entries()).map(([level, count]) => ({ level, count }))

    // Interaction type breakdown
    const interactionMap = new Map<string, number>()
    for (const i of interactions) {
      interactionMap.set(i.type, (interactionMap.get(i.type) ?? 0) + 1)
    }
    const interactionBreakdown = Array.from(interactionMap.entries()).map(([type, count]) => ({ type, count }))

    // KPIs
    const totalVolume = deals.reduce((s: number, d) => s + Number(d.quantity), 0)
    const totalValue = deals.reduce((s: number, d) => s + Number(d.totalValue), 0)
    const completedDeals = deals.filter((d) => d.status === 'COMPLETED')
    const completedVolume = completedDeals.reduce((s: number, d) => s + Number(d.quantity), 0)
    const avgDealSize = deals.length > 0 ? totalVolume / deals.length : 0

    return NextResponse.json({
      kpis: {
        totalContacts: contacts.length,
        totalDeals: deals.length,
        totalVolume,
        totalValue,
        completedDeals: completedDeals.length,
        completedVolume,
        avgDealSize,
        totalInteractions: interactions.length,
      },
      monthlyData,
      statusBreakdown,
      interestBreakdown,
      interactionBreakdown,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
