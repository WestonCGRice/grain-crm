import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { name, phone } = await req.json()
  const driver = await prisma.driver.update({
    where: { id },
    data: { ...(name !== undefined ? { name: name.trim() } : {}), ...(phone !== undefined ? { phone: phone || null } : {}) },
  })
  return NextResponse.json(driver)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.driver.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
