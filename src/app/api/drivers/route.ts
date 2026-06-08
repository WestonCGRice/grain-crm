import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const drivers = await prisma.driver.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json(drivers)
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, phone } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const driver = await prisma.driver.create({ data: { name: name.trim(), phone: phone || null } })
  return NextResponse.json(driver, { status: 201 })
}
