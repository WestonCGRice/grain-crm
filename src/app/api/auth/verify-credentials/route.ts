import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const MAX_ATTEMPTS = 3
const WINDOW_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ valid: false, message: 'Username and password are required.' })
    }

    const user = await prisma.user.findUnique({ where: { username: String(username) } })
    if (!user) {
      await bcrypt.compare('dummy', '$2b$12$dummy.hash.that.will.never.match.anything.here')
      return NextResponse.json({ valid: false, message: 'Invalid username or password.' })
    }

    // Check if account is locked
    if (user.accountLocked) {
      return NextResponse.json({
        valid: false,
        locked: true,
        message: 'This account has been locked after too many failed attempts. Contact your administrator to unlock it.',
      })
    }

    // Reset failure window if it has expired
    let currentAttempts = user.failedLoginAttempts
    if (user.failedLoginWindowStart) {
      const age = Date.now() - user.failedLoginWindowStart.getTime()
      if (age > WINDOW_MS) {
        currentAttempts = 0
        await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, failedLoginWindowStart: null } })
      }
    }

    const passwordValid = await bcrypt.compare(String(password), user.passwordHash)

    if (!passwordValid) {
      const newAttempts = currentAttempts + 1
      const shouldLock = newAttempts >= MAX_ATTEMPTS
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          failedLoginWindowStart: user.failedLoginWindowStart ?? new Date(),
          accountLocked: shouldLock,
        },
      })

      if (shouldLock) {
        return NextResponse.json({
          valid: false,
          locked: true,
          message: 'Account locked after 3 failed attempts. Contact your administrator to unlock it.',
        })
      }

      const remaining = MAX_ATTEMPTS - newAttempts
      return NextResponse.json({
        valid: false,
        message: `Invalid password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before your account is locked.`,
      })
    }

    // Success — reset failure tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, failedLoginWindowStart: null },
    })

    return NextResponse.json({ valid: true, requiresTotp: user.totpEnabled })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ valid: false, message: 'Something went wrong. Please try again.' })
  }
}
