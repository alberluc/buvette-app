import { useState } from 'react';
import { Icon } from '../../../components/UI';
import { formatDate } from '../../../lib/format';
import { createMember, updateMember, deleteMember } from '../lib/api';
import styles from './MemberModal.module.css';

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', postalCode: '', city: '',
  birthDate: '', memberSince: '', status: 'active', notes: '',
};

// member = null → création. canEdit = false → fiche en lecture seule.
export function MemberModal({ member, canEdit, sessionToken, onClose, onSaved, onDeleted }) {
  const isNew = !member;
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY };
    for (const k of Object.keys(EMPTY)) if (member?.[k] != null) base[k] = member[k];
    if (isNew) base.memberSince = new Date().toISOString().slice(0, 10);
    return base;
  });
  const [consent, setConsent] = useState(!!member?.consentAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.firstName.trim() && form.lastName.trim();
  const readOnly = !canEdit;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true); setError('');
    try {
      const payload = { ...form, consent };
      const saved = isNew
        ? await createMember(sessionToken, payload)
        : await updateMember(sessionToken, member.id, payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof TypeError ? 'Connexion impossible — réessayez une fois en ligne.' : e.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true); setError('');
    try {
      await deleteMember(sessionToken, member.id);
      onDeleted(member.id);
    } catch (e) {
      setError(e instanceof TypeError ? 'Connexion impossible — réessayez une fois en ligne.' : e.message);
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const field = (k, label, props = {}) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input value={form[k]} onChange={e => set(k, e.target.value)} disabled={readOnly} className={styles.input} {...props} />
    </label>
  );

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <div className={styles.kicker}>{isNew ? 'Nouveau membre' : readOnly ? 'Fiche membre' : 'Modifier le membre'}</div>
            <h2 className={styles.title}>
              {isNew && !form.lastName ? 'Nouveau membre' : `${form.firstName} ${form.lastName}`.trim()}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className={styles.closeBtn}><Icon.Close size={20} /></button>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            {field('firstName', 'Prénom *', { autoFocus: isNew })}
            {field('lastName', 'Nom *')}
            {field('email', 'Email', { type: 'email', inputMode: 'email' })}
            {field('phone', 'Téléphone', { type: 'tel', inputMode: 'tel' })}
            <div className={styles.span2}>{field('address', 'Adresse')}</div>
            {field('postalCode', 'Code postal', { inputMode: 'numeric' })}
            {field('city', 'Ville')}
            {field('birthDate', 'Date de naissance', { type: 'date' })}
            {field('memberSince', 'Adhérent depuis', { type: 'date' })}
          </div>

          <div className={styles.label}>Statut</div>
          <div className={styles.segmented}>
            {[{ v: 'active', l: 'Actif' }, { v: 'inactive', l: 'Inactif' }].map(o => (
              <button key={o.v} onClick={() => set('status', o.v)} disabled={readOnly}
                className={`${styles.segBtn} ${form.status === o.v ? styles.segBtnActive : ''}`}>
                {o.l}
              </button>
            ))}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Notes</span>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} disabled={readOnly}
              rows={3} className={styles.textarea} />
          </label>

          <label className={`${styles.consent} ${consent ? styles.consentOn : ''}`}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={readOnly} />
            <span>
              <span className={styles.consentTitle}>Consentement RGPD</span>
              <span className={styles.consentText}>
                Le membre a accepté que le club conserve ces informations pour la gestion des adhésions.
                {member?.consentAt && consent && <> Recueilli le {formatDate(member.consentAt)}.</>}
              </span>
            </span>
          </label>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        {canEdit && (
          <div className={styles.footer}>
            {!isNew && (
              confirmDelete ? (
                <div className={styles.confirmDelete}>
                  <span>Supprimer définitivement cette fiche ?</span>
                  <button onClick={() => setConfirmDelete(false)} className={styles.btnGhost}>Annuler</button>
                  <button onClick={handleDelete} disabled={saving} className={styles.btnDanger}>Supprimer</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className={styles.btnDangerGhost}>
                  <Icon.Trash size={16} /> Supprimer
                </button>
              )
            )}
            {!confirmDelete && (
              <div className={styles.footerRight}>
                <button onClick={onClose} className={styles.btnGhost}>Annuler</button>
                <button onClick={handleSave} disabled={!valid || saving} className={styles.btnPrimary}>
                  {saving ? 'Enregistrement…' : isNew ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
