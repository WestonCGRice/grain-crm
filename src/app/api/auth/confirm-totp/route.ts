import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib') as {
  authenticator: { verify: (opts: { token: string; secret: string }) => boolean }
}

export const POST = auth(async (req: NextRequest & { auth: Session | null }) => {
  try {
    const userId = req.auth?.user?.id
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const totpCode = body?.totpCode
    if (!totpCode) {
      return Response.json({ success: false, error: 'Code is required' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.totpSecret) {
      return Response.json({ success: false, error: 'No setup in progress. Please refresh and try again.' })
    }

    const isValid = authenticator.verify({
      token: String(totpCode).replace(/\s/g, ''),
      secret: user.totpSecret,
    })

    if (!isValid) {
      return Response.json({ success: false, error: 'Invalid code — check your authenticator app and try again.' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[confirm-totp]', err)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
})
