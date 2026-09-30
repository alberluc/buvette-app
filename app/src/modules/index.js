import buvette from './buvette';

// Registre des modules fonctionnels. Le socle (App.jsx) n'importe rien d'autre de modules/.
//
// Contrat d'un module :
//   id            identifiant, doit correspondre à `licenses.modules` côté API
//   label         nom affiché
//   Provider      composant ({ sessionToken, currentUser, onApiStatus, children }) monté
//                 quand un utilisateur est connecté ; peut rendre null tant qu'il charge
//   tabs          [{ path, label, Icon, screenLabel, Screen }] — onglets et routes du module
//   Overlays?     composant rendu dans la zone principale (toasts, modales)
//   DevTools?     composant rendu dans le panneau Tweaks
//   SettingsMain? cartes de réglages, colonne principale ({ isAdmin })
//   SettingsSide? cartes de réglages, colonne admin ({ isAdmin })
//   reset?        async () => efface les données locales du module
export const MODULES = [buvette];

// Les tokens émis avant l'introduction des modules n'ont pas de champ `modules`
export const DEFAULT_MODULE_IDS = ['buvette'];

export function enabledModules(licenseInfo) {
  const ids = licenseInfo?.modules ?? DEFAULT_MODULE_IDS;
  return MODULES.filter(m => ids.includes(m.id));
}
