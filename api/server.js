import express from 'express'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import Knex from 'knex'
import knexConfig from './knexfile.js'

const { JWT_SECRET, ADMIN_SECRET } = process.env
if (!JWT_SECRET || !ADMIN_SECRET) {
  console.error('JWT_SECRET et ADMIN_SECRET sont requis')
  process.exit(1)
}

const db = Knex(knexConfig)

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  const origin = req.headers.origin
  const allowed = [
    'https://buvette.petanquedutelegraphe.fr',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Admin-Secret')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) return res.status(401).json({ error: 'Non autorisé' })
  next()
}

function makeLicenseToken(license) {
  return jwt.sign(
    { licenseKey: license.key, club: license.club_name, plan: license.plan, licenseExpires: license.expires_at },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

function checkLicense(license) {
  if (!license) return { ok: false, error: 'Clé invalide', status: 404 }
  if (license.revoked) return { ok: false, error: 'Licence révoquée', status: 403 }
  if (new Date(license.expires_at) < new Date()) return { ok: false, error: 'Licence expirée', status: 403 }
  return { ok: true }
}

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = randomBytes(16)
  return Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) => chars[buf[i * 4 + j] % chars.length]).join('')
  ).join('-')
}

// ── POST /activate ────────────────────────────────────────────────────────────
app.post('/activate', async (req, res) => {
  const { key } = req.body
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Clé manquante' })
  try {
    const license = await db('licenses').where({ key: key.trim().toUpperCase() }).first()
    const check = checkLicense(license)
    if (!check.ok) return res.status(check.status).json({ error: check.error })
    res.json({ token: makeLicenseToken(license) })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /refresh ─────────────────────────────────────────────────────────────
app.post('/refresh', async (req, res) => {
  const { token } = req.body
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token manquant' })
  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true })
  } catch {
    return res.status(400).json({ error: 'Token invalide' })
  }
  try {
    const license = await db('licenses').where({ key: payload.licenseKey }).first()
    const check = checkLicense(license)
    if (!check.ok) return res.status(check.status).json({ error: check.error })
    res.json({ token: makeLicenseToken(license) })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── POST /admin/licenses ──────────────────────────────────────────────────────
app.post('/admin/licenses', requireAdmin, async (req, res) => {
  const { club_name, email, plan } = req.body
  if (!club_name || !['monthly', 'annual'].includes(plan)) {
    return res.status(400).json({ error: 'club_name et plan (monthly|annual) requis' })
  }
  const ms = plan === 'annual' ? 365 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000
  const license = {
    key: generateKey(),
    club_name: club_name.trim(),
    email: email?.trim() || null,
    plan,
    expires_at: new Date(Date.now() + ms).toISOString().split('T')[0],
  }
  try {
    const [row] = await db('licenses').insert(license).returning('*')
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── GET /admin/licenses ───────────────────────────────────────────────────────
app.get('/admin/licenses', requireAdmin, async (req, res) => {
  try {
    const licenses = await db('licenses').orderBy('created_at', 'desc')
    res.json(licenses)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── DELETE /admin/licenses/:key ───────────────────────────────────────────────
app.delete('/admin/licenses/:key', requireAdmin, async (req, res) => {
  try {
    const count = await db('licenses').where({ key: req.params.key.toUpperCase() }).update({ revoked: true })
    if (count === 0) return res.status(404).json({ error: 'Licence introuvable' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.listen(3000, () => console.log('API buvette démarrée sur :3000'))
