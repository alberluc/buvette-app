import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

export function makeLicenseToken(license) {
  return jwt.sign(
    { licenseKey: license.key, club: license.club_name, plan: license.plan, licenseExpires: license.expires_at },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function makeSessionToken(account, licenseKey, club) {
  return jwt.sign(
    { accountId: account.id, name: account.name, role: account.role, licenseKey, club },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function checkLicense(license) {
  if (!license) return { ok: false, error: 'Clé invalide', status: 404 }
  if (license.revoked) return { ok: false, error: 'Licence révoquée', status: 403 }
  if (new Date(license.expires_at) < new Date()) return { ok: false, error: 'Licence expirée', status: 403 }
  return { ok: true }
}

export function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = randomBytes(16)
  return Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) => chars[buf[i * 4 + j] % chars.length]).join('')
  ).join('-')
}
