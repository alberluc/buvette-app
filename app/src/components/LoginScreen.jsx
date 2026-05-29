import { useState, useRef, useEffect } from 'react'
import { setupFirstAccount, login, createAccount, deleteAccount, changePassword, verifyPassword } from '../lib/api'

// ── Helpers visuels ────────────────────────────────────────────────────────────
const inputStyle = {
  display: 'block', width: '100%', height: 52, borderRadius: 10,
  border: '1.5px solid var(--line)', background: 'var(--cream)',
  color: 'var(--ink)', fontSize: 16, fontFamily: 'inherit',
  padding: '0 14px', outline: 'none', boxSizing: 'border-box',
}

function primaryBtn(enabled) {
  return {
    display: 'block', width: '100%', height: 56, borderRadius: 12, border: 'none',
    background: enabled ? 'var(--club)' : 'var(--line)',
    color: enabled ? 'white' : 'var(--ink-mute)',
    fontSize: 17, fontWeight: 700, cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit', transition: 'background 150ms',
  }
}

function FieldLabel({ children, style }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6, ...(style || {}) }}>
      {children}
    </div>
  )
}

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

function AppHeader({ subtitle }) {
  return (
    <div style={{ marginBottom: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>🍺</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>Buvette Club</div>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>{subtitle}</div>
    </div>
  )
}

const cardStyle = {
  background: 'var(--paper)', borderRadius: 24,
  padding: '36px 44px', width: 480,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--line)',
}

function ResetConfirmModal({ onCancel, onConfirm }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,8,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
      <div style={{ background: 'var(--paper)', borderRadius: 20, padding: '32px 36px', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Réinitialiser les données ?</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24 }}>
          Toutes les commandes et l'historique locaux seront supprimés.<br />
          Les comptes restent accessibles via l'API.<br />
          Cette action est irréversible.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 48, borderRadius: 10, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 48, borderRadius: 10, border: 'none', background: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: 'white' }}>Réinitialiser</button>
        </div>
      </div>
    </div>
  )
}

// ── Configuration initiale (aucun compte) ─────────────────────────────────────
function SetupScreen({ licenseToken, onSuccess }) {
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <AppHeader subtitle="Configuration initiale" />
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, textAlign: 'center', color: 'var(--ink)' }}>
          Créer le compte administrateur
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', lineHeight: 1.5 }}>
          Ce compte pourra gérer les utilisateurs et clôturer la caisse.
        </p>
        <FieldLabel>Nom</FieldLabel>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Marie Dupont" style={inputStyle} autoFocus />
        <FieldLabel style={{ marginTop: 18 }}>Mot de passe</FieldLabel>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        {passwordShort && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--warn)', fontWeight: 600 }}>Minimum 4 caractères.</div>}
        <FieldLabel style={{ marginTop: 18 }}>Confirmer le mot de passe</FieldLabel>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} style={inputStyle} />
        {passwordMismatch && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>Les mots de passe ne correspondent pas.</div>}
        {error && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleCreate} disabled={!valid || loading} style={{ ...primaryBtn(valid && !loading), marginTop: 24 }}>
          {loading ? 'Création…' : 'Créer le compte'}
        </button>
      </div>
    </div>
  )
}

// ── Écran de connexion ────────────────────────────────────────────────────────
export function LoginScreen({ accounts, licenseToken, onLoginSuccess, onResetData }) {
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
    return <SetupScreen licenseToken={licenseToken} onSuccess={onLoginSuccess} />
  }

  const handleSelect = (acc) => {
    setSelected(acc)
    setPassword('')
    setError('')
  }

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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', position: 'relative' }}>
      <AppHeader subtitle="Caisse buvette" />

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, textAlign: 'center', color: 'var(--ink)' }}>Connexion</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {accounts.map(acc => {
            const active = selected?.id === acc.id
            return (
              <button
                key={acc.id}
                onClick={() => handleSelect(acc)}
                style={{
                  appearance: 'none',
                  border: active ? '2px solid var(--club)' : '1.5px solid var(--line)',
                  background: active ? 'var(--club-soft)' : 'transparent',
                  borderRadius: 12, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'border-color 120ms, background 120ms',
                }}
              >
                <Avatar name={acc.name} active={active} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: active ? 'var(--club-deep)' : 'var(--ink)' }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 1 }}>
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
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Votre mot de passe"
              style={inputStyle}
            />
            {error && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
            <button onClick={handleLogin} disabled={!password || loading} style={{ ...primaryBtn(!!password && !loading), marginTop: 16 }}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setShowReset(true)}
        style={{ position: 'absolute', bottom: 28, appearance: 'none', border: 'none', background: 'transparent', color: 'var(--ink-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Réinitialiser les données locales
      </button>

      {showReset && <ResetConfirmModal onCancel={() => setShowReset(false)} onConfirm={onResetData} />}
    </div>
  )
}

// ── Modale changement de mot de passe ─────────────────────────────────────────
export function ChangePasswordModal({ accountId, sessionToken, onClose }) {
  const [step, setStep] = useState('current') // 'current' | 'new' | 'confirm'
  const [storedCurrentPwd, setStoredCurrentPwd] = useState('')  // conservé entre étapes
  const [newPassword, setNewPassword] = useState('')            // conservé entre étapes
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const steps = ['current', 'new', 'confirm']
  const stepIdx = steps.indexOf(step)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [step])

  const handleCurrentSubmit = async () => {
    if (!inputVal || loading) return
    setLoading(true)
    setError('')
    try {
      await verifyPassword(sessionToken, inputVal)
      setStoredCurrentPwd(inputVal)
      setStep('new')
      setInputVal('')
    } catch (e) {
      setError(e.message || 'Mot de passe incorrect')
      setInputVal('')
    } finally {
      setLoading(false)
    }
  }

  const handleNewSubmit = () => {
    if (inputVal.length < 4) { setError('Minimum 4 caractères.'); return }
    setNewPassword(inputVal)
    setStep('confirm')
    setError('')
    setInputVal('')
  }

  const handleConfirmSubmit = async () => {
    if (inputVal !== newPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    setError('')
    try {
      await changePassword(sessionToken, accountId, { currentPassword: storedCurrentPwd, newPassword })
      onClose()
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.55)', display: 'grid', placeItems: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--cream)', borderRadius: 24, padding: '36px 52px', minWidth: 420, boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
          {stepIdx + 1} / 3 — Changer le mot de passe
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ width: 40, height: 4, borderRadius: 2, background: stepIdx >= i ? 'var(--club)' : 'var(--line)', transition: 'background 200ms' }} />
          ))}
        </div>

        {step === 'current' && (
          <StepForm
            title="Mot de passe actuel"
            subtitle="Saisir votre mot de passe actuel pour continuer"
            value={inputVal} onChange={setInputVal}
            onSubmit={handleCurrentSubmit} onCancel={onClose}
            error={error} loading={loading} inputRef={inputRef}
          />
        )}
        {step === 'new' && (
          <StepForm
            title="Nouveau mot de passe"
            subtitle="Minimum 4 caractères"
            value={inputVal} onChange={setInputVal}
            onSubmit={handleNewSubmit} onCancel={onClose}
            error={error} btnLabel="Continuer" inputRef={inputRef}
          />
        )}
        {step === 'confirm' && (
          <StepForm
            title="Confirmer le nouveau mot de passe"
            subtitle="Saisir à nouveau le même mot de passe"
            value={inputVal} onChange={setInputVal}
            onSubmit={handleConfirmSubmit} onCancel={onClose}
            error={error} loading={loading} btnLabel="Enregistrer" inputRef={inputRef}
          />
        )}
      </div>
    </div>
  )
}

function StepForm({ title, subtitle, value, onChange, onSubmit, onCancel, error, loading, btnLabel = 'Continuer', inputRef }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 6, color: 'var(--ink)' }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>{subtitle}</div>
      <FieldLabel>Mot de passe</FieldLabel>
      <input
        ref={inputRef}
        type="password" value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        style={inputStyle}
      />
      {error && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
      <button onClick={onSubmit} disabled={!value || loading} style={{ ...primaryBtn(!!value && !loading), marginTop: 20 }}>
        {loading ? 'Enregistrement…' : btnLabel}
      </button>
      <button onClick={onCancel} style={{ display: 'block', width: '100%', marginTop: 10, appearance: 'none', border: 'none', background: 'transparent', color: 'var(--ink-soft)', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
        Annuler
      </button>
    </div>
  )
}

// ── Gestionnaire de comptes ───────────────────────────────────────────────────
export function AccountManager({ accounts: initialAccounts, currentUser, sessionToken, onClose }) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [view, setView] = useState('list') // 'list' | 'add'
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
    setLoading(true)
    setError('')
    try {
      const acc = await createAccount(sessionToken, { name: newName, password: newPassword, role: newRole })
      setAccounts(prev => [...prev, acc])
      setView('list')
      setNewName(''); setNewRole('user'); setNewPassword(''); setNewConfirm('')
    } catch (e) {
      setError(e.message || 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.45)', zIndex: 250, display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`@keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      <div style={{ width: 480, height: '100%', background: 'var(--cream)', boxShadow: '-20px 0 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', animation: 'slideRight 220ms cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {view === 'add' && (
            <button onClick={() => { setView('list'); setError('') }} style={{ appearance: 'none', border: '1.5px solid var(--line)', background: 'transparent', width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)', flexShrink: 0, fontSize: 18 }}>←</button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 4 }}>Gestion des comptes</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{view === 'add' ? 'Nouveau compte' : 'Comptes'}</h2>
          </div>
          <button onClick={onClose} style={{ appearance: 'none', border: '1.5px solid var(--line)', background: 'transparent', width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)', flexShrink: 0, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 28px' }}>
          {view === 'list' && (
            <>
              {error && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={acc.name} active={acc.id === currentUser.id} size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{acc.name}</span>
                        {acc.id === currentUser.id && (
                          <span style={{ fontSize: 11, background: 'var(--club-soft)', color: 'var(--club-deep)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Vous</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>{acc.role === 'admin' ? 'Administrateur' : 'Bénévole'}</div>
                    </div>
                    {acc.id !== currentUser.id && (
                      <button onClick={() => setConfirmDelete(acc)} disabled={loading} style={{ appearance: 'none', border: '1.5px solid var(--line)', background: 'transparent', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--danger)', fontSize: 18 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => { setView('add'); setError('') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 52, borderRadius: 12, border: '1.5px dashed var(--line)', background: 'transparent', color: 'var(--ink-soft)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Ajouter un compte
              </button>
            </>
          )}

          {view === 'add' && (
            <>
              <FieldLabel>Nom</FieldLabel>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex : Jean Martin" style={inputStyle} autoFocus />
              <FieldLabel style={{ marginTop: 18 }}>Rôle</FieldLabel>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {[{ v: 'user', l: 'Bénévole' }, { v: 'admin', l: 'Administrateur' }].map(o => (
                  <button key={o.v} onClick={() => setNewRole(o.v)} style={{
                    flex: 1, height: 44, borderRadius: 10,
                    border: newRole === o.v ? '2px solid var(--club)' : '1.5px solid var(--line)',
                    background: newRole === o.v ? 'var(--club-soft)' : 'transparent',
                    color: newRole === o.v ? 'var(--club-deep)' : 'var(--ink)',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>{o.l}</button>
                ))}
              </div>
              <FieldLabel>Mot de passe</FieldLabel>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
              {passwordShort && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--warn)', fontWeight: 600 }}>Minimum 4 caractères.</div>}
              <FieldLabel style={{ marginTop: 18 }}>Confirmer le mot de passe</FieldLabel>
              <input type="password" value={newConfirm} onChange={e => setNewConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} style={inputStyle} />
              {passwordMismatch && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>Les mots de passe ne correspondent pas.</div>}
              {error && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{error}</div>}
              <button onClick={handleAdd} disabled={!canAdd || loading} style={{ ...primaryBtn(canAdd && !loading), marginTop: 24 }}>
                {loading ? 'Création…' : 'Créer le compte'}
              </button>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,8,0.5)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
          <div style={{ background: 'var(--paper)', borderRadius: 20, padding: '32px 36px', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Supprimer le compte ?</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24 }}>
              Le compte de <b>{confirmDelete.name}</b> sera supprimé définitivement.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, height: 48, borderRadius: 10, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={loading} style={{ flex: 1, height: 48, borderRadius: 10, border: 'none', background: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: 'white' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
