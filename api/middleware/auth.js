import jwt from 'jsonwebtoken'

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
