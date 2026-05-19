import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (existing) {
    console.log('Admin user already exists — skipping.')
    return
  }

  const passwordHash = await bcrypt.hash('GrainCRM2024!', 12)
  await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Admin',
      passwordHash,
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
