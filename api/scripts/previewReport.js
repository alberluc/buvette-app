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
      orderCount: 4, dayTotal: 13, especes: 9, carte: 4,
      products: {
        biere: { name: 'Bière',      qty: 4, total: 8 },
        vin:   { name: 'Vin',        qty: 1, total: 1 },
        soda:  { name: 'Soda / Eau', qty: 4, total: 4 },
        box:   { name: 'Box',        qty: 0, total: 0 },
      },
      orders: [
        { items: { biere: 2 },         total: 4,  payment: 'especes' },
        { items: { biere: 1, soda: 2 }, total: 4, payment: 'especes' },
        { items: { vin: 1, soda: 1 },  total: 2,  payment: 'carte'   },
        { items: { biere: 1, soda: 1 }, total: 3, payment: 'carte'   },
      ],
      mouvements: [
        { id: '1', time: '18:30', label: 'Achat glaçons', amount: -5 },
        { id: '2', time: '20:00', label: 'Appoint monnaie', amount: 20 },
      ],
      cashCounted: 27,
      _attendu: 28,
      _ecart: -1,
    },
    {
      dayKey: '2026-05-10', date: 'Dimanche 10 mai 2026', label: '',
      orderCount: 3, dayTotal: 9, especes: 9, carte: 0,
      products: {
        biere: { name: 'Bière',      qty: 3, total: 6 },
        vin:   { name: 'Vin',        qty: 1, total: 1 },
        soda:  { name: 'Soda / Eau', qty: 2, total: 2 },
        box:   { name: 'Box',        qty: 0, total: 0 },
      },
      orders: [
        { items: { biere: 2 },         total: 4, payment: 'especes' },
        { items: { vin: 1 },           total: 1, payment: 'especes' },
        { items: { biere: 1, soda: 2 }, total: 4, payment: 'especes' },
      ],
    },
    {
      dayKey: '2026-05-24', date: 'Dimanche 24 mai 2026', label: 'Finale championnat',
      orderCount: 5, dayTotal: 19, especes: 12, carte: 7,
      products: {
        biere: { name: 'Bière',      qty: 6, total: 12 },
        vin:   { name: 'Vin',        qty: 2, total:  2 },
        soda:  { name: 'Soda / Eau', qty: 3, total:  3 },
        box:   { name: 'Box',        qty: 2, total:  2 },
      },
      orders: [
        { items: { biere: 2, box: 1 },        total: 5,  payment: 'especes' },
        { items: { biere: 1, soda: 1 },       total: 3,  payment: 'especes' },
        { items: { vin: 2 },                  total: 2,  payment: 'carte'   },
        { items: { biere: 2, soda: 2 },       total: 6,  payment: 'carte'   },
        { items: { biere: 1, soda: 0, box: 1 }, total: 3, payment: 'especes' },
      ],
    },
  ],
  grandTotal: 41,
  grandEspeces: 30,
  grandCarte: 11,
  grandOrderCount: 12,
  grandProducts: {
    biere: { name: 'Bière',      qty: 13, total: 26 },
    vin:   { name: 'Vin',        qty:  4, total:  4 },
    soda:  { name: 'Soda / Eau', qty:  9, total:  9 },
    box:   { name: 'Box',        qty:  2, total:  2 },
  },
}

console.log('Génération des PDFs…')
const [pdf, pdfGrid] = await Promise.all([
  generatePdf(mockData, 'summary'),
  generatePdf(mockData, 'grid'),
])
writeFileSync('/tmp/buvette-report-preview.pdf', pdf)
writeFileSync('/tmp/buvette-report-preview-detail.pdf', pdfGrid)
console.log('PDFs générés :')
console.log('  /tmp/buvette-report-preview.pdf')
console.log('  /tmp/buvette-report-preview-detail.pdf')
