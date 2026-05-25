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
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
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

      const role = (auth?.user as unknown as { role?: string })?.role ?? 'MERCHANDISER'

      // Administration routes: Admin only
      if (pathname.startsWith('/administration') || pathname.startsWith('/admin')) {
        return role === 'ADMIN' ? true : Response.redirect(new URL('/', nextUrl))
      }

      // Hub and module pages: any authenticated role
      if (pathname === '/' || pathname.startsWith('/scale-operations') || pathname.startsWith('/operations-planning')) {
        return true
      }

      // All other routes (Merchandising CRM): Merchandiser or Admin only
      if (role === 'SCALE_OPERATIONS') {
        return Response.redirect(new URL('/scale-operations', nextUrl))
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
