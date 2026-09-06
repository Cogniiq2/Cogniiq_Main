import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  EMPTY_CART,
  decrement,
  increment,
  quantityOf,
  readStoredCart,
  reconcileCart,
  remove,
  setQuantity,
  writeStoredCart,
  type Cart,
} from './cart';
import {
  confirmOrder,
  fetchInventory,
  newClientOrderId,
  type ConfirmedOrder,
  type Stock,
} from './inventoryClient';
import { MAX_QUANTITY_PER_PRODUCT, priceLines, totalCents, type PricedLine } from './pricing';

const CONFIRMED_ORDER_KEY = 'bolagio:private-bar:order:v1';
/** Written BEFORE the request so a refresh mid-confirmation reuses the same
 *  idempotency key instead of creating a second order. */
const PENDING_ORDER_ID_KEY = 'bolagio:private-bar:pending-order:v1';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // blocked storage: state simply does not survive a reload
  }
}

function readJson<T>(key: string, parse: (value: unknown) => T | null): T | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw ? parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown | null): void {
  const store = storage();
  if (!store) return;
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked storage must never interrupt the guest.
  }
}

function parseConfirmedOrder(value: unknown): ConfirmedOrder | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.orderId !== 'string' ||
    typeof record.clientOrderId !== 'string' ||
    typeof record.totalCents !== 'number' ||
    !Array.isArray(record.items) ||
    record.items.length === 0
  ) {
    return null;
  }
  return value as ConfirmedOrder;
}

export type InventoryStatus = 'loading' | 'ready' | 'error';
export type ConfirmStatus = 'idle' | 'pending' | 'stock_changed' | 'failed';

export interface PrivateBarController {
  // ── inventory ──
  readonly stock: Stock;
  readonly inventoryStatus: InventoryStatus;
  /** How many of this product the guest may still add. */
  availableFor(productId: string): number;
  reloadInventory(): void;

  // ── selection ──
  readonly cart: Cart;
  readonly lines: readonly PricedLine[];
  readonly totalCents: number;
  readonly itemCount: number;
  readonly ready: boolean;
  quantityOf(productId: string): number;
  add(productId: string): void;
  subtract(productId: string): void;
  removeLine(productId: string): void;
  clear(): void;
  /** True when live stock trimmed the selection and the guest should be told. */
  readonly reconciled: boolean;
  acknowledgeReconciliation(): void;

  // ── confirmation ──
  readonly confirmedOrder: ConfirmedOrder | null;
  readonly confirmStatus: ConfirmStatus;
  confirm(): Promise<void>;
  /** Ends the confirmed order locally so a new selection can begin. */
  startNewSelection(): void;
}

/**
 * The whole Private Bar client state: live inventory, the persisted selection
 * and the confirmed order.
 *
 * SSR-safe by construction — everything starts empty and is populated in
 * effects, because this page is prerendered and reading storage or the network
 * during render would both break the build and hand React a different tree than
 * the one it hydrates.
 */
export function usePrivateBar(): PrivateBarController {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [ready, setReady] = useState(false);
  const [stock, setStock] = useState<Stock>({});
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>('loading');
  const [reconciled, setReconciled] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('idle');
  const [inventoryNonce, setInventoryNonce] = useState(0);
  const inFlight = useRef(false);

  // Restore what the guest had.
  useEffect(() => {
    setCart(readStoredCart(storage()));
    setConfirmedOrder(readJson(CONFIRMED_ORDER_KEY, parseConfirmedOrder));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return; // never overwrite storage with the pre-load empty state
    writeStoredCart(storage(), cart);
  }, [cart, ready]);

  // Live inventory, and the reconciliation it implies.
  useEffect(() => {
    let cancelled = false;
    setInventoryStatus((current) => (current === 'ready' ? current : 'loading'));

    fetchInventory().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setInventoryStatus('error');
        return;
      }
      setStock(result.stock);
      setInventoryStatus('ready');
      setCart((current) => {
        const { cart: next, changed } = reconcileCart(current, result.stock);
        if (changed) setReconciled(true);
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [inventoryNonce]);

  const availableFor = useCallback(
    (productId: string) => {
      // Until inventory is known, nothing is offered: fail closed rather than
      // letting a guest select a bottle that may not be there.
      if (inventoryStatus !== 'ready') return 0;
      return Math.min(MAX_QUANTITY_PER_PRODUCT, Math.max(0, stock[productId] ?? 0));
    },
    [inventoryStatus, stock]
  );

  const priced = useMemo(() => {
    const result = priceLines(cart);
    return result.ok ? result.lines : [];
  }, [cart]);

  const confirm = useCallback(async () => {
    if (inFlight.current || cart.length === 0) return;
    inFlight.current = true;
    setConfirmStatus('pending');

    // The idempotency key is minted once and persisted before the request. A
    // retry — a second tap, a refresh, a flaky connection — reuses it, and the
    // database answers with the existing order instead of decrementing twice.
    const existingPending = readJson<string>(PENDING_ORDER_ID_KEY, (value) =>
      typeof value === 'string' ? value : null
    );
    const clientOrderId = existingPending ?? newClientOrderId();
    writeJson(PENDING_ORDER_ID_KEY, clientOrderId);

    const result = await confirmOrder(clientOrderId, cart);
    inFlight.current = false;

    if (result.ok) {
      writeJson(PENDING_ORDER_ID_KEY, null);
      writeJson(CONFIRMED_ORDER_KEY, result.order);
      setConfirmedOrder(result.order);
      setStock(result.stock);
      setCart(EMPTY_CART);
      setConfirmStatus('idle');
      return;
    }

    if (result.reason === 'out_of_stock') {
      // A refused confirmation decremented nothing. Bring the selection back in
      // line with reality and let the guest decide again.
      writeJson(PENDING_ORDER_ID_KEY, null);
      setStock(result.stock);
      setCart((current) => reconcileCart(current, result.stock).cart);
      setConfirmStatus('stock_changed');
      return;
    }

    // A failed attempt keeps its key: retrying must not create a second order.
    setConfirmStatus('failed');
  }, [cart]);

  const startNewSelection = useCallback(() => {
    writeJson(CONFIRMED_ORDER_KEY, null);
    setConfirmedOrder(null);
    setConfirmStatus('idle');
    setInventoryNonce((n) => n + 1);
  }, []);

  return {
    stock,
    inventoryStatus,
    availableFor,
    reloadInventory: useCallback(() => setInventoryNonce((n) => n + 1), []),

    cart,
    lines: priced,
    totalCents: useMemo(() => totalCents(priced), [priced]),
    itemCount: useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]),
    ready,
    quantityOf: useCallback((productId: string) => quantityOf(cart, productId), [cart]),
    add: useCallback(
      (productId: string) => {
        setConfirmStatus('idle');
        setCart((current) => increment(current, productId, availableFor(productId)));
      },
      [availableFor]
    ),
    subtract: useCallback((productId: string) => {
      setConfirmStatus('idle');
      setCart((current) => decrement(current, productId));
    }, []),
    removeLine: useCallback((productId: string) => setCart((current) => remove(current, productId)), []),
    clear: useCallback(() => setCart(EMPTY_CART), []),
    reconciled,
    acknowledgeReconciliation: useCallback(() => setReconciled(false), []),

    confirmedOrder,
    confirmStatus,
    confirm,
    startNewSelection,
  };
}

/** Re-exported so components have one import for the selection API. */
export { setQuantity };
