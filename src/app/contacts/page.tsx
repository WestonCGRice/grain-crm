'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2, Eye } from 'lucide-react'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'

type CommodityContact = { commodity: string }
type Contact = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  city: string | null
  state: string | null
  status: string
  createdAt: string
  commodityContacts: CommodityContact[]
  _count: { interactions: number; deals: number }
}

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'badge badge-yellow',
  ACTIVE: 'badge badge-green',
  CUSTOMER: 'badge badge-blue',
  INACTIVE: 'badge badge-gray',
}

const COMMODITY_COLORS: Record<string, string> = {
  CORN: 'badge badge-amber',
  SOYBEANS: 'badge badge-green',
  RICE: 'badge badge-blue',
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/contacts?${params}`)
      const data = await res.json()
      setContacts(data)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      setContacts((c) => c.filter((x) => x.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditContact(null); setShowForm(true) }}>
          <Plus size={16} />
          New Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="CUSTOMER">Customer</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No contacts found.{' '}
            <button className="text-green-600 hover:underline" onClick={() => setShowForm(true)}>Add one</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact Info</th>
                <th>Location</th>
                <th>Status</th>
                <th>Commodities</th>
                <th>Activity</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium text-gray-900">
                      {c.firstName} {c.lastName}
                    </div>
                    {c.title && <div className="text-xs text-gray-500">{c.title}</div>}
                  </td>
                  <td>
                    {c.company ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Building2 size={13} className="text-gray-400" />
                        {c.company}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail size={11} className="text-gray-400" />
                          {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone size={11} className="text-gray-400" />
                          {c.phone}
                        </div>
                      )}
                      {!c.email && !c.phone && <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td>
                    {c.city || c.state
                      ? <span className="text-sm text-gray-700">{[c.city, c.state].filter(Boolean).join(', ')}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td>
                    <span className={STATUS_COLORS[c.status] ?? 'badge badge-gray'}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {c.commodityContacts.length === 0
                        ? <span className="text-gray-400 text-xs">—</span>
                        : c.commodityContacts.map((cc) => (
                          <span key={cc.commodity} className={COMMODITY_COLORS[cc.commodity] ?? 'badge badge-gray'}>
                            {cc.commodity.charAt(0) + cc.commodity.slice(1).toLowerCase()}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-gray-500">
                      <div>{c._count.deals} deal{c._count.deals !== 1 ? 's' : ''}</div>
                      <div>{c._count.interactions} interaction{c._count.interactions !== 1 ? 's' : ''}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/contacts/${c.id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={15} />
                      </Link>
                      <button
                        className="text-gray-400 hover:text-green-600 transition-colors"
                        onClick={() => { setEditContact(c); setShowForm(true) }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)}
                        disabled={deleting === c.id}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ContactForm
          initial={editContact ?? undefined}
          onClose={() => { setShowForm(false); setEditContact(null) }}
          onSaved={() => { setShowForm(false); setEditContact(null); load() }}
        />
      )}
    </div>
  )
}
