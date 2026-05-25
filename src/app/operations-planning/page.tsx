'use client'

import { useRouter } from 'next/navigation'
import { ClipboardList, ArrowLeft } from 'lucide-react'

export default function OperationsPlanningPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
      <div className="text-center space-y-4">
        <ClipboardList size={48} className="mx-auto text-cyan-500" />
        <h1 className="text-2xl font-bold text-gray-900">Operations Planning</h1>
        <p className="text-gray-500">This module is coming soon.</p>
      </div>
      <button
        onClick={() => router.push('/')}
        className="absolute bottom-8 left-8 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={16} /> Return to Home
      </button>
    </div>
  )
}
