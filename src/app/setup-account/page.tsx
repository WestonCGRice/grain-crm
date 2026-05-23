'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ShieldCheck, Lock } from 'lucide-react'

type UIStep = 'loading' | 'error' | 'password' | 'scan' | 'confirm' | 'done'
type UserInfo = { username: string; name: string | null; email: string | null }
type TOTPData = { qrCodeUrl: string; secret: string }

function SetupAccountForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [step, setStep] = useState<UIStep>('loading')
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [totpData, setTotpData] = useState<TOTPData | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) { setStep('error'); setError('No invitation token found. Please use the link from your invitation email.'); return }
    fetch(`/api/auth/setup-account?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'Invalid token')
        return d
      })
      .then((d) => { setUserInfo(d); setStep('password') })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Invalid invitation'); setStep('error') })
  }, [token])

  async function handleSetPassword(e: { preventDefault(): void }) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, step: 'init-totp', password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to set password')
      setTotpData(data)
      setStep('scan')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmTOTP(e: { preventDefault(): void }) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, step: 'confirm-totp', totpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invalid code')
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'loading') {
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
            style={{ background: '#1d2c3f' }}
          >
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Account</h1>
          {userInfo && (
            <p className="text-sm text-gray-500 mt-1">
              Welcome{userInfo.name ? `, ${userInfo.name}` : ''}! Let&apos;s get your account secured.
            </p>
          )}
        </div>

        <div className="card space-y-5">
          {step === 'error' && (
            <div className="text-center space-y-3 py-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <p className="text-gray-500 text-xs">
                Contact your administrator to resend an invitation.
              </p>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>Step 1 of 2</strong> — Create a password for your account.
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div>
                <label className="form-label">Username</label>
                <input className="form-input bg-gray-50" value={userInfo?.username ?? ''} readOnly />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                <Lock size={14} /> Set Password & Continue
              </button>
            </form>
          )}

          {step === 'scan' && totpData && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>Step 2 of 2</strong> — Set up two-factor authentication.
              </div>

              <ol className="space-y-3">
                {[
                  <>Open <strong>Microsoft Authenticator</strong> (or any TOTP app) on your phone.</>,
                  <>Tap <strong>+</strong> → <strong>Other account (Google, Facebook, etc.)</strong></>,
                  <>Point your camera at the QR code below to scan it.</>,
                  <>Once added, click <strong>Continue</strong> below.</>,
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span
                      className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: '#1d2c3f' }}
                    >
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-xl">
                <img src={totpData.qrCodeUrl} alt="Scan with authenticator app" width={200} height={200} />
              </div>

              <details className="bg-gray-50 rounded-lg p-3 cursor-pointer">
                <summary className="text-xs text-gray-500 font-medium select-none">Can&apos;t scan? Enter key manually</summary>
                <code className="text-sm font-mono text-gray-800 break-all block mt-2">{totpData.secret}</code>
                <p className="text-xs text-gray-400 mt-1">Issuer: GrainCRM | Type: Time-based</p>
              </details>

              <button className="btn-primary w-full" onClick={() => setStep('confirm')}>
                Continue — I&apos;ve scanned the QR code
              </button>
            </>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirmTOTP} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Enter the 6-digit code from your authenticator app to confirm setup.
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div>
                <label className="form-label">Authenticator Code</label>
                <input
                  className="form-input text-center text-xl tracking-[0.4em] font-mono"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={submitting || totpCode.length !== 6}
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Activate Account
              </button>

              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
                onClick={() => { setStep('scan'); setTotpCode(''); setError('') }}
              >
                ← Back to QR code
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle size={48} className="mx-auto text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Ready!</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Your password and two-factor authentication are configured. You can now sign in.
                </p>
              </div>
              <a href="/login" className="btn-primary w-full block text-center">
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SetupAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <SetupAccountForm />
    </Suspense>
  )
}
