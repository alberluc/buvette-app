// Modules fonctionnels activables par licence.
// Ajouter ici l'identifiant d'un nouveau module avant de l'exposer.
export const MODULES = ['buvette', 'membres']

// Modules attribués aux licences créées sans précision, et aux tokens émis
// avant l'introduction des modules (qui n'ont pas de champ `modules`).
export const DEFAULT_MODULES = ['buvette']

export function isValidModuleList(modules) {
  return Array.isArray(modules) && modules.every(m => MODULES.includes(m))
}
