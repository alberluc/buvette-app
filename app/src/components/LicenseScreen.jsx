import { useState, useRef } from 'react'
import { activateLicense, refreshLicense } from '../lib/api'
import styles from './LicenseScreen.module.css'

const BUY_URL = 'https://assolyte.fr/#price'

const ERROR_LABELS = {
  'Clé invalide': "Cette clé de licence n'existe pas.",
  'Licence révoquée': 'Licence révoquée. Contactez le support.',
  'Licence expirée': 'Licence expirée. Contactez le support.',
}

function normalizeError(msg) {
  return ERROR_LABELS[msg] || 'Impossible de joindre le serveur. Vérifiez votre connexion.'
}

function ClipboardSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
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

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const raw = text.toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!raw) return
      setGroups(Array.from({ length: 4 }, (_, i) => raw.slice(i * 4, i * 4 + 4)))
      setError('')
      refs[Math.min(3, Math.floor(raw.length / 4))].current?.focus()
    } catch {
      // Permission refusée ou API indisponible
    }
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
    <>
      <div className={styles.keyRow}>
        {groups.map((g, i) => (
          <div key={i} className={styles.keyGroup}>
            <input
              ref={refs[i]}
              value={g}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              maxLength={4}
              autoCapitalize="characters"
              className={`${styles.keyInput} ${g.length === 4 ? styles.keyInputFilled : ''}`}
            />
            {i < 3 && <span className={styles.separator}>–</span>}
          </div>
        ))}
      </div>
      <button type="button" onClick={handlePasteFromClipboard} className={styles.pasteBtn}>
        <ClipboardSvg /> Coller depuis le presse-papier
      </button>
    </>
  )

  return (
    <div className={styles.screen}>
      <div className={styles.brand}>
        <img src="/logo.png" className={styles.brandLogo} alt="Assolyte" />
        <div className={styles.brandName}>Assolyte</div>
        <div className={styles.brandSub}>Caisse buvette</div>
      </div>

      <div className={styles.card}>
        {mode === 'expired' ? (
          <>
            <h2 className={styles.title}>Renouvellement requis</h2>
            <p className={`${styles.subtitle} ${styles.subtitleSm}`}>
              Votre licence a expiré. Connectez-vous à internet pour la renouveler automatiquement.
            </p>
            <button onClick={handleRefresh} disabled={loading} className={styles.primaryBtn}>
              {loading ? 'Renouvellement…' : 'Renouveler la licence'}
            </button>
            {error && <div className={styles.error}>{error}</div>}
            <hr className={styles.divider} />
            <p className={styles.newKeyLabel}>Vous avez une nouvelle clé de licence ?</p>
            {keyInput}
            <button
              onClick={handleActivate} disabled={!isComplete || loading}
              className={styles.secondaryBtn}>
              Activer une nouvelle clé
            </button>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Activation</h2>
            <p className={styles.subtitle}>Saisir la clé de licence reçue lors de votre achat.</p>
            {keyInput}
            {error && <div className={styles.error}>{error}</div>}
            <button
              onClick={handleActivate} disabled={!isComplete || loading}
              className={`${styles.primaryBtn} ${error ? styles.primaryBtnMtSm : styles.primaryBtnMt}`}>
              {loading ? 'Activation…' : 'Activer'}
            </button>
          </>
        )}
      </div>

      <div className={styles.buySection}>
        <p className={styles.buyText}>
          {mode === 'expired' ? 'Besoin de renouveler votre abonnement ?' : 'Pas encore de licence ?'}
        </p>
        <a href={BUY_URL} target="_blank" rel="noopener noreferrer" className={styles.buyBtn}>
          Obtenir une licence →
        </a>
      </div>
    </div>
  )
}
