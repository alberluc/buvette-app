import { Router } from 'express'
import { db } from '../db.js'
import { requireSession } from '../middleware/auth.js'
import { makeLicenseToken } from '../lib/tokens.js'
import { levelAtLeast, sessionPermissions } from '../lib/permissions.js'

const router = Router()

router.get('/settings', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  try {
    const license = await db('licenses').where({ key: licenseKey }).select('cash_float', 'club_name').first()
    if (!license) return res.status(404).json({ error: 'Licence introuvable' })
    res.json({ cashFloat: Number(license.cash_float), clubName: license.club_name })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/settings', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const { cashFloat, clubName } = req.body

  // Chaque champ est optionnel : le socle envoie clubName, le module buvette envoie cashFloat
  if (cashFloat === undefined && clubName === undefined)
    return res.status(400).json({ error: 'Aucun réglage à mettre à jour' })
  // clubName : administrateur du club ; cashFloat : responsable de la buvette
  if (clubName !== undefined && req.session.role !== 'admin')
    return res.status(403).json({ error: 'Droits insuffisants' })
  if (cashFloat !== undefined && !levelAtLeast(sessionPermissions(req.session).buvette, 'admin'))
    return res.status(403).json({ error: 'Droits insuffisants' })
  if (cashFloat !== undefined && (typeof cashFloat !== 'number' || cashFloat < 0))
    return res.status(400).json({ error: 'cashFloat invalide : nombre positif ou nul attendu' })
  if (clubName !== undefined && (typeof clubName !== 'string' || !clubName.trim()))
    return res.status(400).json({ error: 'clubName invalide : chaîne non vide attendue' })

  const updates = { updated_at: new Date() }
  if (cashFloat !== undefined) updates.cash_float = cashFloat
  if (clubName !== undefined) updates.club_name = clubName.trim()

  try {
    await db('licenses').where({ key: licenseKey }).update(updates)
    const license = await db('licenses').where({ key: licenseKey }).first()
    const licenseToken = makeLicenseToken(license)
    res.json({ cashFloat: Number(license.cash_float), clubName: license.club_name, licenseToken })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
