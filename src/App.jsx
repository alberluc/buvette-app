import { useState, useEffect, useRef } from 'react';
import { StatusBar, TabBar, Icon } from './components/UI';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton } from './components/TweaksPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { LoginScreen, ChangePasswordModal, AccountManager } from './components/LoginScreen';
import { LicenseScreen } from './components/LicenseScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { save, reset, loadLicense, saveLicense, loadSession, saveSession, deleteSession, loadAccountsCache, saveAccountsCache, loadProducts, saveProducts } from './lib/storage';
import { parseJwt, refreshLicense, fetchAccounts, fetchCurrentDay, fetchDays, pushOrder, deleteOrder, updateDay, fetchProducts, pushProducts } from './lib/api';
import { fmtEUR, DEFAULT_PRODUCTS } from './lib/data';
import { TWEAK_DEFAULTS, ACCENT_PALETTES, ACCENT_SWATCHES, TEXT_SCALES } from './lib/theme';
import { makeEmptyToday, archiveFromDay, archiveFromApiDay, loadInitialState } from './lib/day';

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    const p = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.club;
    root.style.setProperty('--club', p.club);
    root.style.setProperty('--club-deep', p.clubDeep);
    root.style.setProperty('--club-soft', p.clubSoft);
    root.style.fontSize = (16 * (TEXT_SCALES[t.textSize] || 1)) + 'px';
  }, [t.accent, t.textSize]);

  const [tab, setTab] = useState('orders');

  // ── Données ───────────────────────────────────────────────────────────────
  const [loaded, setLoaded] = useState(false);
  const [day, setDay] = useState(null);
  const [archived, setArchived] = useState([]);
  const [autoCloseNotice, setAutoCloseNotice] = useState(null);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);

  // ── Licence ───────────────────────────────────────────────────────────────
  const [licenseStatus, setLicenseStatus] = useState('checking');
  const [licenseToken, setLicenseToken] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [cachedAccounts, setCachedAccounts] = useState([]);
  const [sessionToken, setSessionToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Sync ──────────────────────────────────────────────────────────────────
  const [apiOnline, setApiOnline] = useState(true);
  const wasOfflineRef = useRef(false);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [pendingClose, setPendingClose] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAccountManager, setShowAccountManager] = useState(false);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [initial, licToken, sesToken, accsCache, savedProducts] = await Promise.all([
        loadInitialState(), loadLicense(), loadSession(), loadAccountsCache(), loadProducts(),
      ]);

      const resolvedProducts = savedProducts || DEFAULT_PRODUCTS;
      setProducts(resolvedProducts);

      // État local en premier (affiché immédiatement si l'API est lente)
      setDay(initial.day);
      if (initial.justAutoClosed) {
        const archiveEntry = archiveFromDay(initial.justAutoClosed, resolvedProducts);
        setArchived([archiveEntry, ...(initial.archived || [])]);
        if (!initial.justAutoClosed.dayClosed) setAutoCloseNotice(archiveEntry);
      } else {
        setArchived(initial.archived);
      }
      setCachedAccounts(accsCache);
      applyLicenseToken(licToken);

      let validSession = null;
      if (sesToken) {
        const p = parseJwt(sesToken);
        if (p && p.exp > Date.now() / 1000) {
          validSession = sesToken;
          setSessionToken(sesToken);
          setCurrentUser({ id: p.accountId, name: p.name, role: p.role });
        }
      }

      // Remplace l'état local par les données API (source de vérité partagée)
      if (validSession) {
        try {
          const [apiDay, apiDays, apiProducts] = await Promise.all([
            fetchCurrentDay(validSession),
            fetchDays(validSession),
            fetchProducts(validSession).catch(() => null),
          ]);
          const finalProducts = apiProducts || resolvedProducts;
          setProducts(finalProducts);
          saveProducts(finalProducts);
          setDay(apiDay);
          setArchived(apiDays.map(d => archiveFromApiDay(d, finalProducts)));
          setAutoCloseNotice(null);
        } catch {
          // Fallback silencieux : l'état local est déjà affiché
        }
      }

      setLoaded(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function applyLicenseToken(token) {
    if (!token) { setLicenseStatus('missing'); return; }
    const p = parseJwt(token);
    if (!p) { setLicenseStatus('missing'); return; }
    if (p.exp < Date.now() / 1000) { setLicenseToken(token); setLicenseStatus('expired'); return; }
    setLicenseToken(token);
    setLicenseInfo({ club: p.club, plan: p.plan, licenseExpires: p.licenseExpires });
    setLicenseStatus('valid');
  }

  // Refresh silencieux de la licence (< 3 jours restants)
  useEffect(() => {
    if (licenseStatus !== 'valid' || !licenseToken) return;
    const p = parseJwt(licenseToken);
    if (!p || p.exp - Date.now() / 1000 > 3 * 24 * 3600) return;
    refreshLicense(licenseToken)
      .then(data => { saveLicense(data.token); applyLicenseToken(data.token); })
      .catch(() => {});
  }, [licenseStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch des comptes après validation de la licence
  useEffect(() => {
    if (licenseStatus !== 'valid' || !licenseToken) return;
    fetchAccounts(licenseToken)
      .then(accs => { setCachedAccounts(accs); saveAccountsCache(accs); })
      .catch(() => {});
  }, [licenseStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (day.dayKey !== key) {
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
  }, [day, loaded, sessionToken, products]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling (sync inter-tablettes, toutes les 10 s) ──────────────────────
  useEffect(() => {
    if (!loaded || !sessionToken) return;
    const id = setInterval(async () => {
      try {
        const apiDay = await fetchCurrentDay(sessionToken);
        const wasOffline = wasOfflineRef.current;
        wasOfflineRef.current = false;
        setApiOnline(true);
        if (wasOffline) {
          // Re-sync complète après reconnexion
          const [apiDays, apiProducts] = await Promise.all([
            fetchDays(sessionToken),
            fetchProducts(sessionToken).catch(() => null),
          ]);
          if (apiProducts) {
            setProducts(apiProducts);
            saveProducts(apiProducts);
          }
          setArchived(prev => apiDays.map(d => archiveFromApiDay(d, apiProducts || products)));
        }
        setDay(prev => {
          if (!prev || apiDay.updatedAt === prev.updatedAt) return prev;
          return apiDay;
        });
      } catch {
        wasOfflineRef.current = true;
        setApiOnline(false);
      }
    }, 10000);
    return () => clearInterval(id);
  }, [loaded, sessionToken, products]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Journée ───────────────────────────────────────────────────────────────
  const addOrder = o => {
    setDay(d => ({ ...d, orders: [...d.orders, o] }));
    if (sessionToken) pushOrder(sessionToken, day.dayKey, o).catch(() => {});
  };
  const removeOrder = (order, orderIndex) => {
    setDay(d => ({ ...d, orders: d.orders.filter((_, i) => i !== orderIndex) }));
    if (sessionToken && order.id) deleteOrder(sessionToken, day.dayKey, order.id).catch(() => {});
  };
  const closeDay = cashCounted => {
    setDay(d => ({ ...d, dayClosed: true, cashCounted }));
    setTab('summary');
    if (sessionToken) updateDay(sessionToken, day.dayKey, { day_closed: true, cash_counted: cashCounted }).catch(() => {});
  };
  const reopenDay = () => {
    setDay(d => ({ ...d, dayClosed: false }));
    if (sessionToken) updateDay(sessionToken, day.dayKey, { day_closed: false }).catch(() => {});
  };
  const setCashCounted = v => setDay(d => ({ ...d, cashCounted: v }));
  const requestCloseDay = cashCounted => setPendingClose({ cashCounted });

  const simulateNextDay = () => {
    const entry = archiveFromDay(day, products);
    setArchived(prev => [entry, ...prev]);
    setDay(makeEmptyToday());
    if (!day.dayClosed) setAutoCloseNotice(entry);
  };

  const updateProducts = async newProducts => {
    setProducts(newProducts);
    saveProducts(newProducts);
    if (sessionToken) pushProducts(sessionToken, newProducts).catch(() => {});
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLoginSuccess = async sessionJWT => {
    await saveSession(sessionJWT);
    setSessionToken(sessionJWT);
    const p = parseJwt(sessionJWT);
    setCurrentUser({ id: p.accountId, name: p.name, role: p.role });
    try {
      const [apiDay, apiDays, apiProducts] = await Promise.all([
        fetchCurrentDay(sessionJWT),
        fetchDays(sessionJWT),
        fetchProducts(sessionJWT).catch(() => null),
      ]);
      const loginProducts = apiProducts || products;
      if (apiProducts) { setProducts(apiProducts); saveProducts(apiProducts); }
      setDay(apiDay);
      setArchived(apiDays.map(d => archiveFromApiDay(d, loginProducts)));
    } catch {}
  };

  const handleLogout = async () => {
    await deleteSession();
    setSessionToken(null);
    setCurrentUser(null);
  };

  const refreshCachedAccounts = () => {
    if (!licenseToken) return;
    fetchAccounts(licenseToken)
      .then(accs => { setCachedAccounts(accs); saveAccountsCache(accs); })
      .catch(() => {});
  };

  const handleReset = async () => {
    await reset();
    await deleteSession();
    const fresh = await loadInitialState();
    setDay(fresh.day);
    setArchived(fresh.archived);
    setCurrentUser(null);
    setSessionToken(null);
    setCachedAccounts([]);
    refreshCachedAccounts();
  };

  // ── PWA install ───────────────────────────────────────────────────────────
  const [installable, setInstallable] = useState(!!window.__pwaInstallEvent);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onAvail = () => setInstallable(true);
    const onDone  = () => { setInstallable(false); setInstalled(true); };
    window.addEventListener('pwa-installable', onAvail);
    window.addEventListener('pwa-installed', onDone);
    return () => { window.removeEventListener('pwa-installable', onAvail); window.removeEventListener('pwa-installed', onDone); };
  }, []);
  const triggerInstall = async () => {
    const ev = window.__pwaInstallEvent;
    if (!ev) return;
    ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') { setInstalled(true); setInstallable(false); }
  };

  // ── Horloge ───────────────────────────────────────────────────────────────
  const [clockTime, setClockTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setClockTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Garde-fous ────────────────────────────────────────────────────────────
  if (!loaded || !day) return null;

  if (licenseStatus === 'missing')
    return <LicenseScreen mode="activate" onActivated={token => { saveLicense(token); applyLicenseToken(token); }} />;
  if (licenseStatus === 'expired')
    return <LicenseScreen mode="expired" expiredToken={licenseToken} onActivated={token => { saveLicense(token); applyLicenseToken(token); }} />;

  if (!currentUser) {
    return (
      <LoginScreen
        accounts={cachedAccounts}
        licenseToken={licenseToken}
        onLoginSuccess={handleLoginSuccess}
        onResetData={handleReset}
      />
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <div
      data-screen-label={tab === 'orders' ? '01 Commandes' : tab === 'summary' ? '02 Bilan' : '03 Historique'}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>
      {t.showStatusBar && <StatusBar time={clockTime} onSettings={() => setSettingsOpen(true)} apiOnline={apiOnline} clubName={licenseInfo?.club} userName={currentUser?.name} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {tab === 'orders'  && <OrdersScreen day={day} products={products} onAddOrder={addOrder} onRemoveOrder={removeOrder} />}
        {tab === 'summary' && <SummaryScreen day={day} products={products} onClose={requestCloseDay} onReopen={reopenDay} cashCounted={day.cashCounted} setCashCounted={setCashCounted} />}
        {tab === 'history' && <HistoryScreen archived={archived} products={products} />}

        {autoCloseNotice && (
          <AutoCloseToast
            entry={autoCloseNotice}
            onDismiss={() => setAutoCloseNotice(null)}
            onView={() => { setTab('history'); setAutoCloseNotice(null); }}
          />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {!t.showStatusBar && (
        <button onClick={() => setSettingsOpen(true)} aria-label="Réglages"
          style={{ position: 'absolute', top: 12, right: 14, width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 50, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
          <GearSvg />
        </button>
      )}

      {settingsOpen && (
        <SettingsDrawer
          t={t} setTweak={setTweak}
          installable={installable} installed={installed} triggerInstall={triggerInstall}
          dayClosed={day.dayClosed} onCloseDay={() => closeDay(day.cashCounted ?? 0)} onReopenDay={reopenDay}
          onReset={handleReset} onSimulateNextDay={simulateNextDay} onClose={() => setSettingsOpen(false)}
          licenseInfo={licenseInfo} currentUser={currentUser}
          onLogout={() => { setSettingsOpen(false); handleLogout(); }}
          onChangePassword={() => { setSettingsOpen(false); setShowChangePassword(true); }}
          onManageAccounts={() => { setSettingsOpen(false); setShowAccountManager(true); }}
          products={products} onProductsChange={updateProducts}
        />
      )}

      {pendingClose && (
        <ConfirmCloseModal
          onConfirm={() => { closeDay(pendingClose.cashCounted); setPendingClose(null); }}
          onCancel={() => setPendingClose(null)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal accountId={currentUser.id} sessionToken={sessionToken} onClose={() => setShowChangePassword(false)} />
      )}

      {showAccountManager && (
        <AccountManager accounts={cachedAccounts} currentUser={currentUser} sessionToken={sessionToken} onClose={() => { setShowAccountManager(false); refreshCachedAccounts(); }} />
      )}

      <TweaksPanel>
        <TweakSection label="Apparence">
          <TweakColor
            label="Couleur d'accent"
            value={ACCENT_SWATCHES[t.accent] || ACCENT_SWATCHES.club}
            options={Object.values(ACCENT_SWATCHES)}
            onChange={arr => {
              const found = Object.entries(ACCENT_SWATCHES).find(([, v]) => v[0] === arr[0]);
              if (found) setTweak('accent', found[0]);
            }}
          />
          <TweakRadio
            label="Taille du texte"
            value={t.textSize}
            options={[{ value: 'normal', label: 'Normal' }, { value: 'large', label: 'Grand' }, { value: 'xlarge', label: '+ Grand' }]}
            onChange={v => setTweak('textSize', v)}
          />
          <TweakToggle label="Barre d'état" value={t.showStatusBar} onChange={v => setTweak('showStatusBar', v)} />
        </TweakSection>
        <TweakSection label="Démo" />
        <TweakButton label="🗓️ Simuler le jour suivant" onClick={simulateNextDay} />
        <TweakButton label={day.dayClosed ? 'Rouvrir la journée' : 'Clôturer la journée'} onClick={() => day.dayClosed ? reopenDay() : closeDay(day.cashCounted ?? 0)} />
        <TweakButton label="Réinitialiser les données" secondary onClick={handleReset} />
      </TweaksPanel>
    </div>
  );
}

// ── Confirmation de clôture ───────────────────────────────────────────────────
function ConfirmCloseModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.55)', display: 'grid', placeItems: 'center', zIndex: 300, animation: 'fadeIn 160ms ease' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{ background: 'var(--cream)', borderRadius: 24, padding: '40px 52px', minWidth: 380, boxShadow: '0 30px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Clôturer la journée ?</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 28, lineHeight: 1.5 }}>
          Cette action archivera la journée en cours.<br />Elle peut être réouverte depuis le bilan.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 52, borderRadius: 12, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: 'var(--club)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: 'white' }}>Clôturer</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast clôture automatique ─────────────────────────────────────────────────
function AutoCloseToast({ entry, onDismiss, onView }) {
  return (
    <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 80, background: 'var(--warn-soft)', color: 'var(--warn)', border: '1px solid var(--warn)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', maxWidth: 720, animation: 'slideDown 280ms cubic-bezier(.2,.8,.2,1)' }}>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      <div style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--warn)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>!</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--warn)' }}>Clôture automatique</div>
        <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>
          La journée du <b>{entry.date}</b> n'a pas été clôturée manuellement.
          Elle a été archivée avec son total ({fmtEUR(entry.total)}).
        </div>
      </div>
      <button onClick={onView} style={{ appearance: 'none', border: '1.5px solid var(--warn)', background: 'transparent', color: 'var(--warn)', padding: '8px 14px', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Voir l'historique</button>
      <button onClick={onDismiss} aria-label="Fermer" style={{ appearance: 'none', border: 'none', background: 'transparent', color: 'var(--warn)', padding: 6, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
        <Icon.Close size={20} />
      </button>
    </div>
  );
}

function GearSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 11-2.83-2.83l.06.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
