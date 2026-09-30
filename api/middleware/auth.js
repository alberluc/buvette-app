import jwt from 'jsonwebtoken'
import { DEFAULT_MODULES } from '../lib/modules.js'
import { levelAtLeast, sessionPermissions } from '../lib/permissions.js'

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
export function requireModule(name, level = 'user') {
  return (req, res, next) => {
    const modules = req.session.modules ?? DEFAULT_MODULES
    if (!modules.includes(name)) return res.status(403).json({ error: 'Module non activé pour cette licence' })
    if (!levelAtLeast(sessionPermissions(req.session)[name], level))
      return res.status(403).json({ error: 'Droits insuffisants' })
    next()
  }
}

// Administrateur du club : gestion des comptes, identité du club
export function requireClubAdmin(req, res, next) {
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Droits insuffisants' })
  next()
}
