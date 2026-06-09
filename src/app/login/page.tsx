'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, TrendingUp } from 'lucide-react'

type Step = 'credentials' | 'totp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!data.valid) {
        setError(data.message ?? 'Invalid username or password.')
        return
      }
      if (data.requiresTotp) {
        setStep('totp')
      } else {
        await doSignIn('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    await doSignIn(totpCode)
    setLoading(false)
  }

  async function doSignIn(code: string) {
    const result = await signIn('credentials', {
      username,
      password,
      totpCode: code,
      redirect: false,
    })
    if (result?.error) {
      setError(code ? 'Invalid authenticator code. Please try again.' : 'Sign in failed.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
            style={{ background: '#14532d' }}
          >
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GrainCRM</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'credentials' ? 'Sign in to your account' : 'Two-factor authentication'}
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    className="form-input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="space-y-4">
              <p className="text-sm text-gray-600">
                Open <strong>Microsoft Authenticator</strong> and enter the 6-digit code for GrainCRM.
              </p>
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
                disabled={loading || totpCode.length !== 6}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Sign In
              </button>
              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
                onClick={() => { setStep('credentials'); setTotpCode(''); setError('') }}
              >
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
