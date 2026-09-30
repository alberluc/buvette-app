export function fmtEUR(n) {
  const s = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  return s + ' €';
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(d) {
  // Pour les dates ISO complètes (ex: "2026-12-31T00:00:00.000Z"), on parse directement.
  // Pour les dates courtes "YYYY-MM-DD", on ajoute T12:00:00 pour éviter un décalage UTC.
  const dt = new Date(typeof d === 'string' && !d.includes('T') ? d + 'T12:00:00' : d);
  return dt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
