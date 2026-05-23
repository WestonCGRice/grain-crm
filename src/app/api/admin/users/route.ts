import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendInviteEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, name: true, email: true,
      isAdmin: true, contractNotifications: true,
      totpEnabled: true, mustSetPassword: true, createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { username, name, email, isAdmin, contractNotifications } = body

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 })
    }

    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 72 * 60 * 60 * 1000)
    const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)

    const user = await prisma.user.create({
      data: {
        username,
        name: name || null,
        email,
        passwordHash: tempHash,
        isAdmin: isAdmin ?? false,
        contractNotifications: contractNotifications ?? false,
        inviteToken,
        inviteExpires,
        mustSetPassword: true,
      },
    })

    try {
      await sendInviteEmail(email, name || username, inviteToken)
    } catch (emailErr) {
      console.error('[email] Failed to send invite:', emailErr)
    }

    return NextResponse.json({
      id: user.id, username: user.username, name: user.name, email: user.email,
      isAdmin: user.isAdmin, contractNotifications: user.contractNotifications,
    }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
