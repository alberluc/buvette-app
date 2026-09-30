// Miroir de api/lib/permissions.js — niveaux d'accès à un module, du plus faible au plus fort.
export const LEVELS = ['user', 'admin'];

export const LEVEL_LABELS = { none: 'Aucun accès', user: 'Utilisateur', admin: 'Responsable' };

export function levelAtLeast(level, required) {
  return LEVELS.includes(level) && LEVELS.indexOf(level) >= LEVELS.indexOf(required);
}

// Utilisateur courant à partir du payload du token de session.
// `modules` = modules activés sur la licence, tels que connus au moment où la session a été émise
// (rafraîchie à chaque ouverture de l'app via /auth/refresh — plus à jour que le token de licence).
// Les sessions émises avant l'introduction des droits par module n'ont pas de champ `permissions` :
// même repli que l'API (admin → tout, bénévole → accès simple aux modules de la licence).
export function userFromSession(p) {
  const modules = p.modules ?? ['buvette'];
  const permissions = p.permissions ?? Object.fromEntries(
    modules.map(m => [m, p.role === 'admin' ? 'admin' : 'user'])
  );
  return { id: p.accountId, name: p.name, role: p.role, modules, permissions };
}
