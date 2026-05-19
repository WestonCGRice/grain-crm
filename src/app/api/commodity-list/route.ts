import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const commodity = searchParams.get('commodity') ?? ''

    const filterMap: Record<string, object> = {
      RICE: { riceList: true },
      CORN: { cornList: true },
      SOYBEAN: { soybeanList: true },
    }

    const where = filterMap[commodity.toUpperCase()] ?? {
      OR: [{ riceList: true }, { cornList: true }, { soybeanList: true }],
    }

    const contacts = await prisma.contact.findMany({
      where: { ...where, contactType: 'ORIGINATION' },
      select: {
        id: true,
        farmingEntityName: true,
        firstName: true,
        lastName: true,
        phone: true,
        riceList: true,
        cornList: true,
        soybeanList: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json(contacts)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch commodity list' }, { status: 500 })
  }
}
