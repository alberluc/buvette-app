import { Router } from 'express'
import { db } from '../db.js'
import { requireSession } from '../middleware/auth.js'
import { generatePdf, monthLabel } from '../lib/reportPdf.js'
import { sendReport } from '../lib/mailer.js'
import { reportEmailHtml } from '../lib/emailTemplates.js'
import { generateXlsx } from '../lib/reportXlsx.js'

const router = Router()

router.get('/report/xlsx/:year/:month', requireSession, async (req, res) => {
  const year  = parseInt(req.params.year, 10)
  const month = parseInt(req.params.month, 10)
  if (!year || !month || month < 1 || month > 12)
    return res.status(400).json({ error: 'Paramètres year/month invalides.' })

  try {
    const buffer = await generateXlsx(req.session.licenseKey, year, month)
    const filename = `assolyte-${year}-${String(month).padStart(2, '0')}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (err) {
    console.error('[report/xlsx]', err)
    res.status(500).json({ error: 'Erreur lors de la génération du fichier.' })
  }
})

router.post('/report/test', requireSession, async (req, res) => {
  if (req.session.role !== 'admin')
    return res.status(403).json({ error: 'Réservé aux administrateurs.' })

  const { licenseKey } = req.session
  const license = await db('licenses').where({ key: licenseKey }).first()
  if (!license?.email)
    return res.status(400).json({ error: 'Aucun email configuré sur cette licence.' })

  const now = new Date()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()
  const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const label = monthLabel(year, month)

  const data = buildMockData(license, year, month)

  try {
    const pdf     = await generatePdf(data, 'summary')
    const pdfGrid = await generatePdf(data, 'grid')
    await sendReport({
      to: license.email,
      clubName: license.club_name,
      monthLabel: label,
      html: reportEmailHtml({ clubName: license.club_name, label, data, isTest: true }),
      pdfBuffer: pdf,
      pdfGridBuffer: pdfGrid,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('[report/test]', err)
    res.status(500).json({ error: 'Erreur lors de la génération ou de l\'envoi.' })
  }
})

function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function eur(n) {
  return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'
}

function buildMockData(license, year, month) {
  const products = license.products || [
    { id: 'biere', name: 'Bière',      price: 2 },
    { id: 'vin',   name: 'Vin',        price: 1 },
    { id: 'soda',  name: 'Soda / Eau', price: 1 },
    { id: 'box',   name: 'Box',        price: 1 },
  ]

  const MONTH_DAYS = new Date(year, month, 0).getDate()
  const WEEKENDS = []
  for (let d = 1; d <= MONTH_DAYS; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if ((dow === 6 || dow === 0) && Math.random() < 0.6) WEEKENDS.push(d)
    else if (dow === 5 && Math.random() < 0.25) WEEKENDS.push(d)
  }

  const grandProducts = {}
  for (const p of products) grandProducts[p.id] = { name: p.name, qty: 0, total: 0 }

  const days = WEEKENDS.map(d => {
    const date = new Date(year, month - 1, d)
    const dayKey = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const displayDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const orderCount = rng(15, 65)
    const productMap = {}
    for (const p of products) productMap[p.id] = { name: p.name, qty: 0, total: 0 }

    let dayTotal = 0
    let especes = 0
    let carte = 0
    const orders = []

    for (let i = 0; i < orderCount; i++) {
      const p = products[rng(0, products.length - 1)]
      const qty = rng(1, 3)
      productMap[p.id].qty   += qty
      productMap[p.id].total += p.price * qty
      const t = p.price * qty
      dayTotal += t
      const payment = Math.random() < 0.7 ? 'especes' : 'carte'
      if (payment === 'especes') especes += t
      else carte += t
      const h = String(10 + Math.floor(i / 6)).padStart(2, '0')
      const min = String((i * 7) % 60).padStart(2, '0')
      orders.push({ items: { [p.id]: qty }, total: t, payment, time: `${h}:${min}` })
    }

    for (const p of products) {
      grandProducts[p.id].qty   += productMap[p.id].qty
      grandProducts[p.id].total += productMap[p.id].total
    }

    return {
      dayKey,
      date: displayDate,
      orderCount,
      dayTotal,
      especes,
      carte,
      products: productMap,
      orders,
    }
  })

  const grandTotal       = days.reduce((s, d) => s + d.dayTotal, 0)
  const grandEspeces     = days.reduce((s, d) => s + d.especes, 0)
  const grandCarte       = days.reduce((s, d) => s + d.carte, 0)
  const grandOrderCount  = days.reduce((s, d) => s + d.orderCount, 0)

  return {
    licenseKey: license.key,
    clubName: license.club_name,
    email: license.email,
    year, month, products, days,
    grandTotal, grandEspeces, grandCarte, grandOrderCount, grandProducts,
  }
}

export default router
