'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp } from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

type FuturesContract = {
  id: string
  commodity: string
  futuresMonth: string
  futuresYear: string
  futuresPrice: string
  quantity: string
  numberOfContracts: number
  deal: {
    contractNumber: string | null
    dealType: string | null
    contact: { firstName: string; lastName: string; farmingEntityName: string | null }
  }
}

const COMMODITY_TABS = [
  { value: '', label: 'All' },
  { value: 'CORN', label: 'Corn' },
  { value: 'SOYBEANS', label: 'Soybeans' },
  { value: 'RICE', label: 'Rice' },
]

const COMMODITY_COLORS: Record<string, string> = {
  CORN: '#d97706',
  SOYBEANS: '#65a30d',
  RICE: '#0891b2',
}

export default function FuturesContractListPage() {
  const [contracts, setContracts] = useState<FuturesContract[]>([])
  const [loading, setLoading] = useState(true)
  const [commodity, setCommodity] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = commodity ? `?commodity=${commodity}` : ''
      const res = await fetch(`/api/futures-contracts${params}`)
      if (res.ok) setContracts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [commodity])

  useEffect(() => { load() }, [load])

  const unit = (c: string) => c === 'RICE' ? 'CWT' : 'bu'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp size={22} className="text-[#1d2c3f]" />
            Futures Contract List
          </h1>
          <p className="page-subtitle">
            {contracts.length} futures contract{contracts.length !== 1 ? 's' : ''} · sorted by nearest maturity
          </p>
        </div>
      </div>

      {/* Commodity filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {COMMODITY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCommodity(tab.value)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              commodity === tab.value
                ? 'border-[#1d2c3f] text-[#1d2c3f]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No futures contracts found. They are created automatically when a purchase or sales contract is saved with Transaction Hedged = Yes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Type</th>
                  <th>Futures Month</th>
                  <th>Futures Year</th>
                  <th>Futures Price</th>
                  <th>Quantity</th>
                  <th># of Contracts</th>
                  <th>Linked Contract #</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((fc) => (
                  <tr key={fc.id}>
                    <td>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: COMMODITY_COLORS[fc.commodity] }}
                        />
                        {fc.commodity.charAt(0) + fc.commodity.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="text-xs text-gray-600">{fc.deal.dealType === 'SALE' ? 'Sell' : 'Purchase'}</td>
                    <td className="font-medium">{fc.futuresMonth}</td>
                    <td className="font-medium">{fc.futuresYear}</td>
                    <td>{formatCurrency(fc.futuresPrice)}/{unit(fc.commodity)}</td>
                    <td>{formatNumber(fc.quantity)} {unit(fc.commodity)}</td>
                    <td className="font-semibold text-center">{fc.numberOfContracts}</td>
                    <td className="font-mono text-xs font-semibold text-gray-700">
                      {fc.deal.contractNumber || <span className="text-gray-400">—</span>}
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {fc.deal.contact.firstName} {fc.deal.contact.lastName}
                      </div>
                      {fc.deal.contact.farmingEntityName && (
                        <div className="text-xs text-gray-500">{fc.deal.contact.farmingEntityName}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
