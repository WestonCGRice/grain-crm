'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Wheat, BarChart3, Home, TrendingUp, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  dot?: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <Home size={16} /> },
  { href: '/contacts', label: 'Contacts', icon: <Users size={16} /> },
]

const commodityItems: NavItem[] = [
  { href: '/corn', label: 'Corn', icon: <Wheat size={16} />, dot: '#d97706' },
  { href: '/soybeans', label: 'Soybeans', icon: <Wheat size={16} />, dot: '#65a30d' },
  { href: '/rice', label: 'Rice', icon: <Wheat size={16} />, dot: '#0891b2' },
]

const analyticsItems: NavItem[] = [
  { href: '/analytics/corn', label: 'Corn Analytics', icon: <BarChart3 size={16} /> },
  { href: '/analytics/soybeans', label: 'Soybeans Analytics', icon: <BarChart3 size={16} /> },
  { href: '/analytics/rice', label: 'Rice Analytics', icon: <BarChart3 size={16} /> },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = pathname === item.href
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-green-700 text-white'
          : 'text-green-100 hover:bg-green-800 hover:text-white'
      }`}
    >
      {item.dot ? (
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.dot }} />
      ) : (
        item.icon
      )}
      {item.label}
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-green-400 uppercase tracking-wider">
      {children}
    </p>
  )
}

export default function Sidebar() {
  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <div className="px-5 py-5 border-b border-green-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-[15px] leading-tight">GrainCRM</div>
            <div className="text-green-400 text-xs">Merchandising Platform</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <SectionLabel>Commodity Lists</SectionLabel>
        {commodityItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <SectionLabel>Analytics</SectionLabel>
        {analyticsItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-green-800 space-y-1">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-green-100 hover:bg-green-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
        <p className="px-3 text-xs text-green-600">© 2026 GrainCRM</p>
      </div>
    </aside>
  )
}
