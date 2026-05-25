import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

const MONTH_ORDER: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const commodity = req.nextUrl.searchParams.get('commodity')

  const contracts = await prisma.futuresContract.findMany({
    where: commodity ? { commodity: commodity as never } : {},
    include: {
      deal: {
        select: {
          contractNumber: true,
          dealType: true,
          contact: { select: { firstName: true, lastName: true, farmingEntityName: true } },
        },
      },
    },
  })

  // Sort by nearest maturity: year asc, then month order asc
  contracts.sort((a, b) => {
    const yearDiff = parseInt(a.futuresYear) - parseInt(b.futuresYear)
    if (yearDiff !== 0) return yearDiff
    return (MONTH_ORDER[a.futuresMonth] ?? 99) - (MONTH_ORDER[b.futuresMonth] ?? 99)
  })

  return NextResponse.json(contracts)
}
