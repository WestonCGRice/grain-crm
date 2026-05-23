'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Contact = { id: string; firstName: string; lastName: string }

export type DealInitial = {
  id: string
  commodity: string
  quantity: string
  pricePerBushel: string
  basis: string | null
  status: string
  contractNumber: string | null
  cropYear: string | null
  futuresMonth: string | null
  futuresYear: string | null
  hedged: string | null
  dealDate: string
  notes: string | null
}

type Props = {
  commodity?: 'CORN' | 'SOYBEANS' | 'RICE'
  contactId?: string
  dealLabel?: string
  dealType?: 'PURCHASE' | 'SALE'
  initial?: DealInitial
  onClose: () => void
  onSaved: () => void
}

const STATUSES = [
  { value: 'PENDING', label: 'Target' },
  { value: 'COMPLETED_UNFILLED', label: 'Completed – Unfilled' },
  { value: 'COMPLETED_FILLED', label: 'Completed – Filled Not Settled' },
  { value: 'SETTLED', label: 'Settled' },
]

const FUTURES_MONTHS_BY_COMMODITY: Record<string, string[]> = {
  CORN: ['March', 'May', 'July', 'September', 'December'],
  RICE: ['January', 'March', 'May', 'July', 'September', 'November'],
  SOYBEANS: ['January', 'March', 'May', 'July', 'August', 'September', 'November'],
}

const YEARS = Array.from({ length: 26 }, (_, i) => String(2024 + i))

const COMMODITIES = ['CORN', 'SOYBEANS', 'RICE']

function isRice(commodity: string) { return commodity === 'RICE' }
function priceLabel(commodity: string) { return isRice(commodity) ? 'Futures Price / CWT' : 'Futures Price / Bushel' }
function basisLabel(commodity: string) { return isRice(commodity) ? 'Basis / CWT' : 'Basis / Bushel' }
function unitLabel(commodity: string) { return isRice(commodity) ? 'CWT' : 'bu' }
function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }

export default function DealForm({
  commodity: initCommodity,
  contactId: initContactId,
  dealLabel = 'Contract',
  dealType,
  initial,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!initial

  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactId, setContactId] = useState(initContactId ?? '')
  const [commodity, setCommodity] = useState(initial?.commodity ?? initCommodity ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity ?? '')
  const [futuresPrice, setFuturesPrice] = useState(initial?.pricePerBushel ?? '')
  const [basis, setBasis] = useState(initial?.basis ?? '')
  const [cropYear, setCropYear] = useState(initial?.cropYear ?? '')
  const [futuresMonth, setFuturesMonth] = useState(initial?.futuresMonth ?? '')
  const [futuresYear, setFuturesYear] = useState(initial?.futuresYear ?? '')
  const [hedged, setHedged] = useState(initial?.hedged ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'PENDING')
  const [dealDate, setDealDate] = useState(
    initial?.dealDate ? initial.dealDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initContactId && !isEdit) {
      fetch('/api/contacts').then((r) => r.json()).then(setContacts).catch(() => {})
    }
  }, [initContactId, isEdit])

  // Reset futures month when commodity changes if current selection isn't valid
  function handleCommodityChange(newCommodity: string) {
    setCommodity(newCommodity)
    const validMonths = FUTURES_MONTHS_BY_COMMODITY[newCommodity] ?? []
    if (!validMonths.includes(futuresMonth)) setFuturesMonth('')
  }

  const qty = parseFloat(quantity) || 0
  const futures = parseFloat(futuresPrice) || 0
  const basisNum = basis !== '' && basis != null ? parseFloat(basis as string) : null
  const hasBothPrices = futuresPrice !== '' && basis !== '' && !isNaN(futures) && basisNum != null && !isNaN(basisNum)
  const cashPrice = hasBothPrices ? futures + (basisNum ?? 0) : null

  const totalDisplay = (() => {
    if (!qty) return '—'
    if (cashPrice != null) return fmt(qty * cashPrice)
    if (futuresPrice !== '' && !isNaN(futures)) return fmt(qty * futures)
    return '—'
  })()

  const availableMonths = commodity ? (FUTURES_MONTHS_BY_COMMODITY[commodity] ?? []) : []

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!contactId && !isEdit) { setError('Please select a contact'); return }
    if (!quantity || !futuresPrice) { setError('Quantity and futures price are required'); return }
    if (status === 'COMPLETED' && !dealDate) {
      setError('Contract Date is required when status is Completed'); return
    }
    setLoading(true)
    setError('')
    try {
      const url = isEdit ? `/api/deals/${initial!.id}` : '/api/deals'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          commodity,
          quantity,
          pricePerBushel: futuresPrice,
          basis: basis !== '' ? basis : null,
          cropYear: cropYear || null,
          futuresMonth: futuresMonth || null,
          futuresYear: futuresYear || null,
          hedged: hedged || null,
          status,
          dealDate,
          notes,
          dealType,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const contractNumber = initial?.contractNumber ?? null
  const showContractNumber = status === 'COMPLETED' || !!contractNumber

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? `Edit ${dealLabel} Contract` : `New ${dealLabel} Contract`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initContactId && !isEdit && (
            <div>
              <label className="form-label">Contact *</label>
              <select className="form-input" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
                <option value="">Select a contact…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Commodity</label>
              <select
                className="form-input"
                value={commodity}
                onChange={(e) => handleCommodityChange(e.target.value)}
                disabled={!!initCommodity && !isEdit}
              >
                <option value="">— Select —</option>
                {COMMODITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Contract Number — shown when Completed or already has a number */}
          {showContractNumber && (
            <div>
              <label className="form-label">Contract Number</label>
              <div className={`form-input bg-gray-50 text-sm ${contractNumber ? 'text-gray-800 font-mono font-semibold' : 'text-gray-400 italic'}`}>
                {contractNumber ?? 'Auto-assigned on save'}
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Quantity ({commodity ? unitLabel(commodity) : 'units'}s) *</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="form-label">{commodity ? priceLabel(commodity) : 'Futures Price'} *</label>
            <input
              className="form-input"
              type="number"
              step="0.0001"
              value={futuresPrice}
              onChange={(e) => setFuturesPrice(e.target.value)}
              required
              placeholder="e.g. 4.55"
            />
          </div>

          <div>
            <label className="form-label">Crop Year</label>
            <select className="form-input" value={cropYear} onChange={(e) => setCropYear(e.target.value)}>
              <option value="">— Select year —</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Futures Month</label>
            <select
              className="form-input"
              value={futuresMonth}
              onChange={(e) => setFuturesMonth(e.target.value)}
              disabled={!commodity}
            >
              <option value="">{commodity ? '— Select month —' : '— Select commodity first —'}</option>
              {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Futures Year</label>
            <select className="form-input" value={futuresYear} onChange={(e) => setFuturesYear(e.target.value)}>
              <option value="">— Select year —</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">{commodity ? basisLabel(commodity) : 'Basis'}</label>
            <input
              className="form-input"
              type="number"
              step="0.0001"
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              placeholder="e.g. -0.25"
            />
          </div>

          {cashPrice != null && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                Cash Price / {commodity ? unitLabel(commodity) : 'unit'}:
              </span>
              <span className="text-blue-900 font-bold">{fmt(cashPrice)}</span>
            </div>
          )}

          <div className="p-3 bg-green-50 rounded-lg text-sm flex items-center justify-between">
            <span className="text-green-700 font-medium">Total Value:</span>
            <span className="text-green-900 font-bold">{totalDisplay}</span>
          </div>

          <div>
            <label className="form-label">Transaction Hedged</label>
            <select className="form-input" value={hedged} onChange={(e) => setHedged(e.target.value)}>
              <option value="">— Select —</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="form-label">
              Contract Date{status === 'COMPLETED' ? ' *' : ''}
            </label>
            <input
              className="form-input"
              type="date"
              value={dealDate}
              onChange={(e) => setDealDate(e.target.value)}
              required={status === 'COMPLETED'}
            />
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Contract'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
