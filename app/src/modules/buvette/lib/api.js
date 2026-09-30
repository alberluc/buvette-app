import { API_URL } from '../../../lib/api'

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

export async function downloadXlsx(sessionToken, year, month) {
  const res = await fetch(`${API_URL}/report/xlsx/${year}/${month}`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Erreur serveur')
  }
  return res.blob()
}

export async function sendTestReport(sessionToken) {
  const res = await fetch(`${API_URL}/report/test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}
