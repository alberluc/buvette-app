import { API_URL } from '../../../lib/api'

// Module en ligne uniquement : aucune de ces données n'est écrite dans IndexedDB.

async function request(sessionToken, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

export const fetchMembers = sessionToken => request(sessionToken, '/members')
export const createMember = (sessionToken, member) => request(sessionToken, '/members', { method: 'POST', body: member })
export const updateMember = (sessionToken, id, member) => request(sessionToken, `/members/${id}`, { method: 'PUT', body: member })
export const deleteMember = (sessionToken, id) => request(sessionToken, `/members/${id}`, { method: 'DELETE' })

export async function downloadMembersCsv(sessionToken) {
  const res = await fetch(`${API_URL}/members/export.csv`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Erreur serveur')
  }
  return res.blob()
}
