'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, TrendingUp, DollarSign, Wheat, BarChart3, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type ContactSummary = {
  id: string; firstName: string; lastName: string
  company: string | null; status: string; createdAt: string
}
type DealSummary = {
  id: string; commodity: string; quantity: string; totalValue: string
  status: string; dealDate: string
  contact: { firstName: string; lastName: string }
}
type DashboardData = {
  totalContacts: number
  totalDeals: number
  totalValue: number
  contactsByStatus: { status: string; _count: { id: number } }[]
  dealsByCommodity: { commodity: string; _count: { id: number }; _sum: { totalValue: string | null } }[]
  recentContacts: ContactSummary[]
  recentDeals: DealSummary[]
}

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'badge badge-yellow', ACTIVE: 'badge badge-green',
  CUSTOMER: 'badge badge-blue', INACTIVE: 'badge badge-gray',
}
const COMMODITY_COLORS: Record<string, string> = {
  CORN: '#d97706', SOYBEANS: '#65a30d', RICE: '#0891b2',
}
const DEAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge badge-yellow', COMPLETED: 'badge badge-green', CANCELLED: 'badge badge-red',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard…</div>
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-7">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome to GrainCRM — your grain merchandising platform</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-5 mb-7">
        <div className="stat-card border-l-4" style={{ borderColor: '#16a34a' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Total Contacts</span>
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-green-600" />
            </div>
          </div>
          <span className="stat-value">{data.totalContacts}</span>
          <Link href="/contacts" className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1">
            View all <ArrowRight size={11} />
          </Link>
        </div>

        <div className="stat-card border-l-4" style={{ borderColor: '#d97706' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Total Deals</span>
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
          </div>
          <span className="stat-value">{data.totalDeals}</span>
        </div>

        <div className="stat-card border-l-4" style={{ borderColor: '#0891b2' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Total Deal Value</span>
            <div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-cyan-600" />
            </div>
          </div>
          <span className="stat-value text-2xl">{formatCurrency(data.totalValue)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-7">
        {/* Commodity breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wheat size={15} /> Commodities
          </h2>
          {data.dealsByCommodity.length === 0 ? (
            <p className="text-sm text-gray-400">No deals yet</p>
          ) : (
            <div className="space-y-3">
              {data.dealsByCommodity.map((c) => (
                <Link key={c.commodity} href={`/${c.commodity.toLowerCase()}`} className="block">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COMMODITY_COLORS[c.commodity] }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {c.commodity.charAt(0) + c.commodity.slice(1).toLowerCase()}
                      </div>
                      <div className="text-xs text-gray-500">{c._count.id} deal{c._count.id !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {formatCurrency(Number(c._sum.totalValue ?? 0))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contact status breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={15} /> Contact Statuses
          </h2>
          {data.contactsByStatus.length === 0 ? (
            <p className="text-sm text-gray-400">No contacts yet</p>
          ) : (
            <div className="space-y-2">
              {data.contactsByStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className={STATUS_COLORS[s.status] ?? 'badge badge-gray'}>{s.status}</span>
                  <span className="text-sm font-semibold text-gray-700">{s._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={15} /> Analytics
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Corn Analytics', href: '/analytics/corn', color: '#d97706' },
              { label: 'Soybeans Analytics', href: '/analytics/soybeans', color: '#65a30d' },
              { label: 'Rice Analytics', href: '/analytics/rice', color: '#0891b2' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span className="text-sm text-gray-700 flex-1">{a.label}</span>
                <ArrowRight size={13} className="text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent contacts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Contacts</h2>
            <Link href="/contacts" className="text-xs text-green-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {data.recentContacts.length === 0 ? (
            <p className="text-sm text-gray-400">No contacts yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentContacts.map((c) => (
                <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{c.firstName} {c.lastName}</div>
                    {c.company && <div className="text-xs text-gray-500 truncate">{c.company}</div>}
                  </div>
                  <span className={STATUS_COLORS[c.status] ?? 'badge badge-gray'}>{c.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent deals */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Deals</h2>
          {data.recentDeals.length === 0 ? (
            <p className="text-sm text-gray-400">No deals yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentDeals.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: COMMODITY_COLORS[d.commodity] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {d.contact.firstName} {d.contact.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {d.commodity.charAt(0) + d.commodity.slice(1).toLowerCase()} · {formatDate(d.dealDate)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-800">{formatCurrency(d.totalValue)}</div>
                    <span className={`${DEAL_STATUS_COLORS[d.status]} text-[10px] mt-0.5 block`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
