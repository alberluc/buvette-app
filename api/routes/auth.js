import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { requireLicenseToken, requireSession } from '../middleware/auth.js'
import { hashPassword, generateSalt } from '../lib/crypto.js'
import { makeSessionToken } from '../lib/tokens.js'

const router = Router()

router.post('/auth/setup', requireLicenseToken, async (req, res) => {
  const { name, password } = req.body
  if (!name?.trim() || !password) return res.status(400).json({ error: 'Nom et mot de passe requis' })
  try {
    const count = await db('accounts').where({ license_key: req.licenseKey }).count('id as c').first()
    if (Number(count.c) > 0) return res.status(409).json({ error: 'Des comptes existent déjà' })

    const id = randomUUID()
    const salt = generateSalt()
    const password_hash = hashPassword(salt, password)
    await db('accounts').insert({ id, license_key: req.licenseKey, name: name.trim(), salt, password_hash, role: 'admin' })

    res.status(201).json({ token: makeSessionToken({ id, name: name.trim(), role: 'admin' }, req.licenseKey, req.club) })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/auth/login', requireLicenseToken, async (req, res) => {
  const { accountId, password } = req.body
  if (!accountId || !password) return res.status(400).json({ error: 'Données manquantes' })
  try {
    const account = await db('accounts').where({ id: accountId, license_key: req.licenseKey }).first()
    if (!account) return res.status(404).json({ error: 'Compte introuvable' })
    if (hashPassword(account.salt, password) !== account.password_hash)
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    res.json({ token: makeSessionToken(account, req.licenseKey, req.club) })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/auth/verify', requireSession, async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' })
  try {
    const account = await db('accounts').where({ id: req.session.accountId, license_key: req.session.licenseKey }).first()
    if (!account) return res.status(404).json({ error: 'Compte introuvable' })
    if (hashPassword(account.salt, password) !== account.password_hash)
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
