import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database…')

  // Clean slate
  await prisma.deal.deleteMany()
  await prisma.interaction.deleteMany()
  await prisma.commodityContact.deleteMany()
  await prisma.contact.deleteMany()

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'James', lastName: 'Mitchell', email: 'jmitchell@farmworks.com',
        phone: '(515) 555-0101', company: 'FarmWorks LLC', title: 'Owner',
        city: 'Ames', state: 'IA', status: 'CUSTOMER',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Sarah', lastName: 'Hendricks', email: 'sarah.h@greatplainsgrain.com',
        phone: '(785) 555-0202', company: 'Great Plains Grain', title: 'Procurement Manager',
        city: 'Salina', state: 'KS', status: 'ACTIVE',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Robert', lastName: 'Calhoun', email: 'rcalhoun@deltafarming.com',
        phone: '(601) 555-0303', company: 'Delta Farming Co', title: 'Grain Merchandiser',
        city: 'Greenville', state: 'MS', status: 'CUSTOMER',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Linda', lastName: 'Zhao', email: 'linda.zhao@agrocorp.net',
        phone: '(319) 555-0404', company: 'AgroCorp International', title: 'VP Procurement',
        city: 'Cedar Rapids', state: 'IA', status: 'ACTIVE',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Tom', lastName: 'Breslin', email: 'tom@breslinfarms.com',
        phone: '(217) 555-0505', company: 'Breslin Family Farms', title: 'Owner',
        city: 'Champaign', state: 'IL', status: 'LEAD',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Angela', lastName: 'Torres', email: 'atorres@sunrisegrain.com',
        phone: '(316) 555-0606', company: 'Sunrise Grain Partners', title: 'Trader',
        city: 'Wichita', state: 'KS', status: 'ACTIVE',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Marcus', lastName: 'Webb', email: 'mwebb@midwestagri.com',
        phone: '(402) 555-0707', company: 'Midwest Agri Trading', title: 'Director',
        city: 'Omaha', state: 'NE', status: 'CUSTOMER',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Deborah', lastName: 'Patel',
        phone: '(225) 555-0808', company: 'Southern Rice Cooperative',
        city: 'Baton Rouge', state: 'LA', status: 'LEAD',
      },
    }),
  ])

  const [james, sarah, robert, linda, tom, angela, marcus, deborah] = contacts

  // Commodity assignments
  await prisma.commodityContact.createMany({
    data: [
      { contactId: james.id, commodity: 'CORN', interestLevel: 'HIGH', estimatedVolume: 250000 },
      { contactId: james.id, commodity: 'SOYBEANS', interestLevel: 'MEDIUM', estimatedVolume: 100000 },
      { contactId: sarah.id, commodity: 'CORN', interestLevel: 'HIGH', estimatedVolume: 500000 },
      { contactId: sarah.id, commodity: 'SOYBEANS', interestLevel: 'HIGH', estimatedVolume: 300000 },
      { contactId: robert.id, commodity: 'RICE', interestLevel: 'HIGH', estimatedVolume: 200000 },
      { contactId: robert.id, commodity: 'SOYBEANS', interestLevel: 'LOW', estimatedVolume: 50000 },
      { contactId: linda.id, commodity: 'CORN', interestLevel: 'HIGH', estimatedVolume: 800000 },
      { contactId: linda.id, commodity: 'SOYBEANS', interestLevel: 'HIGH', estimatedVolume: 400000 },
      { contactId: linda.id, commodity: 'RICE', interestLevel: 'MEDIUM', estimatedVolume: 150000 },
      { contactId: tom.id, commodity: 'CORN', interestLevel: 'MEDIUM', estimatedVolume: 80000 },
      { contactId: angela.id, commodity: 'SOYBEANS', interestLevel: 'HIGH', estimatedVolume: 350000 },
      { contactId: angela.id, commodity: 'CORN', interestLevel: 'MEDIUM', estimatedVolume: 120000 },
      { contactId: marcus.id, commodity: 'CORN', interestLevel: 'HIGH', estimatedVolume: 600000 },
      { contactId: marcus.id, commodity: 'SOYBEANS', interestLevel: 'HIGH', estimatedVolume: 450000 },
      { contactId: deborah.id, commodity: 'RICE', interestLevel: 'HIGH', estimatedVolume: 300000 },
    ],
  })

  // Deals
  const now = new Date()
  function monthAgo(n: number) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - n)
    return d
  }

  await prisma.deal.createMany({
    data: [
      { contactId: james.id, commodity: 'CORN', quantity: 50000, pricePerBushel: 4.55, totalValue: 227500, status: 'COMPLETED', dealDate: monthAgo(5) },
      { contactId: james.id, commodity: 'CORN', quantity: 75000, pricePerBushel: 4.72, totalValue: 354000, status: 'COMPLETED', dealDate: monthAgo(3) },
      { contactId: james.id, commodity: 'SOYBEANS', quantity: 30000, pricePerBushel: 12.10, totalValue: 363000, status: 'PENDING', dealDate: monthAgo(1) },
      { contactId: sarah.id, commodity: 'CORN', quantity: 200000, pricePerBushel: 4.60, totalValue: 920000, status: 'COMPLETED', dealDate: monthAgo(6) },
      { contactId: sarah.id, commodity: 'SOYBEANS', quantity: 100000, pricePerBushel: 12.45, totalValue: 1245000, status: 'COMPLETED', dealDate: monthAgo(4) },
      { contactId: sarah.id, commodity: 'CORN', quantity: 150000, pricePerBushel: 4.80, totalValue: 720000, status: 'PENDING', dealDate: monthAgo(1) },
      { contactId: robert.id, commodity: 'RICE', quantity: 80000, pricePerBushel: 7.20, totalValue: 576000, status: 'COMPLETED', dealDate: monthAgo(5) },
      { contactId: robert.id, commodity: 'RICE', quantity: 60000, pricePerBushel: 7.35, totalValue: 441000, status: 'COMPLETED', dealDate: monthAgo(2) },
      { contactId: linda.id, commodity: 'CORN', quantity: 300000, pricePerBushel: 4.65, totalValue: 1395000, status: 'COMPLETED', dealDate: monthAgo(7) },
      { contactId: linda.id, commodity: 'SOYBEANS', quantity: 150000, pricePerBushel: 12.30, totalValue: 1845000, status: 'COMPLETED', dealDate: monthAgo(4) },
      { contactId: linda.id, commodity: 'RICE', quantity: 50000, pricePerBushel: 7.10, totalValue: 355000, status: 'PENDING', dealDate: monthAgo(1) },
      { contactId: angela.id, commodity: 'SOYBEANS', quantity: 120000, pricePerBushel: 12.55, totalValue: 1506000, status: 'COMPLETED', dealDate: monthAgo(3) },
      { contactId: marcus.id, commodity: 'CORN', quantity: 250000, pricePerBushel: 4.70, totalValue: 1175000, status: 'COMPLETED', dealDate: monthAgo(6) },
      { contactId: marcus.id, commodity: 'SOYBEANS', quantity: 180000, pricePerBushel: 12.20, totalValue: 2196000, status: 'COMPLETED', dealDate: monthAgo(3) },
      { contactId: deborah.id, commodity: 'RICE', quantity: 100000, pricePerBushel: 7.40, totalValue: 740000, status: 'PENDING', dealDate: monthAgo(1) },
    ],
  })

  // Interactions
  await prisma.interaction.createMany({
    data: [
      { contactId: james.id, type: 'CALL', date: monthAgo(6), notes: 'Initial intro call. Discussed corn needs for Q3.' },
      { contactId: james.id, type: 'EMAIL', date: monthAgo(5), notes: 'Sent pricing sheet for 50k bu corn offer.' },
      { contactId: james.id, type: 'MEETING', date: monthAgo(4), notes: 'On-site visit to FarmWorks facility.' },
      { contactId: sarah.id, type: 'CALL', date: monthAgo(7), notes: 'Prospecting call — high volume buyer confirmed.' },
      { contactId: sarah.id, type: 'MEETING', date: monthAgo(6), notes: 'Negotiated large corn contract terms.' },
      { contactId: sarah.id, type: 'EMAIL', date: monthAgo(4), notes: 'Followed up on soy contract renewal.' },
      { contactId: robert.id, type: 'CALL', date: monthAgo(6), notes: 'Discussed new crop rice pricing.' },
      { contactId: robert.id, type: 'EMAIL', date: monthAgo(5), notes: 'Sent rice market report.' },
      { contactId: linda.id, type: 'MEETING', date: monthAgo(8), notes: 'Annual review — multi-commodity needs confirmed.' },
      { contactId: linda.id, type: 'CALL', date: monthAgo(4), notes: 'Quarterly check-in on open positions.' },
      { contactId: angela.id, type: 'CALL', date: monthAgo(4), notes: 'Discussed fall soybean opportunity.' },
      { contactId: marcus.id, type: 'MEETING', date: monthAgo(7), notes: 'Volume commitment meeting — bullish on corn.' },
    ],
  })

  console.log('✅ Seed complete!')
  console.log(`   ${contacts.length} contacts`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
