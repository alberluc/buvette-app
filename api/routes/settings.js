import { Router } from 'express'
import { db } from '../db.js'
import { requireSession } from '../middleware/auth.js'

const router = Router()

router.get('/settings', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  try {
    const license = await db('licenses').where({ key: licenseKey }).select('cash_float').first()
    if (!license) return res.status(404).json({ error: 'Licence introuvable' })
    res.json({ cashFloat: Number(license.cash_float) })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/settings', requireSession, async (req, res) => {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Droits insuffisants' })
  const { licenseKey } = req.session
  const { cashFloat } = req.body
  if (cashFloat == null || typeof cashFloat !== 'number' || cashFloat < 0)
    return res.status(400).json({ error: 'cashFloat invalide : nombre positif ou nul attendu' })
  try {
    await db('licenses').where({ key: licenseKey }).update({
      cash_float: cashFloat,
      updated_at: new Date(),
    })
    res.json({ cashFloat })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
