import { db } from './db';

// Données du socle uniquement. Chaque module gère ses propres clés
// (ex : modules/buvette/lib/storage.js) dans la même table `state`.

const LICENSE_KEY = 'license';
const SESSION_KEY = 'session';
const ACCOUNTS_CACHE_KEY = 'accounts-cache';

export async function reset() {
  try {
    await db.state.bulkDelete([SESSION_KEY, ACCOUNTS_CACHE_KEY]);
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
