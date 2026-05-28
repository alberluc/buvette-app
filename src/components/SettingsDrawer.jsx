import { useState } from 'react';
import { Icon } from './UI';
import { ACCENT_SWATCHES } from '../lib/theme';
import { formatDate } from '../lib/storage';

const PRESET_COLORS = [
  '#C99A3B', '#8E2A3A', '#2F6BBB', '#5E4632',
  '#2E8B57', '#E05C2A', '#7B2D8B', '#C0392B',
  '#1ABC9C', '#34495E',
];

const PRESET_EMOJIS = ['🍺', '🍷', '🥤', '🍿', '☕', '🧃', '🥪', '🍕', '🍫', '🧁', '🍪', '🥨'];

export function SettingsDrawer({
  t, setTweak,
  installable, installed, triggerInstall,
  dayClosed, onCloseDay, onReopenDay,
  onReset, onSimulateNextDay, onClose,
  licenseInfo, currentUser,
  onLogout, onChangePassword, onManageAccounts,
  products, onProductsChange,
}) {
  const [editingProduct, setEditingProduct] = useState(null); // null | { id, name, price, emoji, color } | 'new'
  const isAdmin = currentUser?.role === 'admin';
  const handleSaveProduct = updated => {
    const id = updated.id || (updated.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now());
    const withId = { ...updated, id };
    const exists = products.find(p => p.id === withId.id);
    onProductsChange(exists ? products.map(p => p.id === withId.id ? withId : p) : [...products, withId]);
    setEditingProduct(null);
  };

  return (
    <>
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

          {isAdmin && (
            <DrawerSection title="Catalogue produits">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {products.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: p.color + '22', display: 'grid', placeItems: 'center', fontSize: 18, border: `1px solid ${p.color}44`, flexShrink: 0 }}>{p.emoji}</span>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                    <span style={{ fontSize: 14, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{String(p.price).replace('.', ',')} €</span>
                    <button onClick={() => setEditingProduct(p)} style={{ appearance: 'none', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-soft)', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                      <PencilSvg />
                    </button>
                    <button onClick={() => { if (products.length > 1) onProductsChange(products.filter(x => x.id !== p.id)); }} style={{ appearance: 'none', border: '1px solid var(--line)', background: 'transparent', color: products.length > 1 ? 'var(--danger)' : 'var(--ink-mute)', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: products.length > 1 ? 'pointer' : 'not-allowed' }}>
                      <TrashSvg />
                    </button>
                  </div>
                ))}
              </div>
              <DrawerButton onClick={() => setEditingProduct({ id: '', name: '', price: '', emoji: '🍺', color: PRESET_COLORS[0] })}>
                + Ajouter un produit
              </DrawerButton>
            </DrawerSection>
          )}

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
    {isAdmin && editingProduct && (
      <ProductEditModal
        product={editingProduct}
        isNew={!products.find(p => p.id === editingProduct.id)}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveProduct}
      />
    )}
    </>
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

function PencilSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ── Modale d'édition produit ──────────────────────────────────────────────────

function ProductEditModal({ product, isNew, onClose, onSave }) {
  const [form, setForm] = useState({ ...product });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const priceNum = parseFloat(String(form.price).replace(',', '.'));
  const valid = form.name.trim().length > 0 && !isNaN(priceNum) && priceNum >= 0 && form.emoji.trim().length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.55)', display: 'grid', placeItems: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--cream)', borderRadius: 20, padding: '28px 32px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>
          {isNew ? 'Nouveau produit' : 'Modifier le produit'}
        </div>

        {/* Emoji */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>Emoji</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {PRESET_EMOJIS.map(e => (
            <button key={e} onClick={() => set('emoji', e)} style={{
              appearance: 'none', border: form.emoji === e ? '2px solid var(--club)' : '1.5px solid var(--line)',
              background: form.emoji === e ? 'var(--club-soft)' : 'var(--paper)',
              width: 40, height: 40, borderRadius: 10, fontSize: 20, cursor: 'pointer',
            }}>{e}</button>
          ))}
          <input
            type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={2}
            placeholder="✏️" style={{
              width: 40, height: 40, border: '1.5px solid var(--line)', borderRadius: 10,
              fontSize: 20, textAlign: 'center', background: 'var(--paper)', fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Nom */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>Nom</label>
        <input
          type="text" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Ex : Bière, Soda…"
          style={{ width: '100%', height: 48, border: '1.5px solid var(--line)', borderRadius: 10, padding: '0 14px', fontSize: 16, fontFamily: 'inherit', background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
        />

        {/* Prix */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>Prix unitaire (€)</label>
        <input
          type="text" inputMode="decimal" value={form.price} onChange={e => set('price', e.target.value)}
          placeholder="2,00"
          style={{ width: '100%', height: 48, border: '1.5px solid var(--line)', borderRadius: 10, padding: '0 14px', fontSize: 16, fontFamily: 'inherit', background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
        />

        {/* Couleur */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>Couleur</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => set('color', c)} style={{
              appearance: 'none', border: form.color === c ? '3px solid var(--ink)' : '2px solid transparent',
              background: c, width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
              outline: form.color === c ? '2px solid var(--paper)' : 'none', outlineOffset: '1px',
            }} />
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 12, border: '1.5px solid var(--line)', background: 'transparent', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => valid && onSave({ ...form, price: parseFloat(String(form.price).replace(',', '.')) })}
            disabled={!valid}
            style={{ flex: 2, height: 48, borderRadius: 12, border: 'none', background: valid ? 'var(--club)' : 'var(--line)', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: valid ? 'white' : 'var(--ink-mute)', cursor: valid ? 'pointer' : 'not-allowed' }}>
            {isNew ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
