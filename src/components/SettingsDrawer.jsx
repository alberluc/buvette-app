import { Icon } from './UI';
import { ACCENT_SWATCHES } from '../lib/theme';
import { formatDate } from '../lib/storage';

export function SettingsDrawer({
  t, setTweak,
  installable, installed, triggerInstall,
  dayClosed, onCloseDay, onReopenDay,
  onReset, onSimulateNextDay, onClose,
  licenseInfo, currentUser,
  onLogout, onChangePassword, onManageAccounts,
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,8,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 160ms ease' }}>
      <style>{`@keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 440, height: '100%', background: 'var(--cream)', boxShadow: '-20px 0 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', animation: 'slideRight 220ms cubic-bezier(.2,.8,.2,1)' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 4 }}>Réglages</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Buvette Club</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ appearance: 'none', border: '1.5px solid var(--line)', background: 'transparent', width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon.Close size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 28px' }}>

          <DrawerSection title="Apparence">
            <DrawerLabel>Couleur d'accent</DrawerLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(ACCENT_SWATCHES).map(([key, swatches]) => {
                const active = t.accent === key;
                const names = { club: 'Vert club', navy: 'Bleu marine', burgundy: 'Bordeaux', charcoal: 'Charbon' };
                return (
                  <button key={key} onClick={() => setTweak('accent', key)} style={{
                    appearance: 'none',
                    border: active ? `2px solid ${swatches[0]}` : '1.5px solid var(--line)',
                    background: active ? swatches[2] : 'var(--paper)',
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)', textAlign: 'left',
                  }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: swatches[0], boxShadow: `inset 0 0 0 3px ${swatches[1]}`, flexShrink: 0 }} />
                    {names[key]}
                  </button>
                );
              })}
            </div>
            <DrawerLabel style={{ marginTop: 18 }}>Taille du texte</DrawerLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[{ v: 'normal', l: 'Normal' }, { v: 'large', l: 'Grand' }, { v: 'xlarge', l: '+ Grand' }].map(o => {
                const on = t.textSize === o.v;
                return (
                  <button key={o.v} onClick={() => setTweak('textSize', o.v)} style={{
                    appearance: 'none',
                    border: on ? '2px solid var(--club)' : '1.5px solid var(--line)',
                    background: on ? 'var(--club-soft)' : 'var(--paper)',
                    color: on ? 'var(--club-deep)' : 'var(--ink)',
                    height: 48, borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
                  }}>{o.l}</button>
                );
              })}
            </div>
          </DrawerSection>

          {licenseInfo && (
            <DrawerSection title="Licence">
              <div style={{ padding: '12px 16px', background: 'var(--club-soft)', borderRadius: 12, border: '1px solid var(--club)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--club-deep)' }}>{licenseInfo.club}</div>
                <div style={{ fontSize: 13, color: 'var(--club-deep)', marginTop: 4, opacity: 0.8 }}>
                  Licence {licenseInfo.plan === 'annual' ? 'annuelle' : 'mensuelle'} · expire le {formatDate(licenseInfo.licenseExpires)}
                </div>
              </div>
            </DrawerSection>
          )}

          <DrawerSection title="Compte">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--club-soft)', borderRadius: 12, border: '1px solid var(--club)', marginBottom: 12 }}>
              <UserAvatar name={currentUser.name} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--club-deep)' }}>{currentUser.name}</div>
                <div style={{ fontSize: 13, color: 'var(--club-deep)', opacity: 0.8 }}>
                  {currentUser.role === 'admin' ? 'Administrateur' : 'Bénévole'}
                </div>
              </div>
            </div>
            <DrawerButton onClick={onChangePassword}>🔐 Changer mon mot de passe</DrawerButton>
            {currentUser.role === 'admin' && (
              <div style={{ marginTop: 8 }}>
                <DrawerButton onClick={onManageAccounts}>👥 Gérer les comptes</DrawerButton>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <DrawerButton onClick={onLogout} secondary>Se déconnecter</DrawerButton>
            </div>
          </DrawerSection>

          <DrawerSection title="Application">
            {installable && !installed && (
              <button onClick={triggerInstall} style={{
                appearance: 'none', border: 'none', background: 'var(--club)', color: 'white',
                height: 56, width: '100%', borderRadius: 12,
                fontFamily: 'inherit', fontSize: 17, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                📲 Installer sur la tablette
              </button>
            )}
            {!installable && !installed && (
              <div style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-soft)', background: 'var(--paper)', border: '1px solid var(--line-soft)', borderRadius: 12 }}>
                Pour installer l'app, ouvrir cette URL dans <b>Safari</b> (iPad) ou <b>Chrome</b> (Android), puis sélectionner <b>« Sur l'écran d'accueil »</b>.
              </div>
            )}
            {installed && (
              <div style={{ padding: '14px 16px', fontSize: 15, fontWeight: 600, color: 'var(--ok)', background: 'var(--ok-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon.Check size={20} /> Application installée
              </div>
            )}
          </DrawerSection>

          <DrawerSection title="Démo">
            <DrawerButton onClick={() => { onSimulateNextDay(); onClose(); }}>🗓️ Simuler le jour suivant</DrawerButton>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, marginBottom: 14, lineHeight: 1.5 }}>
              Archive la journée actuelle et démarre une nouvelle journée vide.
            </div>
            <DrawerButton onClick={() => { dayClosed ? onReopenDay() : onCloseDay(); onClose(); }} secondary>
              {dayClosed ? 'Rouvrir la journée' : 'Clôturer la journée'}
            </DrawerButton>
          </DrawerSection>

          <DrawerSection title="Données">
            <DrawerButton onClick={() => { onReset(); onClose(); }} variant="danger">
              Réinitialiser les données locales
            </DrawerButton>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.5 }}>
              Supprime les commandes et l'historique de cet appareil. Les comptes et la licence ne sont pas affectés.
            </div>
          </DrawerSection>

          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 24, textAlign: 'center' }}>Buvette Club · v1.0</div>
        </div>
      </div>
    </div>
  );
}

// ── Composants internes du drawer ─────────────────────────────────────────────

function DrawerSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function DrawerLabel({ children, style }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 8, ...(style || {}) }}>{children}</div>
  );
}

function DrawerButton({ children, onClick, variant, secondary }) {
  const danger = variant === 'danger';
  return (
    <button onClick={onClick} style={{
      appearance: 'none',
      border: '1.5px solid ' + (danger ? 'var(--danger)' : 'var(--line)'),
      background: danger ? 'var(--danger-soft)' : (secondary ? 'transparent' : 'var(--paper)'),
      color: danger ? 'var(--danger)' : 'var(--ink)',
      height: 52, width: '100%', borderRadius: 12,
      fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    }}>{children}</button>
  );
}

function UserAvatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
      background: 'var(--club)', display: 'grid', placeItems: 'center',
      fontSize: Math.round(size * 0.4), fontWeight: 700, color: 'white',
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
