'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, MessageSquare, Send } from 'lucide-react'

type CommodityContact = {
  id: string
  farmingEntityName: string | null
  firstName: string
  lastName: string
  phone: string | null
  smsOptIn: boolean
}

type MessageRecord = {
  id: string
  commodity: string
  messageText: string
  recipientCount: number
  sentAt: string
  sentByName: string | null
}

type Tab = 'RICE' | 'CORN' | 'SOYBEAN'

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: 'RICE', label: 'Rice List', color: '#0891b2' },
  { key: 'CORN', label: 'Corn List', color: '#d97706' },
  { key: 'SOYBEAN', label: 'Soybean List', color: '#65a30d' },
]

const COMMODITY_OPTIONS = [
  { value: 'RICE', label: 'Rice' },
  { value: 'CORN', label: 'Corn' },
  { value: 'SOYBEANS', label: 'Soybeans' },
]

const COMMODITY_COLORS: Record<string, string> = {
  RICE: '#0891b2',
  CORN: '#d97706',
  SOYBEANS: '#65a30d',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function exportCSV(rows: CommodityContact[], commodity: Tab) {
  const headers = ['Farm Name', 'First Name', 'Last Name', 'Phone', 'SMS Opt-In']
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${r.farmingEntityName ?? ''}"`,
        `"${r.firstName}"`,
        `"${r.lastName}"`,
        `"${r.phone ?? ''}"`,
        `"${r.smsOptIn ? 'Yes' : 'No'}"`,
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

  // Compose state
  const [msgCommodity, setMsgCommodity] = useState('RICE')
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null)

  // Archive state
  const [archive, setArchive] = useState<MessageRecord[]>([])
  const [archiveLoading, setArchiveLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commodity-list?commodity=${activeTab}`)
      setRows(await res.json())
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const loadArchive = useCallback(async () => {
    setArchiveLoading(true)
    try {
      const res = await fetch('/api/messages')
      if (res.ok) setArchive(await res.json())
    } finally {
      setArchiveLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadArchive() }, [loadArchive])

  // Count opted-in recipients for selected compose commodity
  const optedInCount = (() => {
    const flag = msgCommodity === 'RICE' ? 'riceList' : msgCommodity === 'CORN' ? 'cornList' : 'soybeanList'
    // We can't filter by a different commodity here without re-fetching,
    // so show a note directing user to the list tab for exact counts
    return null
    void flag
  })()
  void optedInCount

  async function handleSend(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity: msgCommodity, messageText: msgText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setSendResult({ ok: true, text: `Sent to ${data.recipientCount} opted-in recipient${data.recipientCount !== 1 ? 's' : ''}` })
      setMsgText('')
      loadArchive()
    } catch (err) {
      setSendResult({ ok: false, text: err instanceof Error ? err.message : 'Send failed' })
    } finally {
      setSending(false)
    }
  }

  const activeTabMeta = TABS.find((t) => t.key === activeTab)!

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Origination Commodity Lists</h1>
          <p className="page-subtitle">Grain origination contacts opted in to price lists</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => exportCSV(rows, activeTab)}
          disabled={rows.length === 0}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left: lists + compose ── */}
        <div className="flex-1 min-w-0">

          {/* Compose section */}
          <div className="card mb-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-[#1d2c3f]" />
              <h2 className="text-sm font-semibold text-gray-900">Send SMS Message</h2>
            </div>
            <form onSubmit={handleSend} className="space-y-3">
              <div className="flex gap-3 items-end">
                <div className="w-40">
                  <label className="form-label">Commodity</label>
                  <select
                    className="form-input"
                    value={msgCommodity}
                    onChange={(e) => setMsgCommodity(e.target.value)}
                  >
                    {COMMODITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Type your message here…"
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !msgText.trim()}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-md transition-colors mb-0.5"
                  style={{ background: '#1d2c3f', opacity: sending || !msgText.trim() ? 0.6 : 1 }}
                >
                  <Send size={14} /> {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Sent from "The Merchandising Team at Central Grain" · Only contacts with SMS opt-in enabled and a phone number will receive the message.
              </p>
              {sendResult && (
                <div className={`text-xs px-3 py-2 rounded-md ${sendResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {sendResult.text}
                </div>
              )}
            </form>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-[#1d2c3f] text-[#1d2c3f]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: tab.color }} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* List table */}
          <div className="table-container">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                No contacts on the {activeTabMeta.label} yet.
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  {rows.length} contact{rows.length !== 1 ? 's' : ''} · {rows.filter(r => r.smsOptIn && r.phone).length} SMS opted-in
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Farm Name</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Phone</th>
                      <th className="text-center">SMS</th>
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
                            ? <a href={`tel:${r.phone}`} className="text-gray-700 hover:text-[#1d2c3f]">{r.phone}</a>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="text-center">
                          {r.smsOptIn && r.phone
                            ? <span className="badge badge-green text-xs">SMS</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Message Archive ── */}
        <div className="w-72 flex-shrink-0">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={15} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Message Archive</h2>
            </div>

            {archiveLoading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading…</p>
            ) : archive.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No messages sent yet.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {archive.map((m) => (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: COMMODITY_COLORS[m.commodity] ?? '#6b7280' }}
                      >
                        {m.commodity.charAt(0) + m.commodity.slice(1).toLowerCase()}
                      </span>
                      <span className="text-xs text-gray-400">{relativeTime(m.sentAt)}</span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">{m.messageText}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {m.recipientCount} recipient{m.recipientCount !== 1 ? 's' : ''}
                      {m.sentByName ? ` · ${m.sentByName}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
