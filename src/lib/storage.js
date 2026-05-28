import { db } from './db';

const KEY = 'v2';
const PIN_KEY = 'pin';
export const DEFAULT_PIN = '1234';

export async function load() {
  try {
    const record = await db.state.get(KEY);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function save(state) {
  try {
    await db.state.put({ key: KEY, data: state });
  } catch (e) {
    console.warn('[storage] save failed', e);
  }
}

export async function reset() {
  try {
    await db.state.bulkDelete([KEY, PIN_KEY]);
  } catch {}
}

export async function loadPIN() {
  try {
    const record = await db.state.get(PIN_KEY);
    return record?.data ?? null; // null = jamais modifié, code par défaut
  } catch {
    return null;
  }
}

export async function savePIN(pin) {
  try {
    await db.state.put({ key: PIN_KEY, data: pin });
  } catch (e) {
    console.warn('[storage] savePIN failed', e);
  }
}

const LICENSE_KEY = 'license';

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
