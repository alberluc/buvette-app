import { Router } from 'express'
import { db } from '../db.js'
import { requireSession, requireModule } from '../middleware/auth.js'

const router = Router()

router.get('/products', requireSession, requireModule('buvette'), async (req, res) => {
  const { licenseKey } = req.session
  try {
    const license = await db('licenses').where({ key: licenseKey }).select('products').first()
    if (!license) return res.status(404).json({ error: 'Licence introuvable' })
    res.json(license.products)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/products', requireSession, requireModule('buvette', 'admin'), async (req, res) => {
  const { licenseKey } = req.session
  const products = req.body
  if (!Array.isArray(products) || products.length === 0)
    return res.status(400).json({ error: 'Catalogue invalide : tableau non vide attendu' })
  for (const p of products) {
    if (!p.id || !p.name || p.price == null || !p.emoji || !p.color)
      return res.status(400).json({ error: 'Produit invalide : id, name, price, emoji, color requis' })
  }
  try {
    await db('licenses').where({ key: licenseKey }).update({
      products: JSON.stringify(products),
      updated_at: new Date(),
    })
    res.json(products)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
