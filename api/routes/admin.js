import { Router } from 'express'
import { db } from '../db.js'
import { requireAdminSecret } from '../middleware/auth.js'
import { makeLicenseToken, generateKey, checkLicense } from '../lib/tokens.js'

const router = Router()

router.post('/licenses', requireAdminSecret, async (req, res) => {
  const { club_name, email, plan } = req.body
  if (!club_name || !['monthly', 'annual'].includes(plan))
    return res.status(400).json({ error: 'club_name et plan (monthly|annual) requis' })
  const ms = plan === 'annual' ? 365 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000
  try {
    const [row] = await db('licenses').insert({
      key: generateKey(),
      club_name: club_name.trim(),
      email: email?.trim() || null,
      plan,
      expires_at: new Date(Date.now() + ms).toISOString().split('T')[0],
    }).returning('*')
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/licenses', requireAdminSecret, async (req, res) => {
  try {
    res.json(await db('licenses').orderBy('created_at', 'desc'))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/licenses/:key', requireAdminSecret, async (req, res) => {
  try {
    const count = await db('licenses').where({ key: req.params.key.toUpperCase() }).update({ revoked: true })
    if (count === 0) return res.status(404).json({ error: 'Licence introuvable' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Génère un token de licence à la demande (utile pour tester)
router.post('/licenses/:key/token', requireAdminSecret, async (req, res) => {
  try {
    const license = await db('licenses').where({ key: req.params.key.toUpperCase() }).first()
    const check = checkLicense(license)
    if (!check.ok) return res.status(check.status).json({ error: check.error })
    res.json({ token: makeLicenseToken(license) })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
