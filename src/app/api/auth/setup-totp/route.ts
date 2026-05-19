import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import QRCode from 'qrcode'
import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib') as {
  authenticator: {
    generateSecret: () => string
    keyuri: (account: string, service: string, secret: string) => string
  }
}

// Use the auth() HOC so the session is read from the request object directly,
// avoiding the Next.js 16 async cookies() incompatibility with await auth().
export const POST = auth(async (req: NextRequest & { auth: Session | null }) => {
  try {
    const userId = req.auth?.user?.id
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = authenticator.generateSecret()
    const otpAuthUrl = authenticator.keyuri(
      req.auth?.user?.name ?? userId,
      'GrainCRM',
      secret
    )
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

    await prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret },
    })

    return Response.json({ qrCodeUrl, secret })
  } catch (err) {
    console.error('[setup-totp]', err)
    return Response.json({ error: 'Failed to generate setup' }, { status: 500 })
  }
})
