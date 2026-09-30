import { MembresContext } from './context';

// Volontairement sans état : les données personnelles sont chargées par l'écran à son ouverture
// et oubliées quand on le quitte (rien en mémoire sur les autres onglets, rien sur le disque).
// Ne bloque jamais le rendu du shell.
export function MembresProvider({ sessionToken, currentUser, children }) {
  // 'user' = consultation, 'admin' (responsable) = création, modification, suppression, export
  const value = { sessionToken, canEdit: currentUser?.permissions?.membres === 'admin' };
  return <MembresContext.Provider value={value}>{children}</MembresContext.Provider>;
}
