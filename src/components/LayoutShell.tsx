'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const FULL_SCREEN_PATHS = ['/login', '/setup-2fa', '/setup-account']
const FULL_SCREEN_PREFIXES = ['/', '/scale-operations', '/operations-planning', '/administration']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullScreen =
    FULL_SCREEN_PATHS.includes(pathname) ||
    (pathname === '/' || FULL_SCREEN_PREFIXES.slice(1).some((p) => pathname.startsWith(p)))

  if (isFullScreen) {
    return <>{children}</>
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
