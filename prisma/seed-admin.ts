import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (existing) {
    // Ensure role and isAdmin are correct even for pre-existing admin accounts
    if (existing.role !== 'ADMIN' || !existing.isAdmin) {
      await prisma.user.update({
        where: { username: 'admin' },
        data: { role: 'ADMIN', isAdmin: true },
      })
      console.log('✅ Admin user role updated to ADMIN.')
    } else {
      console.log('Admin user already exists and is correctly configured — skipping.')
    }
    return
  }

  const passwordHash = await bcrypt.hash('GrainCRM2024!', 12)
  await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      isAdmin: true,
    },
  })
  console.log('✅ Admin user created.')
  console.log('   Username: admin')
  console.log('   Password: GrainCRM2024!')
  console.log('   ⚠️  Change this password after first login.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
