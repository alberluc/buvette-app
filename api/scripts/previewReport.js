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
      dayKey: '2026-05-03', date: 'Dimanche 3 mai 2026',
      orderCount: 7, dayTotal: 23, especes: 19, carte: 4,
      _base: 0, _attendu: 19,
      products: {
        biere: { name: 'Bière',      qty: 8, total: 16 },
        vin:   { name: 'Vin',        qty: 2, total:  2 },
        soda:  { name: 'Soda / Eau', qty: 4, total:  4 },
        box:   { name: 'Box',        qty: 1, total:  1 },
      },
      orders: [
        { items: { biere: 2 },          total: 4, payment: 'especes', time: '09:45' },
        { items: { vin: 1, soda: 1 },   total: 2, payment: 'carte',   time: '10:30' },
        { items: { biere: 3 },          total: 6, payment: 'especes', time: '11:15' },
        { items: { soda: 2, box: 1 },   total: 3, payment: 'especes', time: '12:00' },
        { items: { biere: 2, vin: 1 },  total: 5, payment: 'especes', time: '14:10' },
        { items: { biere: 1 },          total: 2, payment: 'carte',   time: '15:45' },
        { items: { soda: 1 },           total: 1, payment: 'especes', time: '17:00' },
      ],
      mouvements: [],
    },
    {
      dayKey: '2026-05-04', date: 'Lundi 4 mai 2026',
      orderCount: 5, dayTotal: 14, especes: 12, carte: 2,
      _base: 0, _attendu: 12,
      products: {
        biere: { name: 'Bière',      qty: 5, total: 10 },
        vin:   { name: 'Vin',        qty: 3, total:  3 },
        soda:  { name: 'Soda / Eau', qty: 1, total:  1 },
        box:   { name: 'Box',        qty: 0, total:  0 },
      },
      orders: [
        { items: { biere: 2 },         total: 4, payment: 'especes', time: '10:30' },
        { items: { vin: 2 },           total: 2, payment: 'carte',   time: '11:05' },
        { items: { biere: 1, soda: 1 }, total: 3, payment: 'especes', time: '12:00' },
        { items: { biere: 2 },         total: 4, payment: 'especes', time: '14:30' },
        { items: { vin: 1 },           total: 1, payment: 'especes', time: '16:00' },
      ],
      mouvements: [],
    },
    {
      dayKey: '2026-05-10', date: 'Dimanche 10 mai 2026',
      orderCount: 10, dayTotal: 34, especes: 24, carte: 10,
      _base: 0, _attendu: 44,
      products: {
        biere: { name: 'Bière',      qty: 12, total: 24 },
        vin:   { name: 'Vin',        qty:  4, total:  4 },
        soda:  { name: 'Soda / Eau', qty:  4, total:  4 },
        box:   { name: 'Box',        qty:  2, total:  2 },
      },
      orders: [
        { items: { biere: 2 },           total: 4, payment: 'especes', time: '09:30' },
        { items: { soda: 1 },            total: 1, payment: 'especes', time: '10:15' },
        { items: { biere: 2, vin: 1 },   total: 5, payment: 'carte',   time: '10:45' },
        { items: { biere: 3 },           total: 6, payment: 'especes', time: '11:20' },
        { items: { box: 1, soda: 1 },    total: 2, payment: 'especes', time: '12:00' },
        { items: { biere: 1, soda: 2 },  total: 4, payment: 'carte',   time: '12:35' },
        { items: { vin: 2 },             total: 2, payment: 'especes', time: '13:10' },
        { items: { biere: 2 },           total: 4, payment: 'especes', time: '14:00' },
        { items: { biere: 2, box: 1 },   total: 5, payment: 'especes', time: '15:30' },
        { items: { vin: 1 },             total: 1, payment: 'carte',   time: '17:00' },
      ],
      mouvements: [
        { id: '1', time: '13:00', label: 'Appoint monnaie', amount: 20 },
      ],
      cashCounted: 46,
    },
    {
      dayKey: '2026-05-17', date: 'Dimanche 17 mai 2026',
      orderCount: 8, dayTotal: 28, especes: 20, carte: 8,
      _base: 0, _attendu: 0,
      products: {
        biere: { name: 'Bière',      qty: 10, total: 20 },
        vin:   { name: 'Vin',        qty:  3, total:  3 },
        soda:  { name: 'Soda / Eau', qty:  4, total:  4 },
        box:   { name: 'Box',        qty:  1, total:  1 },
      },
      orders: [
        { items: { biere: 2, soda: 1 }, total: 5, payment: 'especes', time: '10:00' },
        { items: { vin: 1 },            total: 1, payment: 'especes', time: '10:45' },
        { items: { biere: 3 },          total: 6, payment: 'carte',   time: '11:30' },
        { items: { soda: 2, box: 1 },   total: 3, payment: 'especes', time: '12:15' },
        { items: { biere: 2 },          total: 4, payment: 'especes', time: '13:00' },
        { items: { vin: 2 },            total: 2, payment: 'carte',   time: '14:30' },
        { items: { biere: 1, soda: 1 }, total: 3, payment: 'especes', time: '15:45' },
        { items: { biere: 2 },          total: 4, payment: 'especes', time: '17:00' },
      ],
      mouvements: [
        { id: '2', time: '12:00', label: 'Sortie caisse', amount: -20 },
      ],
    },
    {
      dayKey: '2026-05-24', date: 'Dimanche 24 mai 2026',
      orderCount: 11, dayTotal: 41, especes: 29, carte: 12,
      _base: 0, _attendu: 79,
      products: {
        biere: { name: 'Bière',      qty: 15, total: 30 },
        vin:   { name: 'Vin',        qty:  3, total:  3 },
        soda:  { name: 'Soda / Eau', qty:  6, total:  6 },
        box:   { name: 'Box',        qty:  2, total:  2 },
      },
      orders: [
        { items: { biere: 2 },          total: 4, payment: 'especes', time: '09:00' },
        { items: { soda: 1, box: 1 },   total: 2, payment: 'especes', time: '09:45' },
        { items: { biere: 2, vin: 1 },  total: 5, payment: 'carte',   time: '10:30' },
        { items: { biere: 3 },          total: 6, payment: 'especes', time: '11:00' },
        { items: { biere: 1, soda: 1 }, total: 3, payment: 'carte',   time: '11:30' },
        { items: { vin: 1, soda: 1 },   total: 2, payment: 'especes', time: '12:00' },
        { items: { biere: 2, soda: 1 }, total: 5, payment: 'especes', time: '12:30' },
        { items: { soda: 2 },           total: 2, payment: 'especes', time: '13:30' },
        { items: { biere: 2 },          total: 4, payment: 'carte',   time: '14:00' },
        { items: { biere: 3, box: 1 },  total: 7, payment: 'especes', time: '15:00' },
        { items: { vin: 1 },            total: 1, payment: 'especes', time: '17:00' },
      ],
      mouvements: [
        { id: '3', time: '08:30', label: 'Fond de caisse', amount: 50 },
      ],
      cashCounted: 81,
    },
    {
      dayKey: '2026-05-25', date: 'Lundi 25 mai 2026',
      orderCount: 5, dayTotal: 12, especes: 11, carte: 1,
      _base: 0, _attendu: 11,
      products: {
        biere: { name: 'Bière',      qty: 4, total:  8 },
        vin:   { name: 'Vin',        qty: 1, total:  1 },
        soda:  { name: 'Soda / Eau', qty: 2, total:  2 },
        box:   { name: 'Box',        qty: 1, total:  1 },
      },
      orders: [
        { items: { biere: 1, soda: 1 }, total: 3, payment: 'especes', time: '11:00' },
        { items: { biere: 2 },          total: 4, payment: 'especes', time: '12:30' },
        { items: { vin: 1 },            total: 1, payment: 'carte',   time: '14:00' },
        { items: { box: 1 },            total: 1, payment: 'especes', time: '15:30' },
        { items: { biere: 1, soda: 1 }, total: 3, payment: 'especes', time: '17:00' },
      ],
      mouvements: [],
    },
  ],
  grandTotal: 152,
  grandEspeces: 115,
  grandCarte: 37,
  grandOrderCount: 46,
  grandProducts: {
    biere: { name: 'Bière',      qty: 54, total: 108 },
    vin:   { name: 'Vin',        qty: 16, total:  16 },
    soda:  { name: 'Soda / Eau', qty: 21, total:  21 },
    box:   { name: 'Box',        qty:  7, total:   7 },
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
