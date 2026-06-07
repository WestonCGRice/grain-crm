'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit2, Trash2, Phone, Mail, Building2,
  MapPin, FileText, Plus, Phone as PhoneIcon, Mail as MailIcon,
  Users, Calendar,
} from 'lucide-react'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils'
import ContactForm from '@/components/ContactForm'
import InteractionForm from '@/components/InteractionForm'
import DealForm, { type DealInitial } from '@/components/DealForm'

type Interaction = { id: string; type: string; date: string; notes: string | null }

type Deal = {
  id: string
  commodity: string
  quantity: string
  pricePerBushel: string
  basis: string | null
  totalValue: string
  status: string
  contractNumber: string | null
  cropYear: string | null
  futuresMonth: string | null
  futuresYear: string | null
  orderEntered: string | null
  hedged: string | null
  dealDate: string
  updatedAt: string
  notes: string | null
  pickedUpLocationId: string | null
  deliveredLocationId: string | null
  pickedUpLocation: { id: string; name: string } | null
  deliveredLocation: { id: string; name: string } | null
}

type Contact = {
  id: string
  farmingEntityName: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  notes: string | null
  status: string
  riceList: boolean
  cornList: boolean
  soybeanList: boolean
  smsOptIn: boolean
  createdAt: string
  riceAcres: string | null
  cornAcres: string | null
  soybeanAcres: string | null
  riceEstYield: string | null
  cornEstYield: string | null
  soybeanEstYield: string | null
  commodityContacts: { id: string; commodity: string; interestLevel: string; estimatedVolume: string | null }[]
  interactions: Interaction[]
  deals: Deal[]
}

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'badge badge-yellow', ACTIVE: 'badge badge-green',
  CUSTOMER: 'badge badge-blue', INACTIVE: 'badge badge-gray',
}
const DEAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge badge-yellow', COMPLETED: 'badge badge-green', CANCELLED: 'badge badge-red',
}
const DEAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Target', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  CALL: <PhoneIcon size={13} />, EMAIL: <MailIcon size={13} />,
  MEETING: <Users size={13} />, NOTE: <FileText size={13} />,
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showInteraction, setShowInteraction] = useState(false)
  const [showDeal, setShowDeal] = useState(false)
  const [editDeal, setEditDeal] = useState<DealInitial | null>(null)
  const [cropYearFilter, setCropYearFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${id}`)
      if (!res.ok) { router.push('/contacts'); return }
      setContact(await res.json())
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!contact || !confirm(`Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`)) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    router.push('/contacts')
  }

  async function deleteInteraction(iid: string) {
    if (!confirm('Delete this interaction?')) return
    await fetch(`/api/interactions/${iid}`, { method: 'DELETE' })
    load()
  }

  async function deleteDeal(did: string) {
    if (!confirm('Delete this contract? This cannot be undone.')) return
    await fetch(`/api/deals/${did}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!contact) return null

  const totalDealValue = contact.deals.reduce((s, d) => s + parseFloat(d.totalValue), 0)
  const activeLists = [contact.riceList && 'Rice', contact.cornList && 'Corn', contact.soybeanList && 'Soybean'].filter(Boolean)
  const cropYears = [...new Set(contact.deals.map(d => d.cropYear).filter(Boolean) as string[])].sort()
  const filteredDeals = cropYearFilter ? contact.deals.filter(d => d.cropYear === cropYearFilter) : contact.deals

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/contacts')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          {contact.farmingEntityName && (
            <div className="flex items-center gap-2 mb-0.5">
              <Building2 size={14} className="text-gray-400" />
              <span className="text-base font-semibold text-gray-700">{contact.farmingEntityName}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <h1 className="page-title">{contact.firstName} {contact.lastName}</h1>
            <span className={STATUS_COLORS[contact.status]}>{contact.status}</span>
          </div>
          {contact.company && (
            <p className="page-subtitle flex items-center gap-1.5">
              <Building2 size={13} /> {contact.title ? `${contact.title} at ` : ''}{contact.company}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setShowEdit(true)}>
            <Edit2 size={14} /> Edit
          </button>
          <button className="btn-danger flex items-center gap-2" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-5">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-green-600">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone size={14} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-green-600">{contact.phone}</a>
                </div>
              )}
              {(contact.city || contact.state || contact.address) && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {contact.address && <div>{contact.address}</div>}
                    <div>{[contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                Added {formatDate(contact.createdAt)}
              </div>
            </div>
          </div>

          {(activeLists.length > 0 || contact.smsOptIn) && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Commodity Lists</h2>
              <div className="flex flex-wrap gap-1.5">
                {contact.riceList && <span className="badge badge-blue">Rice List</span>}
                {contact.cornList && <span className="badge badge-amber">Corn List</span>}
                {contact.soybeanList && <span className="badge badge-green">Soybean List</span>}
                {contact.smsOptIn && <span className="badge badge-green">SMS On</span>}
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText size={14} /> Notes
              </h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {(contact.riceAcres || contact.cornAcres || contact.soybeanAcres ||
            contact.riceEstYield || contact.cornEstYield || contact.soybeanEstYield) && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Acreage &amp; Est. Yield</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="text-left font-medium pb-1">Commodity</th>
                    <th className="text-right font-medium pb-1">Acres</th>
                    <th className="text-right font-medium pb-1">Bu/Acre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(contact.riceAcres || contact.riceEstYield) && (
                    <tr>
                      <td className="py-1.5 text-gray-700">Rice</td>
                      <td className="py-1.5 text-right text-gray-700">{contact.riceAcres ? formatNumber(contact.riceAcres) : '—'}</td>
                      <td className="py-1.5 text-right text-gray-700">{contact.riceEstYield ? formatNumber(contact.riceEstYield) : '—'}</td>
                    </tr>
                  )}
                  {(contact.cornAcres || contact.cornEstYield) && (
                    <tr>
                      <td className="py-1.5 text-gray-700">Corn</td>
                      <td className="py-1.5 text-right text-gray-700">{contact.cornAcres ? formatNumber(contact.cornAcres) : '—'}</td>
                      <td className="py-1.5 text-right text-gray-700">{contact.cornEstYield ? formatNumber(contact.cornEstYield) : '—'}</td>
                    </tr>
                  )}
                  {(contact.soybeanAcres || contact.soybeanEstYield) && (
                    <tr>
                      <td className="py-1.5 text-gray-700">Soybeans</td>
                      <td className="py-1.5 text-right text-gray-700">{contact.soybeanAcres ? formatNumber(contact.soybeanAcres) : '—'}</td>
                      <td className="py-1.5 text-right text-gray-700">{contact.soybeanEstYield ? formatNumber(contact.soybeanEstYield) : '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Commodity Interests</h2>
            {contact.commodityContacts.length === 0 ? (
              <p className="text-sm text-gray-400">No commodity assignments</p>
            ) : (
              <div className="space-y-2">
                {contact.commodityContacts.map((cc) => (
                  <div key={cc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">
                      {cc.commodity.charAt(0) + cc.commodity.slice(1).toLowerCase()}
                    </span>
                    <div className="text-right">
                      <span className={`badge badge-${cc.interestLevel === 'HIGH' ? 'green' : cc.interestLevel === 'MEDIUM' ? 'yellow' : 'gray'}`}>
                        {cc.interestLevel}
                      </span>
                      {cc.estimatedVolume && (
                        <div className="text-xs text-gray-500 mt-0.5">{formatNumber(cc.estimatedVolume)} bu/yr</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-xl font-bold text-gray-900">{contact.deals.length}</div>
                <div className="text-xs text-gray-500">Contracts</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-xl font-bold text-gray-900">{contact.interactions.length}</div>
                <div className="text-xs text-gray-500">Interactions</div>
              </div>
            </div>
            {contact.deals.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-center">
                <div className="text-lg font-bold text-green-800">{formatCurrency(totalDealValue)}</div>
                <div className="text-xs text-green-600">Total Contract Value</div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Interaction History</h2>
              <button className="btn-primary flex items-center gap-1.5 text-xs py-1.5" onClick={() => setShowInteraction(true)}>
                <Plus size={13} /> Log Interaction
              </button>
            </div>
            {contact.interactions.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No interactions yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contact.interactions.map((i) => (
                  <div key={i.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm flex-shrink-0">
                      {INTERACTION_ICONS[i.type] ?? <FileText size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{i.type}</span>
                        <span className="text-xs text-gray-500">{formatDate(i.date)}</span>
                      </div>
                      {i.notes && <p className="text-sm text-gray-600 mt-0.5 truncate">{i.notes}</p>}
                    </div>
                    <button className="text-gray-300 hover:text-red-500 flex-shrink-0" onClick={() => deleteInteraction(i.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Purchase Grain Contracts</h2>
              <div className="flex items-center gap-3">
                {cropYears.length > 0 && (
                  <select
                    value={cropYearFilter}
                    onChange={e => setCropYearFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">All Crop Years</option>
                    {cropYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                <button className="btn-primary flex items-center gap-1.5 text-xs py-1.5" onClick={() => { setEditDeal(null); setShowDeal(true) }}>
                  <Plus size={13} /> New Contract
                </button>
              </div>
            </div>
            {contact.deals.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No contracts yet</p>
            ) : filteredDeals.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No contracts for crop year {cropYearFilter}</p>
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}></th>
                      <th>Contract #</th>
                      <th>Commodity</th>
                      <th>Volume</th>
                      <th>Futures Price</th>
                      <th>Crop Year</th>
                      <th>Futures Month</th>
                      <th>Futures Year</th>
                      <th>Basis</th>
                      <th>Cash Price</th>
                      <th>Total Value</th>
                      <th>Pickup Location</th>
                      <th>Delivery Location</th>
                      <th>Hedged</th>
                      <th>Status</th>
                      <th>Contract Date</th>
                      <th>Last Updated</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((d) => {
                      const unit = d.commodity === 'RICE' ? 'CWT' : 'Bu'
                      const cashPrice = d.basis != null
                        ? parseFloat(d.pricePerBushel) + parseFloat(d.basis)
                        : null
                      return (
                        <tr key={d.id}>
                          <td>
                            <button
                              className="btn-secondary flex items-center gap-1.5 text-xs py-1 px-2"
                              onClick={() => {
                                setEditDeal({
                                  id: d.id, commodity: d.commodity, quantity: d.quantity,
                                  pricePerBushel: d.pricePerBushel, basis: d.basis,
                                  status: d.status, contractNumber: d.contractNumber,
                                  cropYear: d.cropYear, futuresMonth: d.futuresMonth,
                                  futuresYear: d.futuresYear, orderEntered: d.orderEntered,
                                  hedged: d.hedged, dealDate: d.dealDate, notes: d.notes,
                                  pickedUpLocationId: d.pickedUpLocationId,
                                  deliveredLocationId: d.deliveredLocationId,
                                })
                                setShowDeal(true)
                              }}
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          </td>
                          <td className="font-mono text-xs font-semibold text-gray-700">
                            {d.contractNumber || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="font-medium">{d.commodity.charAt(0) + d.commodity.slice(1).toLowerCase()}</td>
                          <td>{formatNumber(d.quantity)} {d.commodity === 'RICE' ? 'CWT' : 'bu'}</td>
                          <td>{formatCurrency(d.pricePerBushel)}/{unit}</td>
                          <td>{d.cropYear || <span className="text-gray-400">—</span>}</td>
                          <td>{d.futuresMonth || <span className="text-gray-400">—</span>}</td>
                          <td>{d.futuresYear || <span className="text-gray-400">—</span>}</td>
                          <td>{d.basis != null ? `${formatCurrency(d.basis)}/${unit}` : <span className="text-gray-400">—</span>}</td>
                          <td>{cashPrice != null ? `${formatCurrency(cashPrice)}/${unit}` : <span className="text-gray-400">—</span>}</td>
                          <td className="font-medium text-green-700">{formatCurrency(d.totalValue)}</td>
                          <td className="text-xs">{d.pickedUpLocation?.name || <span className="text-gray-400">—</span>}</td>
                          <td className="text-xs">{d.deliveredLocation?.name || <span className="text-gray-400">—</span>}</td>
                          <td>{d.hedged || <span className="text-gray-400">—</span>}</td>
                          <td><span className={DEAL_STATUS_COLORS[d.status]}>{DEAL_STATUS_LABELS[d.status] ?? d.status}</span></td>
                          <td className="text-gray-500 text-xs">{formatDate(d.dealDate)}</td>
                          <td className="text-gray-500 text-xs">{formatDate(d.updatedAt)}</td>
                          <td>
                            <button className="text-gray-300 hover:text-red-500" onClick={() => deleteDeal(d.id)}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <ContactForm
          initial={{ ...contact }}
          contactType="ORIGINATION"
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load() }}
        />
      )}
      {showInteraction && (
        <InteractionForm
          contactId={id}
          onClose={() => setShowInteraction(false)}
          onSaved={() => { setShowInteraction(false); load() }}
        />
      )}
      {showDeal && (
        <DealForm
          contactId={editDeal ? undefined : id}
          dealLabel="Purchase Grain"
          dealType="PURCHASE"
          initial={editDeal ?? undefined}
          onClose={() => { setShowDeal(false); setEditDeal(null) }}
          onSaved={() => { setShowDeal(false); setEditDeal(null); load() }}
        />
      )}
    </div>
  )
}
