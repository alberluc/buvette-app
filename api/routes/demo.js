import { Router } from 'express'
import { db } from '../db.js'
import { generateKey } from '../lib/tokens.js'
import { sendMail } from '../lib/mailer.js'
import { seedDemoData } from '../lib/demoData.js'
import { demoEmailHtml } from '../lib/emailTemplates.js'

const router = Router()

// Limitation simple en mémoire : 3 demandes par IP par heure
const ipRequests = new Map()
const IP_WINDOW_MS = 3_600_000
const IP_MAX = 3

function checkRateLimit(ip) {
  const now = Date.now()
  const times = (ipRequests.get(ip) || []).filter(t => now - t < IP_WINDOW_MS)
  if (times.length >= IP_MAX) return false
  ipRequests.set(ip, [...times, now])
  return true
}

router.post('/demo', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.socket.remoteAddress

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Trop de demandes, réessayez dans une heure.' })
  }

  const { email, club_name } = req.body
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }

  const emailNorm = email.trim().toLowerCase()
  const clubName = club_name?.trim() || 'Mon club'

  try {
    // Une seule démo active par email
    const existing = await db('licenses')
      .where({ email: emailNorm, is_demo: true, revoked: false })
      .where('expires_at', '>=', db.raw('CURRENT_DATE'))
      .first()

    if (existing) {
      return res.status(409).json({ error: 'Une démo est déjà active pour cet email.' })
    }

    const key = generateKey()
    const expiresAt = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]

    const [license] = await db('licenses').insert({
      key,
      club_name: clubName,
      email: emailNorm,
      plan: 'monthly',
      expires_at: expiresAt,
      is_demo: true,
    }).returning('*')

    const daysCount = await seedDemoData(key, license.products)

    const expiresLabel = new Date(expiresAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    await sendMail({
      to: emailNorm,
      subject: 'Votre accès démo Assolyte',
      html: demoEmailHtml({ key, daysCount, expiresLabel }),
    })

    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('[demo]', err)
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

export default router
