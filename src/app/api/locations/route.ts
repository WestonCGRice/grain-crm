import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return null
  return session
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(locations)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { name, address, city, state } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const location = await prisma.location.create({
      data: { name: name.trim(), address: address || null, city: city || null, state: state || null },
    })
    return NextResponse.json(location, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A location with that name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}
