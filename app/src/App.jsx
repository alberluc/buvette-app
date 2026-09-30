import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StatusBar, TabBar, Icon } from './components/UI';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton } from './components/TweaksPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { LoginScreen, ChangePasswordModal, AccountManager } from './components/LoginScreen';
import { LicenseScreen } from './components/LicenseScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { reset, loadLicense, saveLicense, loadSession, saveSession, deleteSession, loadAccountsCache, saveAccountsCache, loadTweaks, saveTweaks } from './lib/storage';
import { parseJwt, refreshLicense, refreshSession, fetchAccounts, pushSettings } from './lib/api';
import { TWEAK_DEFAULTS, ACCENT_PALETTES, ACCENT_SWATCHES, TEXT_SCALES } from './lib/theme';
import { MODULES, enabledModules, accessibleModules, moduleTabs, moduleForPath } from './modules';
import { userFromSession } from './lib/permissions';
import styles from './App.module.css';

const HOME_PATH = '/';
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

      let validSession = null;
      if (sesToken) {
        const p = parseJwt(sesToken);
        if (p && p.exp > Date.now() / 1000) {
          validSession = sesToken;
          setSessionToken(sesToken);
          setCurrentUser(userFromSession(p));
        }
      }

      setLoaded(true);

      // Resynchronise modules et droits avec le serveur (module activé, droit modifié depuis la
      // dernière connexion). Hors ligne : on garde la session locale.
      if (validSession) {
        refreshSession(validSession)
          .then(data => {
            applySessionToken(data.token);
            if (data.licenseToken) { saveLicense(data.licenseToken); applyLicenseToken(data.licenseToken); }
          })
          .catch(e => {
            // Compte supprimé ou licence révoquée/expirée : retour à l'écran de connexion
            if (e.status === 401 || e.status === 403) handleLogout();
          });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function applySessionToken(token) {
    await saveSession(token);
    setSessionToken(token);
    setCurrentUser(userFromSession(parseJwt(token)));
  }

  function applyLicenseToken(token) {
    if (!token) { setLicenseStatus('missing'); return; }
    const p = parseJwt(token);
    if (!p) { setLicenseStatus('missing'); return; }
    if (p.exp < Date.now() / 1000) { setLicenseToken(token); setLicenseStatus('expired'); return; }
    setLicenseToken(token);
    setLicenseInfo({ club: p.club, plan: p.plan, licenseExpires: p.licenseExpires });
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
  // Les modules chargent leurs données au montage de leur Provider (après connexion).
  // Arrivée : l'accueil, ou directement le module s'il n'y en a qu'un (ex : bénévole buvette).
  const handleLoginSuccess = async token => {
    await applySessionToken(token);
    const accessible = accessibleModules(userFromSession(parseJwt(token)));
    navigate(accessible.length === 1 ? accessible[0].tabs[0].path : HOME_PATH, { replace: true });
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
  // Modules affichés = activés sur la licence ET accessibles à l'utilisateur connecté.
  // Accueil (/) = une tuile par module ; dans un module, la barre du bas ne montre que ses onglets.
  // Les réglages d'un module sont son dernier onglet (si le niveau le permet) ; /reglages = réglages globaux.
  const modules = accessibleModules(currentUser);
  const allTabs = modules.flatMap(m => moduleTabs(m, currentUser));
  const currentModule = moduleForPath(modules, currentUser, location.pathname);
  const onHome = location.pathname === HOME_PATH;
  const homeTab = { id: HOME_PATH, label: 'Accueil', icon: <Icon.Grid size={26} /> };
  const tabs = currentModule
    ? [homeTab, ...moduleTabs(currentModule, currentUser).map(tab => ({ id: tab.path, label: tab.label, icon: <tab.Icon size={26} /> }))]
    : [homeTab, { id: SETTINGS_PATH, label: 'Réglages', icon: <Icon.Settings size={26} /> }];
  const screenLabel = onHome ? '00 Accueil'
    : allTabs.find(tab => tab.path === location.pathname)?.screenLabel ?? '04 Réglages';

  // Couleur du module en cours, reprise par la barre d'état, les en-têtes et l'onglet actif
  // (variables CSS inline — valeurs dynamiques). Hors module : couleurs du club.
  const moduleColors = currentModule
    ? { '--module-fg': currentModule.color.fg, '--module-bg': currentModule.color.bg }
    : undefined;

  // ── Rendu principal ───────────────────────────────────────────────────────
  const shell = (
    <div data-screen-label={screenLabel} className={styles.root} style={moduleColors}>
      {t.showStatusBar && <StatusBar time={clockTime} onAccount={() => setAccountOpen(true)} apiOnline={apiOnline} clubName={licenseInfo?.club} userName={currentUser?.name} />}

      <div className={styles.main}>
        <Routes>
          <Route path={HOME_PATH} element={
            <HomeScreen
              modules={modules} settingsPath={SETTINGS_PATH}
              userName={currentUser.name} clubName={licenseInfo?.club}
              onOpen={path => navigate(path)}
            />
          } />
          {allTabs.map(tab => <Route key={tab.path} path={tab.path} element={<tab.Screen />} />)}
          <Route path={SETTINGS_PATH} element={
            <SettingsScreen
              t={t} setTweak={setTweak}
              licenseInfo={licenseInfo}
              clubName={licenseInfo?.club} onClubNameChange={updateClubName}
              currentUser={currentUser}
              onManageAccounts={() => setShowAccountManager(true)}
            />
          } />
          <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
        </Routes>

        {modules.map(m => m.Overlays && <m.Overlays key={m.id} />)}
      </div>

      {!onHome && <TabBar tabs={tabs} active={location.pathname} onChange={path => navigate(path)} />}

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
        <AccountManager accounts={cachedAccounts} currentUser={currentUser} sessionToken={sessionToken} modules={enabledModules(currentUser)} onClose={() => { setShowAccountManager(false); refreshCachedAccounts(); }} />
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
