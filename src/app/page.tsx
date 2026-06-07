'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Scale, TrendingUp, ClipboardList, Shield, Lock, LogOut } from 'lucide-react'

type Tile = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href: string
  accessKey: string
  color: string
}

const TILES: Tile[] = [
  {
    id: 'scale',
    label: 'Scale Operations',
    description: 'Manage incoming and outgoing grain scale tickets',
    icon: <Scale size={36} />,
    href: '/scale-operations',
    accessKey: 'accessScaleOperations',
    color: '#d97706',
  },
  {
    id: 'merchandising',
    label: 'Merchandising',
    description: 'Contacts, contracts, commodity lists, and analytics',
    icon: <TrendingUp size={36} />,
    href: '/dashboard',
    accessKey: 'accessMerchandising',
    color: '#1d2c3f',
  },
  {
    id: 'planning',
    label: 'Operations Planning',
    description: 'Logistics, scheduling, and operations management',
    icon: <ClipboardList size={36} />,
    href: '/operations-planning',
    accessKey: 'accessOperationsPlanning',
    color: '#0891b2',
  },
  {
    id: 'admin',
    label: 'Administration',
    description: 'User management and system configuration',
    icon: <Shield size={36} />,
    href: '/administration',
    accessKey: 'accessAdministration',
    color: '#7c3aed',
  },
]

export default function HubPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const u = session?.user as unknown as Record<string, unknown>
  const isAdmin = u?.role === 'ADMIN'
  const userName = session?.user?.name ?? ''

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5" style={{ background: '#1d2c3f' }}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/central-grain-logo.png" alt="Central Grain" className="h-10 object-contain" style={{ background: 'white', borderRadius: 6, padding: '2px 8px' }} />
        </div>
        <div className="flex items-center gap-4">
          {userName && <span className="text-sm text-white/70">Welcome, {userName}</span>}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Select a Module</h1>
        <p className="text-gray-500 mb-10 text-center">Choose which area you'd like to work in</p>

        <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
          {TILES.map((tile) => {
            const allowed = isAdmin || !!(u?.[tile.accessKey])
            return (
              <button
                key={tile.id}
                onClick={() => allowed && router.push(tile.href)}
                disabled={!allowed}
                className={`relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 text-center transition-all duration-150 ${
                  allowed
                    ? 'bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer border-transparent hover:border-current'
                    : 'bg-white/50 border-gray-200 cursor-not-allowed opacity-50'
                }`}
                style={allowed ? { '--tw-border-opacity': '0.3', borderColor: tile.color } as React.CSSProperties : {}}
              >
                {!allowed && (
                  <span className="absolute top-3 right-3 text-gray-300">
                    <Lock size={14} />
                  </span>
                )}
                <span style={{ color: allowed ? tile.color : '#9ca3af' }}>{tile.icon}</span>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{tile.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{tile.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <footer className="text-center pb-6 text-xs text-gray-400">© 2026 Central Grain</footer>
    </div>
  )
}
