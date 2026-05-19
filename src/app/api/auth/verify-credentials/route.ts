import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ valid: false })
    }

    const user = await prisma.user.findUnique({ where: { username: String(username) } })
    if (!user) {
      // Constant-time response to prevent username enumeration
      await bcrypt.compare('dummy', '$2b$12$dummy.hash.that.will.never.match.anything.here')
      return NextResponse.json({ valid: false })
    }

    const passwordValid = await bcrypt.compare(String(password), user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true, requiresTotp: user.totpEnabled })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ valid: false })
  }
}
