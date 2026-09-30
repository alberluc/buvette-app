import { createContext, useContext } from 'react';

export const BuvetteContext = createContext(null);

// État et actions du module buvette — disponible sous <BuvetteProvider>
export function useBuvette() {
  const ctx = useContext(BuvetteContext);
  if (!ctx) throw new Error('useBuvette() doit être utilisé sous <BuvetteProvider>');
  return ctx;
}
