// Miroir de api/lib/permissions.js — niveaux d'accès à un module, du plus faible au plus fort.
export const LEVELS = ['user', 'admin'];

export const LEVEL_LABELS = { none: 'Aucun accès', user: 'Utilisateur', admin: 'Responsable' };

export function levelAtLeast(level, required) {
  return LEVELS.includes(level) && LEVELS.indexOf(level) >= LEVELS.indexOf(required);
}

// Utilisateur courant à partir du payload du token de session.
// Les sessions émises avant l'introduction des droits par module n'ont pas de champ `permissions` :
// même repli que l'API (admin → tout, bénévole → accès simple aux modules de la licence).
export function userFromSession(p) {
  const permissions = p.permissions ?? Object.fromEntries(
    (p.modules ?? ['buvette']).map(m => [m, p.role === 'admin' ? 'admin' : 'user'])
  );
  return { id: p.accountId, name: p.name, role: p.role, permissions };
}
