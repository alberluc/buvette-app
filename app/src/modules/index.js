import buvette from './buvette';
import membres from './membres';

// Registre des modules fonctionnels. Le socle (App.jsx) n'importe rien d'autre de modules/.
//
// Contrat d'un module :
//   id            identifiant, doit correspondre à `licenses.modules` côté API
//   label         nom affiché
//   description   phrase courte affichée sous le nom sur la tuile de l'accueil
//   Icon          icône de la tuile de l'accueil (composant Icon.* de components/UI)
//   color         couleur d'accent de la tuile ({ fg, bg } : variables CSS, ex. var(--amber))
//   defaultLevel? niveau proposé pour un nouveau compte bénévole ('user' | 'admin') ;
//                 absent = aucun accès par défaut (ex : module manipulant des données personnelles)
//   Provider      composant ({ sessionToken, currentUser, onApiStatus, children }) monté
//                 quand l'utilisateur connecté a accès au module ; peut rendre null tant qu'il charge
//   tabs          [{ path, label, Icon, screenLabel, Screen }] — onglets et routes du module ;
//                 le premier onglet est la porte d'entrée depuis l'accueil. La barre du bas
//                 n'affiche que les onglets du module en cours (précédés du bouton Accueil).
//   Overlays?     composant rendu dans la zone principale (toasts, modales)
//   DevTools?     composant rendu dans le panneau Tweaks
//   SettingsMain? cartes de réglages, colonne principale ({ isAdmin } = responsable du module)
//   SettingsSide? cartes de réglages, colonne admin ({ isAdmin } = responsable du module)
//   reset?        async () => efface les données locales du module
export const MODULES = [buvette, membres];

// Les tokens émis avant l'introduction des modules n'ont pas de champ `modules`
export const DEFAULT_MODULE_IDS = ['buvette'];

// Modules activés sur la licence (indépendamment des droits de l'utilisateur).
// Lus dans la session (user.modules) et non dans le token de licence : la session est ré-émise
// à chaque ouverture de l'app, le token de licence peut dater de 30 jours.
export function enabledModules(user) {
  const ids = user?.modules ?? DEFAULT_MODULE_IDS;
  return MODULES.filter(m => ids.includes(m.id));
}

// Niveau de l'utilisateur sur un module : 'user' | 'admin' | undefined (pas d'accès)
export function moduleLevel(user, moduleId) {
  return user?.permissions?.[moduleId];
}

// Modules activés sur la licence ET accessibles à l'utilisateur
export function accessibleModules(user) {
  return enabledModules(user).filter(m => moduleLevel(user, m.id));
}

// Module auquel appartient une route (null pour l'accueil, les réglages…)
export function moduleForPath(modules, pathname) {
  return modules.find(m => m.tabs.some(t => t.path === pathname)) ?? null;
}
