'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Truck, Package, BarChart2 } from 'lucide-react'

const TILES = [
  {
    id: 'dispatch',
    label: 'Truck Dispatching',
    description: 'Schedule and track truck shipments by driver, commodity, and location',
    icon: <Truck size={36} />,
    href: '/operations-planning/truck-dispatching',
    color: '#d97706',
    border: 'hover:border-amber-400',
  },
  {
    id: 'inventory',
    label: 'Inventory Planning',
    description: 'Plan and manage grain inventory levels and projections',
    icon: <Package size={36} />,
    href: '/operations-planning/inventory-planning',
    color: '#0891b2',
    border: 'hover:border-cyan-400',
  },
  {
    id: 'analysis',
    label: 'Inventory Analysis',
    description: 'Analyze inventory trends, turnover, and commodity performance',
    icon: <BarChart2 size={36} />,
    href: '/operations-planning/inventory-analysis',
    color: '#7c3aed',
    border: 'hover:border-purple-400',
  },
]

export default function OperationsPlanningPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <header className="flex items-center justify-between px-8 py-5" style={{ background: '#1d2c3f' }}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/central-grain-logo.png" alt="Central Grain" className="h-10 object-contain" style={{ background: 'white', borderRadius: 6, padding: '2px 8px' }} />
          <span className="text-white font-semibold text-lg">Operations Planning</span>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Return to Home
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Operations Planning</h1>
        <p className="text-gray-500 mb-10 text-center">Select a planning module</p>

        <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              onClick={() => router.push(tile.href)}
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center ${tile.border}`}
            >
              <span style={{ color: tile.color }}>{tile.icon}</span>
              <div>
                <div className="text-lg font-semibold text-gray-900">{tile.label}</div>
                <div className="text-sm text-gray-500 mt-1">{tile.description}</div>
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="text-center pb-6 text-xs text-gray-400">© 2026 Central Grain</footer>
    </div>
  )
}
