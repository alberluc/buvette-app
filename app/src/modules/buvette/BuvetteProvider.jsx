import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pushSettings, fetchSettings } from '../../lib/api';
import { BuvetteContext } from './context';
import { BUVETTE_PATHS } from './paths';
import { save, loadProducts, saveProducts, loadSettings, saveSettings, DEFAULT_OP_SUGGESTIONS } from './lib/storage';
import { fetchCurrentDay, fetchDays, pushOrder, deleteOrder, updateDay, fetchProducts, pushProducts, pushOperation, deleteOperation } from './lib/api';
import { DEFAULT_PRODUCTS } from './lib/data';
import { makeEmptyToday, makeEmptyDay, archiveFromDay, archiveFromApiDay, loadInitialState } from './lib/day';

// Monté par le shell uniquement quand un utilisateur est connecté.
// Porte tout l'état de la caisse : journée, archives, catalogue, réglages, sync hors-ligne.
export function BuvetteProvider({ sessionToken, currentUser, onApiStatus, children }) {
  const navigate = useNavigate();

  // ── Données ───────────────────────────────────────────────────────────────
  const [loaded, setLoaded] = useState(false);
  const [day, setDay] = useState(null);
  const [archived, setArchived] = useState([]);
  const [autoCloseNotice, setAutoCloseNotice] = useState(null);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [cashFloat, setCashFloat] = useState(0);
  const [opSuggestions, setOpSuggestions] = useState({ ...DEFAULT_OP_SUGGESTIONS });
  const [pendingClose, setPendingClose] = useState(null);

  // ── Sync ──────────────────────────────────────────────────────────────────
  const wasOfflineRef = useRef(false);
  // Ref miroir de `day` — accessible dans les closures de setInterval sans dépendance
  const dayRef = useRef(null);
  useEffect(() => { dayRef.current = day; }, [day]);
  // IDs des commandes/opérations dont le push est en cours (évite les doubles envois)
  const pushingRef = useRef(new Set());

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [initial, savedProducts, savedSettings] = await Promise.all([
        loadInitialState(), loadProducts(), loadSettings(),
      ]);
      setCashFloat(savedSettings.cashFloat ?? 0);
      setOpSuggestions(savedSettings.opSuggestions ?? DEFAULT_OP_SUGGESTIONS);

      const resolvedProducts = savedProducts || DEFAULT_PRODUCTS;
      setProducts(resolvedProducts);

      setDay(initial.day);
      if (initial.justAutoClosed) {
        const archiveEntry = archiveFromDay(initial.justAutoClosed, resolvedProducts);
        setArchived([archiveEntry, ...(initial.archived || [])]);
        if (!initial.justAutoClosed.dayClosed) setAutoCloseNotice(archiveEntry);
      } else {
        setArchived(initial.archived);
      }

      if (sessionToken) {
        try {
          const [apiDay, apiDays, apiProducts, apiSettings] = await Promise.all([
            fetchCurrentDay(sessionToken),
            fetchDays(sessionToken),
            fetchProducts(sessionToken).catch(() => null),
            fetchSettings(sessionToken).catch(() => null),
          ]);
          const finalProducts = apiProducts || resolvedProducts;
          setProducts(finalProducts);
          saveProducts(finalProducts);
          if (apiSettings) {
            setCashFloat(apiSettings.cashFloat ?? 0);
            saveSettings({ ...savedSettings, cashFloat: apiSettings.cashFloat ?? 0 });
          }
          setDay({ mouvements: [], ...apiDay });
          setArchived(apiDays.map(d => archiveFromApiDay(d, finalProducts)));
          setAutoCloseNotice(null);
        } catch {
          // Fallback silencieux : l'état local est déjà affiché
        }
      }

      setLoaded(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persistance ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loaded && day) save({ day, archived });
  }, [day, archived, loaded]);

  // ── Auto-archive à minuit ─────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !day) return;
    const id = setInterval(() => {
      const today = new Date();
      const key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      if (day.dayKey !== key && day.dayKey < key) {
        const entry = archiveFromDay(day, products);
        setArchived(prev => [entry, ...prev]);
        if (!day.dayClosed) setAutoCloseNotice(entry);
        if (sessionToken) {
          updateDay(sessionToken, day.dayKey, { day_closed: true, auto_closed: true }).catch(() => {});
          fetchCurrentDay(sessionToken).then(apiDay => setDay(apiDay)).catch(() => setDay(makeEmptyToday()));
        } else {
          setDay(makeEmptyToday());
        }
      }
    }, 60000);
    return () => clearInterval(id);
  }, [day, loaded, sessionToken, products]);

  // ── Polling (sync inter-tablettes, toutes les 10 s) ──────────────────────
  useEffect(() => {
    if (!loaded || !sessionToken) return;

    async function poll() {
      if (document.hidden) return; // pause si onglet/app en arrière-plan
      try {
        const apiDay = await fetchCurrentDay(sessionToken);
        const wasOffline = wasOfflineRef.current;
        wasOfflineRef.current = false;
        onApiStatus?.(true);
        if (wasOffline) {
          const [apiDays, apiProducts] = await Promise.all([
            fetchDays(sessionToken),
            fetchProducts(sessionToken).catch(() => null),
          ]);
          if (apiProducts) {
            setProducts(apiProducts);
            saveProducts(apiProducts);
          }
          setArchived(apiDays.map(d => archiveFromApiDay(d, apiProducts || products)));
        }
        setDay(prev => {
          if (!prev || apiDay.updatedAt === prev.updatedAt) return prev;
          if (prev.dayKey !== apiDay.dayKey) return prev;
          // Merge : réintègre les commandes/opérations locales pas encore confirmées par l'API
          const apiOrderIds = new Set(apiDay.orders.map(o => o.id));
          const apiMouvIds  = new Set((apiDay.mouvements || []).map(m => m.id));
          const pendingOrders = prev.orders.filter(o => o.id && !apiOrderIds.has(o.id));
          const pendingMouv   = (prev.mouvements || []).filter(m => m.id && !apiMouvIds.has(m.id));
          return {
            ...apiDay,
            orders:     pendingOrders.length ? [...apiDay.orders, ...pendingOrders] : apiDay.orders,
            mouvements: pendingMouv.length   ? [...(apiDay.mouvements || []), ...pendingMouv] : (apiDay.mouvements || []),
          };
        });

        // Retry : repousse les items locaux pas encore sur le serveur
        const localDay = dayRef.current;
        if (localDay && localDay.dayKey === apiDay.dayKey) {
          const apiOrderIds = new Set(apiDay.orders.map(o => o.id));
          for (const order of localDay.orders) {
            if (order.id && !apiOrderIds.has(order.id) && !pushingRef.current.has(order.id)) {
              pushingRef.current.add(order.id);
              pushOrder(sessionToken, localDay.dayKey, order)
                .then(() => pushingRef.current.delete(order.id))
                .catch(() => pushingRef.current.delete(order.id));
            }
          }
          const apiMouvIds = new Set((apiDay.mouvements || []).map(m => m.id));
          for (const mouv of (localDay.mouvements || [])) {
            if (mouv.id && !apiMouvIds.has(mouv.id) && !pushingRef.current.has(mouv.id)) {
              pushingRef.current.add(mouv.id);
              pushOperation(sessionToken, localDay.dayKey, mouv)
                .then(() => pushingRef.current.delete(mouv.id))
                .catch(() => pushingRef.current.delete(mouv.id));
            }
          }
        }
      } catch {
        wasOfflineRef.current = true;
        onApiStatus?.(false);
      }
    }

    const id = setInterval(poll, 10000);
    // Resync immédiat au retour au premier plan (rattrape les mises à jour manquées)
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loaded, sessionToken, products]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Journée ───────────────────────────────────────────────────────────────
  const addOrder = o => {
    const order = currentUser ? { ...o, by: currentUser.name } : o;
    setDay(d => ({ ...d, orders: [...d.orders, order] }));
    if (sessionToken) {
      pushingRef.current.add(order.id);
      pushOrder(sessionToken, day.dayKey, order)
        .then(() => pushingRef.current.delete(order.id))
        .catch(() => pushingRef.current.delete(order.id));
    }
  };
  const removeOrder = (order, orderIndex) => {
    setDay(d => ({ ...d, orders: d.orders.filter((_, i) => i !== orderIndex) }));
    if (sessionToken && order.id) deleteOrder(sessionToken, day.dayKey, order.id).catch(() => {});
  };
  const closeDay = cashCounted => {
    setDay(d => ({ ...d, dayClosed: true, cashCounted }));
    navigate(BUVETTE_PATHS.bilan);
    if (sessionToken) updateDay(sessionToken, day.dayKey, { day_closed: true, cash_counted: cashCounted }).catch(() => {});
  };
  const reopenDay = () => {
    setDay(d => ({ ...d, dayClosed: false }));
    if (sessionToken) updateDay(sessionToken, day.dayKey, { day_closed: false }).catch(() => {});
  };
  const requestCloseDay = cashCounted => setPendingClose({ cashCounted });
  const confirmClose = () => { closeDay(pendingClose.cashCounted); setPendingClose(null); };
  const cancelClose = () => setPendingClose(null);

  const simulateNextDay = () => {
    const entry = archiveFromDay(day, products);
    setArchived(prev => [entry, ...prev]);
    const [y, m, d] = day.dayKey.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    setDay(makeEmptyDay(nextKey));
    if (!day.dayClosed) setAutoCloseNotice(entry);
  };

  const addOperation = op => {
    setDay(d => ({ ...d, mouvements: [...(d.mouvements || []), op] }));
    if (sessionToken) {
      pushingRef.current.add(op.id);
      pushOperation(sessionToken, day.dayKey, op)
        .then(() => pushingRef.current.delete(op.id))
        .catch(() => pushingRef.current.delete(op.id));
    }
  };

  const removeOperation = id => {
    setDay(d => ({ ...d, mouvements: (d.mouvements || []).filter(op => op.id !== id) }));
    if (sessionToken) deleteOperation(sessionToken, day.dayKey, id).catch(() => {});
  };

  // ── Réglages ──────────────────────────────────────────────────────────────
  const updateCashFloat = val => {
    setCashFloat(val);
    saveSettings({ cashFloat: val, opSuggestions });
    if (sessionToken) pushSettings(sessionToken, { cashFloat: val }).catch(() => {});
  };

  // Libellés d'opération : stockés localement uniquement (pas de colonne côté API)
  const updateOpSuggestions = val => {
    setOpSuggestions(val);
    saveSettings({ cashFloat, opSuggestions: val });
  };

  const updateProducts = async newProducts => {
    setProducts(newProducts);
    saveProducts(newProducts);
    if (sessionToken) pushProducts(sessionToken, newProducts).catch(() => {});
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const dismissAutoCloseNotice = () => setAutoCloseNotice(null);
  const viewAutoCloseNotice = () => { navigate(BUVETTE_PATHS.historique); setAutoCloseNotice(null); };

  if (!loaded || !day) return null;

  const value = {
    sessionToken,
    day, archived, products, cashFloat, opSuggestions,
    addOrder, removeOrder, requestCloseDay, closeDay, reopenDay, simulateNextDay,
    addOperation, removeOperation,
    updateCashFloat, updateOpSuggestions, updateProducts,
    pendingClose, confirmClose, cancelClose,
    autoCloseNotice, dismissAutoCloseNotice, viewAutoCloseNotice,
  };

  return <BuvetteContext.Provider value={value}>{children}</BuvetteContext.Provider>;
}
