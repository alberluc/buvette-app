import { db } from '../../../lib/db';

// Clés IndexedDB du module buvette (table `state` partagée avec le socle).
// Ne pas renommer : les tablettes déjà installées ont leurs données sous ces clés.
const DATA_KEY = 'v2';
const PRODUCTS_KEY = 'products';
const SETTINGS_KEY = 'settings';

// ── Données journée ───────────────────────────────────────────────────────────

export async function load() {
  try {
    const record = await db.state.get(DATA_KEY);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function save(state) {
  try {
    await db.state.put({ key: DATA_KEY, data: state });
  } catch (e) {
    console.warn('[storage] save failed', e);
  }
}

export async function reset() {
  try {
    await db.state.delete(DATA_KEY);
  } catch { /* IndexedDB indisponible : rien à effacer */ }
}

// ── Réglages (fond de caisse…) ────────────────────────────────────────────────

export const DEFAULT_OP_SUGGESTIONS = {
  sortie: ['Achat glaçons', 'Petite caisse', 'Monnaie rendue'],
  entree: ['Appoint monnaie', 'Dépôt espèces', 'Remboursement'],
};

export async function loadSettings() {
  try {
    const record = await db.state.get(SETTINGS_KEY);
    const data = record?.data ?? {};
    return { cashFloat: 0, ...data, opSuggestions: data.opSuggestions ?? DEFAULT_OP_SUGGESTIONS };
  } catch {
    return { cashFloat: 0, opSuggestions: DEFAULT_OP_SUGGESTIONS };
  }
}

export async function saveSettings(settings) {
  try {
    await db.state.put({ key: SETTINGS_KEY, data: settings });
  } catch (e) {
    console.warn('[storage] saveSettings failed', e);
  }
}

// ── Produits ──────────────────────────────────────────────────────────────────

export async function loadProducts() {
  try {
    const record = await db.state.get(PRODUCTS_KEY);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveProducts(products) {
  try {
    await db.state.put({ key: PRODUCTS_KEY, data: products });
  } catch (e) {
    console.warn('[storage] saveProducts failed', e);
  }
}
