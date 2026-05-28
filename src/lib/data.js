export const PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2, emoji: '🍺', color: '#C99A3B' },
  { id: 'vin',   name: 'Vin',        price: 1, emoji: '🍷', color: '#8E2A3A' },
  { id: 'soda',  name: 'Soda / Eau', price: 1, emoji: '🥤', color: '#2F6BBB' },
  { id: 'box',   name: 'Box',        price: 1, emoji: '🍿', color: '#5E4632' },
];


export function fmtEUR(n) {
  const s = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  return s + ' €';
}

export function summarize(orders) {
  const out = { total: 0, especes: 0, carte: 0, count: orders.length, products: {} };
  for (const p of PRODUCTS) out.products[p.id] = { qty: 0, total: 0 };
  for (const o of orders) {
    out.total += o.total;
    if (o.payment === 'especes') out.especes += o.total;
    else out.carte += o.total;
    for (const [pid, q] of o.items) {
      const p = PRODUCTS.find(x => x.id === pid);
      out.products[pid].qty += q;
      out.products[pid].total += p.price * q;
    }
  }
  return out;
}
