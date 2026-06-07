import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { name, address, city, state } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    const location = await prisma.location.update({
      where: { id },
      data: { name: name.trim(), address: address || null, city: city || null, state: state || null },
    })
    return NextResponse.json(location)
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A location with that name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  try {
    await prisma.location.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}
