import { useState } from 'react';
import { fmtEUR } from '../../../lib/format';
import { sendTestReport } from '../lib/api';
import { useBuvette } from '../context';
import shared from '../../../screens/SettingsScreen.module.css';
import styles from './BuvetteSettings.module.css';

// Cartes de réglages du module, insérées par SettingsScreen :
// `BuvetteSettingsMain` dans la colonne principale, `BuvetteSettingsSide` dans la colonne admin.

const PRESET_COLORS = [
  '#C99A3B', '#8E2A3A', '#2F6BBB', '#5E4632',
  '#2E8B57', '#E05C2A', '#7B2D8B', '#C0392B',
  '#1ABC9C', '#34495E',
];

const PRESET_EMOJIS = ['🍺', '🍷', '🥤', '🍿', '☕', '🧃', '🥪', '🍕', '🍫', '🧁', '🍪', '🥨'];

export function BuvetteSettingsMain({ isAdmin }) {
  const { cashFloat, updateCashFloat, opSuggestions, updateOpSuggestions } = useBuvette();
  const [newSuggestion, setNewSuggestion] = useState({ sortie: '', entree: '' });

  if (!isAdmin) return null;

  return (
    <>
      <div className={shared.card}>
        <div className={shared.cardTitle}>Caisse</div>
        <div className={shared.fieldLabel}>Fond de caisse (monnaie de départ)</div>
        <CashFloatInput value={cashFloat ?? 0} onChange={updateCashFloat} />
        <div className={shared.hint}>
          Montant d'espèces toujours présent en caisse avant le début des ventes. Utilisé pour le calcul du contrôle de caisse.
        </div>
      </div>

      <div className={shared.card}>
        <div className={shared.cardTitle}>Libellés d'opération</div>
        <SuggestionGroup
          label="− Sorties"
          color="var(--danger)"
          items={(opSuggestions?.sortie) ?? []}
          newValue={newSuggestion.sortie ?? ''}
          onNewValueChange={v => setNewSuggestion(s => ({ ...s, sortie: v }))}
          onAdd={label => updateOpSuggestions({ ...opSuggestions, sortie: [...((opSuggestions?.sortie) ?? []), label] })}
          onRemove={i => updateOpSuggestions({ ...opSuggestions, sortie: ((opSuggestions?.sortie) ?? []).filter((_, j) => j !== i) })}
        />
        <div className={styles.suggestionDivider} />
        <SuggestionGroup
          label="+ Entrées"
          color="var(--ok)"
          items={(opSuggestions?.entree) ?? []}
          newValue={newSuggestion.entree ?? ''}
          onNewValueChange={v => setNewSuggestion(s => ({ ...s, entree: v }))}
          onAdd={label => updateOpSuggestions({ ...opSuggestions, entree: [...((opSuggestions?.entree) ?? []), label] })}
          onRemove={i => updateOpSuggestions({ ...opSuggestions, entree: ((opSuggestions?.entree) ?? []).filter((_, j) => j !== i) })}
        />
      </div>
    </>
  );
}

export function BuvetteSettingsSide({ isAdmin }) {
  const { products, updateProducts, sessionToken } = useBuvette();
  const [editingProduct, setEditingProduct] = useState(null);
  const [testReportStatus, setTestReportStatus] = useState(null); // null | 'loading' | 'sent' | 'error'

  if (!isAdmin) return null;

  const handleSendTestReport = async () => {
    setTestReportStatus('loading');
    try {
      await sendTestReport(sessionToken);
      setTestReportStatus('sent');
      setTimeout(() => setTestReportStatus(null), 4000);
    } catch {
      setTestReportStatus('error');
      setTimeout(() => setTestReportStatus(null), 4000);
    }
  };

  const handleSaveProduct = updated => {
    const id = updated.id || (updated.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now());
    const withId = { ...updated, id };
    const exists = products.find(p => p.id === withId.id);
    updateProducts(exists ? products.map(p => p.id === withId.id ? withId : p) : [...products, withId]);
    setEditingProduct(null);
  };

  return (
    <>
      <div className={shared.card}>
        <div className={shared.cardTitle}>Catalogue produits</div>
        <div className={styles.productList}>
          {products.map(p => (
            <div key={p.id} className={styles.productItem}>
              {/* background et border inline — couleur spécifique au produit */}
              <span className={styles.productEmoji}
                    style={{ background: p.color + '22', border: `1px solid ${p.color}44` }}>
                {p.emoji}
              </span>
              <span className={styles.productName}>{p.name}</span>
              <span className={styles.productPrice}>{fmtEUR(p.price)}</span>
              <button onClick={() => setEditingProduct(p)} className={styles.iconBtn}>
                <PencilSvg />
              </button>
              <button
                onClick={() => { if (products.length > 1) updateProducts(products.filter(x => x.id !== p.id)); }}
                className={`${styles.iconBtn} ${products.length > 1 ? styles.iconBtnDanger : styles.iconBtnDisabled}`}>
                <TrashSvg />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setEditingProduct({ id: '', name: '', price: '', emoji: '🍺', color: PRESET_COLORS[0] })}
          className={shared.btn}>
          + Ajouter un produit
        </button>
      </div>

      <div className={shared.card}>
        <div className={shared.cardTitle}>Test &amp; développement</div>
        <div className={shared.hint} style={{ marginBottom: 12 }}>
          Génère un bilan mensuel avec des données fictives et l'envoie à l'adresse email de la licence.
        </div>
        <button
          onClick={handleSendTestReport}
          disabled={testReportStatus === 'loading'}
          className={shared.btn}>
          {testReportStatus === 'loading' && '⏳ Génération en cours…'}
          {testReportStatus === 'sent'    && '✓ Email envoyé !'}
          {testReportStatus === 'error'   && '✗ Erreur — voir les logs'}
          {testReportStatus === null      && '📧 Envoyer un bilan de test'}
        </button>
      </div>

      {editingProduct && (
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

function CashFloatInput({ value, onChange }) {
  const [local, setLocal] = useState(value === 0 ? '' : String(value).replace('.', ','));

  const handleBlur = () => {
    const n = parseFloat(local.replace(',', '.'));
    if (!isNaN(n) && n >= 0) {
      onChange(n);
      setLocal(String(n).replace('.', ','));
    } else {
      onChange(0);
      setLocal('');
    }
  };

  return (
    <div className={styles.cashFloatWrap}>
      <input
        type="text" inputMode="decimal"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder="0,00"
        className={styles.cashFloatInput}
      />
      <span className={styles.cashFloatEuro}>€</span>
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

function SuggestionGroup({ label, color, items, newValue, onNewValueChange, onAdd, onRemove }) {
  const handleAdd = () => {
    if (newValue.trim()) { onAdd(newValue.trim()); onNewValueChange(''); }
  };
  return (
    <div className={styles.suggestionGroup}>
      <div className={styles.suggestionGroupLabel} style={{ color }}>{label}</div>
      <div className={styles.suggestionList}>
        {items.map((s, i) => (
          <div key={i} className={styles.suggestionItem}>
            <span className={styles.suggestionText}>{s}</span>
            <button onClick={() => onRemove(i)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} aria-label="Supprimer">
              <TrashSvg />
            </button>
          </div>
        ))}
      </div>
      <div className={styles.suggestionAdd}>
        <input
          type="text"
          value={newValue}
          onChange={e => onNewValueChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Nouveau libellé…"
          className={styles.suggestionInput}
        />
        <button onClick={handleAdd} className={shared.btn} style={{ whiteSpace: 'nowrap', width: 'auto', paddingInline: 20 }}>
          + Ajouter
        </button>
      </div>
    </div>
  );
}

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

        <label className={styles.editFieldLabel}>Emoji</label>
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

        <label className={styles.editFieldLabel}>Nom</label>
        <input
          type="text" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Ex : Bière, Soda…"
          className={styles.textInput}
        />

        <label className={styles.editFieldLabel}>Prix unitaire (€)</label>
        <input
          type="text" inputMode="decimal" value={form.price} onChange={e => set('price', e.target.value)}
          placeholder="2,00"
          className={styles.textInput}
        />

        <label className={styles.editFieldLabel}>Couleur</label>
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
