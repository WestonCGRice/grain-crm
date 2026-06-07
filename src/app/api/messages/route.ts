import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { sendSms } from '@/lib/twilio'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

const COMMODITY_FLAG: Record<string, string> = {
  CORN: 'cornList',
  SOYBEANS: 'soybeanList',
  RICE: 'riceList',
}

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const records = await prisma.messageRecord.findMany({ orderBy: { sentAt: 'desc' } })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { commodity, messageText } = await req.json()
    if (!commodity || !messageText?.trim()) {
      return NextResponse.json({ error: 'Commodity and message are required' }, { status: 400 })
    }

    const listFlag = COMMODITY_FLAG[commodity]
    if (!listFlag) {
      return NextResponse.json({ error: 'Invalid commodity' }, { status: 400 })
    }

    // Find opted-in contacts on the selected list with a phone number
    const contacts = await prisma.contact.findMany({
      where: {
        contactType: 'ORIGINATION',
        [listFlag]: true,
        smsOptIn: true,
        phone: { not: null },
      },
      select: { id: true, phone: true },
    })

    // Send SMS to each (errors are non-fatal)
    let sent = 0
    for (const contact of contacts) {
      if (!contact.phone) continue
      try {
        await sendSms(contact.phone, messageText.trim())
        sent++
      } catch (err) {
        console.error(`[twilio] Failed to send to contact ${contact.id}:`, err)
      }
    }

    const sentByName = session.user.name ?? 'Merchandising Team'
    const record = await prisma.messageRecord.create({
      data: {
        commodity,
        messageText: messageText.trim(),
        recipientCount: sent,
        sentByName,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
