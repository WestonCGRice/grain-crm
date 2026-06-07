import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

async function requireAdmin() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return null
  return session
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const ticket = await prisma.scaleTicket.findUnique({ where: { id }, include: { grades: true } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const { ticketType, ticketDate, cropYear, commodity, grossWeight, tareWeight, billOfLading, status, grades } = body

    const gross = grossWeight !== '' && grossWeight != null ? parseFloat(grossWeight) : null
    const tare = tareWeight !== '' && tareWeight != null ? parseFloat(tareWeight) : null
    const net = gross != null && tare != null ? gross - tare : null

    const ticket = await prisma.scaleTicket.update({
      where: { id },
      data: {
        ...(ticketType !== undefined ? { ticketType } : {}),
        ...(ticketDate !== undefined ? { ticketDate: new Date(ticketDate) } : {}),
        ...(cropYear !== undefined ? { cropYear: cropYear || null } : {}),
        ...(commodity !== undefined ? { commodity: commodity || null } : {}),
        grossWeight: gross,
        tareWeight: tare,
        netWeight: net,
        ...(billOfLading !== undefined ? { billOfLading: billOfLading ? billOfLading.slice(0, 15) : null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    })

    // Upsert grades if provided
    if (grades) {
      const gradeData = {
        moisture: grades.moisture !== '' && grades.moisture != null ? parseFloat(grades.moisture) : null,
        testWeight: grades.testWeight !== '' && grades.testWeight != null ? parseFloat(grades.testWeight) : null,
        foreignMatter: grades.foreignMatter !== '' && grades.foreignMatter != null ? parseFloat(grades.foreignMatter) : null,
        splits: grades.splits !== '' && grades.splits != null ? parseFloat(grades.splits) : null,
        totalDamage: grades.totalDamage !== '' && grades.totalDamage != null ? parseFloat(grades.totalDamage) : null,
        heatDamage: grades.heatDamage !== '' && grades.heatDamage != null ? parseFloat(grades.heatDamage) : null,
        milling: grades.milling !== '' && grades.milling != null ? parseFloat(grades.milling) : null,
        wholeGrain: grades.wholeGrain !== '' && grades.wholeGrain != null ? parseFloat(grades.wholeGrain) : null,
        grade: grades.grade || null,
        notes: grades.notes || null,
      }
      await prisma.scaleTicketGrade.upsert({
        where: { ticketId: id },
        update: gradeData,
        create: { ticketId: id, ...gradeData },
      })
    }

    const result = await prisma.scaleTicket.findUnique({ where: { id }, include: { grades: true } })
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  const { id } = await params
  try {
    await prisma.scaleTicket.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
