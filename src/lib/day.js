import { load, todayKey, formatDate } from './storage';
import { PRODUCTS, summarize } from './data';

export function makeEmptyToday() {
  const key = todayKey();
  return { dayKey: key, date: formatDate(key), label: '', orders: [], dayClosed: false, cashCounted: null };
}

export function archiveFromDay(day) {
  const s = summarize(day.orders);
  const products = {};
  for (const p of PRODUCTS) products[p.id] = s.products[p.id].qty;
  return {
    dayKey: day.dayKey, date: day.date, label: day.label || '',
    orderCount: s.count, total: s.total, especes: s.especes, carte: s.carte,
    cashCounted: day.dayClosed ? day.cashCounted : null,
    closed: true, autoClosed: !day.dayClosed, products,
  };
}

// Convertit un jour complet retourné par l'API en entrée d'historique résumée
export function archiveFromApiDay(day) {
  const s = summarize(day.orders);
  const products = {};
  for (const p of PRODUCTS) products[p.id] = s.products[p.id].qty;
  return {
    dayKey: day.dayKey, date: day.date, label: day.label || '',
    orderCount: s.count, total: s.total, especes: s.especes, carte: s.carte,
    cashCounted: day.cashCounted,
    closed: true, autoClosed: day.autoClosed, products,
  };
}

export async function loadInitialState() {
  const saved = await load();
  const key = todayKey();

  if (!saved) return { day: makeEmptyToday(), archived: [], justAutoClosed: null };

  const archived = saved.archived || [];

  if (saved.day && saved.day.dayKey !== key) {
    const archiveEntry = archiveFromDay(saved.day);
    return {
      day: makeEmptyToday(),
      archived: [archiveEntry, ...archived],
      justAutoClosed: !saved.day.dayClosed ? archiveEntry : null,
    };
  }

  return { day: saved.day || makeEmptyToday(), archived, justAutoClosed: null };
}
