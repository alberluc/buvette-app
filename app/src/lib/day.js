import { load, todayKey, formatDate } from './storage';
import { summarize } from './data';

export function makeEmptyToday() {
  const key = todayKey();
  return makeEmptyDay(key);
}

export function makeEmptyDay(key) {
  return { dayKey: key, date: formatDate(key), orders: [], mouvements: [], dayClosed: false, cashCounted: null };
}

export function archiveFromDay(day, products) {
  const s = summarize(day.orders, products);
  const archivedProducts = {};
  for (const p of products) archivedProducts[p.id] = s.products[p.id]?.qty ?? 0;
  return {
    dayKey: day.dayKey, date: day.date,
    orderCount: s.count, total: s.total, especes: s.especes, carte: s.carte,
    cashCounted: day.dayClosed ? day.cashCounted : null,
    mouvements: day.mouvements || [],
    closed: true, autoClosed: !day.dayClosed, products: archivedProducts,
  };
}

export function archiveFromApiDay(day, products) {
  const s = summarize(day.orders, products);
  const archivedProducts = {};
  for (const p of products) archivedProducts[p.id] = s.products[p.id]?.qty ?? 0;
  return {
    dayKey: day.dayKey, date: day.date,
    orderCount: s.count, total: s.total, especes: s.especes, carte: s.carte,
    cashCounted: day.autoClosed ? null : day.cashCounted,
    mouvements: day.mouvements || [],
    closed: true, autoClosed: day.autoClosed, products: archivedProducts,
  };
}

export async function loadInitialState() {
  const saved = await load();
  const key = todayKey();

  if (!saved) return { day: makeEmptyToday(), archived: [], justAutoClosed: null };

  const archived = saved.archived || [];

  if (saved.day && saved.day.dayKey !== key) {
    return {
      day: makeEmptyToday(),
      archived,
      justAutoClosed: saved.day,
    };
  }

  return { day: saved.day || makeEmptyToday(), archived, justAutoClosed: null };
}
