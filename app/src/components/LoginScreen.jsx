import { useState, useRef, useEffect } from 'react'
import { setupFirstAccount, login, createAccount, deleteAccount, changePassword, verifyPassword } from '../lib/api'
import { PwaInstallButton } from './UI'
import styles from './LoginScreen.module.css'

// ── Composants partagés ────────────────────────────────────────────────────────

function Avatar({ name, active, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
      background: active ? 'var(--club)' : 'var(--cream)',
      border: '1.5px solid ' + (active ? 'var(--club)' : 'var(--line)'),
      display: 'grid', placeItems: 'center',
      fontSize: Math.round(size * 0.4), fontWeight: 700,
      color: active ? 'white' : 'var(--ink)',
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function AppBrand({ subtitle }) {
  return (
    <div className={styles.brand}>
      <div className={styles.brandEmoji}>🍺</div>
      <div className={styles.brandName}>Assolyte</div>
      <div className={styles.brandSub}>{subtitle}</div>
    </div>
  )
}

function FieldLabel({ children, mt }) {
  return (
    <div className={`${styles.fieldLabel} ${mt ? styles.fieldLabelMt : ''}`}>
      {children}
    </div>
  )
}

// ── Modale confirmation réinitialisation ───────────────────────────────────────
function ResetConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmModal}>
        <div className={styles.confirmTitle}>Réinitialiser les données ?</div>
        <div className={styles.confirmBody}>
          Toutes les commandes et l'historique locaux seront supprimés.<br />
          Les comptes restent accessibles via l'API.<br />
          Cette action est irréversible.
        </div>
        <div className={styles.confirmBtns}>
          <button onClick={onCancel} className={styles.btnCancel}>Annuler</button>
          <button onClick={onConfirm} className={styles.btnDanger}>Réinitialiser</button>
        </div>
      </div>
    </div>
  )
}

// ── Configuration initiale ─────────────────────────────────────────────────────
function SetupScreen({ licenseToken, onSuccess, onLeaveLicense, clubName }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordMismatch = confirm.length > 0 && password !== confirm
  const passwordShort = password.length > 0 && password.length < 4
  const valid = name.trim().length > 0 && password.length >= 4 && password === confirm

  const handleCreate = async () => {
    if (!valid || loading) return
    setLoading(true)
    setError('')
    try {
      const data = await setupFirstAccount(licenseToken, { name, password })
      onSuccess(data.token)
    } catch (e) {
      setError(e.message === 'Des comptes existent déjà' ? 'Des comptes existent déjà. Rafraîchissez la page.' : (e.message || 'Impossible de joindre le serveur.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <AppBrand subtitle="Configuration initiale" />
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Créer le compte administrateur</h2>
        <p className={styles.cardSubtitle}>
          Ce compte pourra gérer les utilisateurs et clôturer la caisse.
        </p>
        <FieldLabel>Nom</FieldLabel>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Marie Dupont" className={styles.input} autoFocus />
        <FieldLabel mt>Mot de passe</FieldLabel>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} />
        {passwordShort && <div className={styles.inlineWarn}>Minimum 4 caractères.</div>}
        <FieldLabel mt>Confirmer le mot de passe</FieldLabel>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} className={styles.input} />
        {passwordMismatch && <div className={styles.inlineError}>Les mots de passe ne correspondent pas.</div>}
        {error && <div className={styles.centerError}>{error}</div>}
        <button onClick={handleCreate} disabled={!valid || loading} className={styles.primaryBtn} style={{ marginTop: 24 }}>
          {loading ? 'Création…' : 'Créer le compte'}
        </button>
      </div>
      {onLeaveLicense && (
        <div className={styles.bottomLinks}>
          <button onClick={onLeaveLicense} className={styles.leaveBtn}>
            Changer de licence{clubName ? ` · ${clubName}` : ''}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Écran de connexion ─────────────────────────────────────────────────────────
export function LoginScreen({ accounts, licenseToken, clubName, onLoginSuccess, onResetData, onLeaveLicense }) {
  const [selected, setSelected] = useState(accounts.length === 1 ? accounts[0] : null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (selected) setTimeout(() => inputRef.current?.focus(), 50)
  }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (accounts.length === 0) {
    return <SetupScreen licenseToken={licenseToken} onSuccess={onLoginSuccess} onLeaveLicense={onLeaveLicense} clubName={clubName} />
  }

  const handleSelect = (acc) => { setSelected(acc); setPassword(''); setError('') }

  const handleLogin = async () => {
    if (!selected || !password || loading) return
    setLoading(true)
    setError('')
    try {
      const data = await login(licenseToken, { accountId: selected.id, password })
      onLoginSuccess(data.token)
    } catch (e) {
      setError(e.message || 'Impossible de joindre le serveur.')
      setPassword('')
      setTimeout(() => inputRef.current?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <AppBrand subtitle="Caisse buvette" />

      <div className={styles.card}>
        <h2 className={styles.loginTitle}>Connexion</h2>

        <div className={styles.accountList}>
          {accounts.map(acc => {
            const active = selected?.id === acc.id
            return (
              <button key={acc.id} onClick={() => handleSelect(acc)}
                className={`${styles.accountBtn} ${active ? styles.accountBtnActive : ''}`}>
                <Avatar name={acc.name} active={active} />
                <div>
                  <div className={styles.accountBtnName}>{acc.name}</div>
                  <div className={styles.accountBtnRole}>
                    {acc.role === 'admin' ? 'Administrateur' : 'Bénévole'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selected && (
          <>
            <FieldLabel>Mot de passe</FieldLabel>
            <input
              ref={inputRef} type="password" value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Votre mot de passe"
              className={styles.input}
            />
            {error && <div className={styles.centerErrorSm}>{error}</div>}
            <button onClick={handleLogin} disabled={!password || loading} className={styles.primaryBtn} style={{ marginTop: 16 }}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </>
        )}
      </div>

      <div className={styles.bottomLinks}>
        <PwaInstallButton />
        {onLeaveLicense && (
          <button onClick={onLeaveLicense} className={styles.leaveBtn}>
            Changer de licence{clubName ? ` · ${clubName}` : ''}
          </button>
        )}
        <button onClick={() => setShowReset(true)} className={styles.resetBtn}>
          Réinitialiser les données locales
        </button>
      </div>

      {showReset && <ResetConfirmModal onCancel={() => setShowReset(false)} onConfirm={onResetData} />}
    </div>
  )
}

// ── Modale changement de mot de passe ─────────────────────────────────────────
export function ChangePasswordModal({ accountId, sessionToken, onClose }) {
  const [step, setStep] = useState('current')
  const [storedCurrentPwd, setStoredCurrentPwd] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const steps = ['current', 'new', 'confirm']
  const stepIdx = steps.indexOf(step)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [step])

  const handleCurrentSubmit = async () => {
    if (!inputVal || loading) return
    setLoading(true); setError('')
    try {
      await verifyPassword(sessionToken, inputVal)
      setStoredCurrentPwd(inputVal); setStep('new'); setInputVal('')
    } catch (e) {
      setError(e.message || 'Mot de passe incorrect'); setInputVal('')
    } finally { setLoading(false) }
  }

  const handleNewSubmit = () => {
    if (inputVal.length < 4) { setError('Minimum 4 caractères.'); return }
    setNewPassword(inputVal); setStep('confirm'); setError(''); setInputVal('')
  }

  const handleConfirmSubmit = async () => {
    if (inputVal !== newPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true); setError('')
    try {
      await changePassword(sessionToken, accountId, { currentPassword: storedCurrentPwd, newPassword })
      onClose()
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.changePwdModal}>
        <div className={styles.changePwdStepLabel}>{stepIdx + 1} / 3 — Changer le mot de passe</div>
        <div className={styles.changePwdSteps}>
          {steps.map((s, i) => (
            <div key={s} className={`${styles.changePwdStep} ${stepIdx >= i ? styles.changePwdStepDone : ''}`} />
          ))}
        </div>

        {step === 'current' && (
          <StepForm title="Mot de passe actuel" subtitle="Saisir votre mot de passe actuel pour continuer"
            value={inputVal} onChange={setInputVal} onSubmit={handleCurrentSubmit} onCancel={onClose}
            error={error} loading={loading} inputRef={inputRef} />
        )}
        {step === 'new' && (
          <StepForm title="Nouveau mot de passe" subtitle="Minimum 4 caractères"
            value={inputVal} onChange={setInputVal} onSubmit={handleNewSubmit} onCancel={onClose}
            error={error} btnLabel="Continuer" inputRef={inputRef} />
        )}
        {step === 'confirm' && (
          <StepForm title="Confirmer le nouveau mot de passe" subtitle="Saisir à nouveau le même mot de passe"
            value={inputVal} onChange={setInputVal} onSubmit={handleConfirmSubmit} onCancel={onClose}
            error={error} loading={loading} btnLabel="Enregistrer" inputRef={inputRef} />
        )}
      </div>
    </div>
  )
}

function StepForm({ title, subtitle, value, onChange, onSubmit, onCancel, error, loading, btnLabel = 'Continuer', inputRef }) {
  return (
    <div>
      <div className={styles.stepTitle}>{title}</div>
      <div className={styles.stepSubtitle}>{subtitle}</div>
      <FieldLabel>Mot de passe</FieldLabel>
      <input ref={inputRef} type="password" value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        className={styles.input} />
      {error && <div className={styles.centerErrorSm}>{error}</div>}
      <button onClick={onSubmit} disabled={!value || loading} className={styles.primaryBtn} style={{ marginTop: 20 }}>
        {loading ? 'Enregistrement…' : btnLabel}
      </button>
      <button onClick={onCancel} className={styles.cancelLink}>Annuler</button>
    </div>
  )
}

// ── Gestionnaire de comptes ────────────────────────────────────────────────────
export function AccountManager({ accounts: initialAccounts, currentUser, sessionToken, onClose }) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [view, setView] = useState('list')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [newPassword, setNewPassword] = useState('')
  const [newConfirm, setNewConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const passwordShort = newPassword.length > 0 && newPassword.length < 4
  const passwordMismatch = newConfirm.length > 0 && newPassword !== newConfirm
  const canAdd = newName.trim().length > 0 && newPassword.length >= 4 && newPassword === newConfirm

  const handleAdd = async () => {
    if (!canAdd || loading) return
    setLoading(true); setError('')
    try {
      const acc = await createAccount(sessionToken, { name: newName, password: newPassword, role: newRole })
      setAccounts(prev => [...prev, acc])
      setView('list')
      setNewName(''); setNewRole('user'); setNewPassword(''); setNewConfirm('')
    } catch (e) {
      setError(e.message || 'Erreur lors de la création.')
    } finally { setLoading(false) }
  }

  const handleDelete = async (acc) => {
    setLoading(true)
    try {
      await deleteAccount(sessionToken, acc.id)
      setAccounts(prev => prev.filter(a => a.id !== acc.id))
      setConfirmDelete(null)
    } catch (e) {
      setError(e.message || 'Erreur lors de la suppression.')
      setConfirmDelete(null)
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawerPanel}>
        <div className={styles.drawerHeader}>
          {view === 'add' && (
            <button onClick={() => { setView('list'); setError('') }} className={styles.drawerIconBtn}>←</button>
          )}
          <div className={styles.drawerHeaderFlex}>
            <div className={styles.drawerHeaderLabel}>Gestion des comptes</div>
            <h2 className={styles.drawerHeaderTitle}>{view === 'add' ? 'Nouveau compte' : 'Comptes'}</h2>
          </div>
          <button onClick={onClose} className={styles.drawerIconBtn}>✕</button>
        </div>

        <div className={styles.drawerBody}>
          {view === 'list' && (
            <>
              {error && <div className={styles.inlineError} style={{ marginBottom: 12 }}>{error}</div>}
              <div className={styles.accountItemsList}>
                {accounts.map(acc => (
                  <div key={acc.id} className={styles.accountItem}>
                    <Avatar name={acc.name} active={acc.id === currentUser.id} size={44} />
                    <div className={styles.accountItemInfo}>
                      <div className={styles.accountItemHeader}>
                        <span className={styles.accountItemName}>{acc.name}</span>
                        {acc.id === currentUser.id && (
                          <span className={styles.accountItemYou}>Vous</span>
                        )}
                      </div>
                      <div className={styles.accountItemRole}>
                        {acc.role === 'admin' ? 'Administrateur' : 'Bénévole'}
                      </div>
                    </div>
                    {acc.id !== currentUser.id && (
                      <button onClick={() => setConfirmDelete(acc)} disabled={loading} className={styles.accountItemDeleteBtn}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => { setView('add'); setError('') }} className={styles.addAccountBtn}>
                + Ajouter un compte
              </button>
            </>
          )}

          {view === 'add' && (
            <>
              <FieldLabel>Nom</FieldLabel>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex : Jean Martin" className={styles.input} autoFocus />
              <FieldLabel mt>Rôle</FieldLabel>
              <div className={styles.roleGroup}>
                {[{ v: 'user', l: 'Bénévole' }, { v: 'admin', l: 'Administrateur' }].map(o => (
                  <button key={o.v} onClick={() => setNewRole(o.v)}
                    className={`${styles.roleBtn} ${newRole === o.v ? styles.roleBtnActive : ''}`}>
                    {o.l}
                  </button>
                ))}
              </div>
              <FieldLabel>Mot de passe</FieldLabel>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={styles.input} />
              {passwordShort && <div className={styles.inlineWarn}>Minimum 4 caractères.</div>}
              <FieldLabel mt>Confirmer le mot de passe</FieldLabel>
              <input type="password" value={newConfirm} onChange={e => setNewConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} className={styles.input} />
              {passwordMismatch && <div className={styles.inlineError}>Les mots de passe ne correspondent pas.</div>}
              {error && <div className={styles.centerError}>{error}</div>}
              <button onClick={handleAdd} disabled={!canAdd || loading} className={styles.primaryBtn} style={{ marginTop: 24 }}>
                {loading ? 'Création…' : 'Créer le compte'}
              </button>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className={styles.confirmOverlay} style={{ position: 'absolute' }}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmTitle}>Supprimer le compte ?</div>
            <div className={styles.confirmBody}>
              Le compte de <b>{confirmDelete.name}</b> sera supprimé définitivement.
            </div>
            <div className={styles.confirmBtns}>
              <button onClick={() => setConfirmDelete(null)} className={styles.btnCancel}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={loading} className={styles.btnDanger}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
