import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { requireLicenseToken, requireSession, requireClubAdmin } from '../middleware/auth.js'
import { hashPassword, generateSalt } from '../lib/crypto.js'
import { DEFAULT_MODULES } from '../lib/modules.js'
import { isValidPermissions, loadPermissions, savePermissions } from '../lib/permissions.js'

const router = Router()

const ROLES = ['admin', 'user']

// `permissions` = droits stockés ({ module: level }) ; ignorés pour un administrateur du club
router.get('/accounts', requireLicenseToken, async (req, res) => {
  try {
    const accounts = await db('accounts')
      .where({ license_key: req.licenseKey })
      .select('id', 'name', 'role', 'created_at')
      .orderBy('created_at', 'asc')
    const permissions = await loadPermissions(accounts.map(a => a.id))
    res.json(accounts.map(a => ({ ...a, permissions: permissions[a.id] })))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/accounts', requireSession, requireClubAdmin, async (req, res) => {
  const { name, password, role, permissions = {} } = req.body
  if (!name?.trim() || !password) return res.status(400).json({ error: 'Nom et mot de passe requis' })
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' })
  if (!isValidPermissions(permissions, req.session.modules ?? DEFAULT_MODULES))
    return res.status(400).json({ error: 'Droits invalides' })
  try {
    const id = randomUUID()
    const salt = generateSalt()
    const password_hash = hashPassword(salt, password)
    await db.transaction(async trx => {
      await trx('accounts').insert({ id, license_key: req.session.licenseKey, name: name.trim(), salt, password_hash, role })
      await savePermissions(trx, id, permissions)
    })
    res.status(201).json({ id, name: name.trim(), role, permissions })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Modifie le rôle et/ou les droits d'un compte. Pris en compte à sa prochaine connexion.
router.put('/accounts/:id', requireSession, requireClubAdmin, async (req, res) => {
  const { role, permissions } = req.body
  if (role === undefined && permissions === undefined) return res.status(400).json({ error: 'Rien à modifier' })
  if (role !== undefined && !ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' })
  if (permissions !== undefined && !isValidPermissions(permissions, req.session.modules ?? DEFAULT_MODULES))
    return res.status(400).json({ error: 'Droits invalides' })
  // Évite qu'un club se retrouve sans administrateur
  if (req.params.id === req.session.accountId && role !== undefined && role !== 'admin')
    return res.status(400).json({ error: 'Impossible de retirer vos propres droits d\'administrateur' })
  try {
    const account = await db('accounts').where({ id: req.params.id, license_key: req.session.licenseKey }).first()
    if (!account) return res.status(404).json({ error: 'Compte introuvable' })
    await db.transaction(async trx => {
      if (role !== undefined) await trx('accounts').where({ id: account.id }).update({ role, updated_at: new Date() })
      if (permissions !== undefined) await savePermissions(trx, account.id, permissions)
    })
    const stored = await loadPermissions([account.id])
    res.json({ id: account.id, name: account.name, role: role ?? account.role, permissions: stored[account.id] })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/accounts/:id', requireSession, requireClubAdmin, async (req, res) => {
  if (req.params.id === req.session.accountId)
    return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' })
  try {
    // Les droits sont supprimés en cascade (FK account_permissions.account_id)
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
