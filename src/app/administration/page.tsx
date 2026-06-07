'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X, Shield, Bell, ArrowLeft, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type User = {
  id: string
  username: string
  name: string | null
  email: string | null
  role: string
  isAdmin: boolean
  contractNotifications: boolean
  totpEnabled: boolean
  mustSetPassword: boolean
  createdAt: string
  accessMerchandising: boolean
  accessAdministration: boolean
  accessScaleOperations: boolean
  accessOperationsPlanning: boolean
}

const ROLES = [
  { value: 'MERCHANDISER', label: 'Standard User' },
  { value: 'ADMIN', label: 'Admin' },
]

const MODULES: { key: keyof Pick<User, 'accessMerchandising' | 'accessAdministration' | 'accessScaleOperations' | 'accessOperationsPlanning'>; label: string }[] = [
  { key: 'accessMerchandising',      label: 'Merchandising' },
  { key: 'accessAdministration',     label: 'Administration' },
  { key: 'accessScaleOperations',    label: 'Scale Operations' },
  { key: 'accessOperationsPlanning', label: 'Operations Planning' },
]

export default function AdministrationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin ?? false

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('MERCHANDISER')
  const [newNotify, setNewNotify] = useState(false)
  const [newAccess, setNewAccess] = useState({
    accessMerchandising: true,
    accessAdministration: false,
    accessScaleOperations: false,
    accessOperationsPlanning: false,
  })

  // Edit modal (name / email / role / notifications only)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('MERCHANDISER')
  const [editNotify, setEditNotify] = useState(false)

  useEffect(() => {
    if (session && !isAdmin) router.push('/')
  }, [session, isAdmin, router])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { if (isAdmin) loadUsers() }, [isAdmin, loadUsers])

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername, name: newName, email: newEmail,
          role: newRole, contractNotifications: newNotify, ...newAccess,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')
      setShowCreate(false)
      setNewUsername(''); setNewName(''); setNewEmail(''); setNewRole('MERCHANDISER'); setNewNotify(false)
      setNewAccess({ accessMerchandising: true, accessAdministration: false, accessScaleOperations: false, accessOperationsPlanning: false })
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(u: User) {
    setEditUser(u)
    setEditName(u.name ?? '')
    setEditEmail(u.email ?? '')
    setEditRole(u.role === 'ADMIN' ? 'ADMIN' : 'MERCHANDISER')
    setEditNotify(u.contractNotifications)
    setError('')
  }

  async function handleEdit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!editUser) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, role: editRole, contractNotifications: editNotify }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update user')
      setEditUser(null)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAccess(userId: string, field: string, value: boolean) {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u))
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    loadUsers()
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <header className="flex items-center justify-between px-8 py-5" style={{ background: '#1d2c3f' }}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/central-grain-logo.png" alt="Central Grain" className="h-10 object-contain" style={{ background: 'white', borderRadius: 6, padding: '2px 8px' }} />
          <span className="text-white font-semibold text-lg">Administration</span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Return to Home
        </button>
      </header>

      <main className="flex-1 w-full px-6 py-8" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Access Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} — check boxes control which modules each user can access</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setError('') }}
            className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-md transition-colors"
            style={{ background: '#2563eb' }}
            onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}
          >
            <Plus size={15} /> Add User
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No users yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="text-center">Merchandising</th>
                  <th className="text-center">Administration</th>
                  <th className="text-center">Scale Operations</th>
                  <th className="text-center">Operations Planning</th>
                  <th>Notifications</th>
                  <th>2FA</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isUserAdmin = u.role === 'ADMIN'
                  return (
                    <tr key={u.id}>
                      <td className="font-mono text-sm font-medium text-gray-800">
                        {u.username}
                        {isUserAdmin && (
                          <span className="ml-2 badge badge-navy text-xs">Admin</span>
                        )}
                      </td>
                      <td>{u.name || <span className="text-gray-400">—</span>}</td>
                      <td className="text-sm text-gray-600">{u.email || <span className="text-gray-400">—</span>}</td>
                      {MODULES.map((mod) => (
                        <td key={mod.key} className="text-center">
                          <input
                            type="checkbox"
                            checked={isUserAdmin || u[mod.key]}
                            disabled={isUserAdmin || u.id === session?.user?.id}
                            onChange={(e) => toggleAccess(u.id, mod.key, e.target.checked)}
                            className="w-4 h-4 accent-green-600 cursor-pointer disabled:cursor-default"
                            title={isUserAdmin ? 'Admins always have full access' : mod.label}
                          />
                        </td>
                      ))}
                      <td>
                        <span className={`badge ${u.contractNotifications ? 'badge-green' : 'badge-gray'}`}>
                          {u.contractNotifications ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.totpEnabled ? 'badge-green' : 'badge-yellow'}`}>
                          {u.totpEnabled ? 'Enabled' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.mustSetPassword ? 'badge-yellow' : 'badge-green'}`}>
                          {u.mustSetPassword ? 'Invite Pending' : 'Active'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-gray-300 hover:text-[#1d2c3f]"
                            onClick={() => openEdit(u)}
                            title="Edit user"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="text-gray-300 hover:text-red-500"
                            onClick={() => handleDelete(u)}
                            disabled={u.id === session?.user?.id}
                            title={u.id === session?.user?.id ? 'Cannot delete your own account' : 'Delete user'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          * Access changes take effect the next time the user logs in. Admin users always have full access to all modules.
        </p>
      </main>

      {/* Create user modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Username *</label>
                <input className="form-input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                <p className="mt-1 text-xs text-gray-500">An invitation email will be sent to this address.</p>
              </div>
              <div>
                <label className="form-label">Role *</label>
                <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {newRole !== 'ADMIN' && (
                <div>
                  <label className="form-label">Module Access</label>
                  <div className="space-y-2 mt-1">
                    {MODULES.map((mod) => (
                      <label key={mod.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAccess[mod.key]}
                          onChange={(e) => setNewAccess(prev => ({ ...prev, [mod.key]: e.target.checked }))}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-gray-700">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={newNotify} onChange={(e) => setNewNotify(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Bell size={13} /> Contract Notifications</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Creating…' : 'Create User & Send Invite'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit user modal (name / email / role / notifications) */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Edit User — <span className="font-mono">{editUser.username}</span></h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Role *</label>
                <select className="form-input" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editNotify} onChange={(e) => setEditNotify(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Bell size={13} /> Contract Notifications</span>
              </label>
              {editUser.id === session?.user?.id && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  You are editing your own account. Role changes take effect on next login.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg shadow-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Shield size={13} /> Go to Merchandising
        </button>
      </div>
    </div>
  )
}
