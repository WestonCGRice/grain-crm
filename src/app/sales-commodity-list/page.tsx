'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download } from 'lucide-react'

type Row = {
  id: string
  farmingEntityName: string | null
  firstName: string
  lastName: string
  phone: string | null
}

type ListKey =
  | 'rice-rough-export'
  | 'rice-rough-domestic'
  | 'soybeans-domestic'
  | 'soybeans-export'
  | 'corn-domestic'
  | 'corn-export'

const TABS: { key: ListKey; label: string }[] = [
  { key: 'rice-rough-export',   label: 'Rice – Rough Export' },
  { key: 'rice-rough-domestic', label: 'Rice – Rough Domestic' },
  { key: 'soybeans-domestic',   label: 'Soybeans – Domestic' },
  { key: 'soybeans-export',     label: 'Soybeans – Export' },
  { key: 'corn-domestic',       label: 'Corn – Domestic' },
  { key: 'corn-export',         label: 'Corn – Export' },
]

function exportCSV(rows: Row[], label: string) {
  const headers = ['Customer Entity Name', 'First Name', 'Last Name', 'Phone']
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${r.farmingEntityName ?? ''}"`,
        `"${r.firstName}"`,
        `"${r.lastName}"`,
        `"${r.phone ?? ''}"`,
      ].join(',')
    ),
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${label.toLowerCase().replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SalesCommodityListPage() {
  const [activeTab, setActiveTab] = useState<ListKey>('rice-rough-export')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales-commodity-list?list=${activeTab}`)
      const data = await res.json()
      setRows(data)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? ''

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Commodity Lists</h1>
          <p className="page-subtitle">Grain customers opted in to sales commodity lists</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => exportCSV(rows, activeLabel)}
          disabled={rows.length === 0}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-5 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
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
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No customers on the <span className="font-medium">{activeLabel}</span> list yet.
            Add them via the Sales Commodity Lists checkboxes on a Grain Customer.
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              {rows.length} customer{rows.length !== 1 ? 's' : ''} on {activeLabel}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Customer Entity Name</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-800">
                      {r.farmingEntityName || <span className="text-gray-400">—</span>}
                    </td>
                    <td>{r.firstName}</td>
                    <td>{r.lastName}</td>
                    <td>
                      {r.phone
                        ? <a href={`tel:${r.phone}`} className="hover:text-[#1d2c3f]">{r.phone}</a>
                        : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
