import { db } from '../db.js'
import { DEFAULT_MODULES } from './modules.js'

// Niveaux d'accès à un module, du plus faible au plus fort.
// 'user'  : utiliser le module (ex : saisir des commandes)
// 'admin' : responsable du module (ex : catalogue, fond de caisse)
export const LEVELS = ['user', 'admin']

export function levelAtLeast(level, required) {
  return LEVELS.includes(level) && LEVELS.indexOf(level) >= LEVELS.indexOf(required)
}

// { module: level } — modules limités à ceux de la licence
export function isValidPermissions(permissions, licenseModules) {
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return false
  return Object.entries(permissions).every(([m, l]) => licenseModules.includes(m) && LEVELS.includes(l))
}

// Droits stockés, par compte : { accountId: { module: level } }
export async function loadPermissions(accountIds) {
  const out = Object.fromEntries(accountIds.map(id => [id, {}]))
  if (!accountIds.length) return out
  const rows = await db('account_permissions').whereIn('account_id', accountIds)
  for (const r of rows) out[r.account_id][r.module] = r.level
  return out
}

// Remplace les droits stockés d'un compte (à appeler dans une transaction)
export async function savePermissions(trx, accountId, permissions) {
  await trx('account_permissions').where({ account_id: accountId }).delete()
  const rows = Object.entries(permissions).map(([module, level]) => ({ account_id: accountId, module, level }))
  if (rows.length) await trx('account_permissions').insert(rows)
}

// Droits effectifs embarqués dans la session : admin du club → 'admin' sur tous les modules de la licence
export function effectivePermissions(account, licenseModules, stored) {
  if (account.role === 'admin') return Object.fromEntries(licenseModules.map(m => [m, 'admin']))
  return Object.fromEntries(Object.entries(stored ?? {}).filter(([m]) => licenseModules.includes(m)))
}

// Sessions émises avant l'introduction des droits par module : pas de champ `permissions`,
// on reproduit l'ancien comportement (admin → tout, bénévole → accès simple aux modules de la licence)
export function sessionPermissions(session) {
  if (session.permissions) return session.permissions
  const modules = session.modules ?? DEFAULT_MODULES
  return Object.fromEntries(modules.map(m => [m, session.role === 'admin' ? 'admin' : 'user']))
}
