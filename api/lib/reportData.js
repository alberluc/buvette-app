import { db } from '../db.js'

export async function buildMonthReport(licenseKey, year, month) {
  const license = await db('licenses').where({ key: licenseKey }).first()
  if (!license) throw new Error(`License ${licenseKey} introuvable`)

  const products = license.products || []
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

  const rows = await db('days')
    .where({ license_key: licenseKey })
    .whereLike('day_key', `${monthPrefix}-%`)
    .orderBy('day_key', 'asc')

  let cashBase = license.cash_float ?? 0
  const allDays = rows.map(row => {
    const day = aggregateDay(row, products)
    const mouvTotal = day.mouvements.reduce((s, m) => s + m.amount, 0)
    day._attendu = cashBase + day.especes + mouvTotal
    day._ecart = day.cashCounted != null ? day.cashCounted - day._attendu : null
    cashBase = day.cashCounted != null ? day.cashCounted : day._attendu
    return day
  })
  const days = allDays.filter(d => d.orderCount > 0)

  const grandTotal    = days.reduce((s, d) => s + d.dayTotal, 0)
  const grandEspeces  = days.reduce((s, d) => s + d.especes, 0)
  const grandCarte    = days.reduce((s, d) => s + d.carte, 0)
  const grandOrderCount = days.reduce((s, d) => s + d.orderCount, 0)

  const grandProducts = {}
  for (const p of products) grandProducts[p.id] = { name: p.name, qty: 0, total: 0 }
  for (const day of days) {
    for (const [pid, stat] of Object.entries(day.products)) {
      if (!grandProducts[pid]) grandProducts[pid] = { name: stat.name, qty: 0, total: 0 }
      grandProducts[pid].qty   += stat.qty
      grandProducts[pid].total += stat.total
    }
  }

  return {
    licenseKey,
    clubName: license.club_name,
    email: license.email,
    year,
    month,
    products,
    days,
    grandTotal,
    grandEspeces,
    grandCarte,
    grandOrderCount,
    grandProducts,
  }
}

function aggregateDay(row, products) {
  const orders = row.orders || []

  const productMap = {}
  for (const p of products) {
    productMap[p.id] = { name: p.name, qty: 0, total: 0, price: p.price }
  }

  let dayTotal = 0
  let especes = 0
  let carte = 0
  const enrichedOrders = []

  for (const order of orders) {
    dayTotal += order.total
    if (order.payment === 'especes') especes += order.total
    else carte += order.total

    const itemsByPid = {}
    for (const [pid, qty] of order.items) {
      if (!productMap[pid]) {
        const p = products.find(x => x.id === pid)
        productMap[pid] = { name: p?.name ?? pid, qty: 0, total: 0, price: p?.price ?? 0 }
      }
      productMap[pid].qty   += qty
      productMap[pid].total += productMap[pid].price * qty
      itemsByPid[pid] = qty
    }
    enrichedOrders.push({ items: itemsByPid, total: order.total, payment: order.payment })
  }

  return {
    dayKey: row.day_key,
    date: row.date,
    label: row.label,
    orderCount: orders.length,
    dayTotal,
    especes,
    carte,
    products: productMap,
    orders: enrichedOrders,
    mouvements: row.mouvements || [],
    cashCounted: row.cash_counted !== null && row.cash_counted !== undefined ? Number(row.cash_counted) : null,
  }
}
