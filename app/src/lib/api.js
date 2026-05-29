const API_URL = import.meta.env.VITE_API_URL || 'https://api.petanquedutelegraphe.fr'

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

export async function createAccount(sessionToken, { name, password, role }) {
  const res = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify({ name, password, role }),
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

// ── Produits ──────────────────────────────────────────────────────────────────

export async function fetchProducts(sessionToken) {
  const res = await fetch(`${API_URL}/products`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function pushProducts(sessionToken, products) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify(products),
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

// ── Journées ──────────────────────────────────────────────────────────────────

export async function fetchCurrentDay(sessionToken) {
  const res = await fetch(`${API_URL}/days/current`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function fetchDays(sessionToken) {
  const res = await fetch(`${API_URL}/days`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function pushOrder(sessionToken, dayKey, order) {
  const res = await fetch(`${API_URL}/days/${dayKey}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify(order),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function deleteOrder(sessionToken, dayKey, orderId) {
  const res = await fetch(`${API_URL}/days/${dayKey}/orders/${orderId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function pushOperation(sessionToken, dayKey, operation) {
  const res = await fetch(`${API_URL}/days/${dayKey}/mouvements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify(operation),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function deleteOperation(sessionToken, dayKey, operationId) {
  const res = await fetch(`${API_URL}/days/${dayKey}/mouvements/${operationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export async function updateDay(sessionToken, dayKey, patch) {
  const res = await fetch(`${API_URL}/days/${dayKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
    body: JSON.stringify(patch),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}
