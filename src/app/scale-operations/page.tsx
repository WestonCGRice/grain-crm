'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, ArrowLeft, Truck, Ship, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Ticket = {
  id: string
  ticketNumber: string
  ticketType: string
  ticketDate: string
  cropYear: string | null
  commodity: string | null
  grossWeight: string | null
  tareWeight: string | null
  netWeight: string | null
  billOfLading: string | null
  status: string
}

const TYPE_LABELS: Record<string, string> = {
  SCALE_TICKET: 'Scale Ticket',
  SHIPMENT_TICKET: 'Shipment Ticket',
  DIRECT_SHIP: 'Direct Ship',
}

export default function ScaleOperationsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/scale-tickets?status=ACTIVE')
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <header className="flex items-center justify-between px-8 py-5" style={{ background: '#1d2c3f' }}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/central-grain-logo.png" alt="Central Grain" className="h-10 object-contain" style={{ background: 'white', borderRadius: 6, padding: '2px 8px' }} />
          <span className="text-white font-semibold text-lg">Scale Operations and Shipments</span>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Return to Home
        </button>
      </header>

      <main className="flex-1 px-6 py-8" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/scale-operations/operate')}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-transparent hover:border-amber-400 shadow-sm hover:shadow-md transition-all"
          >
            <Scale size={36} className="text-amber-500" />
            <div className="text-center">
              <div className="font-semibold text-gray-900">Operate Scale</div>
              <div className="text-xs text-gray-500 mt-0.5">Weigh in / weigh out trucks</div>
            </div>
          </button>

          <button
            onClick={() => router.push('/scale-operations/direct-ship')}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-transparent hover:border-blue-400 shadow-sm hover:shadow-md transition-all"
          >
            <Ship size={36} className="text-blue-500" />
            <div className="text-center">
              <div className="font-semibold text-gray-900">Enter Direct Ship Tickets</div>
              <div className="text-xs text-gray-500 mt-0.5">Third-party origin to sales customer</div>
            </div>
          </button>

          <button
            onClick={() => router.push('/scale-operations/select-location')}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-transparent hover:border-green-400 shadow-sm hover:shadow-md transition-all"
          >
            <MapPin size={36} className="text-green-600" />
            <div className="text-center">
              <div className="font-semibold text-gray-900">Select Location</div>
              <div className="text-xs text-gray-500 mt-0.5">Set active operating location</div>
            </div>
          </button>
        </div>

        {/* Active tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">Active Tickets</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tickets that have been created but not yet completed</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-600">{tickets.length} active</span>
              <button onClick={loadTickets} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <Truck size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No active tickets. Use Operate Scale to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Commodity</th>
                    <th>Crop Year</th>
                    <th>Gross Wt</th>
                    <th>Tare Wt</th>
                    <th>Net Wt</th>
                    <th>Bill of Lading</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="cursor-pointer hover:bg-amber-50" onClick={() => router.push('/scale-operations/operate')}>
                      <td className="font-mono font-semibold text-gray-800">{t.ticketNumber}</td>
                      <td>{TYPE_LABELS[t.ticketType] ?? t.ticketType}</td>
                      <td className="text-sm">{formatDate(t.ticketDate)}</td>
                      <td>{t.commodity ? t.commodity.charAt(0) + t.commodity.slice(1).toLowerCase() : <span className="text-gray-400">—</span>}</td>
                      <td>{t.cropYear || <span className="text-gray-400">—</span>}</td>
                      <td>{t.grossWeight ? `${Number(t.grossWeight).toLocaleString()} lbs` : <span className="text-gray-400">—</span>}</td>
                      <td>{t.tareWeight ? `${Number(t.tareWeight).toLocaleString()} lbs` : <span className="text-gray-400">—</span>}</td>
                      <td className="font-medium text-green-700">{t.netWeight ? `${Number(t.netWeight).toLocaleString()} lbs` : <span className="text-gray-400">—</span>}</td>
                      <td>{t.billOfLading || <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
