'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Eye, Phone, Mail, BarChart3, TrendingUp } from 'lucide-react'
import AssignCommodityForm from '@/components/AssignCommodityForm'
import DealForm from '@/components/DealForm'
import { formatNumber, formatCurrency } from '@/lib/utils'

type Contact = {
  id: string; firstName: string; lastName: string
  email: string | null; phone: string | null
  company: string | null; city: string | null; state: string | null; status: string
}

type CommodityRow = {
  id: string
  contactId: string
  interestLevel: string
  estimatedVolume: string | null
  notes: string | null
  createdAt: string
  contact: Contact
}

type Props = {
  commodity: 'CORN' | 'SOYBEANS' | 'RICE'
  label: string
  color: string
  analyticsHref: string
}

const INTEREST_COLORS: Record<string, string> = {
  LOW: 'badge badge-gray',
  MEDIUM: 'badge badge-yellow',
  HIGH: 'badge badge-green',
}

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'badge badge-yellow', ACTIVE: 'badge badge-green',
  CUSTOMER: 'badge badge-blue', INACTIVE: 'badge badge-gray',
}

export default function CommodityPage({ commodity, label, color, analyticsHref }: Props) {
  const [rows, setRows] = useState<CommodityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [showDeal, setShowDeal] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commodity-contacts?commodity=${commodity}`)
      setRows(await res.json())
    } finally {
      setLoading(false)
    }
  }, [commodity])

  useEffect(() => { load() }, [load])

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from ${label} list?`)) return
    setRemoving(id)
    try {
      await fetch(`/api/commodity-contacts/${id}`, { method: 'DELETE' })
      setRows((r) => r.filter((x) => x.id !== id))
    } finally {
      setRemoving(null)
    }
  }

  const totalEstimated = rows.reduce((s, r) => s + (r.estimatedVolume ? parseFloat(r.estimatedVolume) : 0), 0)
  const highInterest = rows.filter((r) => r.interestLevel === 'HIGH').length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <h1 className="page-title">{label}</h1>
          </div>
          <p className="page-subtitle">{rows.length} contact{rows.length !== 1 ? 's' : ''} on this list</p>
        </div>
        <div className="flex gap-2">
          <Link href={analyticsHref} className="btn-secondary flex items-center gap-2">
            <BarChart3 size={15} /> Analytics
          </Link>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAssign(true)}>
            <Plus size={15} /> Add Contact
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="stat-label">Total Contacts</span>
          <span className="stat-value">{rows.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">High Interest</span>
          <span className="stat-value" style={{ color }}>{highInterest}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Est. Annual Volume</span>
          <span className="stat-value text-2xl">{formatNumber(totalEstimated)} bu</span>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No contacts on this list yet.{' '}
            <button className="text-green-600 hover:underline" onClick={() => setShowAssign(true)}>Add one</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Contact</th>
                <th>Company</th>
                <th>Contact Info</th>
                <th>Location</th>
                <th>Status</th>
                <th>Interest</th>
                <th>Est. Volume</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/contacts/${row.contact.id}`} className="font-medium text-gray-900 hover:text-green-700">
                      {row.contact.firstName} {row.contact.lastName}
                    </Link>
                    {row.notes && <div className="text-xs text-gray-400 truncate max-w-[160px]">{row.notes}</div>}
                  </td>
                  <td>
                    {row.contact.company
                      ? <span className="text-gray-700">{row.contact.company}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      {row.contact.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Mail size={10} className="text-gray-400" /> {row.contact.email}
                        </div>
                      )}
                      {row.contact.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone size={10} className="text-gray-400" /> {row.contact.phone}
                        </div>
                      )}
                      {!row.contact.email && !row.contact.phone && <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td>
                    {row.contact.city || row.contact.state
                      ? <span className="text-sm text-gray-700">{[row.contact.city, row.contact.state].filter(Boolean).join(', ')}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td><span className={STATUS_COLORS[row.contact.status]}>{row.contact.status}</span></td>
                  <td><span className={INTEREST_COLORS[row.interestLevel]}>{row.interestLevel}</span></td>
                  <td>
                    {row.estimatedVolume
                      ? <span className="text-sm text-gray-700">{formatNumber(row.estimatedVolume)} bu</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/contacts/${row.contact.id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={14} />
                      </Link>
                      <button
                        className="text-gray-400 hover:text-green-600 transition-colors"
                        onClick={() => setShowDeal(row.contact.id)}
                        title="New deal"
                      >
                        <TrendingUp size={14} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleRemove(row.id, `${row.contact.firstName} ${row.contact.lastName}`)}
                        disabled={removing === row.id}
                        title="Remove from list"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAssign && (
        <AssignCommodityForm
          commodity={commodity}
          existingContactIds={rows.map((r) => r.contact.id)}
          onClose={() => setShowAssign(false)}
          onSaved={() => { setShowAssign(false); load() }}
        />
      )}

      {showDeal && (
        <DealForm
          commodity={commodity}
          contactId={showDeal}
          onClose={() => setShowDeal(null)}
          onSaved={() => { setShowDeal(null) }}
        />
      )}
    </div>
  )
}
