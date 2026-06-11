import { db } from '../db.js'
import { DEFAULT_PRODUCTS, generateHistoricalDays, generateTodayOpen } from './dayGenerator.js'

export async function seedDemoData(licenseKey, products = DEFAULT_PRODUCTS) {
  const rows = generateHistoricalDays(licenseKey, products)
  if (rows.length > 0) await db('days').insert(rows)
  await db('days').insert(generateTodayOpen(licenseKey, products))
  return rows.length
}
