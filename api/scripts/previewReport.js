// Usage : node scripts/previewReport.js
// Génère deux PDFs de démo dans /tmp/

import { generatePdf } from '../lib/reportPdf.js'
import { writeFileSync } from 'fs'

// Mai 2026 — Pétanque des Cailloux Ronds
// Scénarios couverts :
//   - Journée normale (dimanche régulier)
//   - Tournoi (gros volume, mouvements multiples, comptage exact)
//   - Clôture auto (oubli de fermeture, pas de comptage)
//   - Comptage avec écart mineur (−2 €)
//   - Comptage avec écart important (+8 €)
//   - Vendredi soir (faible volume, peu de mouvements)
//   - Journée avec sortie caisse intermédiaire

const mockData = {
  licenseKey: 'DEMO-0000-00000',
  clubName:   'Pétanque des Cailloux Ronds',
  email:      'tresorier@petanque-cailloux.fr',
  year:  2026,
  month: 5,
  products: [
    { id: 'biere', name: 'Bière',      price: 2 },
    { id: 'vin',   name: 'Vin',        price: 1 },
    { id: 'soda',  name: 'Soda / Eau', price: 1 },
    { id: 'box',   name: 'Box',        price: 1 },
  ],
  days: [
    // ── Dimanche 3 mai – journée ordinaire, comptage exact ────────────────
    {
      dayKey: '2026-05-03', date: 'Dimanche 3 mai 2026',
      orderCount: 14, dayTotal: 44, especes: 32, carte: 12,
      _base: 50, _attendu: 82,
      products: {
        biere: { name: 'Bière',      qty: 16, total: 32 },
        vin:   { name: 'Vin',        qty:  4, total:  4 },
        soda:  { name: 'Soda / Eau', qty:  6, total:  6 },
        box:   { name: 'Box',        qty:  2, total:  2 },
      },
      orders: [
        { items: { biere: 2 },           total: 4,  payment: 'especes', time: '10:05' },
        { items: { soda: 2 },            total: 2,  payment: 'especes', time: '10:22' },
        { items: { biere: 1, vin: 1 },   total: 3,  payment: 'carte',   time: '10:48' },
        { items: { biere: 3 },           total: 6,  payment: 'especes', time: '11:10' },
        { items: { soda: 1, box: 1 },    total: 2,  payment: 'especes', time: '11:35' },
        { items: { biere: 2, soda: 1 },  total: 5,  payment: 'carte',   time: '12:00' },
        { items: { vin: 2 },             total: 2,  payment: 'especes', time: '12:20' },
        { items: { biere: 2 },           total: 4,  payment: 'especes', time: '12:55' },
        { items: { biere: 1 },           total: 2,  payment: 'especes', time: '13:30' },
        { items: { soda: 1 },            total: 1,  payment: 'carte',   time: '14:05' },
        { items: { biere: 2, vin: 1 },   total: 5,  payment: 'especes', time: '14:40' },
        { items: { box: 1 },             total: 1,  payment: 'especes', time: '15:10' },
        { items: { biere: 1, soda: 1 },  total: 3,  payment: 'carte',   time: '15:55' },
        { items: { biere: 2 },           total: 4,  payment: 'especes', time: '16:30' },
      ],
      mouvements: [
        { id: 'op-1', time: '09:00', label: 'Fond de caisse', amount: 50 },
      ],
      cashCounted: 82,
    },

    // ── Vendredi 9 mai – soirée d'entraînement, clôture auto, pas de comptage ──
    {
      dayKey: '2026-05-09', date: 'Vendredi 9 mai 2026',
      orderCount: 7, dayTotal: 16, especes: 13, carte: 3,
      _base: 0, _attendu: 13,
      products: {
        biere: { name: 'Bière',      qty: 5, total: 10 },
        vin:   { name: 'Vin',        qty: 2, total:  2 },
        soda:  { name: 'Soda / Eau', qty: 3, total:  3 },
        box:   { name: 'Box',        qty: 1, total:  1 },
      },
      orders: [
        { items: { biere: 1 },           total: 2,  payment: 'especes', time: '18:15' },
        { items: { soda: 2 },            total: 2,  payment: 'carte',   time: '18:40' },
        { items: { biere: 2 },           total: 4,  payment: 'especes', time: '19:05' },
        { items: { vin: 1, box: 1 },     total: 2,  payment: 'especes', time: '19:30' },
        { items: { biere: 1, soda: 1 },  total: 3,  payment: 'especes', time: '20:00' },
        { items: { vin: 1 },             total: 1,  payment: 'carte',   time: '20:25' },
        { items: { biere: 1 },           total: 2,  payment: 'especes', time: '20:50' },
      ],
      mouvements: [],
      autoClosed: true,
    },

    // ── Samedi 10 mai – TOURNOI, gros volume, mouvements multiples, comptage exact ──
    {
      dayKey: '2026-05-10', date: 'Samedi 10 mai 2026',
      orderCount: 48, dayTotal: 158, especes: 118, carte: 40,
      _base: 50, _attendu: 152,
      products: {
        biere: { name: 'Bière',      qty: 55, total: 110 },
        vin:   { name: 'Vin',        qty: 14, total:  14 },
        soda:  { name: 'Soda / Eau', qty: 22, total:  22 },
        box:   { name: 'Box',        qty: 12, total:  12 },
      },
      orders: [
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '09:05' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '09:18' },
        { items: { biere: 3, soda: 1 },   total:  7, payment: 'especes', time: '09:35' },
        { items: { biere: 4 },            total:  8, payment: 'especes', time: '09:52' },
        { items: { vin: 2, soda: 1 },     total:  3, payment: 'carte',   time: '10:08' },
        { items: { biere: 2, box: 2 },    total:  6, payment: 'especes', time: '10:20' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '10:35' },
        { items: { soda: 3 },             total:  3, payment: 'especes', time: '10:45' },
        { items: { biere: 3 },            total:  6, payment: 'carte',   time: '10:58' },
        { items: { vin: 1, box: 1 },      total:  2, payment: 'especes', time: '11:10' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'especes', time: '11:22' },
        { items: { biere: 4, vin: 1 },    total:  9, payment: 'especes', time: '11:35' },
        { items: { soda: 2, box: 1 },     total:  3, payment: 'carte',   time: '11:48' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '12:00' },
        { items: { biere: 2, vin: 2 },    total:  6, payment: 'especes', time: '12:12' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '12:22' },
        { items: { biere: 3, box: 2 },    total:  8, payment: 'carte',   time: '12:35' },
        { items: { vin: 2 },              total:  2, payment: 'especes', time: '12:48' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '13:00' },
        { items: { biere: 4, soda: 2 },   total: 10, payment: 'especes', time: '13:15' },
        { items: { box: 3 },              total:  3, payment: 'especes', time: '13:25' },
        { items: { biere: 3, vin: 1 },    total:  7, payment: 'carte',   time: '13:38' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '13:50' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '14:02' },
        { items: { biere: 3, soda: 1 },   total:  7, payment: 'carte',   time: '14:15' },
        { items: { vin: 1 },              total:  1, payment: 'especes', time: '14:28' },
        { items: { biere: 2, box: 1 },    total:  5, payment: 'especes', time: '14:40' },
        { items: { biere: 4 },            total:  8, payment: 'especes', time: '14:55' },
        { items: { soda: 3, box: 1 },     total:  4, payment: 'carte',   time: '15:05' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'especes', time: '15:20' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '15:35' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '15:45' },
        { items: { biere: 3 },            total:  6, payment: 'carte',   time: '16:00' },
        { items: { vin: 2, box: 1 },      total:  3, payment: 'especes', time: '16:12' },
        { items: { biere: 2, soda: 2 },   total:  6, payment: 'especes', time: '16:22' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '16:35' },
        { items: { soda: 2 },             total:  2, payment: 'carte',   time: '16:45' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'especes', time: '16:55' },
        { items: { biere: 1, box: 1 },    total:  3, payment: 'especes', time: '17:05' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '17:15' },
        { items: { biere: 2 },            total:  4, payment: 'carte',   time: '17:28' },
        { items: { vin: 1 },              total:  1, payment: 'especes', time: '17:38' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'especes', time: '17:50' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '18:00' },
        { items: { box: 2 },              total:  2, payment: 'especes', time: '18:10' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'carte',   time: '18:20' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '18:35' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '18:48' },
      ],
      mouvements: [
        { id: 'op-1', time: '08:30', label: 'Fond de caisse',   amount:  50 },
        { id: 'op-2', time: '09:45', label: 'Achat glaçons',    amount: -12 },
        { id: 'op-3', time: '12:30', label: 'Appoint monnaie',  amount:  40 },
        { id: 'op-4', time: '18:00', label: 'Sortie caisse',    amount: -46 },
      ],
      cashCounted: 152,
    },

    // ── Dimanche 11 mai – lendemain de tournoi, volume modéré, comptage -2 € ──
    {
      dayKey: '2026-05-11', date: 'Dimanche 11 mai 2026',
      orderCount: 18, dayTotal: 52, especes: 38, carte: 14,
      _base: 50, _attendu: 88,
      products: {
        biere: { name: 'Bière',      qty: 18, total: 36 },
        vin:   { name: 'Vin',        qty:  6, total:  6 },
        soda:  { name: 'Soda / Eau', qty:  8, total:  8 },
        box:   { name: 'Box',        qty:  2, total:  2 },
      },
      orders: [
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '09:40' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '10:05' },
        { items: { biere: 1, vin: 1 },    total:  3, payment: 'carte',   time: '10:25' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '10:50' },
        { items: { soda: 2, box: 1 },     total:  3, payment: 'especes', time: '11:10' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'carte',   time: '11:30' },
        { items: { vin: 2 },              total:  2, payment: 'especes', time: '11:55' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '12:15' },
        { items: { soda: 3 },             total:  3, payment: 'carte',   time: '12:40' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '13:00' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'especes', time: '13:30' },
        { items: { vin: 1, box: 1 },      total:  2, payment: 'especes', time: '14:00' },
        { items: { biere: 2 },            total:  4, payment: 'carte',   time: '14:25' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '14:55' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '15:20' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'especes', time: '15:50' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '16:15' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '16:45' },
      ],
      mouvements: [
        { id: 'op-1', time: '09:00', label: 'Fond de caisse', amount: 50 },
        { id: 'op-2', time: '17:00', label: 'Sortie caisse',  amount: -30 },
      ],
      cashCounted: 86,   // écart −2 €
    },

    // ── Vendredi 16 mai – soirée entraînement, peu de mouvements, pas de comptage ──
    {
      dayKey: '2026-05-16', date: 'Vendredi 16 mai 2026',
      orderCount: 9, dayTotal: 22, especes: 16, carte: 6,
      _base: 0, _attendu: 16,
      products: {
        biere: { name: 'Bière',      qty: 7,  total: 14 },
        vin:   { name: 'Vin',        qty: 2,  total:  2 },
        soda:  { name: 'Soda / Eau', qty: 4,  total:  4 },
        box:   { name: 'Box',        qty: 2,  total:  2 },
      },
      orders: [
        { items: { biere: 1 },            total: 2,  payment: 'especes', time: '18:10' },
        { items: { soda: 2, box: 1 },     total: 3,  payment: 'carte',   time: '18:35' },
        { items: { biere: 2 },            total: 4,  payment: 'especes', time: '19:00' },
        { items: { vin: 1, soda: 1 },     total: 2,  payment: 'carte',   time: '19:25' },
        { items: { biere: 1 },            total: 2,  payment: 'especes', time: '19:50' },
        { items: { box: 1 },              total: 1,  payment: 'especes', time: '20:10' },
        { items: { biere: 2 },            total: 4,  payment: 'especes', time: '20:30' },
        { items: { vin: 1 },              total: 1,  payment: 'especes', time: '20:55' },
        { items: { soda: 1 },             total: 1,  payment: 'carte',   time: '21:20' },
      ],
      mouvements: [],
    },

    // ── Dimanche 17 mai – clôture automatique (oubli), pas de comptage ──────
    {
      dayKey: '2026-05-17', date: 'Dimanche 17 mai 2026',
      orderCount: 16, dayTotal: 47, especes: 33, carte: 14,
      _base: 50, _attendu: 83,
      products: {
        biere: { name: 'Bière',      qty: 16, total: 32 },
        vin:   { name: 'Vin',        qty:  5, total:  5 },
        soda:  { name: 'Soda / Eau', qty:  7, total:  7 },
        box:   { name: 'Box',        qty:  3, total:  3 },
      },
      orders: [
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '10:10' },
        { items: { soda: 1, box: 1 },     total:  2, payment: 'especes', time: '10:35' },
        { items: { biere: 3 },            total:  6, payment: 'carte',   time: '11:00' },
        { items: { vin: 2 },              total:  2, payment: 'especes', time: '11:25' },
        { items: { biere: 2, soda: 2 },   total:  6, payment: 'especes', time: '11:50' },
        { items: { biere: 1 },            total:  2, payment: 'carte',   time: '12:15' },
        { items: { soda: 3, box: 1 },     total:  4, payment: 'especes', time: '12:40' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'especes', time: '13:05' },
        { items: { biere: 1 },            total:  2, payment: 'carte',   time: '13:30' },
        { items: { vin: 1 },              total:  1, payment: 'especes', time: '14:00' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '14:25' },
        { items: { box: 1, soda: 1 },     total:  2, payment: 'carte',   time: '14:50' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '15:15' },
        { items: { vin: 1, biere: 1 },    total:  3, payment: 'especes', time: '15:40' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '16:10' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '16:35' },
      ],
      mouvements: [
        { id: 'op-1', time: '09:30', label: 'Fond de caisse', amount: 50 },
      ],
      autoClosed: true,
    },

    // ── Samedi 24 mai – journée correcte, comptage avec écart +8 € ───────────
    {
      dayKey: '2026-05-24', date: 'Samedi 24 mai 2026',
      orderCount: 22, dayTotal: 68, especes: 50, carte: 18,
      _base: 50, _attendu: 82,
      products: {
        biere: { name: 'Bière',      qty: 22, total: 44 },
        vin:   { name: 'Vin',        qty:  8, total:  8 },
        soda:  { name: 'Soda / Eau', qty: 12, total: 12 },
        box:   { name: 'Box',        qty:  4, total:  4 },
      },
      orders: [
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '09:30' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '10:00' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'carte',   time: '10:20' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '10:45' },
        { items: { biere: 1, soda: 1 },   total:  3, payment: 'carte',   time: '11:05' },
        { items: { vin: 2, soda: 1 },     total:  3, payment: 'especes', time: '11:25' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'especes', time: '11:50' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '12:10' },
        { items: { biere: 2 },            total:  4, payment: 'carte',   time: '12:30' },
        { items: { biere: 3, box: 1 },    total:  7, payment: 'especes', time: '12:55' },
        { items: { vin: 1 },              total:  1, payment: 'especes', time: '13:20' },
        { items: { biere: 2, vin: 2 },    total:  6, payment: 'especes', time: '13:45' },
        { items: { soda: 3 },             total:  3, payment: 'carte',   time: '14:05' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '14:30' },
        { items: { box: 2, soda: 1 },     total:  3, payment: 'carte',   time: '14:55' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '15:20' },
        { items: { vin: 2 },              total:  2, payment: 'especes', time: '15:45' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'especes', time: '16:10' },
        { items: { biere: 1 },            total:  2, payment: 'carte',   time: '16:35' },
        { items: { soda: 1, box: 1 },     total:  2, payment: 'especes', time: '17:00' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '17:25' },
        { items: { vin: 1 },              total:  1, payment: 'especes', time: '17:50' },
      ],
      mouvements: [
        { id: 'op-1', time: '09:00', label: 'Fond de caisse',  amount:  50 },
        { id: 'op-2', time: '10:15', label: 'Achat glaçons',   amount: -12 },
        { id: 'op-3', time: '17:30', label: 'Sortie caisse',   amount: -36 },
      ],
      cashCounted: 90,   // écart +8 €
    },

    // ── Dimanche 25 mai – gros tournoi, appoint monnaie, comptage exact ──────
    {
      dayKey: '2026-05-25', date: 'Dimanche 25 mai 2026',
      orderCount: 52, dayTotal: 172, especes: 126, carte: 46,
      _base: 50, _attendu: 146,
      products: {
        biere: { name: 'Bière',      qty: 62, total: 124 },
        vin:   { name: 'Vin',        qty: 16, total:  16 },
        soda:  { name: 'Soda / Eau', qty: 20, total:  20 },
        box:   { name: 'Box',        qty: 12, total:  12 },
      },
      orders: [
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '09:00' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '09:12' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '09:25' },
        { items: { vin: 1, box: 1 },      total:  2, payment: 'especes', time: '09:38' },
        { items: { biere: 4 },            total:  8, payment: 'especes', time: '09:50' },
        { items: { soda: 3, box: 2 },     total:  5, payment: 'carte',   time: '10:05' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'especes', time: '10:18' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '10:30' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '10:42' },
        { items: { biere: 2, box: 2 },    total:  6, payment: 'carte',   time: '10:55' },
        { items: { vin: 2 },              total:  2, payment: 'especes', time: '11:08' },
        { items: { biere: 4, soda: 1 },   total:  9, payment: 'especes', time: '11:20' },
        { items: { biere: 2 },            total:  4, payment: 'carte',   time: '11:32' },
        { items: { soda: 2, box: 1 },     total:  3, payment: 'especes', time: '11:45' },
        { items: { biere: 3, vin: 1 },    total:  7, payment: 'especes', time: '11:58' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '12:10' },
        { items: { vin: 2, soda: 2 },     total:  4, payment: 'carte',   time: '12:22' },
        { items: { biere: 4 },            total:  8, payment: 'especes', time: '12:35' },
        { items: { box: 3 },              total:  3, payment: 'especes', time: '12:45' },
        { items: { biere: 3, soda: 1 },   total:  7, payment: 'especes', time: '12:58' },
        { items: { biere: 2 },            total:  4, payment: 'carte',   time: '13:10' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '13:22' },
        { items: { biere: 3, vin: 1 },    total:  7, payment: 'especes', time: '13:35' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '13:48' },
        { items: { vin: 1, box: 1 },      total:  2, payment: 'carte',   time: '14:00' },
        { items: { biere: 4 },            total:  8, payment: 'especes', time: '14:12' },
        { items: { soda: 3 },             total:  3, payment: 'especes', time: '14:25' },
        { items: { biere: 2, vin: 2 },    total:  6, payment: 'especes', time: '14:38' },
        { items: { biere: 3 },            total:  6, payment: 'carte',   time: '14:50' },
        { items: { box: 2, soda: 1 },     total:  3, payment: 'especes', time: '15:02' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'especes', time: '15:15' },
        { items: { vin: 2 },              total:  2, payment: 'carte',   time: '15:28' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '15:40' },
        { items: { soda: 2, box: 1 },     total:  3, payment: 'especes', time: '15:52' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '16:05' },
        { items: { biere: 3, vin: 1 },    total:  7, payment: 'carte',   time: '16:18' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '16:30' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '16:42' },
        { items: { vin: 1, box: 1 },      total:  2, payment: 'especes', time: '16:55' },
        { items: { biere: 4 },            total:  8, payment: 'especes', time: '17:05' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'carte',   time: '17:18' },
        { items: { soda: 2 },             total:  2, payment: 'especes', time: '17:30' },
        { items: { biere: 3 },            total:  6, payment: 'especes', time: '17:42' },
        { items: { box: 1 },              total:  1, payment: 'especes', time: '17:55' },
        { items: { biere: 2, vin: 1 },    total:  5, payment: 'especes', time: '18:05' },
        { items: { biere: 1 },            total:  2, payment: 'carte',   time: '18:18' },
        { items: { soda: 1 },             total:  1, payment: 'especes', time: '18:30' },
        { items: { biere: 2 },            total:  4, payment: 'especes', time: '18:42' },
        { items: { biere: 3, box: 1 },    total:  7, payment: 'especes', time: '18:55' },
        { items: { vin: 1 },              total:  1, payment: 'especes', time: '19:08' },
        { items: { biere: 2, soda: 1 },   total:  5, payment: 'carte',   time: '19:20' },
        { items: { biere: 1 },            total:  2, payment: 'especes', time: '19:35' },
      ],
      mouvements: [
        { id: 'op-1', time: '08:30', label: 'Fond de caisse',  amount:  50 },
        { id: 'op-2', time: '09:30', label: 'Achat glaçons',   amount: -14 },
        { id: 'op-3', time: '12:00', label: 'Appoint monnaie', amount:  40 },
        { id: 'op-4', time: '18:30', label: 'Sortie caisse',   amount: -56 },
      ],
      cashCounted: 146,
    },

    // ── Vendredi 30 mai – fin de mois calme, pas de mouvements ───────────────
    {
      dayKey: '2026-05-30', date: 'Vendredi 30 mai 2026',
      orderCount: 6, dayTotal: 14, especes: 12, carte: 2,
      _base: 0, _attendu: 12,
      products: {
        biere: { name: 'Bière',      qty: 5, total: 10 },
        vin:   { name: 'Vin',        qty: 1, total:  1 },
        soda:  { name: 'Soda / Eau', qty: 2, total:  2 },
        box:   { name: 'Box',        qty: 1, total:  1 },
      },
      orders: [
        { items: { biere: 2 },            total: 4,  payment: 'especes', time: '18:30' },
        { items: { soda: 1, box: 1 },     total: 2,  payment: 'especes', time: '18:55' },
        { items: { biere: 1 },            total: 2,  payment: 'carte',   time: '19:20' },
        { items: { vin: 1 },              total: 1,  payment: 'especes', time: '19:50' },
        { items: { biere: 2 },            total: 4,  payment: 'especes', time: '20:15' },
        { items: { soda: 1 },             total: 1,  payment: 'especes', time: '20:40' },
      ],
      mouvements: [],
      cashCounted: 12,
    },
  ],

  grandTotal:      537,
  grandEspeces:    398,
  grandCarte:      139,
  grandOrderCount: 134,
  grandProducts: {
    biere: { name: 'Bière',      qty: 206, total: 412 },
    vin:   { name: 'Vin',        qty:  58, total:  58 },
    soda:  { name: 'Soda / Eau', qty:  84, total:  84 },
    box:   { name: 'Box',        qty:  40, total:  40 },
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
