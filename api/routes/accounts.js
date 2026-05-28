import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { requireLicenseToken, requireSession } from '../middleware/auth.js'
import { hashPassword, generateSalt } from '../lib/crypto.js'

const router = Router()

router.get('/accounts', requireLicenseToken, async (req, res) => {
  try {
    const accounts = await db('accounts')
      .where({ license_key: req.licenseKey })
      .select('id', 'name', 'role', 'created_at')
      .orderBy('created_at', 'asc')
    res.json(accounts)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/accounts', requireSession, async (req, res) => {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Droits insuffisants' })
  const { name, password, role } = req.body
  if (!name?.trim() || !password) return res.status(400).json({ error: 'Nom et mot de passe requis' })
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' })
  try {
    const id = randomUUID()
    const salt = generateSalt()
    const password_hash = hashPassword(salt, password)
    await db('accounts').insert({ id, license_key: req.session.licenseKey, name: name.trim(), salt, password_hash, role })
    res.status(201).json({ id, name: name.trim(), role })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/accounts/:id', requireSession, async (req, res) => {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Droits insuffisants' })
  if (req.params.id === req.session.accountId)
    return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' })
  try {
    const count = await db('accounts').where({ id: req.params.id, license_key: req.session.licenseKey }).delete()
    if (count === 0) return res.status(404).json({ error: 'Compte introuvable' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/accounts/:id/password', requireSession, async (req, res) => {
  const isSelf = req.params.id === req.session.accountId
  const isAdmin = req.session.role === 'admin'
  if (!isSelf && !isAdmin) return res.status(403).json({ error: 'Droits insuffisants' })

  const { currentPassword, newPassword } = req.body
  if (!newPassword) return res.status(400).json({ error: 'Nouveau mot de passe requis' })
  try {
    const account = await db('accounts').where({ id: req.params.id, license_key: req.session.licenseKey }).first()
    if (!account) return res.status(404).json({ error: 'Compte introuvable' })

    if (isSelf) {
      if (!currentPassword) return res.status(400).json({ error: 'Mot de passe actuel requis' })
      if (hashPassword(account.salt, currentPassword) !== account.password_hash)
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
    }

    const salt = generateSalt()
    await db('accounts').where({ id: req.params.id }).update({ salt, password_hash: hashPassword(salt, newPassword), updated_at: new Date() })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
