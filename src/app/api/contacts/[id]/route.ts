import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        commodityContacts: true,
        interactions: { orderBy: { date: 'desc' } },
        deals: { orderBy: { dealDate: 'desc' } },
      },
    })
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(contact)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      farmingEntityName, firstName, lastName, email, phone, company, title,
      address, city, state, zip, notes, status,
      riceAcres, cornAcres, soybeanAcres, riceEstYield, cornEstYield, soybeanEstYield,
    } = body

    const contact = await prisma.contact.update({
      where: { id },
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
        status,
        riceAcres: riceAcres ? parseFloat(riceAcres) : null,
        cornAcres: cornAcres ? parseFloat(cornAcres) : null,
        soybeanAcres: soybeanAcres ? parseFloat(soybeanAcres) : null,
        riceEstYield: riceEstYield ? parseFloat(riceEstYield) : null,
        cornEstYield: cornEstYield ? parseFloat(cornEstYield) : null,
        soybeanEstYield: soybeanEstYield ? parseFloat(soybeanEstYield) : null,
      },
    })
    return NextResponse.json(contact)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
