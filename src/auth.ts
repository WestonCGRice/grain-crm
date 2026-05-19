import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { authConfig } from '@/auth.config'

// otplib named exports aren't resolved by bundler moduleResolution
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib') as {
  authenticator: {
    verify: (opts: { token: string; secret: string }) => boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
        totpCode: {},
      },
      async authorize(credentials) {
        try {
          const username = String(credentials.username ?? '')
          const password = String(credentials.password ?? '')
          const totpCode = String(credentials.totpCode ?? '')

          if (!username || !password) return null

          const user = await prisma.user.findUnique({ where: { username } })
          if (!user) return null

          const passwordValid = await bcrypt.compare(password, user.passwordHash)
          if (!passwordValid) return null

          if (user.totpEnabled && user.totpSecret) {
            if (!totpCode) return null
            const isValid = authenticator.verify({
              token: totpCode.replace(/\s/g, ''),
              secret: user.totpSecret,
            })
            if (!isValid) return null
          }

          return {
            id: user.id,
            name: user.name ?? user.username,
            totpEnabled: user.totpEnabled,
          }
        } catch (err) {
          console.error('[authorize] Error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.totpEnabled = (user as unknown as { totpEnabled?: boolean }).totpEnabled ?? false
      }
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      ;(session.user as unknown as { totpEnabled: boolean }).totpEnabled = (token.totpEnabled as boolean) ?? false
      return session
    },
  },
})
