import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { authConfig } from '@/auth.config'

import { verifyTOTP } from '@/lib/totp'

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
            const isValid = verifyTOTP(totpCode, user.totpSecret)
            if (!isValid) return null
          }

          return {
            id: user.id,
            name: user.name ?? user.username,
            totpEnabled: user.totpEnabled,
            role: user.role,
            isAdmin: user.role === 'ADMIN',
            accessMerchandising: user.accessMerchandising,
            accessAdministration: user.accessAdministration,
            accessScaleOperations: user.accessScaleOperations,
            accessOperationsPlanning: user.accessOperationsPlanning,
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
        const u = user as unknown as {
          totpEnabled?: boolean; role?: string
          accessMerchandising?: boolean; accessAdministration?: boolean
          accessScaleOperations?: boolean; accessOperationsPlanning?: boolean
        }
        token.id = user.id
        token.totpEnabled = u.totpEnabled ?? false
        token.role = u.role ?? 'MERCHANDISER'
        token.isAdmin = token.role === 'ADMIN'
        token.accessMerchandising = u.accessMerchandising ?? true
        token.accessAdministration = u.accessAdministration ?? false
        token.accessScaleOperations = u.accessScaleOperations ?? false
        token.accessOperationsPlanning = u.accessOperationsPlanning ?? false
      }
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      const u = session.user as unknown as Record<string, unknown>
      u.totpEnabled = (token.totpEnabled as boolean) ?? false
      u.role = (token.role as string) ?? 'MERCHANDISER'
      u.isAdmin = token.role === 'ADMIN'
      u.accessMerchandising = (token.accessMerchandising as boolean) ?? true
      u.accessAdministration = (token.accessAdministration as boolean) ?? false
      u.accessScaleOperations = (token.accessScaleOperations as boolean) ?? false
      u.accessOperationsPlanning = (token.accessOperationsPlanning as boolean) ?? false
      return session
    },
  },
})
