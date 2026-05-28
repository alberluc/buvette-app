import { Icon } from './UI';
import styles from './SettingsDrawer.module.css';

export function SettingsDrawer({ currentUser, onLogout, onChangePassword, onClose }) {
  return (
    <div onClick={onClose} className={styles.backdrop}>
      <div onClick={e => e.stopPropagation()} className={styles.panel}>

        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelHeaderLabel}>Mon compte</div>
            <h2 className={styles.panelHeaderTitle}>{currentUser.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className={styles.panelCloseBtn}>
            <Icon.Close size={20} />
          </button>
        </div>

        <div className={styles.panelBody}>
          <div className={`${styles.infoCard} ${styles.accountCard}`}>
            <UserAvatar name={currentUser.name} />
            <div>
              <div className={styles.infoCardTitle}>{currentUser.name}</div>
              <div className={styles.infoCardSub}>
                {currentUser.role === 'admin' ? 'Administrateur' : 'Bénévole'}
              </div>
            </div>
          </div>
          <DrawerButton onClick={onChangePassword}>Changer mon mot de passe</DrawerButton>
          <DrawerButton onClick={onLogout} secondary margin>Se déconnecter</DrawerButton>
          {import.meta.env.DEV && (
            <DrawerButton onClick={() => { onClose(); window.postMessage({ type: '__activate_edit_mode' }, '*'); }} margin>
              🛠 Tweaks (dev)
            </DrawerButton>
          )}
          <div className={styles.version}>Buvette Club · v1.0</div>
        </div>
      </div>
    </div>
  );
}

// ── Composants internes du drawer ─────────────────────────────────────────────

function DrawerSection({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function DrawerLabel({ children, mt }) {
  return (
    <div className={`${styles.label} ${mt ? styles.labelMt : ''}`}>{children}</div>
  );
}

function DrawerButton({ children, onClick, secondary, margin }) {
  const cls = secondary ? styles.drawerBtnSecondary : styles.drawerBtnDefault;
  return (
    <button onClick={onClick} className={`${styles.drawerBtn} ${cls} ${margin ? styles.drawerBtnMargin : ''}`}>
      {children}
    </button>
  );
}

function UserAvatar({ name, size = 36 }) {
  return (
    <div className={styles.avatar} style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      fontSize: Math.round(size * 0.4),
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
