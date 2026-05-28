import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'
import { makeLicenseToken, checkLicense } from '../lib/tokens.js'

const router = Router()

router.post('/activate', async (req, res) => {
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

router.post('/refresh', async (req, res) => {
  const { token } = req.body
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token manquant' })
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true })
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

export default router
