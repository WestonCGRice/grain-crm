import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return null
  return session
}

// Full edit (name, email, role, contractNotifications)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const {
    name, email, role, contractNotifications,
    accessMerchandising, accessAdministration, accessScaleOperations, accessOperationsPlanning,
  } = body

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name || null } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(role !== undefined ? { role, isAdmin: role === 'ADMIN' } : {}),
      ...(contractNotifications !== undefined ? { contractNotifications } : {}),
      ...(accessMerchandising !== undefined ? { accessMerchandising } : {}),
      ...(accessAdministration !== undefined ? { accessAdministration } : {}),
      ...(accessScaleOperations !== undefined ? { accessScaleOperations } : {}),
      ...(accessOperationsPlanning !== undefined ? { accessOperationsPlanning } : {}),
    },
    select: {
      id: true, username: true, name: true, email: true,
      role: true, isAdmin: true, contractNotifications: true, totpEnabled: true, mustSetPassword: true, createdAt: true,
      accessMerchandising: true, accessAdministration: true,
      accessScaleOperations: true, accessOperationsPlanning: true, accountLocked: true,
    },
  })
  return NextResponse.json(user)
}

// Toggle flags (legacy inline checkboxes — kept for compat)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const {
    isAdmin, contractNotifications,
    accessMerchandising, accessAdministration, accessScaleOperations, accessOperationsPlanning,
    unlockAccount,
  } = body

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(isAdmin !== undefined ? { isAdmin } : {}),
      ...(contractNotifications !== undefined ? { contractNotifications } : {}),
      ...(accessMerchandising !== undefined ? { accessMerchandising } : {}),
      ...(accessAdministration !== undefined ? { accessAdministration } : {}),
      ...(accessScaleOperations !== undefined ? { accessScaleOperations } : {}),
      ...(accessOperationsPlanning !== undefined ? { accessOperationsPlanning } : {}),
      ...(unlockAccount ? { accountLocked: false, failedLoginAttempts: 0, failedLoginWindowStart: null } : {}),
    },
    select: {
      id: true, username: true, name: true, email: true,
      role: true, isAdmin: true, contractNotifications: true, totpEnabled: true, mustSetPassword: true, createdAt: true,
      accessMerchandising: true, accessAdministration: true,
      accessScaleOperations: true, accessOperationsPlanning: true, accountLocked: true,
    },
  })
  return NextResponse.json(user)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (session.user?.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
