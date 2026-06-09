import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendInviteEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return null
  return session
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!user.email) return NextResponse.json({ error: 'User has no email address on file' }, { status: 400 })

  const inviteToken = crypto.randomBytes(32).toString('hex')
  const inviteExpires = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id },
    data: {
      inviteToken,
      inviteExpires,
      mustSetPassword: true,
      accountLocked: false,
      failedLoginAttempts: 0,
      failedLoginWindowStart: null,
    },
  })

  try {
    await sendInviteEmail(user.email, user.name ?? user.username, inviteToken)
  } catch (err) {
    console.error('[email] Failed to send invite:', err)
    return NextResponse.json({ error: 'Invite saved but email failed to send. Check SMTP settings.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
