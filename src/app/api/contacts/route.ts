import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? ''

    const contacts = await prisma.contact.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { company: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          status ? { status: status as never } : {},
        ],
      },
      include: {
        commodityContacts: true,
        _count: { select: { interactions: true, deals: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
    return NextResponse.json(contacts)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      farmingEntityName, firstName, lastName, email, phone, company, title,
      address, city, state, zip, notes, status,
      riceAcres, cornAcres, soybeanAcres, riceEstYield, cornEstYield, soybeanEstYield,
    } = body

    const contact = await prisma.contact.create({
      data: {
        farmingEntityName: farmingEntityName || null,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        company: company || null,
        title: title || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        notes: notes || null,
        status: status ?? 'LEAD',
        riceAcres: riceAcres ? parseFloat(riceAcres) : null,
        cornAcres: cornAcres ? parseFloat(cornAcres) : null,
        soybeanAcres: soybeanAcres ? parseFloat(soybeanAcres) : null,
        riceEstYield: riceEstYield ? parseFloat(riceEstYield) : null,
        cornEstYield: cornEstYield ? parseFloat(cornEstYield) : null,
        soybeanEstYield: soybeanEstYield ? parseFloat(soybeanEstYield) : null,
      },
    })
    return NextResponse.json(contact, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
