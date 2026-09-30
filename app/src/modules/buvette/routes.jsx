import { useBuvette } from './context';
import { OrdersScreen } from './screens/OrdersScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { HistoryScreen } from './screens/HistoryScreen';

// Adaptateurs route → écran : les écrans restent pilotés par props,
// l'état vient du contexte buvette.

export function JournalRoute() {
  const b = useBuvette();
  return (
    <OrdersScreen
      day={b.day} products={b.products}
      onAddOrder={b.addOrder} onRemoveOrder={b.removeOrder}
      onAddOperation={b.addOperation} onRemoveOperation={b.removeOperation}
      opSuggestions={b.opSuggestions} cashFloat={b.cashFloat} archived={b.archived}
    />
  );
}

export function BilanRoute() {
  const b = useBuvette();
  return (
    <SummaryScreen
      day={b.day} products={b.products}
      onClose={b.requestCloseDay} onReopen={b.reopenDay}
      cashCounted={b.day.cashCounted} cashFloat={b.cashFloat} archived={b.archived}
      onAddOperation={b.addOperation} onRemoveOperation={b.removeOperation}
      opSuggestions={b.opSuggestions}
    />
  );
}

export function HistoriqueRoute() {
  const b = useBuvette();
  return <HistoryScreen archived={b.archived} products={b.products} cashFloat={b.cashFloat} sessionToken={b.sessionToken} />;
}
