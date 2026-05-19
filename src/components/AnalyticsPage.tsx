'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'

type KPIs = {
  totalContacts: number
  totalDeals: number
  totalVolume: number
  totalValue: number
  completedDeals: number
  completedVolume: number
  avgDealSize: number
  totalInteractions: number
}

type AnalyticsData = {
  kpis: KPIs
  monthlyData: { month: string; volume: number; value: number; count: number }[]
  statusBreakdown: { status: string; count: number }[]
  interestBreakdown: { level: string; count: number }[]
  interactionBreakdown: { type: string; count: number }[]
}

type Props = {
  commodity: 'corn' | 'soybeans' | 'rice'
  label: string
  color: string
  listHref: string
}

const PIE_COLORS = ['#16a34a', '#d97706', '#6b7280', '#0891b2', '#dc2626', '#7c3aed']

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value text-2xl">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

export default function AnalyticsPage({ commodity, label, color, listHref }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/analytics/${commodity}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [commodity])

  if (loading) return <div className="p-12 text-center text-gray-400">Loading analytics…</div>
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>
  if (!data) return null

  const { kpis, monthlyData, statusBreakdown, interestBreakdown, interactionBreakdown } = data

  return (
    <div>
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <Link href={listHref} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <h1 className="page-title">{label} Analytics</h1>
            </div>
            <p className="page-subtitle">Performance overview and deal metrics</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="Contacts" value={String(kpis.totalContacts)} />
        <StatCard label="Total Deals" value={String(kpis.totalDeals)} sub={`${kpis.completedDeals} completed`} />
        <StatCard
          label="Total Volume"
          value={`${formatNumber(Math.round(kpis.totalVolume))} bu`}
          sub={`${formatNumber(Math.round(kpis.completedVolume))} bu completed`}
        />
        <StatCard label="Total Value" value={formatCurrency(kpis.totalValue)} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-7">
        <StatCard label="Avg Deal Size" value={`${formatNumber(Math.round(kpis.avgDealSize))} bu`} />
        <StatCard label="Interactions Logged" value={String(kpis.totalInteractions)} />
      </div>

      {monthlyData.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No deal data yet. Deals will appear here once recorded.
        </div>
      ) : (
        <>
          {/* Monthly Volume Bar Chart */}
          <div className="card mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Volume (bushels)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => v != null ? [`${formatNumber(Number(v))} bu`, 'Volume'] : undefined} />
                <Bar dataKey="volume" fill={color} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Value Line Chart */}
          <div className="card mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Deal Value ($)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => v != null ? [formatCurrency(Number(v)), 'Value'] : undefined} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: color }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Deal count per month */}
          <div className="card mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Deal Count</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Pie charts row */}
      <div className="grid grid-cols-3 gap-4">
        {statusBreakdown.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Deal Status</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusBreakdown.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {interestBreakdown.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Interest Levels</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={interestBreakdown.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                  dataKey="count"
                  nameKey="level"
                  cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {interactionBreakdown.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Interaction Types</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={interactionBreakdown.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                  dataKey="count"
                  nameKey="type"
                  cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusBreakdown.length === 0 && interestBreakdown.length === 0 && interactionBreakdown.length === 0 && (
          <div className="col-span-3 card text-center py-8 text-gray-400">
            Charts will populate as you add contacts, deals, and interactions.
          </div>
        )}
      </div>
    </div>
  )
}
