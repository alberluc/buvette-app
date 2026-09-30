export const API_URL = import.meta.env.VITE_API_URL || 'https://api.petanquedutelegraphe.fr'

export function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

// ── Licences ──────────────────────────────────────────────────────────────────

export async function activateLicense(key) {
  const res = await fetch(`${API_URL}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function refreshLicense(token) {
  const res = await fetch(`${API_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

// ── Session ───────────────────────────────────────────────────────────────────

// Ré-émet la session depuis l'état serveur → { token, licenseToken }.
// L'erreur porte `status` (401/403 = session à abandonner) ; une erreur réseau n'en a pas.
export async function refreshSession(sessionToken) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Erreur serveur'), { status: res.status })
  return data
}

// ── Comptes ───────────────────────────────────────────────────────────────────

export async function fetchAccounts(licenseToken) {
  const res = await fetch(`${API_URL}/accounts`, {
    headers: { 'Authorization': `Bearer ${licenseToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function setupFirstAccount(licenseToken, { name, password }) {
  const res = await fetch(`${API_URL}/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${licenseToken}` },
    body: JSON.stringify({ name, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data // { token: sessionJWT }
}

export async function login(licenseToken, { accountId, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${licenseToken}` },
    body: JSON.stringify({ accountId, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data // { token: sessionJWT }
}

// permissions : { module: 'user' | 'admin' } (ignoré côté API pour un administrateur du club)
export async function createAccount(sessionToken, { name, password, role, permissions }) {
  const res = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify({ name, password, role, permissions }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function updateAccount(sessionToken, accountId, { role, permissions }) {
  const res = await fetch(`${API_URL}/accounts/${accountId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify({ role, permissions }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function deleteAccount(sessionToken, accountId) {
  const res = await fetch(`${API_URL}/accounts/${accountId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function verifyPassword(sessionToken, password) {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function changePassword(sessionToken, accountId, { currentPassword, newPassword }) {
  const res = await fetch(`${API_URL}/accounts/${accountId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

// ── Réglages ──────────────────────────────────────────────────────────────────

export async function fetchSettings(sessionToken) {
  const res = await fetch(`${API_URL}/settings`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function pushSettings(sessionToken, settings) {
  const res = await fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify(settings),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

