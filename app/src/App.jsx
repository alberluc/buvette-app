import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StatusBar, TabBar, Icon } from './components/UI';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton } from './components/TweaksPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { LoginScreen, ChangePasswordModal, AccountManager } from './components/LoginScreen';
import { LicenseScreen } from './components/LicenseScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { reset, loadLicense, saveLicense, loadSession, saveSession, deleteSession, loadAccountsCache, saveAccountsCache, loadTweaks, saveTweaks } from './lib/storage';
import { parseJwt, refreshLicense, fetchAccounts, pushSettings } from './lib/api';
import { TWEAK_DEFAULTS, ACCENT_PALETTES, ACCENT_SWATCHES, TEXT_SCALES } from './lib/theme';
import { MODULES, enabledModules, accessibleModules } from './modules';
import { userFromSession } from './lib/permissions';
import styles from './App.module.css';

const SETTINGS_PATH = '/reglages';

// Shell du socle : licence, connexion, comptes, apparence, navigation.
// Les données métier vivent dans les modules (voir modules/index.js).
export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const p = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.club;
    root.style.setProperty('--club', p.club);
    root.style.setProperty('--club-deep', p.clubDeep);
    root.style.setProperty('--club-soft', t.darkMode ? (p.clubSoftDark || '#1C2E22') : p.clubSoft);
    if (t.darkMode) root.setAttribute('data-dark', '');
    else root.removeAttribute('data-dark');
    document.getElementById('root').style.zoom = TEXT_SCALES[t.textSize] || 1;
  }, [t.accent, t.textSize, t.darkMode]);

  const [loaded, setLoaded] = useState(false);

  // ── Licence ───────────────────────────────────────────────────────────────
  const [licenseStatus, setLicenseStatus] = useState('checking');
  const [licenseToken, setLicenseToken] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [cachedAccounts, setCachedAccounts] = useState([]);
  const [sessionToken, setSessionToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Sync (état remonté par les modules) ───────────────────────────────────
  const [apiOnline, setApiOnline] = useState(true);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [accountOpen, setAccountOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAccountManager, setShowAccountManager] = useState(false);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [licToken, sesToken, accsCache, savedTweaks] = await Promise.all([
        loadLicense(), loadSession(), loadAccountsCache(), loadTweaks(),
      ]);
      if (savedTweaks) setTweak(savedTweaks);
      setCachedAccounts(accsCache);
      applyLicenseToken(licToken);

      if (sesToken) {
        const p = parseJwt(sesToken);
        if (p && p.exp > Date.now() / 1000) {
          setSessionToken(sesToken);
          setCurrentUser(userFromSession(p));
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
    setLicenseInfo({ club: p.club, plan: p.plan, licenseExpires: p.licenseExpires, modules: p.modules });
    setLicenseStatus('valid');
  }

  useEffect(() => {
    if (licenseStatus !== 'valid' || !licenseToken) return;
    const p = parseJwt(licenseToken);
    if (!p || p.exp - Date.now() / 1000 > 3 * 24 * 3600) return;
    refreshLicense(licenseToken)
      .then(data => { saveLicense(data.token); applyLicenseToken(data.token); })
      .catch(() => {});
  }, [licenseStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (licenseStatus !== 'valid' || !licenseToken) return;
    fetchAccounts(licenseToken)
      .then(accs => { setCachedAccounts(accs); saveAccountsCache(accs); })
      .catch(() => {});
  }, [licenseStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persistance ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loaded) saveTweaks(t);
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Réglages club ─────────────────────────────────────────────────────────
  const updateClubName = name => {
    if (!sessionToken) return;
    pushSettings(sessionToken, { clubName: name })
      .then(data => {
        if (data.licenseToken) { saveLicense(data.licenseToken); applyLicenseToken(data.licenseToken); }
      })
      .catch(() => {});
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Les modules chargent leurs données au montage de leur Provider (après connexion)
  const handleLoginSuccess = async sessionJWT => {
    await saveSession(sessionJWT);
    setSessionToken(sessionJWT);
    const p = parseJwt(sessionJWT);
    setCurrentUser(userFromSession(p));
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
    await Promise.all(MODULES.map(m => m.reset?.()));
    await deleteSession();
    setCurrentUser(null);
    setSessionToken(null);
    setCachedAccounts([]);
    refreshCachedAccounts();
  };

  const handleLeaveLicense = async () => {
    await saveLicense(null);
    await deleteSession();
    setSessionToken(null);
    setCurrentUser(null);
    setCachedAccounts([]);
    setLicenseToken(null);
    setLicenseInfo(null);
    setLicenseStatus('missing');
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
  if (!loaded) return null;

  if (licenseStatus === 'missing')
    return <LicenseScreen mode="activate" onActivated={token => { saveLicense(token); applyLicenseToken(token); }} />;
  if (licenseStatus === 'expired')
    return <LicenseScreen mode="expired" expiredToken={licenseToken} onActivated={token => { saveLicense(token); applyLicenseToken(token); }} />;

  if (!currentUser) {
    return (
      <LoginScreen
        accounts={cachedAccounts}
        licenseToken={licenseToken}
        clubName={licenseInfo?.club}
        onLoginSuccess={handleLoginSuccess}
        onResetData={handleReset}
        onLeaveLicense={handleLeaveLicense}
      />
    );
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  // Modules affichés = activés sur la licence ET accessibles à l'utilisateur connecté
  const modules = accessibleModules(licenseInfo, currentUser);
  const moduleTabs = modules.flatMap(m => m.tabs);
  const defaultPath = moduleTabs[0]?.path ?? SETTINGS_PATH;
  const tabs = [
    ...moduleTabs.map(tab => ({ id: tab.path, label: tab.label, icon: <tab.Icon size={26} /> })),
    { id: SETTINGS_PATH, label: 'Réglages', icon: <Icon.Settings size={26} /> },
  ];
  const screenLabel = moduleTabs.find(tab => tab.path === location.pathname)?.screenLabel ?? '04 Réglages';

  // ── Rendu principal ───────────────────────────────────────────────────────
  const shell = (
    <div data-screen-label={screenLabel} className={styles.root}>
      {t.showStatusBar && <StatusBar time={clockTime} onAccount={() => setAccountOpen(true)} apiOnline={apiOnline} clubName={licenseInfo?.club} userName={currentUser?.name} />}

      <div className={styles.main}>
        <Routes>
          {moduleTabs.map(tab => <Route key={tab.path} path={tab.path} element={<tab.Screen />} />)}
          <Route path={SETTINGS_PATH} element={
            <SettingsScreen
              t={t} setTweak={setTweak}
              licenseInfo={licenseInfo}
              clubName={licenseInfo?.club} onClubNameChange={updateClubName}
              currentUser={currentUser}
              modules={modules}
              onManageAccounts={() => setShowAccountManager(true)}
            />
          } />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>

        {modules.map(m => m.Overlays && <m.Overlays key={m.id} />)}
      </div>

      <TabBar tabs={tabs} active={location.pathname} onChange={path => navigate(path)} />

      {!t.showStatusBar && (
        <button onClick={() => setAccountOpen(true)} aria-label="Mon compte"
          className={styles.floatingSettingsBtn}>
          <Icon.User size={20} />
        </button>
      )}

      {accountOpen && (
        <SettingsDrawer
          currentUser={currentUser}
          onLogout={() => { setAccountOpen(false); handleLogout(); }}
          onChangePassword={() => { setAccountOpen(false); setShowChangePassword(true); }}
          onClose={() => setAccountOpen(false)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal accountId={currentUser.id} sessionToken={sessionToken} onClose={() => setShowChangePassword(false)} />
      )}

      {showAccountManager && (
        <AccountManager accounts={cachedAccounts} currentUser={currentUser} sessionToken={sessionToken} modules={enabledModules(licenseInfo)} onClose={() => { setShowAccountManager(false); refreshCachedAccounts(); }} />
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
          <TweakToggle label="Mode sombre" value={t.darkMode} onChange={v => setTweak('darkMode', v)} />
          <TweakToggle label="Barre d'état" value={t.showStatusBar} onChange={v => setTweak('showStatusBar', v)} />
        </TweakSection>
        {modules.map(m => m.DevTools && <m.DevTools key={m.id} />)}
        <TweakButton label="Réinitialiser les données" secondary onClick={handleReset} />
      </TweaksPanel>
    </div>
  );

  // Chaque module actif enveloppe le shell avec son Provider (état + synchro)
  return modules.reduceRight(
    (children, m) => <m.Provider key={m.id} sessionToken={sessionToken} currentUser={currentUser} onApiStatus={setApiOnline}>{children}</m.Provider>,
    shell,
  );
}
