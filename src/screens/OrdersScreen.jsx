import { useState, useMemo, useRef } from 'react';
import { AppHeader, Icon, BigButton, PayBadge } from '../components/UI';
import { MouvementModal } from '../components/MouvementModal';
import { fmtEUR } from '../lib/data';
import styles from './OrdersScreen.module.css';

export function OrdersScreen({ day, products, onAddOrder, onRemoveOrder, onAddMouvement }) {
  const orders = day.orders;
  const dayClosed = day.dayClosed;
  const [modalOpen, setModalOpen] = useState(false);
  const [mouvementOpen, setMouvementOpen] = useState(false);
  const summary = useMemo(() => {
    let total = 0;
    for (const o of orders) total += o.total;
    return { total, count: orders.length };
  }, [orders]);
  const listRef = useRef(null);

  const display = [...orders].reverse();

  return (
    <div className={styles.screen}>
      <AppHeader
        subtitle={day.date.toUpperCase()}
        title="Journal des commandes"
        right={
          <div className={styles.headerRight}>
            <div className={styles.headerStatLabel}>Total du jour</div>
            <div className={styles.headerStatValue}>{fmtEUR(summary.total)}</div>
            <div className={styles.headerStatSub}>
              {summary.count} commande{summary.count > 1 ? 's' : ''}{day.label ? ` · ${day.label}` : ''}
            </div>
          </div>
        }
      />

      <div ref={listRef} className={styles.list}>
        {display.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Aucune commande pour l'instant</div>
            <div className={styles.emptyText}>
              Appuyez sur le bouton « + » en bas à droite pour enregistrer la première commande de la journée.
            </div>
          </div>
        )}
        <div className={styles.orderListInner}>
          {display.map((o, i) => {
            const originalIndex = orders.length - 1 - i;
            return (
              <OrderRow
                key={display.length - i}
                order={o}
                orderIndex={originalIndex}
                dayClosed={dayClosed}
                onRemove={onRemoveOrder}
                products={products}
              />
            );
          })}
        </div>
      </div>

      {!dayClosed && (
        <>
          <button
            onClick={() => setMouvementOpen(true)}
            className={styles.fabSecondary}
            aria-label="Mouvement de caisse"
            title="Mouvement de caisse"
          >
            <TransferSvg />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className={styles.fab}
            aria-label="Nouvelle commande"
          >
            <Icon.Plus size={44} />
          </button>
        </>
      )}

      {dayClosed && (
        <div className={styles.closedBadge}>
          Journée clôturée — ouvrir une nouvelle journée pour saisir
        </div>
      )}

      {mouvementOpen && (
        <MouvementModal
          onClose={() => setMouvementOpen(false)}
          onValidate={onAddMouvement}
        />
      )}

      {modalOpen && (
        <NewOrderModal
          products={products}
          onClose={() => setModalOpen(false)}
          onValidate={(items, payment) => {
            const now = new Date();
            const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const total = items.reduce((s, [pid, q]) => {
              const p = products.find(x => x.id === pid);
              return s + (p ? p.price : 0) * q;
            }, 0);
            onAddOrder({ id: crypto.randomUUID(), time, items, payment, total });
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function OrderRow({ order, orderIndex, dayClosed, onRemove, products }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <div className={styles.orderRow}>
        <div className={styles.orderTime}>{order.time}</div>
        <div className={styles.orderItems}>
          {order.items.map(([pid, q]) => {
            const p = products.find(x => x.id === pid);
            return (
              <span key={pid} className={styles.orderItem}>
                <span className={styles.orderItemQty}>{q}</span>
                <span>×</span>
                <span>{p ? p.name : pid}</span>
              </span>
            );
          })}
        </div>
        <PayBadge kind={order.payment} />
        <div className={styles.orderTotal}>{fmtEUR(order.total)}</div>
        {!dayClosed ? (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Supprimer la commande"
            className={styles.deleteBtn}>
            <Icon.Trash size={20} />
          </button>
        ) : (
          <div className={styles.deletePlaceholder} />
        )}
      </div>

      {confirmDelete && (
        <DeleteConfirmModal
          order={order}
          products={products}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onRemove(order, orderIndex); }}
        />
      )}
    </>
  );
}

function DeleteConfirmModal({ order, products, onCancel, onConfirm }) {
  const itemSummary = order.items.map(([pid, q]) => {
    const p = products.find(x => x.id === pid);
    return `${q} × ${p ? p.name : pid}`;
  }).join('  ·  ');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>Supprimer cette commande ?</div>
        <div className={styles.modalSub}>{order.time} · {itemSummary}</div>
        <div className={styles.modalAmount}>{fmtEUR(order.total)}</div>
        <div className={styles.modalActions}>
          <button onClick={onCancel} className={styles.btnCancel}>Annuler</button>
          <button onClick={onConfirm} className={styles.btnDanger}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

function NewOrderModal({ products, onClose, onValidate }) {
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
    const p = products.find(x => x.id === pid);
    return s + (p ? p.price : 0) * q;
  }, 0);
  const itemCount = items.reduce((s, [, q]) => s + q, 0);

  return (
    <div className={styles.newOrderOverlay}>
      <div className={styles.newOrderModal}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalHeaderLabel}>Nouvelle commande</div>
            <h2 className={styles.modalHeaderTitle}>Sélectionner les produits</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Fermer">
            <Icon.Close size={24} />
          </button>
        </div>

        <div className={styles.productsGrid}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} qty={cart[p.id] || 0}
                         onMinus={() => bump(p.id, -1)} onPlus={() => bump(p.id, +1)} />
          ))}
        </div>

        <div className={styles.modalFooter}>
          <div>
            <div className={styles.paymentLabel}>Mode de paiement</div>
            <div className={styles.paymentOptions}>
              <PaymentChoice value="especes" current={payment} onSelect={setPayment} label="Espèces" hint="(par défaut)" />
              <PaymentChoice value="carte"   current={payment} onSelect={setPayment} label="Carte" />
            </div>
          </div>
          <div className={styles.totalSection}>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalAmount}>{fmtEUR(total)}</div>
            <div className={styles.totalCount}>
              {itemCount === 0 ? 'Aucun produit' : `${itemCount} produit${itemCount > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        <div className={styles.modalActions2}>
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
    <div className={`${styles.productCard} ${active ? styles.productCardActive : ''}`}>
      {/* background et border restent inline — couleur spécifique au produit */}
      <div className={styles.productEmoji}
           style={{ background: product.color + '22', border: `1.5px solid ${product.color}55` }}>
        {product.emoji}
      </div>
      <div>
        <div className={styles.productName}>{product.name}</div>
        <div className={styles.productPrice}>{fmtEUR(product.price)} l'unité</div>
      </div>
      <div className={styles.productCounter}>
        <CounterBtn onClick={onMinus} disabled={qty === 0} kind="minus" />
        <div className={`${styles.counterQty} ${active ? styles.counterQtyActive : styles.counterQtyInactive}`}>{qty}</div>
        <CounterBtn onClick={onPlus} kind="plus" />
      </div>
    </div>
  );
}

function CounterBtn({ onClick, disabled, kind }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`${styles.counterBtn} ${disabled ? styles.counterBtnDisabled : styles.counterBtnNormal}`}>
      {kind === 'plus' ? <Icon.Plus size={26} /> : <Icon.Minus size={26} />}
    </button>
  );
}

function TransferSvg() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function PaymentChoice({ value, current, onSelect, label, hint }) {
  const on = current === value;
  return (
    <button onClick={() => onSelect(value)}
      className={`${styles.paymentChoice} ${on ? styles.paymentChoiceActive : styles.paymentChoiceInactive}`}>
      <span className={`${styles.paymentRadio} ${on ? styles.paymentRadioActive : styles.paymentRadioInactive}`} />
      {label}
      {hint && <span className={styles.paymentHint}>{hint}</span>}
    </button>
  );
}
