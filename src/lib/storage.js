import { db } from './db';

const DATA_KEY = 'v2';
const LICENSE_KEY = 'license';
const SESSION_KEY = 'session';
const ACCOUNTS_CACHE_KEY = 'accounts-cache';
const PRODUCTS_KEY = 'products';

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
    await db.state.bulkDelete([DATA_KEY, SESSION_KEY, ACCOUNTS_CACHE_KEY]);
  } catch {}
}

// ── Licence ───────────────────────────────────────────────────────────────────

export async function loadLicense() {
  try {
    const record = await db.state.get(LICENSE_KEY);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveLicense(token) {
  try {
    await db.state.put({ key: LICENSE_KEY, data: token });
  } catch (e) {
    console.warn('[storage] saveLicense failed', e);
  }
}

// ── Session utilisateur ───────────────────────────────────────────────────────

export async function loadSession() {
  try {
    const record = await db.state.get(SESSION_KEY);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveSession(token) {
  try {
    await db.state.put({ key: SESSION_KEY, data: token });
  } catch (e) {
    console.warn('[storage] saveSession failed', e);
  }
}

export async function deleteSession() {
  try {
    await db.state.delete(SESSION_KEY);
  } catch {}
}

// ── Cache des comptes (pour affichage hors-ligne) ─────────────────────────────

export async function loadAccountsCache() {
  try {
    const record = await db.state.get(ACCOUNTS_CACHE_KEY);
    return record?.data ?? [];
  } catch {
    return [];
  }
}

export async function saveAccountsCache(accounts) {
  try {
    await db.state.put({ key: ACCOUNTS_CACHE_KEY, data: accounts });
  } catch (e) {
    console.warn('[storage] saveAccountsCache failed', e);
  }
}

// ── Préférences UI (accent, taille texte…) ────────────────────────────────────

const TWEAKS_KEY = 'tweaks';

export async function loadTweaks() {
  try {
    const record = await db.state.get(TWEAKS_KEY);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveTweaks(tweaks) {
  try {
    await db.state.put({ key: TWEAKS_KEY, data: tweaks });
  } catch (e) {
    console.warn('[storage] saveTweaks failed', e);
  }
}

// ── Réglages (fond de caisse…) ────────────────────────────────────────────────

const SETTINGS_KEY = 'settings';

export async function loadSettings() {
  try {
    const record = await db.state.get(SETTINGS_KEY);
    return record?.data ?? { cashFloat: 0 };
  } catch {
    return { cashFloat: 0 };
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

// ── Utilitaires date ──────────────────────────────────────────────────────────

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(d) {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
