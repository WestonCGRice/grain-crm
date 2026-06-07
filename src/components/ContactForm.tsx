'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

type ContactFormData = {
  farmingEntityName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  title: string
  address: string
  city: string
  state: string
  zip: string
  notes: string
  status: string
  contactType: string
  // Origination lists
  riceList: boolean
  cornList: boolean
  soybeanList: boolean
  smsOptIn: boolean
  // Sales lists (Grain Customers)
  riceRoughExport: boolean
  riceRoughDomestic: boolean
  soybeansDomestic: boolean
  soybeansExport: boolean
  cornDomestic: boolean
  cornExport: boolean
  riceAcres: string
  cornAcres: string
  soybeanAcres: string
  riceEstYield: string
  cornEstYield: string
  soybeanEstYield: string
}

type InitialContact = Partial<{
  [K in keyof ContactFormData]: ContactFormData[K] | null
}> & { id?: string }

type Props = {
  initial?: InitialContact
  contactType?: 'ORIGINATION' | 'CUSTOMER'
  onClose: () => void
  onSaved: () => void
}

function defaultForm(contactType: string): ContactFormData {
  return {
    farmingEntityName: '',
    firstName: '', lastName: '', email: '', phone: '',
    company: '', title: '', address: '', city: '', state: '', zip: '',
    notes: '', status: 'LEAD',
    contactType,
    riceList: false, cornList: false, soybeanList: false, smsOptIn: false,
    riceRoughExport: false, riceRoughDomestic: false,
    soybeansDomestic: false, soybeansExport: false,
    cornDomestic: false, cornExport: false,
    riceAcres: '', cornAcres: '', soybeanAcres: '',
    riceEstYield: '', cornEstYield: '', soybeanEstYield: '',
  }
}

function normalizeInitial(initial?: InitialContact, contactType?: string): ContactFormData {
  const base = defaultForm(contactType ?? 'ORIGINATION')
  if (!initial) return base
  const result = { ...base }
  for (const key of Object.keys(base) as (keyof ContactFormData)[]) {
    const val = initial[key]
    if (val == null) continue
    if (typeof base[key] === 'boolean') {
      (result as Record<string, unknown>)[key] = Boolean(val)
    } else {
      (result as Record<string, unknown>)[key] = String(val)
    }
  }
  return result
}

const STATUS_OPTIONS = ['LEAD', 'ACTIVE', 'CUSTOMER', 'INACTIVE']
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export default function ContactForm({ initial, contactType: propContactType, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ContactFormData>(() => normalizeInitial(initial, propContactType))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!initial?.id
  const isOrigination = (form.contactType || propContactType || 'ORIGINATION') === 'ORIGINATION'

  function set(field: keyof ContactFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  type BoolField = 'riceList' | 'cornList' | 'soybeanList' | 'smsOptIn' | 'riceRoughExport' | 'riceRoughDomestic' | 'soybeansDomestic' | 'soybeansExport' | 'cornDomestic' | 'cornExport'
  function toggle(field: BoolField) {
    setForm((f) => ({ ...f, [field]: !f[field] }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Primary contact first and last name are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const url = isEdit ? `/api/contacts/${initial!.id}` : '/api/contacts'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save contact')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const title = isEdit
    ? (isOrigination ? 'Edit Origination Contact' : 'Edit Grain Customer')
    : (isOrigination ? 'New Origination Contact' : 'New Grain Customer')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">{isOrigination ? 'Farming Entity Name' : 'Customer Entity Name'}</label>
            <input className="form-input" value={form.farmingEntityName} onChange={(e) => set('farmingEntityName', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Primary Contact First Name *</label>
              <input className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Primary Contact Last Name *</label>
              <input className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <label className="form-label">State</label>
              <select className="form-input" value={form.state} onChange={(e) => set('state', e.target.value)}>
                <option value="">—</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">ZIP</label>
              <input className="form-input" value={form.zip} onChange={(e) => set('zip', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {isOrigination && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Commodity Lists</p>
                <div className="flex gap-6">
                  {([
                    { field: 'riceList' as const, label: 'Rice List' },
                    { field: 'cornList' as const, label: 'Corn List' },
                    { field: 'soybeanList' as const, label: 'Soybean List' },
                  ]).map(({ field, label }) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[field]}
                        onChange={() => toggle(field)}
                        className="w-4 h-4 rounded accent-green-600"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.smsOptIn}
                  onChange={() => toggle('smsOptIn')}
                  className="w-4 h-4 rounded accent-green-600"
                />
                <span className="text-sm text-gray-700">Receive SMS Messages</span>
              </label>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acres</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Rice Acres</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.riceAcres} onChange={(e) => set('riceAcres', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Corn Acres</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.cornAcres} onChange={(e) => set('cornAcres', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Soybean Acres</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.soybeanAcres} onChange={(e) => set('soybeanAcres', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Est. Yield (bu/acre)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Rice Est. Yield</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.riceEstYield} onChange={(e) => set('riceEstYield', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Corn Est. Yield</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.cornEstYield} onChange={(e) => set('cornEstYield', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Soybean Est. Yield</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.soybeanEstYield} onChange={(e) => set('soybeanEstYield', e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {!isOrigination && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sales Commodity Lists</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { field: 'riceRoughExport' as const, label: 'Rice – Rough Export' },
                  { field: 'riceRoughDomestic' as const, label: 'Rice – Rough Domestic' },
                  { field: 'soybeansDomestic' as const, label: 'Soybeans – Domestic' },
                  { field: 'soybeansExport' as const, label: 'Soybeans – Export' },
                  { field: 'cornDomestic' as const, label: 'Corn – Domestic' },
                  { field: 'cornExport' as const, label: 'Corn – Export' },
                ]).map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[field]}
                      onChange={() => toggle(field)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : (isOrigination ? 'Create Contact' : 'Create Customer')}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
