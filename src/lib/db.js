import Dexie from 'dexie';

export const db = new Dexie('buvette');
db.version(1).stores({ state: 'key' });
