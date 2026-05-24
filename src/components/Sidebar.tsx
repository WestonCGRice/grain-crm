'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Users, BarChart3, Home, LogOut, ShoppingCart,
  List, Target, CheckCircle,
  Trash2, Settings, ChevronRight,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  matchPrefix?: string
}

function NavLink({ item, indent }: { item: NavItem; indent?: boolean }) {
  const pathname = usePathname()
  const active = item.matchPrefix
    ? pathname === item.href || pathname.startsWith(item.matchPrefix + '/')
    : pathname === item.href
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        indent ? 'pl-5' : ''
      } ${
        active
          ? 'bg-[var(--sidebar-active)] text-white'
          : 'text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)] hover:text-white'
      }`}
    >
      <span className="flex-shrink-0 opacity-75">{item.icon}</span>
      {item.label}
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: 'var(--sidebar-label)' }}>
      {children}
    </p>
  )
}

export default function Sidebar() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin ?? false

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="px-4 py-4" style={{ background: '#ffffff', borderBottom: '1px solid var(--sidebar-border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/central-grain-logo.png"
          alt="Central Grain"
          className="w-full object-contain max-h-[60px]"
        />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {/* Dashboard */}
        <NavLink item={{ href: '/', label: 'Dashboard', icon: <Home size={15} /> }} />

        {/* Contacts */}
        <SectionLabel>Contacts</SectionLabel>
        <NavLink item={{ href: '/contacts', label: 'Grain Origination Contacts', icon: <Users size={15} />, matchPrefix: '/contacts' }} />
        <NavLink item={{ href: '/grain-customers', label: 'Grain Customers', icon: <ShoppingCart size={15} />, matchPrefix: '/grain-customers' }} />

        {/* Origination Commodity Lists */}
        <SectionLabel>Origination Commodity Lists</SectionLabel>
        <NavLink item={{ href: '/commodity-list', label: 'Origination Commodity Lists', icon: <List size={15} />, matchPrefix: '/commodity-list' }} />

        {/* Sales Commodity Lists */}
        <SectionLabel>Sales Commodity Lists</SectionLabel>
        <NavLink item={{ href: '/sales-commodity-list', label: 'Sales Commodity Lists', icon: <List size={15} />, matchPrefix: '/sales-commodity-list' }} />

        {/* Contracts */}
        <SectionLabel>Contracts</SectionLabel>
        <NavLink item={{ href: '/contracts/target', label: 'Target Contracts', icon: <Target size={15} />, matchPrefix: '/contracts/target' }} />
        <NavLink item={{ href: '/contracts/completed-unfilled', label: 'Completed - Unfilled', icon: <ChevronRight size={15} />, matchPrefix: '/contracts/completed-unfilled' }} />
        <NavLink item={{ href: '/contracts/completed-filled', label: 'Completed - Filled / Unsettled', icon: <ChevronRight size={15} />, matchPrefix: '/contracts/completed-filled' }} />
        <NavLink item={{ href: '/contracts/settled', label: 'Settled Contracts', icon: <CheckCircle size={15} />, matchPrefix: '/contracts/settled' }} />
        <NavLink item={{ href: '/contracts/deleted', label: 'Deleted Contracts', icon: <Trash2 size={15} />, matchPrefix: '/contracts/deleted' }} />

        {/* Analytics */}
        <SectionLabel>Analytics</SectionLabel>
        <NavLink item={{ href: '/analytics/corn', label: 'Corn Analytics', icon: <BarChart3 size={15} /> }} />
        <NavLink item={{ href: '/analytics/soybeans', label: 'Soybeans Analytics', icon: <BarChart3 size={15} /> }} />
        <NavLink item={{ href: '/analytics/rice', label: 'Rice Analytics', icon: <BarChart3 size={15} /> }} />
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {isAdmin && (
          <NavLink item={{ href: '/admin', label: 'Administration', icon: <Settings size={15} />, matchPrefix: '/admin' }} />
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: 'var(--sidebar-fg)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--sidebar-fg)' }}
        >
          <LogOut size={15} className="opacity-75 flex-shrink-0" />
          Sign Out
        </button>
        <p className="px-3 text-[11px]" style={{ color: 'var(--sidebar-label)' }}>
          © 2026 Central Grain
        </p>
      </div>
    </aside>
  )
}
