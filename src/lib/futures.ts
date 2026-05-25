import prisma from './prisma'

// Standard CME contract sizes
const CONTRACT_SIZES: Record<string, number> = {
  CORN: 5000,
  SOYBEANS: 5000,
  RICE: 2000,
}

type DealForFutures = {
  id: string
  dealType: string | null
  hedged: string | null
  deletedAt: Date | null
  commodity: string
  quantity: { toNumber(): number } | number
  pricePerBushel: { toNumber(): number } | number
  futuresMonth: string | null
  futuresYear: string | null
}

export async function upsertFuturesContract(deal: DealForFutures) {
  const isHedgedSale =
    deal.dealType === 'SALE' &&
    deal.hedged === 'Yes' &&
    !deal.deletedAt &&
    deal.futuresMonth &&
    deal.futuresYear

  if (!isHedgedSale) {
    await prisma.futuresContract.deleteMany({ where: { dealId: deal.id } })
    return
  }

  const contractSize = CONTRACT_SIZES[deal.commodity] ?? 5000
  const qty = typeof deal.quantity === 'object' ? deal.quantity.toNumber() : Number(deal.quantity)
  const price = typeof deal.pricePerBushel === 'object' ? deal.pricePerBushel.toNumber() : Number(deal.pricePerBushel)
  const numberOfContracts = Math.round(qty / contractSize)

  await prisma.futuresContract.upsert({
    where: { dealId: deal.id },
    create: {
      dealId: deal.id,
      commodity: deal.commodity as never,
      futuresMonth: deal.futuresMonth!,
      futuresYear: deal.futuresYear!,
      futuresPrice: price,
      quantity: qty,
      numberOfContracts,
    },
    update: {
      commodity: deal.commodity as never,
      futuresMonth: deal.futuresMonth!,
      futuresYear: deal.futuresYear!,
      futuresPrice: price,
      quantity: qty,
      numberOfContracts,
    },
  })
}
