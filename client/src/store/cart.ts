import { create } from 'zustand';
import type { Cart } from '@ecommerce/shared';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from '../lib/commerce';

/** A stable key for a cart line (product + variant). */
export const lineKey = (productId: string, variantId: string) => `${productId}:${variantId}`;

function extractError(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  );
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  /** Line key currently being mutated (disables its controls), or null. */
  pendingKey: string | null;
  /** Drawer visibility. */
  isOpen: boolean;
  error: string | null;

  totalItems: () => number;

  load: () => Promise<void>;
  add: (input: { productId: string; variantId: string; quantity: number }) => Promise<void>;
  setQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  remove: (productId: string, variantId: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Merge the guest cart into the user's cart after authentication. */
  mergeOnLogin: () => Promise<void>;

  openDrawer: () => void;
  closeDrawer: () => void;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  pendingKey: null,
  isOpen: false,
  error: null,

  totalItems: () => get().cart?.totalItems ?? 0,

  load: async () => {
    set({ isLoading: true });
    try {
      const cart = await getCart();
      set({ cart, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  add: async (input) => {
    set({ error: null, pendingKey: lineKey(input.productId, input.variantId) });
    try {
      const cart = await addToCart(input);
      set({ cart, pendingKey: null, isOpen: true });
    } catch (err) {
      set({ pendingKey: null, error: extractError(err, "Impossible d'ajouter au panier") });
      throw err;
    }
  },

  setQuantity: async (productId, variantId, quantity) => {
    set({ error: null, pendingKey: lineKey(productId, variantId) });
    try {
      const cart = await updateCartItem(productId, variantId, quantity);
      set({ cart, pendingKey: null });
    } catch (err) {
      set({ pendingKey: null, error: extractError(err, 'Stock insuffisant') });
      throw err;
    }
  },

  remove: async (productId, variantId) => {
    set({ error: null, pendingKey: lineKey(productId, variantId) });
    try {
      const cart = await removeCartItem(productId, variantId);
      set({ cart, pendingKey: null });
    } catch (err) {
      set({ pendingKey: null, error: extractError(err, 'Erreur') });
      throw err;
    }
  },

  clear: async () => {
    try {
      await clearCart();
      set((s) => ({
        cart: s.cart ? { ...s.cart, items: [], totalAmount: 0, totalItems: 0 } : null,
      }));
    } catch (err) {
      set({ error: extractError(err, 'Erreur') });
    }
  },

  mergeOnLogin: async () => {
    // Pass the current guest lines explicitly so the merge survives even when the
    // browser drops the cross-origin httpOnly cartId cookie on this call.
    const guestItems = (get().cart?.items ?? []).map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
    }));
    try {
      const cart = await mergeCart(guestItems);
      set({ cart });
    } catch {
      // Fall back to a plain reload if the merge call fails.
      await get().load();
    }
  },

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  clearError: () => set({ error: null }),
}));
