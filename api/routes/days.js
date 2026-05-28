import { Router } from 'express'
import { db } from '../db.js'
import { requireSession } from '../middleware/auth.js'

const router = Router()

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dayKey) {
  const dt = new Date(dayKey + 'T12:00:00')
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Récupère ou crée la journée du jour
router.get('/days/current', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const dayKey = todayKey()
  try {
    let day = await db('days').where({ license_key: licenseKey, day_key: dayKey }).first()
    if (!day) {
      const [inserted] = await db('days')
        .insert({ license_key: licenseKey, day_key: dayKey, date: formatDate(dayKey) })
        .returning('*')
      day = inserted
    }
    res.json(toClientDay(day))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Historique complet du club (toutes les journées sauf la journée en cours)
router.get('/days', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  try {
    const days = await db('days')
      .where({ license_key: licenseKey })
      .whereNot({ day_key: todayKey() })
      .orderBy('day_key', 'desc')
    res.json(days.map(toClientDay))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ajoute une commande à la journée — append atomique en JSONB pour éviter les conflits
router.post('/days/:dayKey/orders', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const { dayKey } = req.params
  const order = req.body
  if (!order || !order.items || !order.payment || order.total == null)
    return res.status(400).json({ error: 'Commande invalide' })
  try {
    const updated = await db('days')
      .where({ license_key: licenseKey, day_key: dayKey })
      .update({
        orders: db.raw('orders || ?::jsonb', [JSON.stringify([order])]),
        updated_at: db.raw('NOW()'),
      })
      .returning('*')
    if (!updated.length) return res.status(404).json({ error: 'Journée introuvable' })
    res.json(toClientDay(updated[0]))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprime une commande de la journée par son id
router.delete('/days/:dayKey/orders/:orderId', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const { dayKey, orderId } = req.params
  try {
    const updated = await db('days')
      .where({ license_key: licenseKey, day_key: dayKey })
      .update({
        orders: db.raw(
          `(SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) FROM jsonb_array_elements(orders) AS elem WHERE elem->>'id' != ?)`,
          [orderId]
        ),
        updated_at: db.raw('NOW()'),
      })
      .returning('*')
    if (!updated.length) return res.status(404).json({ error: 'Journée introuvable' })
    res.json(toClientDay(updated[0]))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ajoute un mouvement de caisse — append atomique en JSONB
router.post('/days/:dayKey/mouvements', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const { dayKey } = req.params
  const mouvement = req.body
  if (!mouvement || !mouvement.id || !mouvement.time || mouvement.amount == null)
    return res.status(400).json({ error: 'Mouvement invalide : id, time, amount requis' })
  try {
    const updated = await db('days')
      .where({ license_key: licenseKey, day_key: dayKey })
      .update({
        mouvements: db.raw('mouvements || ?::jsonb', [JSON.stringify([mouvement])]),
        updated_at: db.raw('NOW()'),
      })
      .returning('*')
    if (!updated.length) return res.status(404).json({ error: 'Journée introuvable' })
    res.json(toClientDay(updated[0]))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprime un mouvement de caisse par son id
router.delete('/days/:dayKey/mouvements/:mouvementId', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const { dayKey, mouvementId } = req.params
  try {
    const updated = await db('days')
      .where({ license_key: licenseKey, day_key: dayKey })
      .update({
        mouvements: db.raw(
          `(SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) FROM jsonb_array_elements(mouvements) AS elem WHERE elem->>'id' != ?)`,
          [mouvementId]
        ),
        updated_at: db.raw('NOW()'),
      })
      .returning('*')
    if (!updated.length) return res.status(404).json({ error: 'Journée introuvable' })
    res.json(toClientDay(updated[0]))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Mise à jour de la journée (clôture, réouverture, libellé, espèces comptées)
router.put('/days/:dayKey', requireSession, async (req, res) => {
  const { licenseKey } = req.session
  const { dayKey } = req.params
  const { day_closed, auto_closed, cash_counted, label } = req.body
  const patch = { updated_at: db.raw('NOW()') }
  if (day_closed !== undefined) patch.day_closed = day_closed
  if (auto_closed !== undefined) patch.auto_closed = auto_closed
  if (cash_counted !== undefined) patch.cash_counted = cash_counted
  if (label !== undefined) patch.label = label
  try {
    const updated = await db('days')
      .where({ license_key: licenseKey, day_key: dayKey })
      .update(patch)
      .returning('*')
    if (!updated.length) return res.status(404).json({ error: 'Journée introuvable' })
    res.json(toClientDay(updated[0]))
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

function toClientDay(row) {
  return {
    dayKey: row.day_key,
    date: row.date,
    label: row.label,
    orders: row.orders,
    mouvements: row.mouvements || [],
    dayClosed: row.day_closed,
    autoClosed: row.auto_closed,
    cashCounted: row.cash_counted !== null ? Number(row.cash_counted) : null,
    updatedAt: row.updated_at,
  }
}

export default router
