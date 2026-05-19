'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Contact = { id: string; firstName: string; lastName: string; company?: string | null }

type Props = {
  commodity: 'CORN' | 'SOYBEANS' | 'RICE'
  existingContactIds: string[]
  onClose: () => void
  onSaved: () => void
}

const INTEREST_LEVELS = ['LOW', 'MEDIUM', 'HIGH']

export default function AssignCommodityForm({ commodity, existingContactIds, onClose, onSaved }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactId, setContactId] = useState('')
  const [interestLevel, setInterestLevel] = useState('MEDIUM')
  const [estimatedVolume, setEstimatedVolume] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((data: Contact[]) => {
        setContacts(data.filter((c) => !existingContactIds.includes(c.id)))
      })
      .catch(() => setError('Failed to load contacts'))
  }, [existingContactIds])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId) { setError('Please select a contact'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/commodity-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, commodity, interestLevel, estimatedVolume, notes }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to assign contact')
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
          <h2 className="text-lg font-semibold text-gray-900">
            Add Contact to {commodity.charAt(0) + commodity.slice(1).toLowerCase()} List
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Contact *</label>
            <select className="form-input" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
              <option value="">Select a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}{c.company ? ` – ${c.company}` : ''}
                </option>
              ))}
            </select>
            {contacts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">All contacts are already on this list.</p>
            )}
          </div>

          <div>
            <label className="form-label">Interest Level</label>
            <select className="form-input" value={interestLevel} onChange={(e) => setInterestLevel(e.target.value)}>
              {INTEREST_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Estimated Volume (bushels/yr)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1000"
              value={estimatedVolume}
              onChange={(e) => setEstimatedVolume(e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading || contacts.length === 0}>
              {loading ? 'Adding…' : 'Add to List'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
