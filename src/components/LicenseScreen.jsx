import { useState, useRef } from 'react'
import { activateLicense, refreshLicense } from '../lib/api'

const ERROR_LABELS = {
  'Clé invalide': "Cette clé de licence n'existe pas.",
  'Licence révoquée': 'Licence révoquée. Contactez le support.',
  'Licence expirée': 'Licence expirée. Contactez le support.',
}

function normalizeError(msg) {
  return ERROR_LABELS[msg] || 'Impossible de joindre le serveur. Vérifiez votre connexion.'
}

export function LicenseScreen({ mode = 'activate', expiredToken, onActivated }) {
  const [groups, setGroups] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const r0 = useRef(null)
  const r1 = useRef(null)
  const r2 = useRef(null)
  const r3 = useRef(null)
  const refs = [r0, r1, r2, r3]

  const isComplete = groups.every(g => g.length === 4)
  const fullKey = groups.join('-')

  const handleChange = (i, val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    const next = [...groups]
    next[i] = clean
    setGroups(next)
    setError('')
    if (clean.length === 4 && i < 3) refs[i + 1].current?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && groups[i] === '' && i > 0) refs[i - 1].current?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const raw = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '')
    setGroups(Array.from({ length: 4 }, (_, i) => raw.slice(i * 4, i * 4 + 4)))
    refs[Math.min(3, Math.floor(raw.length / 4))].current?.focus()
  }

  const handleActivate = async () => {
    if (!isComplete || loading) return
    setLoading(true)
    setError('')
    try {
      const data = await activateLicense(fullKey)
      onActivated(data.token)
    } catch (e) {
      setError(normalizeError(e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const data = await refreshLicense(expiredToken)
      onActivated(data.token)
    } catch (e) {
      setError(normalizeError(e.message))
    } finally {
      setLoading(false)
    }
  }

  const keyInput = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      {groups.map((g, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            ref={refs[i]}
            value={g}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            maxLength={4}
            autoCapitalize="characters"
            style={{
              width: 72, height: 56, textAlign: 'center',
              fontSize: 20, fontWeight: 700, letterSpacing: 6,
              fontFamily: 'monospace',
              border: `1.5px solid ${g.length === 4 ? 'var(--club)' : 'var(--line)'}`,
              borderRadius: 10,
              background: g.length === 4 ? 'var(--club-soft)' : 'var(--cream)',
              color: 'var(--ink)', outline: 'none',
              transition: 'border-color 120ms, background 120ms',
            }}
          />
          {i < 3 && <span style={{ color: 'var(--ink-mute)', fontSize: 20, userSelect: 'none' }}>–</span>}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)',
    }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>🍺</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>Buvette Club</div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Caisse buvette</div>
      </div>

      <div style={{
        background: 'var(--paper)', borderRadius: 24,
        padding: '36px 44px', width: 480,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid var(--line)',
      }}>
        {mode === 'expired' ? (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
              Renouvellement requis
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', lineHeight: 1.5 }}>
              Votre licence a expiré. Connectez-vous à internet pour la renouveler automatiquement.
            </p>
            <button onClick={handleRefresh} disabled={loading} style={primaryBtnStyle(!loading)}>
              {loading ? 'Renouvellement…' : 'Renouveler la licence'}
            </button>
            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ margin: '24px 0 20px', borderTop: '1px solid var(--line)' }} />
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center' }}>
              Vous avez une nouvelle clé de licence ?
            </p>
            {keyInput}
            <button
              onClick={handleActivate} disabled={!isComplete || loading}
              style={{ ...secondaryBtnStyle(isComplete && !loading), marginTop: 12 }}>
              Activer une nouvelle clé
            </button>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
              Activation
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', lineHeight: 1.5 }}>
              Saisir la clé de licence reçue lors de votre achat.
            </p>
            {keyInput}
            {error && <div style={errorStyle}>{error}</div>}
            <button onClick={handleActivate} disabled={!isComplete || loading} style={{ ...primaryBtnStyle(isComplete && !loading), marginTop: error ? 12 : 24 }}>
              {loading ? 'Activation…' : 'Activer'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function primaryBtnStyle(enabled) {
  return {
    display: 'block', width: '100%', height: 56, borderRadius: 12, border: 'none',
    background: enabled ? 'var(--club)' : 'var(--line)',
    color: enabled ? 'white' : 'var(--ink-mute)',
    fontSize: 17, fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit', transition: 'background 150ms',
  }
}

function secondaryBtnStyle(enabled) {
  return {
    display: 'block', width: '100%', height: 48, borderRadius: 12,
    border: '1.5px solid var(--line)', background: 'transparent',
    color: enabled ? 'var(--ink)' : 'var(--ink-mute)',
    fontSize: 15, fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit',
  }
}

const errorStyle = {
  marginTop: 12, fontSize: 13, fontWeight: 600,
  color: 'var(--danger)', textAlign: 'center',
}
