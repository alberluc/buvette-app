import jwt from 'jsonwebtoken'
import { db } from '../db.js'
import { DEFAULT_MODULES } from '../lib/modules.js'
import { levelAtLeast, sessionPermissions, loadPermissions, effectivePermissions } from '../lib/permissions.js'
import { checkLicense } from '../lib/tokens.js'

export function requireAdminSecret(req, res, next) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Non autorisé' })
  next()
}

export function requireLicenseToken(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' })
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    if (!payload.licenseKey) return res.status(401).json({ error: 'Token invalide' })
    req.licenseKey = payload.licenseKey
    req.club = payload.club
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

export function requireSession(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' })
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    if (!payload.accountId) return res.status(401).json({ error: 'Token invalide' })
    req.session = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Session expirée' })
  }
}

// À placer après requireSession : refuse l'accès si le module n'est pas activé pour la licence,
// ou si le compte n'a pas le niveau requis sur ce module ('user' ou 'admin').
// Les sessions émises avant l'introduction des modules n'ont pas de champ `modules` → modules par défaut.
//
// fresh: true → relit licence, compte et droits en base à chaque requête au lieu de faire confiance
// au token (valable 7 j). À utiliser pour les modules qui exposent des données personnelles :
// un compte supprimé, un droit retiré ou une licence révoquée prennent effet immédiatement.
export function requireModule(name, level = 'user', { fresh = false } = {}) {
  return async (req, res, next) => {
    let modules = req.session.modules ?? DEFAULT_MODULES
    let permissions = sessionPermissions(req.session)

    if (fresh) {
      try {
        const [account, license] = await Promise.all([
          db('accounts').where({ id: req.session.accountId, license_key: req.session.licenseKey }).first(),
          db('licenses').where({ key: req.session.licenseKey }).first(),
        ])
        if (!account) return res.status(401).json({ error: 'Compte introuvable' })
        const check = checkLicense(license)
        if (!check.ok) return res.status(check.status).json({ error: check.error })
        modules = license.modules ?? DEFAULT_MODULES
        const stored = await loadPermissions([account.id])
        permissions = effectivePermissions(account, modules, stored[account.id])
      } catch {
        return res.status(500).json({ error: 'Erreur serveur' })
      }
    }

    if (!modules.includes(name)) return res.status(403).json({ error: 'Module non activé pour cette licence' })
    if (!levelAtLeast(permissions[name], level))
      return res.status(403).json({ error: 'Droits insuffisants' })
    next()
  }
}

// Administrateur du club : gestion des comptes, identité du club
export function requireClubAdmin(req, res, next) {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Droits insuffisants' })
  next()
}
