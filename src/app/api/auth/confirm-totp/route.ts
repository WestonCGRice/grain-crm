import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib') as {
  authenticator: { verify: (opts: { token: string; secret: string }) => boolean }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { totpCode } = await req.json()
    if (!totpCode) {
      return NextResponse.json({ success: false, error: 'Code is required' })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.totpSecret) {
      return NextResponse.json({ success: false, error: 'No setup in progress. Please refresh and try again.' })
    }

    const isValid = authenticator.verify({
      token: String(totpCode).replace(/\s/g, ''),
      secret: user.totpSecret,
    })

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid code — check your authenticator app and try again.' })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpEnabled: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
