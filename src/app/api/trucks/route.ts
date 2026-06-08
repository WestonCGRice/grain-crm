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
  const trucks = await prisma.truck.findMany({ where: { isActive: true }, orderBy: { number: 'asc' } })
  return NextResponse.json(trucks)
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { number, description } = await req.json()
  if (!number?.trim()) return NextResponse.json({ error: 'Truck number is required' }, { status: 400 })
  try {
    const truck = await prisma.truck.create({ data: { number: number.trim(), description: description || null } })
    return NextResponse.json(truck, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Truck number already exists' }, { status: 409 })
  }
}
