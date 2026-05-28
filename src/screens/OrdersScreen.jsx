import { useState, useMemo, useRef } from 'react';
import { AppHeader, Icon, BigButton, PayBadge } from '../components/UI';
import { PRODUCTS, fmtEUR } from '../lib/data';

export function OrdersScreen({ day, onAddOrder, onRemoveOrder }) {
  const orders = day.orders;
  const dayClosed = day.dayClosed;
  const [modalOpen, setModalOpen] = useState(false);
  const summary = useMemo(() => {
    let total = 0;
    for (const o of orders) total += o.total;
    return { total, count: orders.length };
  }, [orders]);
  const listRef = useRef(null);

  const display = [...orders].reverse();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <AppHeader
        subtitle={day.date.toUpperCase()}
        title="Journal des commandes"
        right={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 6 }}>
              Total du jour
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--club)', letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>
              {fmtEUR(summary.total)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 2 }}>
              {summary.count} commande{summary.count > 1 ? 's' : ''}{day.label ? ` · ${day.label}` : ''}
            </div>
          </div>
        }
      />

      <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '16px 24px 120px' }}>
        {display.length === 0 && (
          <div style={{ margin: '80px auto', maxWidth: 420, textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Aucune commande pour l'instant
            </div>
            <div style={{ fontSize: 16 }}>
              Appuyez sur le bouton « + » en bas à droite pour enregistrer la première commande de la journée.
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {display.map((o, i) => {
            const originalIndex = orders.length - 1 - i;
            return (
              <OrderRow
                key={display.length - i}
                order={o}
                orderIndex={originalIndex}
                dayClosed={dayClosed}
                onRemove={onRemoveOrder}
              />
            );
          })}
        </div>
      </div>

      {!dayClosed && (
        <button
          onClick={() => setModalOpen(true)}
          style={{
            position: 'absolute', right: 28, bottom: 28,
            width: 92, height: 92, borderRadius: '50%',
            border: 'none', background: 'var(--club)', color: 'white',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            boxShadow: '0 12px 28px rgba(31,111,63,0.40), 0 4px 8px rgba(0,0,0,0.10)',
            transition: 'transform 120ms, background 120ms',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Nouvelle commande">
          <Icon.Plus size={44} />
        </button>
      )}

      {dayClosed && (
        <div style={{
          position: 'absolute', right: 28, bottom: 28,
          padding: '14px 22px', background: 'var(--ink)', color: 'var(--cream)',
          borderRadius: 12, fontSize: 15, fontWeight: 600,
          boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
        }}>
          Journée clôturée — ouvrir une nouvelle journée pour saisir
        </div>
      )}

      {modalOpen && (
        <NewOrderModal
          onClose={() => setModalOpen(false)}
          onValidate={(items, payment) => {
            const now = new Date();
            const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const total = items.reduce((s, [pid, q]) => {
              const p = PRODUCTS.find(x => x.id === pid);
              return s + p.price * q;
            }, 0);
            onAddOrder({ id: crypto.randomUUID(), time, items, payment, total });
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function OrderRow({ order, orderIndex, dayClosed, onRemove }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <div style={{
        background: 'var(--paper)', border: '1px solid var(--line-soft)',
        borderRadius: 14, padding: '16px 22px',
        display: 'grid', gridTemplateColumns: '76px 1fr auto auto auto',
        alignItems: 'center', gap: 18,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
          {order.time}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
          {order.items.map(([pid, q]) => {
            const p = PRODUCTS.find(x => x.id === pid);
            return (
              <span key={pid} style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 500, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontWeight: 800, color: 'var(--club)', fontVariantNumeric: 'tabular-nums' }}>{q}</span>
                <span>×</span>
                <span>{p.name}</span>
              </span>
            );
          })}
        </div>
        <PayBadge kind={order.payment} />
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'right', letterSpacing: -0.3 }}>
          {fmtEUR(order.total)}
        </div>
        {!dayClosed ? (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Supprimer la commande"
            style={{
              appearance: 'none', border: '1.5px solid var(--line-soft)',
              background: 'transparent', color: 'var(--ink-mute)',
              width: 44, height: 44, borderRadius: 10,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'color 120ms, border-color 120ms, background 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.background = '#FDE8E6'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-mute)'; e.currentTarget.style.borderColor = 'var(--line-soft)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon.Trash size={20} />
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>

      {confirmDelete && (
        <DeleteConfirmModal
          order={order}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onRemove(order, orderIndex); }}
        />
      )}
    </>
  );
}

function DeleteConfirmModal({ order, onCancel, onConfirm }) {
  const itemSummary = order.items.map(([pid, q]) => {
    const p = PRODUCTS.find(x => x.id === pid);
    return `${q} × ${p.name}`;
  }).join('  ·  ');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,15,8,0.45)',
      display: 'grid', placeItems: 'center', zIndex: 200,
    }}>
      <div style={{
        background: 'var(--cream)', borderRadius: 20, padding: '32px 40px',
        minWidth: 360, maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Supprimer cette commande ?
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 6 }}>
          {order.time} · {itemSummary}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginBottom: 28 }}>
          {fmtEUR(order.total)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 52, borderRadius: 12,
            border: '1.5px solid var(--line)', background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, color: 'var(--ink)',
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            flex: 1, height: 52, borderRadius: 12,
            border: 'none', background: 'var(--danger)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: 'white',
          }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onValidate }) {
  const [cart, setCart] = useState({});
  const [payment, setPayment] = useState('especes');

  const bump = (pid, delta) => {
    setCart(c => {
      const next = { ...c };
      next[pid] = Math.max(0, (next[pid] || 0) + delta);
      return next;
    });
  };

  const items = Object.entries(cart).filter(([, q]) => q > 0);
  const total = items.reduce((s, [pid, q]) => {
    const p = PRODUCTS.find(x => x.id === pid);
    return s + p.price * q;
  }, 0);
  const itemCount = items.reduce((s, [, q]) => s + q, 0);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,15,8,0.45)',
      display: 'grid', placeItems: 'center', zIndex: 100,
      animation: 'fadeIn 160ms ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        width: 980, maxHeight: 720, background: 'var(--cream)',
        borderRadius: 22, display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
        animation: 'slideUp 220ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{
          padding: '22px 28px', borderBottom: '1px solid var(--line)',
          background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 4 }}>
              Nouvelle commande
            </div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Sélectionner les produits</h2>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', border: '1.5px solid var(--line)', background: 'transparent',
            width: 52, height: 52, borderRadius: 12, display: 'grid', placeItems: 'center',
            cursor: 'pointer', color: 'var(--ink)',
          }} aria-label="Fermer">
            <Icon.Close size={24} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p} qty={cart[p.id] || 0}
                         onMinus={() => bump(p.id, -1)} onPlus={() => bump(p.id, +1)} />
          ))}
        </div>

        <div style={{
          padding: '18px 28px', background: 'var(--paper)', borderTop: '1px solid var(--line)',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 8 }}>
              Mode de paiement
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <PaymentChoice value="especes" current={payment} onSelect={setPayment} label="Espèces" hint="(par défaut)" />
              <PaymentChoice value="carte"   current={payment} onSelect={setPayment} label="Carte" />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 4 }}>
              Total
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--club)', letterSpacing: -0.8, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {fmtEUR(total)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
              {itemCount === 0 ? 'Aucun produit' : `${itemCount} produit${itemCount > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px 20px', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <BigButton variant="ghost" onClick={onClose} style={{ minWidth: 160 }}>
            Annuler
          </BigButton>
          <BigButton
            variant="primary" disabled={itemCount === 0}
            icon={<Icon.Check size={28} />}
            style={{ flex: 1, fontSize: 24, height: 80 }}
            onClick={() => onValidate(items, payment)}>
            Valider la commande · {fmtEUR(total)}
          </BigButton>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, qty, onMinus, onPlus }) {
  const active = qty > 0;
  return (
    <div style={{
      background: 'var(--paper)',
      border: active ? '2px solid var(--club)' : '1.5px solid var(--line)',
      borderRadius: 16, padding: '16px 20px',
      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center', gap: 18, transition: 'border-color 120ms',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: product.color + '22', display: 'grid', placeItems: 'center',
        fontSize: 30, border: `1.5px solid ${product.color}55`,
      }}>{product.emoji}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 }}>{product.name}</div>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 2 }}>{fmtEUR(product.price)} l'unité</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CounterBtn onClick={onMinus} disabled={qty === 0} kind="minus" />
        <div style={{
          width: 60, textAlign: 'center', fontSize: 32, fontWeight: 800,
          color: active ? 'var(--club)' : 'var(--ink-mute)',
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
        }}>{qty}</div>
        <CounterBtn onClick={onPlus} kind="plus" />
      </div>
    </div>
  );
}

function CounterBtn({ onClick, disabled, kind }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        appearance: 'none', width: 56, height: 56, borderRadius: 12,
        border: '1.5px solid ' + (disabled ? 'var(--line-soft)' : 'var(--line)'),
        background: pressed ? 'var(--cream-deep)' : (disabled ? 'transparent' : 'var(--cream)'),
        color: disabled ? 'var(--ink-mute)' : 'var(--ink)',
        display: 'grid', placeItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 80ms',
      }}>
      {kind === 'plus' ? <Icon.Plus size={26} /> : <Icon.Minus size={26} />}
    </button>
  );
}

function PaymentChoice({ value, current, onSelect, label, hint }) {
  const on = current === value;
  return (
    <button onClick={() => onSelect(value)} style={{
      appearance: 'none',
      border: on ? '2px solid var(--club)' : '1.5px solid var(--line)',
      background: on ? 'var(--club-soft)' : 'transparent',
      color: on ? 'var(--club-deep)' : 'var(--ink)',
      height: 60, padding: '0 22px', borderRadius: 12,
      fontFamily: 'inherit', fontSize: 19, fontWeight: 700, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 120ms',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        border: on ? '6px solid var(--club)' : '2px solid var(--ink-mute)',
        background: 'var(--paper)', boxSizing: 'border-box',
      }} />
      {label}
      {hint && <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>{hint}</span>}
    </button>
  );
}
