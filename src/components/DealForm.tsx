'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Contact = { id: string; firstName: string; lastName: string }

type Props = {
  commodity?: 'CORN' | 'SOYBEANS' | 'RICE'
  contactId?: string
  onClose: () => void
  onSaved: () => void
}

const COMMODITIES = ['CORN', 'SOYBEANS', 'RICE']
const STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED']

export default function DealForm({ commodity: initCommodity, contactId: initContactId, onClose, onSaved }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactId, setContactId] = useState(initContactId ?? '')
  const [commodity, setCommodity] = useState(initCommodity ?? 'CORN')
  const [quantity, setQuantity] = useState('')
  const [pricePerBushel, setPricePerBushel] = useState('')
  const [status, setStatus] = useState('PENDING')
  const [dealDate, setDealDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initContactId) {
      fetch('/api/contacts').then((r) => r.json()).then(setContacts).catch(() => {})
    }
  }, [initContactId])

  const total = quantity && pricePerBushel
    ? (parseFloat(quantity) * parseFloat(pricePerBushel)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : '—'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId) { setError('Please select a contact'); return }
    if (!quantity || !pricePerBushel) { setError('Quantity and price are required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, commodity, quantity, pricePerBushel, status, dealDate, notes }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save deal')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">New Deal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initContactId && (
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
              <select className="form-input" value={commodity} onChange={(e) => setCommodity(e.target.value as never)} disabled={!!initCommodity}>
                {COMMODITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Quantity (bushels) *</label>
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
              <label className="form-label">Price / Bushel *</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.0001"
                value={pricePerBushel}
                onChange={(e) => setPricePerBushel(e.target.value)}
                required
                placeholder="e.g. 4.55"
              />
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg text-sm">
            <span className="text-green-700 font-medium">Total Value: </span>
            <span className="text-green-900 font-bold">{total}</span>
          </div>

          <div>
            <label className="form-label">Deal Date</label>
            <input
              className="form-input"
              type="date"
              value={dealDate}
              onChange={(e) => setDealDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : 'Save Deal'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
