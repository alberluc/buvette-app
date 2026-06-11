export const DEFAULT_PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2 },
  { id: 'vin',   name: 'Vin',        price: 1 },
  { id: 'soda',  name: 'Soda / Eau', price: 1 },
  { id: 'box',   name: 'Box',        price: 1 },
]

const PRODUCT_WEIGHTS = [50, 15, 25, 10]

function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function toDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(dayKey) {
  const dt = new Date(dayKey + 'T12:00:00')
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function weightedPick(products) {
  const r = Math.random() * 100
  let cum = 0
  for (let i = 0; i < products.length; i++) {
    cum += PRODUCT_WEIGHTS[i] ?? (100 / products.length)
    if (r < cum) return products[i]
  }
  return products[0]
}

function randomTime(startHour = 10, endHour = 22) {
  const h = rng(startHour, endHour - 1)
  const m = rng(0, 59)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateOrder(products, index, timeOpts = {}) {
  const numProducts = rng(1, Math.min(3, products.length))
  const selected = new Map()

  while (selected.size < numProducts) {
    const p = weightedPick(products)
    if (!selected.has(p.id)) selected.set(p.id, rng(1, 3))
  }

  const items = [...selected.entries()]
  const total = items.reduce((sum, [pid, qty]) => {
    const p = products.find(x => x.id === pid)
    return sum + (p?.price ?? 0) * qty
  }, 0)

  return {
    id: `order-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    time: randomTime(timeOpts.startHour ?? 10, timeOpts.endHour ?? 22),
    items,
    payment: Math.random() < 0.7 ? 'especes' : 'carte',
    total,
  }
}

export function generateHistoricalDays(licenseKey, products) {
  const now = new Date()
  const rows = []

  const start = new Date(now)
  start.setMonth(start.getMonth() - 3)
  start.setDate(1)

  const cursor = new Date(start)
  while (cursor < now) {
    const dow = cursor.getDay()
    const isWeekend = dow === 0 || dow === 6
    const isFriday = dow === 5

    if ((isWeekend && Math.random() < 0.55) || (isFriday && Math.random() < 0.25)) {
      const orderCount = isWeekend ? rng(18, 65) : rng(6, 22)
      const orders = Array.from({ length: orderCount }, (_, i) => generateOrder(products, i))
      const dayKey = toDayKey(new Date(cursor))

      rows.push({
        license_key: licenseKey,
        day_key: dayKey,
        date: formatDate(dayKey),
        orders: JSON.stringify(orders),
        mouvements: JSON.stringify([]),
        day_closed: true,
        auto_closed: false,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return rows
}

export function generateTodayOpen(licenseKey, products) {
  const now = new Date()
  const currentHour = now.getHours()
  const startHour = Math.max(9, currentHour - 3)
  const endHour = Math.max(startHour + 1, currentHour)
  const orders = Array.from({ length: rng(8, 22) }, (_, i) =>
    generateOrder(products, i, { startHour, endHour }),
  )

  const dayKey = toDayKey(now)
  return {
    license_key: licenseKey,
    day_key: dayKey,
    date: formatDate(dayKey),
    orders: JSON.stringify(orders),
    mouvements: JSON.stringify([
      { id: 'op-1', time: '09:00', label: 'Fond de caisse', amount: 100 },
      { id: 'op-2', time: '11:30', label: 'Achat glace', amount: -rng(10, 25) },
    ]),
    day_closed: false,
    auto_closed: false,
  }
}
