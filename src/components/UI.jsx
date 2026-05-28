import { useState } from 'react';
import { PRODUCTS } from '../lib/data';

export function PayBadge({ kind, size = 'md' }) {
  const isEspeces = kind === 'especes';
  const styles = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: size === 'lg' ? '8px 14px' : '5px 10px',
    borderRadius: 999, fontWeight: 600,
    fontSize: size === 'lg' ? 16 : 14,
    background: isEspeces ? 'var(--amber-soft)' : 'var(--blue-soft)',
    color: isEspeces ? 'var(--amber)' : 'var(--blue)',
    letterSpacing: 0.1, whiteSpace: 'nowrap',
  };
  return (
    <span style={styles}>
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: isEspeces ? 'var(--amber)' : 'var(--blue)',
      }} />
      {isEspeces ? 'Espèces' : 'Carte'}
    </span>
  );
}

export function BigButton({ children, onClick, variant = 'primary', icon, style, disabled }) {
  const palette = {
    primary: { bg: 'var(--club)', color: 'white', hover: 'var(--club-deep)' },
    ghost:   { bg: 'transparent', color: 'var(--ink)', hover: 'var(--cream-deep)', border: '1.5px solid var(--line)' },
    danger:  { bg: 'var(--danger)', color: 'white', hover: '#8E2A1E' },
  }[variant];

  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        appearance: 'none',
        border: palette.border || 'none',
        background: disabled ? '#D8CFBE' : (hover ? palette.hover : palette.bg),
        color: disabled ? '#8C8473' : palette.color,
        height: 72, padding: '0 32px', borderRadius: 14,
        fontWeight: 700, fontSize: 22, letterSpacing: 0.2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        fontFamily: 'inherit', transition: 'background 120ms',
        ...(style || {}),
      }}>
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
         style={{ transform: dir === 'up' ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
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
  Trash: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  ),
};

export function StatusBar({ time, onSettings, apiOnline = true, clubName, userName }) {
  return (
    <div style={{
      height: 32, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      fontSize: 13, fontWeight: 600, color: 'var(--ink)',
      background: 'var(--cream)', borderBottom: '1px solid var(--line-soft)',
    }}>
      <div>{time}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-soft)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
          {clubName ? clubName.toUpperCase() : 'BUVETTE CLUB'}
          {userName ? <span style={{ fontWeight: 500, marginLeft: 8 }}>— {userName}</span> : null}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: 999,
            background: apiOnline ? 'var(--ok)' : 'var(--warn)',
            boxShadow: apiOnline ? '0 0 0 2px var(--ok-soft)' : '0 0 0 2px var(--warn-soft)',
            transition: 'background 400ms, box-shadow 400ms',
          }} />
          {!apiOnline && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warn)', letterSpacing: 0.3 }}>
              Hors ligne
            </span>
          )}
        </span>
        <Icon.Battery size={12} />
        {onSettings && (
          <button onClick={onSettings} aria-label="Réglages" title="Réglages" style={{
            appearance: 'none', border: 'none', background: 'transparent',
            color: 'var(--ink-soft)', padding: 2, marginLeft: 4,
            cursor: 'pointer', display: 'grid', placeItems: 'center', borderRadius: 6,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'orders',  label: 'Commandes', icon: <Icon.Receipt size={26} /> },
    { id: 'summary', label: 'Bilan',     icon: <Icon.Chart   size={26} /> },
    { id: 'history', label: 'Historique',icon: <Icon.Clock   size={26} /> },
  ];
  return (
    <div style={{
      height: 78, borderTop: '1px solid var(--line)',
      background: 'var(--paper)',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flexShrink: 0,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            appearance: 'none', border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            color: on ? 'var(--club)' : 'var(--ink-soft)',
            fontFamily: 'inherit', fontWeight: on ? 700 : 500, fontSize: 14,
            position: 'relative', transition: 'color 120ms',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: on ? 64 : 0, height: 3, background: 'var(--club)',
              borderRadius: '0 0 3px 3px', transition: 'width 160ms ease',
            }} />
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
    <div style={{
      padding: '20px 32px 18px', borderBottom: '1px solid var(--line-soft)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 24, background: 'var(--cream)', flexShrink: 0,
    }}>
      <div>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 1.4,
          color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 6,
        }}>{subtitle}</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.4 }}>
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}

export function orderLineSummary(items) {
  return items.map(([pid, q]) => {
    const p = PRODUCTS.find(x => x.id === pid);
    return `${q} × ${p.name}`;
  }).join('  ·  ');
}
