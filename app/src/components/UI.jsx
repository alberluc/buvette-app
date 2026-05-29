import styles from './UI.module.css';

export function PayBadge({ kind, size = 'md' }) {
  const isEspeces = kind === 'especes';
  return (
    <span className={`${styles.payBadge} ${size === 'lg' ? styles.payBadgeLg : styles.payBadgeMd} ${isEspeces ? styles.payBadgeEspeces : styles.payBadgeCarte}`}>
      <span className={`${styles.payDot} ${isEspeces ? styles.payDotEspeces : styles.payDotCarte}`} />
      {isEspeces ? 'Espèces' : 'Carte'}
    </span>
  );
}

export function BigButton({ children, onClick, variant = 'primary', icon, style, disabled }) {
  const variantClass = {
    primary: styles.bigBtnPrimary,
    ghost:   styles.bigBtnGhost,
    danger:  styles.bigBtnDanger,
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${styles.bigBtn} ${variantClass}`}
      style={style}>
      {icon}
      {children}
    </button>
  );
}

export const Icon = {
  Plus: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  ),
  Check: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  ),
  Close: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Receipt: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5V3z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  Chart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <rect x="6" y="11" width="3" height="7" />
      <rect x="11" y="6" width="3" height="12" />
      <rect x="16" y="14" width="3" height="4" />
    </svg>
  ),
  Clock: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Chevron: ({ size = 24, dir = 'down' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
         className={`${styles.chevron} ${dir === 'up' ? styles.chevronUp : ''}`}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Wifi: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5a10 10 0 0114 0" />
      <path d="M8.5 16a5 5 0 017 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
  Battery: ({ size = 16 }) => (
    <svg width={size * 1.6} height={size} viewBox="0 0 26 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="2" width="20" height="12" rx="2.5" />
      <rect x="3" y="4" width="14" height="8" rx="1" fill="currentColor" stroke="none" />
      <rect x="22" y="6" width="2" height="4" rx="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  User: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  Settings: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 11-2.83-2.83l.06.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Trash: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  ),
};

export function StatusBar({ time, onAccount, apiOnline = true, clubName, userName }) {
  return (
    <div className={styles.statusBar}>
      <div>{time}</div>
      <div className={styles.statusRight}>
        <span className={styles.clubName}>
          {clubName ? clubName.toUpperCase() : 'BUVETTE CLUB'}
        </span>
        <span className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${apiOnline ? styles.statusDotOnline : styles.statusDotOffline}`} />
          {!apiOnline && <span className={styles.offlineLabel}>Hors ligne</span>}
        </span>
        <Icon.Battery size={12} />
        {onAccount && (
          <button onClick={onAccount} aria-label="Mon compte" title={userName || 'Compte'} className={styles.settingsBtn}>
            <Icon.User size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'orders',   label: 'Journal',    icon: <Icon.Receipt  size={26} /> },
    { id: 'summary',  label: 'Bilan',      icon: <Icon.Chart    size={26} /> },
    { id: 'history',  label: 'Historique', icon: <Icon.Clock    size={26} /> },
    { id: 'settings', label: 'Réglages',   icon: <Icon.Settings size={26} /> },
  ];
  return (
    <div className={styles.tabBar}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`${styles.tabBtn} ${on ? styles.tabBtnActive : ''}`}>
            <div className={`${styles.tabIndicator} ${on ? styles.tabIndicatorActive : ''}`} />
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppHeader({ title, subtitle, right }) {
  return (
    <div className={styles.appHeader}>
      <div>
        <div className={styles.appHeaderSubtitle}>{subtitle}</div>
        <h1 className={styles.appHeaderTitle}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function orderLineSummary(items, products) {
  return items.map(([pid, q]) => {
    const p = products ? products.find(x => x.id === pid) : null;
    return `${q} × ${p ? p.name : pid}`;
  }).join('  ·  ');
}
