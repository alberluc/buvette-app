import { useState } from 'react';
import { Icon } from './UI';
import { ACCENT_SWATCHES } from '../lib/theme';
import { formatDate } from '../lib/storage';
import styles from './SettingsDrawer.module.css';

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
  const [editingProduct, setEditingProduct] = useState(null);
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
    <div onClick={onClose} className={styles.backdrop}>
      <div onClick={e => e.stopPropagation()} className={styles.panel}>

        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelHeaderLabel}>Réglages</div>
            <h2 className={styles.panelHeaderTitle}>Buvette Club</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className={styles.panelCloseBtn}>
            <Icon.Close size={20} />
          </button>
        </div>

        <div className={styles.panelBody}>

          <DrawerSection title="Apparence">
            <DrawerLabel>Couleur d'accent</DrawerLabel>
            <div className={styles.accentGrid}>
              {Object.entries(ACCENT_SWATCHES).map(([key, swatches]) => {
                const active = t.accent === key;
                const names = { club: 'Vert club', navy: 'Bleu marine', burgundy: 'Bordeaux', charcoal: 'Charbon' };
                return (
                  <button key={key} onClick={() => setTweak('accent', key)}
                    className={`${styles.accentBtn} ${active ? styles.accentBtnActive : styles.accentBtnInactive}`}
                    style={active ? { border: `2px solid ${swatches[0]}`, background: swatches[2] } : {}}>
                    {/* background inline — couleur d'accent dynamique */}
                    <span className={styles.accentSwatch}
                          style={{ background: swatches[0], boxShadow: `inset 0 0 0 3px ${swatches[1]}` }} />
                    {names[key]}
                  </button>
                );
              })}
            </div>
            <DrawerLabel mt>Taille du texte</DrawerLabel>
            <div className={styles.textSizeGrid}>
              {[{ v: 'normal', l: 'Normal' }, { v: 'large', l: 'Grand' }, { v: 'xlarge', l: '+ Grand' }].map(o => {
                const on = t.textSize === o.v;
                return (
                  <button key={o.v} onClick={() => setTweak('textSize', o.v)}
                    className={`${styles.textSizeBtn} ${on ? styles.textSizeBtnActive : styles.textSizeBtnInactive}`}>
                    {o.l}
                  </button>
                );
              })}
            </div>
          </DrawerSection>

          {licenseInfo && (
            <DrawerSection title="Licence">
              <div className={styles.infoCard}>
                <div className={styles.infoCardTitle}>{licenseInfo.club}</div>
                <div className={styles.infoCardSub}>
                  Licence {licenseInfo.plan === 'annual' ? 'annuelle' : 'mensuelle'} · expire le {formatDate(licenseInfo.licenseExpires)}
                </div>
              </div>
            </DrawerSection>
          )}

          <DrawerSection title="Compte">
            <div className={`${styles.infoCard} ${styles.accountCard}`}>
              <UserAvatar name={currentUser.name} />
              <div>
                <div className={styles.infoCardTitle}>{currentUser.name}</div>
                <div className={styles.infoCardSub}>
                  {currentUser.role === 'admin' ? 'Administrateur' : 'Bénévole'}
                </div>
              </div>
            </div>
            <DrawerButton onClick={onChangePassword}>🔐 Changer mon mot de passe</DrawerButton>
            {currentUser.role === 'admin' && (
              <DrawerButton onClick={onManageAccounts} margin>👥 Gérer les comptes</DrawerButton>
            )}
            <DrawerButton onClick={onLogout} secondary margin>Se déconnecter</DrawerButton>
          </DrawerSection>

          {isAdmin && (
            <DrawerSection title="Catalogue produits">
              <div className={styles.productList}>
                {products.map(p => (
                  <div key={p.id} className={styles.productItem}>
                    {/* background et border inline — couleur spécifique au produit */}
                    <span className={styles.productEmoji}
                          style={{ background: p.color + '22', border: `1px solid ${p.color}44` }}>
                      {p.emoji}
                    </span>
                    <span className={styles.productName}>{p.name}</span>
                    <span className={styles.productPrice}>{String(p.price).replace('.', ',')} €</span>
                    <button onClick={() => setEditingProduct(p)} className={styles.iconBtn}>
                      <PencilSvg />
                    </button>
                    <button
                      onClick={() => { if (products.length > 1) onProductsChange(products.filter(x => x.id !== p.id)); }}
                      className={`${styles.iconBtn} ${products.length > 1 ? styles.iconBtnDanger : styles.iconBtnDisabled}`}>
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
              <button onClick={triggerInstall} className={styles.installBtn}>
                📲 Installer sur la tablette
              </button>
            )}
            {!installable && !installed && (
              <div className={styles.installHint}>
                Pour installer l'app, ouvrir cette URL dans <b>Safari</b> (iPad) ou <b>Chrome</b> (Android), puis sélectionner <b>« Sur l'écran d'accueil »</b>.
              </div>
            )}
            {installed && (
              <div className={styles.installedBadge}>
                <Icon.Check size={20} /> Application installée
              </div>
            )}
          </DrawerSection>

          <DrawerSection title="Démo">
            <DrawerButton onClick={() => { onSimulateNextDay(); onClose(); }}>🗓️ Simuler le jour suivant</DrawerButton>
            <div className={styles.demoHint}>Archive la journée actuelle et démarre une nouvelle journée vide.</div>
            <DrawerButton onClick={() => { dayClosed ? onReopenDay() : onCloseDay(); onClose(); }} secondary>
              {dayClosed ? 'Rouvrir la journée' : 'Clôturer la journée'}
            </DrawerButton>
          </DrawerSection>

          <DrawerSection title="Données">
            <DrawerButton onClick={() => { onReset(); onClose(); }} variant="danger">
              Réinitialiser les données locales
            </DrawerButton>
            <div className={styles.resetHint}>
              Supprime les commandes et l'historique de cet appareil. Les comptes et la licence ne sont pas affectés.
            </div>
          </DrawerSection>

          <div className={styles.version}>Buvette Club · v1.0</div>
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

function DrawerButton({ children, onClick, variant, secondary, margin }) {
  const danger = variant === 'danger';
  const cls = danger ? styles.drawerBtnDanger : secondary ? styles.drawerBtnSecondary : styles.drawerBtnDefault;
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
    <div className={styles.editOverlay}>
      <div className={styles.editModal}>
        <div className={styles.editTitle}>
          {isNew ? 'Nouveau produit' : 'Modifier le produit'}
        </div>

        <label className={styles.fieldLabel}>Emoji</label>
        <div className={styles.emojiGrid}>
          {PRESET_EMOJIS.map(e => (
            <button key={e} onClick={() => set('emoji', e)}
              className={`${styles.emojiBtn} ${form.emoji === e ? styles.emojiBtnActive : styles.emojiBtnInactive}`}>
              {e}
            </button>
          ))}
          <input
            type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={2}
            placeholder="✏️" className={styles.emojiInput}
          />
        </div>

        <label className={styles.fieldLabel}>Nom</label>
        <input
          type="text" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Ex : Bière, Soda…"
          className={styles.textInput}
        />

        <label className={styles.fieldLabel}>Prix unitaire (€)</label>
        <input
          type="text" inputMode="decimal" value={form.price} onChange={e => set('price', e.target.value)}
          placeholder="2,00"
          className={styles.textInput}
        />

        <label className={styles.fieldLabel}>Couleur</label>
        <div className={styles.colorGrid}>
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => set('color', c)}
              className={`${styles.colorSwatch} ${form.color === c ? styles.colorSwatchActive : styles.colorSwatchInactive}`}
              style={{ background: c }} />
          ))}
        </div>

        <div className={styles.editActions}>
          <button onClick={onClose} className={styles.editBtnCancel}>Annuler</button>
          <button
            onClick={() => valid && onSave({ ...form, price: parseFloat(String(form.price).replace(',', '.')) })}
            disabled={!valid}
            className={`${styles.editBtnSave} ${valid ? styles.editBtnSaveValid : styles.editBtnSaveInvalid}`}>
            {isNew ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
