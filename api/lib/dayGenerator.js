export const DEFAULT_PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2 },
  { id: 'vin',   name: 'Vin',        price: 1 },
  { id: 'soda',  name: 'Soda / Eau', price: 1 },
  { id: 'box',   name: 'Box',        price: 1 },
]

// Bière très majoritaire, soda fréquent, vin modéré, box rare
const PRODUCT_WEIGHTS = [52, 18, 22, 8]

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

function randomTime(startHour, endHour) {
  const h = rng(startHour, Math.max(startHour, endHour - 1))
  const m = rng(0, 59)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateOrder(products, index, startHour = 10, endHour = 19) {
  // Majorité de commandes simples (1 produit), parfois 2, rarement 3
  const numProducts = Math.random() < 0.60 ? 1 : Math.random() < 0.80 ? 2 : 3
  const selected = new Map()

  while (selected.size < Math.min(numProducts, products.length)) {
    const p = weightedPick(products)
    if (!selected.has(p.id)) {
      // Quantité : souvent 1, parfois une tournée (2-4)
      const qty = Math.random() < 0.55 ? 1 : Math.random() < 0.70 ? 2 : rng(3, 4)
      selected.set(p.id, qty)
    }
  }

  const items = [...selected.entries()]
  const total = items.reduce((sum, [pid, qty]) => {
    const p = products.find(x => x.id === pid)
    return sum + (p?.price ?? 0) * qty
  }, 0)

  return {
    id: `order-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    time: randomTime(startHour, endHour),
    items,
    payment: Math.random() < 0.72 ? 'especes' : 'carte',
    total,
  }
}

let _opSeq = 0
function nextOpId() {
  return `op-${++_opSeq}-${Math.random().toString(36).slice(2, 5)}`
}

function generateMouvements(dayType, cashFloat) {
  const mvt = []

  // Fond de caisse en début de journée (quasi-systématique pour les grosses journées)
  const fondProb = { tournament: 0.90, weekend: 0.80, friday: 0.55, small: 0.35 }
  if (Math.random() < (fondProb[dayType] ?? 0.4)) {
    mvt.push({ id: nextOpId(), time: randomTime(8, 10), label: 'Fond de caisse', amount: cashFloat })
  }

  // Achat glaçons en matinée pour les journées chargées
  if ((dayType === 'tournament' && Math.random() < 0.65) ||
      (dayType === 'weekend'    && Math.random() < 0.40)) {
    mvt.push({ id: nextOpId(), time: randomTime(9, 11), label: 'Achat glaçons', amount: -rng(8, 16) })
  }

  // Appoint monnaie en milieu de journée quand la caisse manque de pièces
  if ((dayType === 'tournament' && Math.random() < 0.50) ||
      (dayType === 'weekend'    && Math.random() < 0.25)) {
    mvt.push({ id: nextOpId(), time: randomTime(11, 14), label: 'Appoint monnaie', amount: rng(20, 50) })
  }

  // Achat consommables ponctuels (gobelets, pailles…)
  if (Math.random() < 0.12) {
    mvt.push({ id: nextOpId(), time: randomTime(9, 12), label: 'Achat consommables', amount: -rng(5, 18) })
  }

  // Sortie caisse en fin de journée (vidage partiel)
  if ((dayType === 'tournament' && Math.random() < 0.60) ||
      (dayType === 'weekend'    && Math.random() < 0.45) ||
      (dayType === 'friday'     && Math.random() < 0.30)) {
    mvt.push({ id: nextOpId(), time: randomTime(17, 21), label: 'Sortie caisse', amount: -rng(30, 80) })
  }

  mvt.sort((a, b) => a.time.localeCompare(b.time))
  return mvt
}

function computeExpectedCash(orders, mouvements) {
  const especes = orders.filter(o => o.payment === 'especes').reduce((s, o) => s + o.total, 0)
  const mvtSum  = mouvements.reduce((s, m) => s + m.amount, 0)
  return especes + mvtSum
}

// Clôture manuelle → comptage toujours présent. Clôture auto → null.
function maybeCashCounted(expected, isAutoClosed) {
  if (isAutoClosed) return null

  const r = Math.random()
  let ecart = 0
  if      (r < 0.45) ecart = 0                                              // exact
  else if (r < 0.70) ecart = rng(1, 2) * (Math.random() < 0.5 ? 1 : -1)   // ±1-2 €
  else if (r < 0.88) ecart = rng(3, 5) * (Math.random() < 0.4 ? 1 : -1)   // ±3-5 €
  else               ecart = rng(6, 15) * (Math.random() < 0.3 ? 1 : -1)   // ±6-15 €

  return Math.max(0, Math.round((expected + ecart) * 100) / 100)
}

export function generateHistoricalDays(licenseKey, products, cashFloat = 50) {
  const now = new Date()
  const rows = []

  const start = new Date(now)
  start.setMonth(start.getMonth() - 3)
  start.setDate(1)

  const cursor = new Date(start)
  while (cursor < now) {
    const dow = cursor.getDay()
    const isSunday   = dow === 0
    const isSaturday = dow === 6
    const isFriday   = dow === 5
    const isWeekday  = dow >= 1 && dow <= 4

    let dayType    = null
    let orderRange = [0, 0]
    let timeRange  = [10, 19]

    if (isSunday && Math.random() < 0.62) {
      dayType    = Math.random() < 0.28 ? 'tournament' : 'weekend'
      orderRange = dayType === 'tournament' ? [38, 72] : [14, 38]
      timeRange  = dayType === 'tournament' ? [9, 17]  : [10, 18]
    } else if (isSaturday && Math.random() < 0.45) {
      dayType    = Math.random() < 0.20 ? 'tournament' : 'weekend'
      orderRange = dayType === 'tournament' ? [30, 58] : [10, 32]
      timeRange  = dayType === 'tournament' ? [9, 17]  : [10, 19]
    } else if (isFriday && Math.random() < 0.30) {
      dayType    = 'friday'
      orderRange = [5, 18]
      timeRange  = [17, 22]
    } else if (isWeekday && Math.random() < 0.07) {
      dayType    = 'small'
      orderRange = [3, 11]
      timeRange  = [14, 20]
    }

    if (dayType) {
      const orderCount = rng(orderRange[0], orderRange[1])
      const orders     = Array.from({ length: orderCount }, (_, i) =>
        generateOrder(products, i, timeRange[0], timeRange[1]),
      )
      orders.sort((a, b) => a.time.localeCompare(b.time))

      const mouvements  = generateMouvements(dayType, cashFloat)
      const isAutoClosed = (
        (dayType === 'small'   && Math.random() < 0.38) ||
        (dayType === 'friday'  && Math.random() < 0.22) ||
        (dayType === 'weekend' && Math.random() < 0.10)
      )

      const expected   = computeExpectedCash(orders, mouvements)
      const cashCounted = maybeCashCounted(expected, isAutoClosed)
      const dayKey     = toDayKey(new Date(cursor))

      rows.push({
        license_key:  licenseKey,
        day_key:      dayKey,
        date:         formatDate(dayKey),
        orders:       JSON.stringify(orders),
        mouvements:   JSON.stringify(mouvements),
        day_closed:   true,
        auto_closed:  isAutoClosed,
        cash_counted: cashCounted,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return rows
}

export function generateTodayOpen(licenseKey, products, cashFloat = 50) {
  const now         = new Date()
  const currentHour = now.getHours()
  const startHour   = Math.max(9, currentHour - rng(2, 4))
  const endHour     = Math.max(startHour + 1, Math.min(currentHour, 22))

  const orders = Array.from({ length: rng(8, 22) }, (_, i) =>
    generateOrder(products, i, startHour, endHour),
  )
  orders.sort((a, b) => a.time.localeCompare(b.time))

  const fondHour = Math.max(8, startHour - 1)
  const mouvements = [
    { id: nextOpId(), time: `${String(fondHour).padStart(2, '0')}:00`, label: 'Fond de caisse', amount: cashFloat },
  ]
  if (Math.random() < 0.45) {
    mouvements.push({
      id: nextOpId(),
      time: randomTime(startHour, Math.max(startHour + 1, currentHour - 1)),
      label: 'Achat glaçons',
      amount: -rng(8, 14),
    })
  }

  const dayKey = toDayKey(now)
  return {
    license_key:  licenseKey,
    day_key:      dayKey,
    date:         formatDate(dayKey),
    orders:       JSON.stringify(orders),
    mouvements:   JSON.stringify(mouvements),
    day_closed:   false,
    auto_closed:  false,
    cash_counted: null,
  }
}
