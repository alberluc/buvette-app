import { Router } from 'express'
import { db } from '../db.js'
import { requireAdminSecret } from '../middleware/auth.js'
import { makeLicenseToken, generateKey, checkLicense } from '../lib/tokens.js'
import { sendMail } from '../lib/mailer.js'
import { licenseEmailHtml } from '../lib/emailTemplates.js'

const router = Router()

router.post('/licenses', requireAdminSecret, async (req, res) => {
  const { club_name, email, plan } = req.body
  if (!club_name || !email || !['monthly', 'annual'].includes(plan))
    return res.status(400).json({ error: 'club_name, email et plan (monthly|annual) requis' })
  const ms = plan === 'annual' ? 365 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000
  const expiresAt = new Date(Date.now() + ms).toISOString().split('T')[0]
  try {
    const [row] = await db('licenses').insert({
      key: generateKey(),
      club_name: club_name.trim(),
      email: email.trim(),
      plan,
      expires_at: expiresAt,
    }).returning('*')

    const expiresLabel = new Date(expiresAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    await sendMail({
      to: email.trim(),
      subject: `Votre licence Assolyte — ${club_name.trim()}`,
      html: licenseEmailHtml({ key: row.key, clubName: club_name.trim(), plan, expiresLabel }),
    })

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
    const count = await db('licenses').where({ key: req.params.key.toUpperCase() })
      .update({ revoked: true, revoked_at: db.fn.now() })
    if (count === 0) return res.status(404).json({ error: 'Licence introuvable' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/licenses/:key/restore', requireAdminSecret, async (req, res) => {
  try {
    const count = await db('licenses').where({ key: req.params.key.toUpperCase() })
      .update({ revoked: false, revoked_at: null })
    if (count === 0) return res.status(404).json({ error: 'Licence introuvable' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/licenses/:key/permanent', requireAdminSecret, async (req, res) => {
  const key = req.params.key.toUpperCase()
  try {
    const license = await db('licenses').where({ key }).first()
    if (!license) return res.status(404).json({ error: 'Licence introuvable' })
    if (!license.is_demo) return res.status(400).json({ error: 'Suppression définitive réservée aux licences démo' })
    await db('days').where({ license_key: key }).delete()
    await db('accounts').where({ license_key: key }).delete()
    await db('licenses').where({ key }).delete()
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
