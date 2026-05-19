'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download } from 'lucide-react'

type CommodityContact = {
  id: string
  farmingEntityName: string | null
  firstName: string
  lastName: string
  phone: string | null
}

type Tab = 'RICE' | 'CORN' | 'SOYBEAN'

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: 'RICE', label: 'Rice List', color: '#0891b2' },
  { key: 'CORN', label: 'Corn List', color: '#d97706' },
  { key: 'SOYBEAN', label: 'Soybean List', color: '#65a30d' },
]

function exportCSV(rows: CommodityContact[], commodity: Tab) {
  const headers = ['Farm Name', 'Primary Contact First Name', 'Primary Contact Last Name', 'Phone']
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
  a.download = `${commodity.toLowerCase()}-list.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CommodityListPage() {
  const [activeTab, setActiveTab] = useState<Tab>('RICE')
  const [rows, setRows] = useState<CommodityContact[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commodity-list?commodity=${activeTab}`)
      const data = await res.json()
      setRows(data)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  const activeTabMeta = TABS.find((t) => t.key === activeTab)!

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Commodity List</h1>
          <p className="page-subtitle">Grain origination contacts opted in to price lists</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => exportCSV(rows, activeTab)}
          disabled={rows.length === 0}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: tab.color }}
              />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No contacts on the {activeTabMeta.label} yet. Check the{' '}
            <span className="font-medium">{activeTabMeta.label}</span> checkbox on a Grain Origination Contact to add them.
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              {rows.length} contact{rows.length !== 1 ? 's' : ''} on {activeTabMeta.label}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Farm Name</th>
                  <th>Primary Contact First Name</th>
                  <th>Primary Contact Last Name</th>
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
                        ? <a href={`tel:${r.phone}`} className="text-gray-700 hover:text-green-600">{r.phone}</a>
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
