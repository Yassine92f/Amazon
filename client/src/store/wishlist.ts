import { create } from 'zustand';
import { getWishlist, toggleWishlist, removeWishlist, type WishlistItemDto } from '../lib/commerce';

interface WishlistState {
  items: WishlistItemDto[];
  /** Product ids on the wishlist, for O(1) lookup by cards/buttons. */
  ids: Set<string>;
  count: number;
  isLoading: boolean;
  /** Product id currently being toggled, or null. */
  pendingId: string | null;

  has: (productId: string) => boolean;
  load: () => Promise<void>;
  /** Toggle membership; returns the new state (true = now wishlisted). */
  toggle: (productId: string) => Promise<boolean>;
  remove: (productId: string) => Promise<void>;
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  ids: new Set(),
  count: 0,
  isLoading: false,
  pendingId: null,

  has: (productId) => get().ids.has(productId),

  load: async () => {
    set({ isLoading: true });
    try {
      const wl = await getWishlist();
      set({
        items: wl.items,
        ids: new Set(wl.items.map((i) => i.productId)),
        count: wl.count,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  toggle: async (productId) => {
    set({ pendingId: productId });
    try {
      const { wishlisted, wishlist } = await toggleWishlist(productId);
      set({
        items: wishlist.items,
        ids: new Set(wishlist.items.map((i) => i.productId)),
        count: wishlist.count,
        pendingId: null,
      });
      return wishlisted;
    } catch {
      set({ pendingId: null });
      throw new Error('wishlist toggle failed');
    }
  },

  remove: async (productId) => {
    set({ pendingId: productId });
    try {
      const wl = await removeWishlist(productId);
      set({
        items: wl.items,
        ids: new Set(wl.items.map((i) => i.productId)),
        count: wl.count,
        pendingId: null,
      });
    } catch {
      set({ pendingId: null });
    }
  },

  reset: () => set({ items: [], ids: new Set(), count: 0, pendingId: null }),
}));
