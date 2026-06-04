'use client';

import { useEffect } from 'react';
import { useCartStore } from '../store/cart';

/**
 * Loads the cart once on mount. The cart is server-side: a logged-out shopper is
 * tracked by an httpOnly `cartId` cookie, so this populates the cart for guests
 * and users alike. Login/logout transitions are handled by the auth store, which
 * merges the guest cart and reloads.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const load = useCartStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return <>{children}</>;
}
