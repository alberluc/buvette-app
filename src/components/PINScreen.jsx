import { useState } from 'react';

// ── Icône backspace ──────────────────────────────────────────────────────────
function BackspaceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  );
}

// ── Touche numérique ─────────────────────────────────────────────────────────
function NumButton({ isDigit, onClick, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: 82, height: 82, borderRadius: '50%',
        border: isDigit ? '1.5px solid var(--line)' : 'none',
        background: pressed
          ? 'var(--cream-deep)'
          : isDigit ? 'var(--paper)' : 'transparent',
        display: 'grid', placeItems: 'center',
        cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 30, fontWeight: 600, color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        transition: 'background 80ms',
      }}>
      {children}
    </button>
  );
}

// ── Composant d'entrée PIN (réutilisé partout) ───────────────────────────────
function PINEntry({ title, subtitle, validatePIN, onSuccess, onCancel, errorLabel = 'Code incorrect' }) {
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const trySubmit = async (p) => {
    if (validatePIN) {
      const ok = await Promise.resolve(validatePIN(p));
      if (ok) {
        onSuccess(p);
      } else {
        setShaking(true);
        setErrorMsg(errorLabel);
        setTimeout(() => { setShaking(false); setPin(''); setErrorMsg(''); }, 700);
      }
    } else {
      onSuccess(p);
    }
  };

  const handleDigit = (d) => {
    if (pin.length >= 4 || shaking) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => trySubmit(next), 80);
  };

  const handleBack = () => { if (!shaking) setPin(p => p.slice(0, -1)); };

  const rows = [['1','2','3'], ['4','5','6'], ['7','8','9'], [null,'0','back']];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-10px); }
          35%      { transform: translateX(10px); }
          55%      { transform: translateX(-7px); }
          75%      { transform: translateX(7px); }
          90%      { transform: translateX(-3px); }
        }
      `}</style>

      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, textAlign: 'center' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, textAlign: 'center', maxWidth: 260, lineHeight: 1.45 }}>
          {subtitle}
        </div>
      )}

      {/* 4 points */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 10,
        animation: shaking ? 'pinShake 0.65s ease' : 'none',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            background: i < pin.length ? 'var(--club)' : 'transparent',
            border: `2.5px solid ${i < pin.length ? 'var(--club)' : 'var(--line)'}`,
            transition: 'background 100ms, border-color 100ms',
          }} />
        ))}
      </div>

      {/* Message d'erreur */}
      <div style={{ height: 20, marginBottom: 20, fontSize: 14, fontWeight: 600, color: 'var(--danger)', textAlign: 'center' }}>
        {errorMsg}
      </div>

      {/* Pavé numérique */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 8 }}>
            {row.map((key, ki) => {
              if (key === null) return <div key={ki} style={{ width: 82, height: 82 }} />;
              if (key === 'back') return (
                <NumButton key={ki} isDigit={false} onClick={handleBack}>
                  <BackspaceIcon />
                </NumButton>
              );
              return (
                <NumButton key={ki} isDigit onClick={() => handleDigit(key)}>
                  {key}
                </NumButton>
              );
            })}
          </div>
        ))}
      </div>

      {onCancel && (
        <button onClick={onCancel} style={{
          marginTop: 20, appearance: 'none', border: 'none', background: 'transparent',
          color: 'var(--ink-soft)', fontSize: 15, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Annuler</button>
      )}
    </div>
  );
}

// ── Écran de verrouillage plein écran (ouverture de l'app) ───────────────────
export function PINLockScreen({ storedPIN, isDefault, onSuccess, onResetData }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', position: 'relative',
    }}>
      {/* En-tête app */}
      <div style={{ marginBottom: 44, textAlign: 'center' }}>
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>🍺</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>Buvette Club</div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Caisse buvette</div>
      </div>

      <PINEntry
        title="Code PIN"
        subtitle="Saisir votre code pour accéder à l'application"
        validatePIN={(p) => p === storedPIN}
        onSuccess={onSuccess}
      />

      {/* Indication code par défaut (première utilisation) */}
      {isDefault && (
        <div style={{
          marginTop: 16, padding: '8px 16px',
          background: 'var(--club-soft)', borderRadius: 10,
          fontSize: 13, color: 'var(--club-deep)', fontWeight: 500,
          textAlign: 'center',
        }}>
          Code par défaut : <b>1234</b> — modifiable dans les paramètres
        </div>
      )}

      {/* Lien réinitialisation d'urgence */}
      <button
        onClick={() => setShowResetConfirm(true)}
        style={{
          position: 'absolute', bottom: 28,
          appearance: 'none', border: 'none', background: 'transparent',
          color: 'var(--ink-mute)', fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
        Code oublié ? Réinitialiser les données
      </button>

      {/* Confirmation de réinitialisation */}
      {showResetConfirm && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(20,15,8,0.5)',
          display: 'grid', placeItems: 'center', zIndex: 10,
        }}>
          <div style={{
            background: 'var(--paper)', borderRadius: 20, padding: '32px 36px',
            maxWidth: 360, textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
              Réinitialiser les données ?
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24 }}>
              Toutes les commandes et l'historique seront supprimés.<br />
              Le code PIN sera réinitialisé à <b>1234</b>.<br />
              Cette action est irréversible.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowResetConfirm(false)} style={{
                flex: 1, height: 48, borderRadius: 10, border: '1.5px solid var(--line)',
                background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 600, color: 'var(--ink)',
              }}>Annuler</button>
              <button onClick={onResetData} style={{
                flex: 1, height: 48, borderRadius: 10, border: 'none',
                background: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 700, color: 'white',
              }}>Réinitialiser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modale de vérification PIN (confirmation d'une action) ───────────────────
export function PINChallenge({ title, description, storedPIN, onSuccess, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.55)',
      display: 'grid', placeItems: 'center', zIndex: 300,
      animation: 'fadeIn 160ms ease',
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{
        background: 'var(--cream)', borderRadius: 24, padding: '40px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
      }}>
        <PINEntry
          title={title}
          subtitle={description}
          validatePIN={(p) => p === storedPIN}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

// ── Modale de changement de code PIN (3 étapes) ──────────────────────────────
export function ChangePINModal({ storedPIN, onSave, onClose }) {
  const [step, setStep] = useState('current'); // 'current' | 'new' | 'confirm'
  const [newPIN, setNewPIN] = useState('');

  const stepLabel = { current: '1 / 3', new: '2 / 3', confirm: '3 / 3' }[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.55)',
      display: 'grid', placeItems: 'center', zIndex: 300,
      animation: 'fadeIn 160ms ease',
    }}>
      <div style={{
        background: 'var(--cream)', borderRadius: 24, padding: '36px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.35)', minWidth: 380,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
          color: 'var(--ink-mute)', textTransform: 'uppercase',
          marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>{stepLabel}</span>
          <span style={{ color: 'var(--line)' }}>—</span>
          <span>Changer le code PIN</span>
        </div>

        {/* Barre de progression */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {['current','new','confirm'].map((s, i) => {
            const steps = ['current','new','confirm'];
            const active = steps.indexOf(step) >= i;
            return (
              <div key={s} style={{
                width: 40, height: 4, borderRadius: 2,
                background: active ? 'var(--club)' : 'var(--line)',
                transition: 'background 200ms',
              }} />
            );
          })}
        </div>

        {step === 'current' && (
          <PINEntry
            title="Code PIN actuel"
            subtitle="Saisir votre code PIN actuel pour continuer"
            validatePIN={(p) => p === storedPIN}
            onSuccess={() => setStep('new')}
            onCancel={onClose}
          />
        )}
        {step === 'new' && (
          <PINEntry
            title="Nouveau code PIN"
            subtitle="Saisir votre nouveau code à 4 chiffres"
            onSuccess={(p) => { setNewPIN(p); setStep('confirm'); }}
            onCancel={onClose}
          />
        )}
        {step === 'confirm' && (
          <PINEntry
            title="Confirmer le nouveau code"
            subtitle="Saisir à nouveau le même code"
            validatePIN={(p) => p === newPIN}
            onSuccess={(p) => { onSave(p); onClose(); }}
            onCancel={onClose}
            errorLabel="Les codes ne correspondent pas"
          />
        )}
      </div>
    </div>
  );
}
