// Usage : node scripts/previewReport.js
// Génère un PDF de démo dans /tmp/buvette-report-preview.pdf

import { generatePdf } from '../lib/reportPdf.js'
import { writeFileSync } from 'fs'

const mockData = {
  licenseKey: 'DEMO-0000-00000',
  clubName: 'Pétanque du Télégraphe',
  email: 'demo@club.fr',
  year: 2026,
  month: 5,
  products: [
    { id: 'biere', name: 'Bière',      price: 2 },
    { id: 'vin',   name: 'Vin',        price: 1 },
    { id: 'soda',  name: 'Soda / Eau', price: 1 },
    { id: 'box',   name: 'Box',        price: 1 },
  ],
  days: [
    {
      dayKey: '2026-05-02', date: 'Samedi 2 mai 2026', label: 'Tournoi printemps',
      orderCount: 38, dayTotal: 102, especes: 74, carte: 28,
      products: {
        biere: { name: 'Bière',      qty: 42, total: 84 },
        vin:   { name: 'Vin',        qty:  5, total:  5 },
        soda:  { name: 'Soda / Eau', qty: 13, total: 13 },
        box:   { name: 'Box',        qty:  0, total:  0 },
      },
    },
    {
      dayKey: '2026-05-10', date: 'Dimanche 10 mai 2026', label: '',
      orderCount: 12, dayTotal: 28, especes: 28, carte: 0,
      products: {
        biere: { name: 'Bière',      qty: 10, total: 20 },
        vin:   { name: 'Vin',        qty:  3, total:  3 },
        soda:  { name: 'Soda / Eau', qty:  5, total:  5 },
        box:   { name: 'Box',        qty:  0, total:  0 },
      },
    },
    {
      dayKey: '2026-05-24', date: 'Dimanche 24 mai 2026', label: 'Finale championnat',
      orderCount: 65, dayTotal: 187, especes: 120, carte: 67,
      products: {
        biere: { name: 'Bière',      qty: 71, total: 142 },
        vin:   { name: 'Vin',        qty: 12, total:  12 },
        soda:  { name: 'Soda / Eau', qty: 23, total:  23 },
        box:   { name: 'Box',        qty: 10, total:  10 },
      },
    },
  ],
  grandTotal: 317,
  grandEspeces: 222,
  grandCarte: 95,
  grandOrderCount: 115,
  grandProducts: {
    biere: { name: 'Bière',      qty: 123, total: 246 },
    vin:   { name: 'Vin',        qty:  20, total:  20 },
    soda:  { name: 'Soda / Eau', qty:  41, total:  41 },
    box:   { name: 'Box',        qty:  10, total:  10 },
  },
}

const out = '/tmp/buvette-report-preview.pdf'
console.log('Génération du PDF…')
const pdf = await generatePdf(mockData)
writeFileSync(out, pdf)
console.log(`PDF généré : ${out}`)
