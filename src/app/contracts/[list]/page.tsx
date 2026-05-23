'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Edit2, RotateCcw } from 'lucide-react'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils'
import DealForm, { type DealInitial } from '@/components/DealForm'

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
  hedged: string | null
  dealDate: string
  updatedAt: string
  notes: string | null
  deletedAt: string | null
  dealType: string | null
  contact: { id: string; firstName: string; lastName: string; farmingEntityName: string | null }
}

const LIST_CONFIG: Record<string, { statuses: string[]; title: string; includeDeleted?: boolean }> = {
  target: {
    statuses: ['PENDING'],
    title: 'Target Contracts',
  },
  'completed-unfilled': {
    statuses: ['COMPLETED', 'COMPLETED_UNFILLED'],
    title: 'Completed Contracts – Unfilled',
  },
  'completed-filled': {
    statuses: ['COMPLETED_FILLED'],
    title: 'Completed Contracts – Filled Not Settled',
  },
  settled: {
    statuses: ['SETTLED'],
    title: 'Settled Contracts',
  },
  deleted: {
    statuses: ['DELETED', 'CANCELLED'],
    title: 'Deleted Contracts',
    includeDeleted: true,
  },
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Target',
  COMPLETED: 'Completed – Unfilled',
  COMPLETED_UNFILLED: 'Completed – Unfilled',
  COMPLETED_FILLED: 'Completed – Filled Not Settled',
  SETTLED: 'Settled',
  DELETED: 'Deleted',
  CANCELLED: 'Deleted',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge badge-yellow',
  COMPLETED: 'badge badge-blue',
  COMPLETED_UNFILLED: 'badge badge-blue',
  COMPLETED_FILLED: 'badge badge-purple',
  SETTLED: 'badge badge-green',
  DELETED: 'badge badge-red',
  CANCELLED: 'badge badge-red',
}

const RESTORE_STATUSES = [
  { value: 'PENDING', label: 'Target' },
  { value: 'COMPLETED_UNFILLED', label: 'Completed – Unfilled' },
  { value: 'COMPLETED_FILLED', label: 'Completed – Filled Not Settled' },
  { value: 'SETTLED', label: 'Settled' },
]

export default function ContractListPage() {
  const { list } = useParams<{ list: string }>()
  const config = LIST_CONFIG[list]

  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [editDeal, setEditDeal] = useState<DealInitial | null>(null)
  const [showDeal, setShowDeal] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [restoreStatus, setRestoreStatus] = useState('PENDING')

  const load = useCallback(async () => {
    if (!config) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        statuses: config.statuses.join(','),
        ...(config.includeDeleted ? { includeDeleted: 'true' } : {}),
      })
      const res = await fetch(`/api/deals?${params}`)
      setDeals(await res.json())
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => { load() }, [load])

  async function handleRestore(deal: Deal) {
    await fetch(`/api/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: restoreStatus }),
    })
    setRestoring(null)
    load()
  }

  if (!config) {
    return <div className="p-12 text-center text-gray-400">Unknown contract list.</div>
  }

  const totalValue = deals.reduce((s, d) => s + parseFloat(d.totalValue), 0)
  const isDeleted = list === 'deleted'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{config.title}</h1>
          <p className="page-subtitle">
            {deals.length} contract{deals.length !== 1 ? 's' : ''}
            {totalValue > 0 && ` · ${formatCurrency(totalValue)} total value`}
          </p>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No contracts in this list.</div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Contract #</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Commodity</th>
                  <th>Volume</th>
                  <th>Futures Price</th>
                  <th>Basis</th>
                  <th>Cash Price</th>
                  <th>Total Value</th>
                  <th>Crop Year</th>
                  <th>Futures Month</th>
                  <th>Futures Year</th>
                  <th>Hedged</th>
                  <th>Status</th>
                  <th>Contract Date</th>
                  <th>Last Updated</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => {
                  const unit = d.commodity === 'RICE' ? 'CWT' : 'Bu'
                  const cashPrice = d.basis != null
                    ? parseFloat(d.pricePerBushel) + parseFloat(d.basis)
                    : null
                  return (
                    <tr key={d.id}>
                      <td className="font-mono text-xs font-semibold text-gray-700">
                        {d.contractNumber || <span className="text-gray-400">—</span>}
                      </td>
                      <td>
                        <div className="font-medium text-gray-900">
                          {d.contact.firstName} {d.contact.lastName}
                        </div>
                        {d.contact.farmingEntityName && (
                          <div className="text-xs text-gray-500">{d.contact.farmingEntityName}</div>
                        )}
                      </td>
                      <td className="text-xs text-gray-600">{d.dealType === 'SALE' ? 'Sell' : 'Purchase'}</td>
                      <td className="font-medium">{d.commodity.charAt(0) + d.commodity.slice(1).toLowerCase()}</td>
                      <td>{formatNumber(d.quantity)} {d.commodity === 'RICE' ? 'CWT' : 'bu'}</td>
                      <td>{formatCurrency(d.pricePerBushel)}/{unit}</td>
                      <td>{d.basis != null ? `${formatCurrency(d.basis)}/${unit}` : <span className="text-gray-400">—</span>}</td>
                      <td>{cashPrice != null ? `${formatCurrency(cashPrice)}/${unit}` : <span className="text-gray-400">—</span>}</td>
                      <td className="font-medium text-green-700">{formatCurrency(d.totalValue)}</td>
                      <td>{d.cropYear || <span className="text-gray-400">—</span>}</td>
                      <td>{d.futuresMonth || <span className="text-gray-400">—</span>}</td>
                      <td>{d.futuresYear || <span className="text-gray-400">—</span>}</td>
                      <td>{d.hedged || <span className="text-gray-400">—</span>}</td>
                      <td><span className={STATUS_COLORS[d.status]}>{STATUS_LABELS[d.status] ?? d.status}</span></td>
                      <td className="text-gray-500 text-xs">{formatDate(d.dealDate)}</td>
                      <td className="text-gray-500 text-xs">{formatDate(d.updatedAt)}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {isDeleted ? (
                            restoring === d.id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  className="form-input py-0.5 text-xs"
                                  value={restoreStatus}
                                  onChange={(e) => setRestoreStatus(e.target.value)}
                                >
                                  {RESTORE_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                                <button
                                  className="btn-primary py-0.5 px-2 text-xs"
                                  onClick={() => handleRestore(d)}
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button
                                className="text-gray-300 hover:text-green-600"
                                title="Restore"
                                onClick={() => { setRestoring(d.id); setRestoreStatus('PENDING') }}
                              >
                                <RotateCcw size={13} />
                              </button>
                            )
                          ) : (
                            <button
                              className="text-gray-300 hover:text-[#1d2c3f]"
                              title="Edit"
                              onClick={() => {
                                setEditDeal({
                                  id: d.id, commodity: d.commodity, quantity: d.quantity,
                                  pricePerBushel: d.pricePerBushel, basis: d.basis,
                                  status: d.status, contractNumber: d.contractNumber,
                                  cropYear: d.cropYear, futuresMonth: d.futuresMonth,
                                  futuresYear: d.futuresYear, hedged: d.hedged,
                                  dealDate: d.dealDate, notes: d.notes,
                                })
                                setShowDeal(true)
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeal && editDeal && (
        <DealForm
          dealLabel={editDeal.id ? 'Contract' : 'Contract'}
          dealType={deals.find((d) => d.id === editDeal.id)?.dealType === 'SALE' ? 'SALE' : 'PURCHASE'}
          initial={editDeal}
          onClose={() => { setShowDeal(false); setEditDeal(null) }}
          onSaved={() => { setShowDeal(false); setEditDeal(null); load() }}
        />
      )}
    </div>
  )
}
