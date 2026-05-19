'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react'

type SetupData = { qrCodeUrl: string; secret: string }
type UIStep = 'scan' | 'confirm' | 'done'

export default function Setup2FAPage() {
  const [data, setData] = useState<SetupData | null>(null)
  const [uiStep, setUiStep] = useState<UIStep>('scan')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/setup-totp', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => { if (d.qrCodeUrl) setData(d) })
  }, [])

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/confirm-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode: code }),
      })
      const result = await res.json()
      if (!result.success) {
        setError(result.error ?? 'Invalid code. Please try again.')
        return
      }
      setUiStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
            style={{ background: '#14532d' }}
          >
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Two-Factor Authentication</h1>
          <p className="text-sm text-gray-500 mt-1">Secure your account with Microsoft Authenticator</p>
        </div>

        <div className="card space-y-5">
          {uiStep === 'scan' && (
            <>
              <ol className="space-y-3">
                {[
                  <>Open <strong>Microsoft Authenticator</strong> on your phone.</>,
                  <>Tap <strong>+</strong> → <strong>Other account (Google, Facebook, etc.)</strong></>,
                  <>Point your camera at the QR code below to scan it.</>,
                  <>Once added, click <strong>Continue</strong> below.</>,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span
                      className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: '#15803d' }}
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-xl">
                <img src={data.qrCodeUrl} alt="Scan with Microsoft Authenticator" width={200} height={200} />
              </div>

              <details className="bg-gray-50 rounded-lg p-3 cursor-pointer">
                <summary className="text-xs text-gray-500 font-medium select-none">Can&apos;t scan? Enter key manually</summary>
                <code className="text-sm font-mono text-gray-800 break-all block mt-2">{data.secret}</code>
                <p className="text-xs text-gray-400 mt-1">Issuer: GrainCRM | Type: Time-based</p>
              </details>

              <button className="btn-primary w-full" onClick={() => setUiStep('confirm')}>
                Continue — I&apos;ve scanned the QR code
              </button>
            </>
          )}

          {uiStep === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Enter the 6-digit code shown in Microsoft Authenticator to confirm your setup.
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">Authenticator Code</label>
                <input
                  className="form-input text-center text-xl tracking-[0.4em] font-mono"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={loading || code.length !== 6}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Enable Two-Factor Authentication
              </button>

              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
                onClick={() => { setUiStep('scan'); setCode(''); setError('') }}
              >
                ← Back to QR code
              </button>
            </form>
          )}

          {uiStep === 'done' && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle size={48} className="mx-auto text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">2FA Enabled!</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Your account is now protected. You&apos;ll need your authenticator code each time you sign in.
                </p>
              </div>
              <button
                className="btn-primary w-full"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Sign in with 2FA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
