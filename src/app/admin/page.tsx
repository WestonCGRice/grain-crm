'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X, Shield, Bell, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type User = {
  id: string
  username: string
  name: string | null
  email: string | null
  isAdmin: boolean
  contractNotifications: boolean
  totpEnabled: boolean
  mustSetPassword: boolean
  createdAt: string
}

type AuditLog = {
  id: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  contractNumber: string | null
  commodity: string | null
  contactName: string | null
  createdAt: string
  user: { username: string; name: string | null }
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Created',
  STATUS_CHANGED: 'Status Changed',
  DELETED: 'Deleted',
  RESTORED: 'Restored',
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin ?? false

  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [newNotify, setNewNotify] = useState(false)

  useEffect(() => {
    if (session && !isAdmin) router.push('/')
  }, [session, isAdmin, router])

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
  }, [])

  const loadLogs = useCallback(async () => {
    const res = await fetch('/api/admin/audit-log')
    if (res.ok) setLogs(await res.json())
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    Promise.all([loadUsers(), loadLogs()]).finally(() => setLoading(false))
  }, [isAdmin, loadUsers, loadLogs])

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
          isAdmin: newIsAdmin, contractNotifications: newNotify,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')
      setShowCreate(false)
      setNewUsername(''); setNewName(''); setNewEmail('')
      setNewIsAdmin(false); setNewNotify(false)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleFlag(user: User, field: 'isAdmin' | 'contractNotifications') {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !user[field] }),
    })
    loadUsers()
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user ${user.username}? This cannot be undone.`)) return
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    loadUsers()
  }

  if (!isAdmin) return null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={22} className="text-[#1d2c3f]" />
            Administration
          </h1>
          <p className="page-subtitle">Manage users and view contract audit log</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['users', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
              activeTab === tab
                ? 'border-[#1d2c3f] text-[#1d2c3f]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab === 'users' ? 'Master User List' : 'Contract Audit Log'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : activeTab === 'users' ? (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> New User
            </button>
          </div>
          <div className="table-container">
            {users.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No users yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>2FA</th>
                    <th>Admin</th>
                    <th>Contract Notifications</th>
                    <th>Account Status</th>
                    <th>Created</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-sm font-medium text-gray-800">{u.username}</td>
                      <td>{u.name || <span className="text-gray-400">—</span>}</td>
                      <td className="text-sm text-gray-600">{u.email || <span className="text-gray-400">—</span>}</td>
                      <td>
                        <span className={`badge ${u.totpEnabled ? 'badge-green' : 'badge-yellow'}`}>
                          {u.totpEnabled ? 'Enabled' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={u.isAdmin}
                          onChange={() => toggleFlag(u, 'isAdmin')}
                          className="w-4 h-4"
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={u.contractNotifications}
                          onChange={() => toggleFlag(u, 'contractNotifications')}
                          className="w-4 h-4"
                        />
                      </td>
                      <td>
                        <span className={`badge ${u.mustSetPassword ? 'badge-yellow' : 'badge-green'}`}>
                          {u.mustSetPassword ? 'Invite Pending' : 'Active'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                      <td>
                        <button
                          className="text-gray-300 hover:text-red-500"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === session?.user?.id}
                          title={u.id === session?.user?.id ? 'Cannot delete your own account' : 'Delete user'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="table-container">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No audit log entries yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th><span className="flex items-center gap-1"><Clock size={13} /> Time</span></th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Contract #</th>
                    <th>Commodity</th>
                    <th>Contact</th>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="font-mono text-sm">{log.user.name ?? log.user.username}</td>
                      <td>
                        <span className={`badge ${
                          log.action === 'CREATED' ? 'badge-green' :
                          log.action === 'DELETED' ? 'badge-red' :
                          log.action === 'RESTORED' ? 'badge-blue' :
                          'badge-navy'
                        }`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-semibold">
                        {log.contractNumber || <span className="text-gray-400">—</span>}
                      </td>
                      <td>{log.commodity || <span className="text-gray-400">—</span>}</td>
                      <td>{log.contactName || <span className="text-gray-400">—</span>}</td>
                      <td className="text-xs text-gray-500">{log.fromStatus || <span className="text-gray-400">—</span>}</td>
                      <td className="text-xs text-gray-500">{log.toStatus || <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}
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
                <p className="mt-1 text-xs text-gray-500">An invitation email will be sent to this address with a link to set up their password and two-factor authentication.</p>
              </div>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newIsAdmin} onChange={(e) => setNewIsAdmin(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Shield size={13} /> Admin</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newNotify} onChange={(e) => setNewNotify(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Bell size={13} /> Contract Notifications</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Creating…' : 'Create User & Send Invite'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
