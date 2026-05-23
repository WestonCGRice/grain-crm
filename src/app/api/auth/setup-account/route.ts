import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { generateSecret, keyuri, verifyTOTP } from '@/lib/totp'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: { inviteToken: token, inviteExpires: { gt: new Date() } },
    select: { id: true, username: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'This invitation link is invalid or has expired.' }, { status: 400 })

  return NextResponse.json(user)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, step, password, totpCode } = body

  const user = await prisma.user.findFirst({
    where: { inviteToken: token, inviteExpires: { gt: new Date() } },
    select: { id: true, username: true, name: true, totpSecret: true },
  })
  if (!user) return NextResponse.json({ error: 'This invitation link is invalid or has expired.' }, { status: 400 })

  if (step === 'init-totp') {
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const secret = generateSecret()
    const otpAuthUrl = keyuri(user.name ?? user.username, 'GrainCRM', secret)
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, totpSecret: secret },
    })

    return NextResponse.json({ qrCodeUrl, secret })
  }

  if (step === 'confirm-totp') {
    if (!user.totpSecret) {
      return NextResponse.json({ error: 'Please set your password first.' }, { status: 400 })
    }
    if (!verifyTOTP(totpCode, user.totpSecret)) {
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        mustSetPassword: false,
        inviteToken: null,
        inviteExpires: null,
      },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown step.' }, { status: 400 })
}
