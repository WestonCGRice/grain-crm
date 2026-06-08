'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Truck, Users } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 64        // px per hour
const COL_WIDTH = 78          // px per dispatch column (15 cols × 78 = 1170px)
const NUM_COLS = 15
const START_HOUR = 5          // 5 AM
const END_HOUR = 22           // 10 PM
const SNAP_MINUTES = 15
const LABEL_WIDTH = 52        // px for hour labels
const COMMODITIES = ['CORN', 'SOYBEANS', 'RICE']
const COMMODITY_COLORS: Record<string, string> = {
  CORN: '#d97706', SOYBEANS: '#65a30d', RICE: '#0891b2',
}
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_WEEKS_OFFSET = 4

type Location = { id: string; name: string }
type Driver   = { id: string; name: string; phone: string | null }
type Truck_   = { id: string; number: string; description: string | null }
type Dispatch = {
  id: string
  truckId: string; driverId: string; commodity: string
  pickupLocationId: string; deliveryLocationId: string
  startTime: string; durationMinutes: number; notes: string | null
  truck: { id: string; number: string }
  driver: { id: string; name: string }
  pickupLocation: { id: string; name: string }
  deliveryLocation: { id: string; name: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatHour(h: number): string {
  const suffix = h < 12 ? 'AM' : 'PM'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display}:00 ${suffix}`
}

function minutesFromMidnight(isoStr: string): number {
  const d = new Date(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}

// Greedy column assignment — finds first column with no overlap
function assignColumns(dispatches: Dispatch[]): Map<string, number> {
  const sorted = [...dispatches].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const cols: Map<string, number> = new Map()
  // For each column, track when it becomes free (in minutes from midnight)
  const colFreeAt: number[] = Array(NUM_COLS).fill(0)

  for (const d of sorted) {
    const start = minutesFromMidnight(d.startTime)
    const end = start + d.durationMinutes
    const col = colFreeAt.findIndex((freeAt) => freeAt <= start)
    const assignedCol = col === -1 ? 0 : col  // fallback to col 0 if all occupied
    cols.set(d.id, assignedCol)
    colFreeAt[assignedCol] = end
  }
  return cols
}

// ── Driver management modal ────────────────────────────────────────────────────
function DriverModal({ drivers, trucks, onClose, onRefresh }: {
  drivers: Driver[]; trucks: Truck_[]
  onClose: () => void; onRefresh: () => void
}) {
  const [tab, setTab] = useState<'drivers' | 'trucks'>('drivers')
  const [dName, setDName] = useState(''); const [dPhone, setDPhone] = useState('')
  const [tNumber, setTNumber] = useState(''); const [tDesc, setTDesc] = useState('')
  const [saving, setSaving] = useState(false); const [err, setErr] = useState('')

  async function addDriver(e: { preventDefault(): void }) {
    e.preventDefault(); setSaving(true); setErr('')
    const res = await fetch('/api/drivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dName, phone: dPhone }) })
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Error') }
    else { setDName(''); setDPhone(''); onRefresh() }
    setSaving(false)
  }

  async function removeDriver(id: string) {
    if (!confirm('Remove this driver?')) return
    await fetch(`/api/drivers/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  async function addTruck(e: { preventDefault(): void }) {
    e.preventDefault(); setSaving(true); setErr('')
    const res = await fetch('/api/trucks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: tNumber, description: tDesc }) })
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Error') }
    else { setTNumber(''); setTDesc(''); onRefresh() }
    setSaving(false)
  }

  async function removeTruck(id: string) {
    if (!confirm('Remove this truck?')) return
    await fetch(`/api/trucks/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Manage Drivers &amp; Trucks</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {(['drivers', 'trucks'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-white border border-b-white border-gray-200 text-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'drivers' ? 'Drivers' : 'Trucks'}
            </button>
          ))}
        </div>

        {err && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{err}</div>}

        {tab === 'drivers' && (
          <>
            <form onSubmit={addDriver} className="flex gap-2 mb-4">
              <input className="form-input flex-1" placeholder="Driver name *" value={dName} onChange={(e) => setDName(e.target.value)} required />
              <input className="form-input w-32" placeholder="Phone" value={dPhone} onChange={(e) => setDPhone(e.target.value)} />
              <button type="submit" className="btn-primary px-3 py-1.5 text-sm" disabled={saving}><Plus size={14} /></button>
            </form>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {drivers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No drivers yet.</p>}
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{d.name}</span>
                    {d.phone && <span className="text-xs text-gray-500 ml-2">{d.phone}</span>}
                  </div>
                  <button onClick={() => removeDriver(d.id)} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'trucks' && (
          <>
            <form onSubmit={addTruck} className="flex gap-2 mb-4">
              <input className="form-input flex-1" placeholder="Truck # *" value={tNumber} onChange={(e) => setTNumber(e.target.value)} required />
              <input className="form-input flex-1" placeholder="Description" value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
              <button type="submit" className="btn-primary px-3 py-1.5 text-sm" disabled={saving}><Plus size={14} /></button>
            </form>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {trucks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No trucks yet.</p>}
              {trucks.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-800">Truck #{t.number}</span>
                    {t.description && <span className="text-xs text-gray-500 ml-2">{t.description}</span>}
                  </div>
                  <button onClick={() => removeTruck(t.id)} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Dispatch form popup ────────────────────────────────────────────────────────
function DispatchPopup({
  dispatch, clickedTime, trucks, drivers, locations,
  onClose, onSaved, onDelete,
}: {
  dispatch?: Dispatch; clickedTime?: Date
  trucks: Truck_[]; drivers: Driver[]; locations: Location[]
  onClose: () => void; onSaved: () => void; onDelete?: () => void
}) {
  const isEdit = !!dispatch
  const [truckId, setTruckId] = useState(dispatch?.truckId ?? '')
  const [driverId, setDriverId] = useState(dispatch?.driverId ?? '')
  const [commodity, setCommodity] = useState(dispatch?.commodity ?? '')
  const [pickupId, setPickupId] = useState(dispatch?.pickupLocationId ?? '')
  const [deliveryId, setDeliveryId] = useState(dispatch?.deliveryLocationId ?? '')
  const [startIso, setStartIso] = useState(() => {
    if (dispatch) return new Date(dispatch.startTime).toISOString().slice(0, 16)
    if (clickedTime) return clickedTime.toISOString().slice(0, 16)
    return new Date().toISOString().slice(0, 16)
  })
  const [duration, setDuration] = useState(dispatch?.durationMinutes ?? 90)
  const [notes, setNotes] = useState(dispatch?.notes ?? '')
  const [saving, setSaving] = useState(false); const [err, setErr] = useState('')

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const url = isEdit ? `/api/dispatches/${dispatch!.id}` : '/api/dispatches'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ truckId, driverId, commodity, pickupLocationId: pickupId, deliveryLocationId: deliveryId, startTime: new Date(startIso).toISOString(), durationMinutes: duration, notes }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Error') }
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this dispatch?')) return
    await fetch(`/api/dispatches/${dispatch!.id}`, { method: 'DELETE' })
    onDelete?.()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Dispatch' : 'New Dispatch'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        {err && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{err}</div>}
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Truck *</label>
              <select className="form-input" value={truckId} onChange={(e) => setTruckId(e.target.value)} required>
                <option value="">— Select —</option>
                {trucks.map((t) => <option key={t.id} value={t.id}>#{t.number}{t.description ? ` – ${t.description}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Driver *</label>
              <select className="form-input" value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                <option value="">— Select —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Commodity *</label>
            <select className="form-input" value={commodity} onChange={(e) => setCommodity(e.target.value)} required>
              <option value="">— Select —</option>
              {COMMODITIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Pickup Location *</label>
              <select className="form-input" value={pickupId} onChange={(e) => setPickupId(e.target.value)} required>
                <option value="">— Select —</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Delivery Location *</label>
              <select className="form-input" value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)} required>
                <option value="">— Select —</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Pickup Time *</label>
              <input className="form-input" type="datetime-local" value={startIso} onChange={(e) => setStartIso(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Duration (min)</label>
              <input className="form-input" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 90)} />
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1 text-sm" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Dispatch'}</button>
            {isEdit && (
              <button type="button" className="text-red-400 hover:text-red-600 px-3 py-2 rounded-md border border-gray-200 hover:border-red-200 transition-colors text-sm" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button type="button" className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Dispatch block (resizable) ────────────────────────────────────────────────
function DispatchBlock({
  dispatch, col, hourHeight, startHour, readOnly,
  onClick, onResizeDone,
}: {
  dispatch: Dispatch; col: number; hourHeight: number; startHour: number; readOnly: boolean
  onClick: () => void; onResizeDone: (id: string, mins: number) => void
}) {
  const [liveDuration, setLiveDuration] = useState(dispatch.durationMinutes)
  const dragRef = useRef<{ startY: number; startDur: number } | null>(null)

  // Recalc when prop changes
  useEffect(() => { setLiveDuration(dispatch.durationMinutes) }, [dispatch.durationMinutes])

  const minOfDay = minutesFromMidnight(dispatch.startTime)
  const top = Math.max(0, (minOfDay - startHour * 60)) * (hourHeight / 60)
  const height = Math.max(hourHeight / 4, liveDuration * (hourHeight / 60))

  const color = COMMODITY_COLORS[dispatch.commodity] ?? '#6b7280'

  function handleResizeDown(e: React.MouseEvent) {
    if (readOnly) return
    e.stopPropagation()
    dragRef.current = { startY: e.clientY, startDur: dispatch.durationMinutes }

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return
      const deltaY = ev.clientY - dragRef.current.startY
      const deltaMins = Math.round(deltaY / (hourHeight / 60) / SNAP_MINUTES) * SNAP_MINUTES
      setLiveDuration(Math.max(15, dragRef.current.startDur + deltaMins))
    }
    function onUp(ev: MouseEvent) {
      if (!dragRef.current) return
      const deltaY = ev.clientY - dragRef.current.startY
      const deltaMins = Math.round(deltaY / (hourHeight / 60) / SNAP_MINUTES) * SNAP_MINUTES
      const finalDur = Math.max(15, dragRef.current.startDur + deltaMins)
      dragRef.current = null
      onResizeDone(dispatch.id, finalDur)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const endMin = minOfDay + liveDuration
  const endH = Math.floor(endMin / 60)
  const endM = endMin % 60
  const endStr = `${endH % 12 || 12}:${String(endM).padStart(2, '0')}${endH < 12 ? 'am' : 'pm'}`

  return (
    <div
      style={{
        position: 'absolute',
        top, height,
        left: LABEL_WIDTH + col * COL_WIDTH + 2,
        width: COL_WIDTH - 4,
        background: color,
        borderRadius: 5,
        opacity: 0.92,
        cursor: readOnly ? 'default' : 'pointer',
        overflow: 'hidden',
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      onClick={onClick}
    >
      <div style={{ padding: '2px 4px', color: 'white', fontSize: 10, lineHeight: 1.3, userSelect: 'none' }}>
        <div style={{ fontWeight: 700, fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          #{dispatch.truck.number} · {dispatch.driver.name}
        </div>
        {height > 28 && (
          <div style={{ opacity: 0.9, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {dispatch.commodity.charAt(0) + dispatch.commodity.slice(1).toLowerCase()}
          </div>
        )}
        {height > 44 && (
          <div style={{ opacity: 0.8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 9 }}>
            → {dispatch.deliveryLocation.name}
          </div>
        )}
        {height > 58 && (
          <div style={{ opacity: 0.75, fontSize: 9 }}>ends {endStr}</div>
        )}
      </div>
      {!readOnly && (
        <div
          onMouseDown={handleResizeDown}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
            cursor: 'ns-resize', background: 'rgba(0,0,0,0.15)',
          }}
        />
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TruckDispatchingPage() {
  const router = useRouter()

  const todayRef = useRef(new Date())
  const today = todayRef.current
  today.setHours(0, 0, 0, 0)
  const currentWeekMonday = getWeekMonday(today)

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const dow = today.getDay()
    return dow === 0 ? 6 : dow - 1  // 0=Mon … 6=Sun
  })

  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck_[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [popup, setPopup] = useState<{ dispatch?: Dispatch; clickedTime?: Date } | null>(null)
  const [loading, setLoading] = useState(false)

  const weekMonday = addDays(currentWeekMonday, weekOffset * 7)
  const selectedDate = addDays(weekMonday, selectedDayIndex)
  const isReadOnly = selectedDate < today

  const loadDispatches = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dispatches?date=${toDateStr(selectedDate)}`)
    if (res.ok) setDispatches(await res.json())
    setLoading(false)
  }, [selectedDate])  // eslint-disable-line react-hooks/exhaustive-deps

  const loadResources = useCallback(async () => {
    const [dRes, tRes, lRes] = await Promise.all([
      fetch('/api/drivers'), fetch('/api/trucks'), fetch('/api/locations'),
    ])
    if (dRes.ok) setDrivers(await dRes.json())
    if (tRes.ok) setTrucks(await tRes.json())
    if (lRes.ok) setLocations(await lRes.json())
  }, [])

  useEffect(() => { loadDispatches() }, [loadDispatches])
  useEffect(() => { loadResources() }, [loadResources])

  const colAssignment = assignColumns(dispatches)

  async function handleResize(id: string, mins: number) {
    await fetch(`/api/dispatches/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes: mins }),
    })
    loadDispatches()
  }

  function handleGridClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isReadOnly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const totalMinutes = START_HOUR * 60 + Math.round((y / (HOUR_HEIGHT / 60)) / SNAP_MINUTES) * SNAP_MINUTES
    const clickedTime = new Date(selectedDate)
    clickedTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
    setPopup({ clickedTime })
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const totalCalH = hours.length * HOUR_HEIGHT
  const totalCalW = LABEL_WIDTH + NUM_COLS * COL_WIDTH

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i))

  const selectedDateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4" style={{ background: '#1d2c3f' }}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/central-grain-logo.png" alt="Central Grain" className="h-10 object-contain" style={{ background: 'white', borderRadius: 6, padding: '2px 8px' }} />
          <span className="text-white font-semibold text-lg">Truck Dispatching</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDriverModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Users size={14} /> <Truck size={14} /> Manage Drivers &amp; Trucks
          </button>
          <button onClick={() => router.push('/operations-planning')} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4" style={{ maxWidth: totalCalW + 32, margin: '0 auto', width: '100%' }}>

        {/* Week navigation + day selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Back arrow */}
            <button
              onClick={() => setWeekOffset(w => Math.max(-MAX_WEEKS_OFFSET, w - 1))}
              disabled={weekOffset <= -MAX_WEEKS_OFFSET}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Day buttons */}
            <div className="flex gap-1 flex-1">
              {weekDays.map((day, i) => {
                const isPast = day < today
                const isToday = toDateStr(day) === toDateStr(today)
                const isSelected = i === selectedDayIndex
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDayIndex(i)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#1d2c3f] text-white'
                        : isPast
                        ? 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                        : isToday
                        ? 'text-[#1d2c3f] bg-cyan-50 border border-cyan-200 hover:bg-cyan-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div>{DAY_LABELS[i]}</div>
                    <div className="text-xs opacity-75">{day.getMonth() + 1}/{day.getDate()}</div>
                  </button>
                )
              })}
            </div>

            {/* Forward arrow */}
            <button
              onClick={() => setWeekOffset(w => Math.min(MAX_WEEKS_OFFSET, w + 1))}
              disabled={weekOffset >= MAX_WEEKS_OFFSET}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-2 px-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">{selectedDateLabel}</span>
            {isReadOnly && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Past day — view only
              </span>
            )}
            {!isReadOnly && (
              <span className="text-xs text-gray-400">Click on the calendar to schedule a dispatch</span>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading…</div>
          ) : (
            <div style={{ position: 'relative', width: totalCalW, height: totalCalH + 1 }}>

              {/* Hour grid lines & labels */}
              {hours.map((h, i) => (
                <div key={h} style={{ position: 'absolute', top: i * HOUR_HEIGHT, left: 0, width: totalCalW, height: HOUR_HEIGHT, borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ position: 'absolute', left: 4, top: 2, fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', width: LABEL_WIDTH - 8, textAlign: 'right' }}>
                    {formatHour(h)}
                  </span>
                </div>
              ))}

              {/* Column separators */}
              {Array.from({ length: NUM_COLS + 1 }, (_, i) => (
                <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: LABEL_WIDTH + i * COL_WIDTH, width: 1, background: i === 0 ? '#d1d5db' : '#f3f4f6' }} />
              ))}

              {/* Clickable grid overlay (behind blocks) */}
              <div
                style={{ position: 'absolute', top: 0, left: LABEL_WIDTH, width: NUM_COLS * COL_WIDTH, height: totalCalH, cursor: isReadOnly ? 'default' : 'crosshair', zIndex: 1 }}
                onClick={handleGridClick}
              />

              {/* Half-hour tick lines */}
              {hours.map((_, i) => (
                <div key={`half-${i}`} style={{ position: 'absolute', top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2, left: LABEL_WIDTH, width: NUM_COLS * COL_WIDTH, height: 1, background: '#f9fafb', zIndex: 0 }} />
              ))}

              {/* Current time indicator */}
              {toDateStr(selectedDate) === toDateStr(today) && (() => {
                const now = new Date()
                const minNow = now.getHours() * 60 + now.getMinutes()
                const topNow = (minNow - START_HOUR * 60) * (HOUR_HEIGHT / 60)
                if (topNow < 0 || topNow > totalCalH) return null
                return (
                  <div style={{ position: 'absolute', top: topNow, left: LABEL_WIDTH, width: NUM_COLS * COL_WIDTH, height: 2, background: '#ef4444', zIndex: 20, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: -6, top: -4, width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                  </div>
                )
              })()}

              {/* Dispatch blocks */}
              {dispatches.map((d) => (
                <DispatchBlock
                  key={d.id}
                  dispatch={d}
                  col={colAssignment.get(d.id) ?? 0}
                  hourHeight={HOUR_HEIGHT}
                  startHour={START_HOUR}
                  readOnly={isReadOnly}
                  onClick={() => setPopup({ dispatch: d })}
                  onResizeDone={handleResize}
                />
              ))}
            </div>
          )}
        </div>

        {dispatches.length > 0 && (
          <p className="mt-2 text-xs text-gray-400 text-right">{dispatches.length} dispatch{dispatches.length !== 1 ? 'es' : ''} scheduled · drag bottom edge of a block to adjust duration</p>
        )}
      </main>

      {/* Modals */}
      {showDriverModal && (
        <DriverModal
          drivers={drivers} trucks={trucks}
          onClose={() => setShowDriverModal(false)}
          onRefresh={loadResources}
        />
      )}

      {popup && (
        <DispatchPopup
          dispatch={popup.dispatch}
          clickedTime={popup.clickedTime}
          trucks={trucks} drivers={drivers} locations={locations}
          onClose={() => setPopup(null)}
          onSaved={() => { setPopup(null); loadDispatches() }}
          onDelete={() => { setPopup(null); loadDispatches() }}
        />
      )}
    </div>
  )
}
