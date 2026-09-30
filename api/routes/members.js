import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { requireSession, requireModule } from '../middleware/auth.js'

const router = Router()

// Données personnelles : droits relus en base à chaque requête (fresh).
// 'user' = consulter, 'admin' (responsable) = créer, modifier, supprimer, exporter.
const canRead  = [requireSession, requireModule('membres', 'user',  { fresh: true })]
const canWrite = [requireSession, requireModule('membres', 'admin', { fresh: true })]

const STATUSES = ['active', 'inactive']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Les colonnes `date` arrivent en Date locale depuis pg : on reformate sans passer par l'UTC
function ymd(d) {
  if (!d) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toClient(m) {
  return {
    id: m.id,
    firstName: m.first_name, lastName: m.last_name,
    email: m.email, phone: m.phone,
    address: m.address, postalCode: m.postal_code, city: m.city,
    birthDate: ymd(m.birth_date), memberSince: ymd(m.member_since),
    status: m.status, notes: m.notes,
    consentAt: m.consent_at, createdAt: m.created_at, updatedAt: m.updated_at,
  }
}

// Valide le corps d'une requête → { row } (colonnes DB, hors consentement) ou { error }
function parseMember(body) {
  const str = v => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const row = {
    first_name: str(body.firstName), last_name: str(body.lastName),
    email: str(body.email), phone: str(body.phone),
    address: str(body.address), postal_code: str(body.postalCode), city: str(body.city),
    birth_date: str(body.birthDate), member_since: str(body.memberSince),
    status: body.status ?? 'active', notes: str(body.notes),
  }
  if (!row.first_name || !row.last_name) return { error: 'Prénom et nom requis' }
  if (row.email && !EMAIL_RE.test(row.email)) return { error: 'Email invalide' }
  if (!STATUSES.includes(row.status)) return { error: 'Statut invalide' }
  for (const k of ['birth_date', 'member_since'])
    if (row[k] && !DATE_RE.test(row[k])) return { error: 'Date invalide (AAAA-MM-JJ attendu)' }
  if (body.consent !== undefined && typeof body.consent !== 'boolean') return { error: 'Consentement invalide' }
  return { row }
}

router.get('/members', ...canRead, async (req, res) => {
  try {
    const rows = await db('members').where({ license_key: req.session.licenseKey })
      .orderBy([{ column: 'last_name' }, { column: 'first_name' }])
    res.json(rows.map(toClient))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Export complet (portabilité / archivage) — CSV `;` avec BOM pour Excel
router.get('/members/export.csv', ...canWrite, async (req, res) => {
  const cols = [
    ['Nom', 'last_name'], ['Prénom', 'first_name'], ['Email', 'email'], ['Téléphone', 'phone'],
    ['Adresse', 'address'], ['Code postal', 'postal_code'], ['Ville', 'city'],
    ['Date de naissance', 'birth_date'], ['Adhérent depuis', 'member_since'],
    ['Statut', 'status'], ['Consentement', 'consent_at'], ['Notes', 'notes'],
  ]
  const cell = v => {
    if (v == null) return ''
    const s = v instanceof Date ? ymd(v) : String(v)
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  try {
    const rows = await db('members').where({ license_key: req.session.licenseKey })
      .orderBy([{ column: 'last_name' }, { column: 'first_name' }])
    const lines = [cols.map(c => c[0]).join(';')]
    for (const r of rows) {
      lines.push(cols.map(([, k]) => {
        if (k === 'status') return r.status === 'active' ? 'Actif' : 'Inactif'
        if (k === 'consent_at') return r.consent_at ? ymd(new Date(r.consent_at)) : ''
        return cell(r[k])
      }).join(';'))
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="membres.csv"')
    res.send('﻿' + lines.join('\r\n'))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/members/:id', ...canRead, async (req, res) => {
  try {
    const m = await db('members').where({ id: req.params.id, license_key: req.session.licenseKey }).first()
    if (!m) return res.status(404).json({ error: 'Membre introuvable' })
    res.json(toClient(m))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/members', ...canWrite, async (req, res) => {
  const { row, error } = parseMember(req.body ?? {})
  if (error) return res.status(400).json({ error })
  try {
    const [m] = await db('members').insert({
      ...row, id: randomUUID(), license_key: req.session.licenseKey,
      consent_at: req.body.consent ? new Date() : null,
    }).returning('*')
    res.status(201).json(toClient(m))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/members/:id', ...canWrite, async (req, res) => {
  const { row, error } = parseMember(req.body ?? {})
  if (error) return res.status(400).json({ error })
  try {
    const where = { id: req.params.id, license_key: req.session.licenseKey }
    const existing = await db('members').where(where).first()
    if (!existing) return res.status(404).json({ error: 'Membre introuvable' })
    // Le consentement garde sa date d'origine tant qu'il n'est pas retiré
    let consent_at = existing.consent_at
    if (req.body.consent === true && !consent_at) consent_at = new Date()
    if (req.body.consent === false) consent_at = null
    const [m] = await db('members').where(where).update({ ...row, consent_at, updated_at: new Date() }).returning('*')
    res.json(toClient(m))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Suppression définitive (droit à l'effacement)
router.delete('/members/:id', ...canWrite, async (req, res) => {
  try {
    const count = await db('members').where({ id: req.params.id, license_key: req.session.licenseKey }).delete()
    if (count === 0) return res.status(404).json({ error: 'Membre introuvable' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
