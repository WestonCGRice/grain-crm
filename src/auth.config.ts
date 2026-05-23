import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  callbacks: {
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      ;(session.user as unknown as { totpEnabled: boolean }).totpEnabled = (token.totpEnabled as boolean) ?? false
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const totpEnabled = ((auth?.user as unknown as { totpEnabled?: boolean })?.totpEnabled) ?? false
      const { pathname } = nextUrl

      // Always allow NextAuth's own API routes and our custom auth endpoints
      if (pathname.startsWith('/api/auth')) return true

      // Login page: redirect logged-in users away, allow others
      if (pathname === '/login') {
        return isLoggedIn ? Response.redirect(new URL('/', nextUrl)) : true
      }

      // Account setup page is public — invite token is the credential
      if (pathname === '/setup-account') return true

      // Must be logged in for all other routes
      if (!isLoggedIn) return false

      // 2FA setup page: only for users who haven't set up TOTP yet
      if (pathname === '/setup-2fa') {
        return totpEnabled ? Response.redirect(new URL('/', nextUrl)) : true
      }

      // Logged in without TOTP → force to setup
      if (!totpEnabled) {
        return Response.redirect(new URL('/setup-2fa', nextUrl))
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
