export const DEFAULT_PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2, emoji: '🍺', color: '#C99A3B' },
  { id: 'vin',   name: 'Vin',        price: 1, emoji: '🍷', color: '#8E2A3A' },
  { id: 'soda',  name: 'Soda / Eau', price: 1, emoji: '🥤', color: '#2F6BBB' },
  { id: 'box',   name: 'Box',        price: 1, emoji: '🍿', color: '#5E4632' },
];

export function fmtEUR(n) {
  const s = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  return s + ' €';
}

// Calcule le montant estimé en caisse espèces à partir du fond de caisse,
// des journées archivées non encore comptées, et de la journée en cours.
export function estimatedCash(cashFloat, archived, dayEspeces, dayMouvements) {
  let base = cashFloat ?? 0;
  let report = 0;
  for (const a of (archived || [])) {
    if (a.cashCounted !== null) { base = a.cashCounted; report = 0; break; }
    report += a.especes + (a.mouvements || []).reduce((s, m) => s + m.amount, 0);
  }
  const opsTotal = (dayMouvements || []).reduce((s, m) => s + m.amount, 0);
  return base + report + dayEspeces + opsTotal;
}

export function summarize(orders, products) {
  const out = { total: 0, especes: 0, carte: 0, count: orders.length, products: {} };
  for (const p of products) out.products[p.id] = { qty: 0, total: 0 };
  for (const o of orders) {
    out.total += o.total;
    if (o.payment === 'especes') out.especes += o.total;
    else out.carte += o.total;
    for (const [pid, q] of o.items) {
      if (!out.products[pid]) out.products[pid] = { qty: 0, total: 0 };
      const p = products.find(x => x.id === pid);
      const price = p ? p.price : 0;
      out.products[pid].qty += q;
      out.products[pid].total += price * q;
    }
  }
  return out;
}
