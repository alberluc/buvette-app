import { useState, useEffect, useMemo } from 'react';
import { AppHeader, Icon } from '../../../components/UI';
import { useMembres } from '../context';
import { fetchMembers, downloadMembersCsv } from '../lib/api';
import { MemberModal } from '../components/MemberModal';
import styles from './MembersScreen.module.css';

const STATUS_FILTERS = [
  { v: 'active',   l: 'Actifs' },
  { v: 'inactive', l: 'Inactifs' },
  { v: 'all',      l: 'Tous' },
];

// Recherche insensible à la casse et aux accents
const fold = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function MembersScreen() {
  const { sessionToken, canEdit } = useMembres();
  const [members, setMembers] = useState(null); // null = chargement en cours
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('active');
  const [opened, setOpened] = useState(null); // membre ouvert, {} = nouveau, null = fermé
  const [exportError, setExportError] = useState(null);

  // En ligne uniquement : rechargé à chaque ouverture de l'écran, jamais mis en cache sur l'appareil
  useEffect(() => {
    let cancelled = false;
    fetchMembers(sessionToken)
      .then(list => { if (!cancelled) { setMembers(list); setLoadError(null); } })
      .catch(e => { if (!cancelled) setLoadError(e instanceof TypeError ? 'offline' : e.message); });
    return () => { cancelled = true; };
  }, [sessionToken, reloadKey]);

  const visible = useMemo(() => {
    if (!members) return [];
    const q = fold(query.trim());
    return members.filter(m =>
      (status === 'all' || m.status === status) &&
      (!q || [m.firstName, m.lastName, m.email, m.phone, m.city].some(v => fold(v).includes(q)))
    );
  }, [members, query, status]);

  const counts = useMemo(() => ({
    active: members?.filter(m => m.status === 'active').length ?? 0,
    all: members?.length ?? 0,
  }), [members]);

  const handleSaved = saved => {
    setMembers(prev => {
      const exists = prev.some(m => m.id === saved.id);
      const next = exists ? prev.map(m => m.id === saved.id ? saved : m) : [...prev, saved];
      return next.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr') || a.firstName.localeCompare(b.firstName, 'fr'));
    });
    setOpened(null);
  };

  const handleDeleted = id => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setOpened(null);
  };

  const handleExport = async () => {
    setExportError(null);
    try {
      const blob = await downloadMembersCsv(sessionToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `membres-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Export impossible (hors ligne ?)');
    }
  };

  const headerRight = members && (
    <div className={styles.headerRight}>
      <div className={styles.headerStat}>
        <span className={styles.headerStatValue}>{counts.active}</span>
        <span className={styles.headerStatLabel}>actifs sur {counts.all}</span>
      </div>
      {canEdit && (
        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.secondaryBtn}>Exporter (CSV)</button>
          <button onClick={() => setOpened({})} className={styles.primaryBtn}>
            <Icon.Plus size={18} /> Nouveau membre
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.screen}>
      <AppHeader subtitle="ADHÉRENTS" title="Membres" right={headerRight} />

      {loadError ? (
        <div className={styles.stateBox}>
          <div className={styles.stateTitle}>
            {loadError === 'offline' ? 'Connexion requise' : 'Impossible de charger les membres'}
          </div>
          <div className={styles.stateText}>
            {loadError === 'offline'
              ? 'Les données des membres ne sont jamais enregistrées sur l\'appareil : une connexion internet est nécessaire pour les consulter.'
              : loadError}
          </div>
          <button onClick={() => { setMembers(null); setReloadKey(k => k + 1); }} className={styles.secondaryBtn}>Réessayer</button>
        </div>
      ) : !members ? (
        <div className={styles.stateBox}><div className={styles.stateText}>Chargement…</div></div>
      ) : (
        <div className={styles.body}>
          <div className={styles.toolbar}>
            <input
              type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un nom, un email, une ville…"
              className={styles.search}
            />
            <div className={styles.segmented}>
              {STATUS_FILTERS.map(f => (
                <button key={f.v} onClick={() => setStatus(f.v)}
                  className={`${styles.segBtn} ${status === f.v ? styles.segBtnActive : ''}`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          {exportError && <div className={styles.inlineError}>{exportError}</div>}

          {visible.length === 0 ? (
            <div className={styles.empty}>
              {members.length === 0
                ? (canEdit ? 'Aucun membre pour l\'instant. Ajoutez le premier avec « Nouveau membre ».' : 'Aucun membre enregistré.')
                : 'Aucun membre ne correspond à la recherche.'}
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Ville</th>
                    <th>Adhérent depuis</th>
                    <th>Statut</th>
                    <th>RGPD</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(m => (
                    <MemberRow key={m.id} member={m} onOpen={() => setOpened(m)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {opened && (
        <MemberModal
          member={opened.id ? opened : null}
          canEdit={canEdit}
          sessionToken={sessionToken}
          onClose={() => setOpened(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

function MemberRow({ member: m, onOpen }) {
  return (
    <tr onClick={onOpen} className={styles.row}>
      <td className={styles.nameCell}>
        <span className={styles.lastName}>{m.lastName}</span> {m.firstName}
      </td>
      <td className={styles.muted} data-label="Email">{m.email || '—'}</td>
      <td className={styles.muted} data-label="Téléphone">{m.phone || '—'}</td>
      <td className={styles.muted} data-label="Ville">{m.city || '—'}</td>
      <td className={styles.muted} data-label="Adhérent depuis">{m.memberSince ? m.memberSince.slice(0, 4) : '—'}</td>
      <td data-label="Statut">
        <span className={`${styles.badge} ${m.status === 'active' ? styles.badgeActive : styles.badgeInactive}`}>
          {m.status === 'active' ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td data-label="RGPD">
        {m.consentAt
          ? <span className={styles.consentOk} title="Consentement recueilli"><Icon.Check size={16} /></span>
          : <span className={styles.consentMissing}>À recueillir</span>}
      </td>
    </tr>
  );
}
