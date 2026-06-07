import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

async function generateTicketNumber(): Promise<string> {
  const latest = await prisma.scaleTicket.findFirst({ orderBy: { ticketNumber: 'desc' } })
  if (!latest) return '000000001'
  const next = parseInt(latest.ticketNumber, 10) + 1
  return String(next).padStart(9, '0')
}

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const tickets = await prisma.scaleTicket.findMany({
    where: status ? { status } : {},
    include: { grades: true },
    orderBy: { ticketNumber: 'desc' },
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { ticketType, ticketDate, cropYear, commodity, grossWeight, tareWeight, billOfLading } = body

    if (!ticketType) return NextResponse.json({ error: 'Ticket type is required' }, { status: 400 })

    const ticketNumber = await generateTicketNumber()
    const gross = grossWeight !== '' && grossWeight != null ? parseFloat(grossWeight) : null
    const tare = tareWeight !== '' && tareWeight != null ? parseFloat(tareWeight) : null
    const net = gross != null && tare != null ? gross - tare : null

    const ticket = await prisma.scaleTicket.create({
      data: {
        ticketNumber,
        ticketType,
        ticketDate: ticketDate ? new Date(ticketDate) : new Date(),
        cropYear: cropYear || null,
        commodity: commodity || null,
        grossWeight: gross,
        tareWeight: tare,
        netWeight: net,
        billOfLading: billOfLading ? billOfLading.slice(0, 15) : null,
        status: 'ACTIVE',
      },
      include: { grades: true },
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
