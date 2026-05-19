import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import QRCode from 'qrcode'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib') as {
  authenticator: {
    generateSecret: () => string
    keyuri: (account: string, service: string, secret: string) => string
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = authenticator.generateSecret()
    const otpAuthUrl = authenticator.keyuri(
      session.user.name ?? session.user.id,
      'GrainCRM',
      secret
    )
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpSecret: secret },
    })

    return NextResponse.json({ qrCodeUrl, secret })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate setup' }, { status: 500 })
  }
}
