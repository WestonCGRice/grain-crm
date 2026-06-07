'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Plus, Truck, Trash2, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Grade = {
  moisture: string; testWeight: string; foreignMatter: string
  splits: string; totalDamage: string; heatDamage: string
  milling: string; wholeGrain: string; grade: string; notes: string
}

type Ticket = {
  id: string
  ticketNumber: string
  ticketType: string
  ticketDate: string
  cropYear: string | null
  commodity: string | null
  grossWeight: string | null
  tareWeight: string | null
  netWeight: string | null
  billOfLading: string | null
  status: string
  grades: Partial<Grade> | null
}

const TICKET_TYPES = [
  { value: 'SCALE_TICKET', label: 'Scale Ticket' },
  { value: 'SHIPMENT_TICKET', label: 'Shipment Ticket' },
]

const COMMODITIES = ['CORN', 'SOYBEANS', 'RICE']
const YEARS = Array.from({ length: 26 }, (_, i) => String(2024 + i))

const TYPE_LABELS: Record<string, string> = {
  SCALE_TICKET: 'Scale Ticket',
  SHIPMENT_TICKET: 'Shipment Ticket',
  DIRECT_SHIP: 'Direct Ship',
}

const EMPTY_GRADE: Grade = {
  moisture: '', testWeight: '', foreignMatter: '', splits: '',
  totalDamage: '', heatDamage: '', milling: '', wholeGrain: '', grade: '', notes: '',
}

function blankForm() {
  return {
    ticketType: 'SCALE_TICKET',
    ticketDate: new Date().toISOString().slice(0, 10),
    cropYear: '',
    commodity: '',
    grossWeight: '',
    tareWeight: '',
    billOfLading: '',
  }
}

export default function OperateScalePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin ?? false

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)
  const [popupTab, setPopupTab] = useState<'details' | 'grades'>('details')
  const [form, setForm] = useState(blankForm())
  const [grade, setGrade] = useState<Grade>(EMPTY_GRADE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nextNumber, setNextNumber] = useState<string | null>(null)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/scale-tickets?status=ACTIVE')
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  // Preview next ticket number (fetch current max to show in popup)
  async function fetchNextNumber() {
    const res = await fetch('/api/scale-tickets')
    if (!res.ok) { setNextNumber('000000001'); return }
    const all: Ticket[] = await res.json()
    if (all.length === 0) { setNextNumber('000000001'); return }
    const max = all.reduce((m, t) => Math.max(m, parseInt(t.ticketNumber, 10)), 0)
    setNextNumber(String(max + 1).padStart(9, '0'))
  }

  function openWeighIn() {
    setEditTicket(null)
    setForm(blankForm())
    setGrade(EMPTY_GRADE)
    setPopupTab('details')
    setError('')
    fetchNextNumber()
    setShowPopup(true)
  }

  function openTicket(t: Ticket) {
    setEditTicket(t)
    setForm({
      ticketType: t.ticketType,
      ticketDate: t.ticketDate.slice(0, 10),
      cropYear: t.cropYear ?? '',
      commodity: t.commodity ?? '',
      grossWeight: t.grossWeight ?? '',
      tareWeight: t.tareWeight ?? '',
      billOfLading: t.billOfLading ?? '',
    })
    setGrade(t.grades ? {
      moisture: t.grades.moisture ?? '',
      testWeight: t.grades.testWeight ?? '',
      foreignMatter: t.grades.foreignMatter ?? '',
      splits: t.grades.splits ?? '',
      totalDamage: t.grades.totalDamage ?? '',
      heatDamage: t.grades.heatDamage ?? '',
      milling: t.grades.milling ?? '',
      wholeGrain: t.grades.wholeGrain ?? '',
      grade: t.grades.grade ?? '',
      notes: t.grades.notes ?? '',
    } : EMPTY_GRADE)
    setPopupTab('details')
    setError('')
    setShowPopup(true)
  }

  const gross = parseFloat(form.grossWeight) || 0
  const tare = parseFloat(form.tareWeight) || 0
  const net = gross > 0 && tare > 0 ? gross - tare : null

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const body = { ...form, grades: grade }
      const url = editTicket ? `/api/scale-tickets/${editTicket.id}` : '/api/scale-tickets'
      const method = editTicket ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save ticket')
      }
      setShowPopup(false)
      loadTickets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally { setSaving(false) }
  }

  async function handleMarkComplete(ticketId: string) {
    await fetch(`/api/scale-tickets/${ticketId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    setShowPopup(false)
    loadTickets()
  }

  async function handleDelete(ticketId: string) {
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    await fetch(`/api/scale-tickets/${ticketId}`, { method: 'DELETE' })
    setShowPopup(false)
    loadTickets()
  }

  function field(label: string, key: keyof typeof form, opts?: { type?: string; maxLength?: number; readOnly?: boolean; placeholder?: string }) {
    return (
      <div>
        <label className="form-label">{label}</label>
        <input
          className={`form-input ${opts?.readOnly ? 'bg-gray-50 text-gray-600' : ''}`}
          type={opts?.type ?? 'text'}
          value={form[key]}
          maxLength={opts?.maxLength}
          readOnly={opts?.readOnly}
          placeholder={opts?.placeholder}
          onChange={(e) => !opts?.readOnly && setForm(prev => ({ ...prev, [key]: e.target.value }))}
        />
      </div>
    )
  }

  function gradeField(label: string, key: keyof Grade, unit?: string) {
    return (
      <div>
        <label className="form-label">{label}{unit ? ` (${unit})` : ''}</label>
        <input
          className="form-input"
          type="number"
          step="0.01"
          min="0"
          value={grade[key]}
          onChange={(e) => setGrade(prev => ({ ...prev, [key]: e.target.value }))}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <header className="flex items-center justify-between px-8 py-5" style={{ background: '#1d2c3f' }}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/central-grain-logo.png" alt="Central Grain" className="h-10 object-contain" style={{ background: 'white', borderRadius: 6, padding: '2px 8px' }} />
          <span className="text-white font-semibold text-lg">Operate Scale</span>
        </div>
        <button onClick={() => router.push('/scale-operations')} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Scale Operations
        </button>
      </header>

      <main className="flex-1 px-6 py-6" style={{ maxWidth: 1300, margin: '0 auto', width: '100%' }}>
        {/* Top action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={openWeighIn}
            className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            style={{ background: '#d97706' }}
            onMouseOver={e => (e.currentTarget.style.background = '#b45309')}
            onMouseOut={e => (e.currentTarget.style.background = '#d97706')}
          >
            <Plus size={15} /> Weigh In Truck
          </button>
          <button
            className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            style={{ background: '#1d2c3f' }}
            onMouseOver={e => (e.currentTarget.style.background = '#152232')}
            onMouseOut={e => (e.currentTarget.style.background = '#1d2c3f')}
            onClick={() => {
              const pending = tickets.find(t => t.grossWeight && !t.tareWeight)
              if (pending) openTicket(pending)
            }}
          >
            <Truck size={15} /> Weigh Out Truck
          </button>
        </div>

        {/* Active tickets table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">Active Tickets</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click a ticket to open and edit it</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600 font-medium">{tickets.length} active</span>
              <button onClick={loadTickets} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <Truck size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No active tickets. Click "Weigh In Truck" to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Commodity</th>
                    <th>Crop Year</th>
                    <th>Gross Wt (lbs)</th>
                    <th>Tare Wt (lbs)</th>
                    <th>Net Wt (lbs)</th>
                    <th>Bill of Lading</th>
                    <th>Grades</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="cursor-pointer hover:bg-amber-50" onClick={() => openTicket(t)}>
                      <td className="font-mono font-semibold text-gray-800">{t.ticketNumber}</td>
                      <td>{TYPE_LABELS[t.ticketType] ?? t.ticketType}</td>
                      <td className="text-sm">{formatDate(t.ticketDate)}</td>
                      <td>{t.commodity ? t.commodity.charAt(0) + t.commodity.slice(1).toLowerCase() : <span className="text-gray-400">—</span>}</td>
                      <td>{t.cropYear || <span className="text-gray-400">—</span>}</td>
                      <td>{t.grossWeight ? Number(t.grossWeight).toLocaleString() : <span className="text-gray-400">—</span>}</td>
                      <td>{t.tareWeight ? Number(t.tareWeight).toLocaleString() : <span className="text-gray-400">—</span>}</td>
                      <td className="font-medium text-green-700">{t.netWeight ? Number(t.netWeight).toLocaleString() : <span className="text-gray-400">—</span>}</td>
                      <td>{t.billOfLading || <span className="text-gray-400">—</span>}</td>
                      <td><span className={`badge ${t.grades ? 'badge-green' : 'badge-gray'}`}>{t.grades ? 'Yes' : 'None'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Ticket popup ── */}
      {showPopup && (
        <div className="modal-overlay" onClick={() => setShowPopup(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editTicket ? `Ticket #${editTicket.ticketNumber}` : 'New Scale Ticket'}
                </h2>
                {!editTicket && nextNumber && (
                  <p className="text-xs text-gray-500 mt-0.5">Ticket number will be assigned: <span className="font-mono font-semibold">{nextNumber}</span></p>
                )}
              </div>
              <button onClick={() => setShowPopup(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-4 mt-3">
              {(['details', 'grades'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPopupTab(t)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    popupTab === t ? 'bg-white border border-b-white border-gray-200 text-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'details' ? 'Ticket Details' : 'Ticket Grades'}
                </button>
              ))}
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <form onSubmit={handleSave}>
              {popupTab === 'details' && (
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Ticket Type *</label>
                    <select className="form-input" value={form.ticketType} onChange={(e) => setForm(p => ({ ...p, ticketType: e.target.value }))}>
                      {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  {field('Ticket Date', 'ticketDate', { type: 'date' })}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Crop Year</label>
                      <select className="form-input" value={form.cropYear} onChange={(e) => setForm(p => ({ ...p, cropYear: e.target.value }))}>
                        <option value="">— Select —</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Commodity</label>
                      <select className="form-input" value={form.commodity} onChange={(e) => setForm(p => ({ ...p, commodity: e.target.value }))}>
                        <option value="">— Select —</option>
                        {COMMODITIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {field('Gross Weight (lbs)', 'grossWeight', { type: 'number', placeholder: 'Loaded truck weight' })}
                    {field('Tare Weight (lbs)', 'tareWeight', { type: 'number', placeholder: 'Empty truck weight' })}
                  </div>

                  {net !== null && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between text-sm">
                      <span className="text-green-700 font-medium">Net Weight (auto-calculated):</span>
                      <span className="text-green-900 font-bold">{net.toLocaleString()} lbs</span>
                    </div>
                  )}

                  {field('Bill of Lading', 'billOfLading', { maxLength: 15, placeholder: 'Optional, max 15 characters' })}
                </div>
              )}

              {popupTab === 'grades' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Enter quality grade measurements. Leave blank if not applicable.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {gradeField('Moisture', 'moisture', '%')}
                    {gradeField('Test Weight', 'testWeight', 'lbs/bu')}
                    {gradeField('Foreign Matter', 'foreignMatter', '%')}
                    {gradeField('Splits', 'splits', '%')}
                    {gradeField('Total Damage', 'totalDamage', '%')}
                    {gradeField('Heat Damage', 'heatDamage', '%')}
                    {gradeField('Milling', 'milling', '%')}
                    {gradeField('Whole Grain', 'wholeGrain', '%')}
                  </div>
                  <div>
                    <label className="form-label">Grade</label>
                    <input className="form-input" value={grade.grade} onChange={(e) => setGrade(p => ({ ...p, grade: e.target.value }))} placeholder="e.g. US #2" />
                  </div>
                  <div>
                    <label className="form-label">Grade Notes</label>
                    <textarea className="form-input" rows={2} value={grade.notes} onChange={(e) => setGrade(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-2 pt-4 mt-2 border-t border-gray-100">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving…' : editTicket ? 'Save Changes' : 'Create Ticket'}
                </button>
                {editTicket && (
                  <button
                    type="button"
                    className="btn-secondary px-3"
                    onClick={() => handleMarkComplete(editTicket.id)}
                    title="Mark as completed"
                  >
                    Complete
                  </button>
                )}
                {editTicket && isAdmin && (
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-600 px-3 py-2 rounded-md border border-gray-200 hover:border-red-200 transition-colors"
                    onClick={() => handleDelete(editTicket.id)}
                    title="Delete ticket (admin only)"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button type="button" className="btn-secondary px-3" onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
