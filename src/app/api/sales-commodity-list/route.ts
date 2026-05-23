import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const list = searchParams.get('list') ?? ''

    const fieldMap: Record<string, object> = {
      'rice-rough-export':   { riceRoughExport: true },
      'rice-rough-domestic': { riceRoughDomestic: true },
      'soybeans-domestic':   { soybeansDomestic: true },
      'soybeans-export':     { soybeansExport: true },
      'corn-domestic':       { cornDomestic: true },
      'corn-export':         { cornExport: true },
    }

    const filter = fieldMap[list] ?? {}

    const contacts = await prisma.contact.findMany({
      where: { contactType: 'CUSTOMER', ...filter },
      select: {
        id: true, farmingEntityName: true,
        firstName: true, lastName: true, phone: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json(contacts)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
  }
}
