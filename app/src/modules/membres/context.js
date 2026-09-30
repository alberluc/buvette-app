import { createContext, useContext } from 'react';

export const MembresContext = createContext(null);

// { sessionToken, canEdit } — disponible sous <MembresProvider>
export function useMembres() {
  const ctx = useContext(MembresContext);
  if (!ctx) throw new Error('useMembres() doit être utilisé sous <MembresProvider>');
  return ctx;
}
