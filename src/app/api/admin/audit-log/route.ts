import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  const isAdmin = (session?.user as unknown as { isAdmin?: boolean })?.isAdmin
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const logs = await prisma.contractAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { user: { select: { username: true, name: true } } },
  })
  return NextResponse.json(logs)
}
