import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contactId, type, date, notes } = body

    const interaction = await prisma.interaction.create({
      data: {
        contactId,
        type,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    })
    return NextResponse.json(interaction, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
