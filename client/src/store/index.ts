import { create } from 'zustand';
import type { User } from '@ecommerce/shared';
import { api } from '../lib/api';
import { useCartStore } from './cart';
import { useWishlistStore } from './wishlist';

// Called after a successful login/register: fold the guest cart into the user's
// and load their wishlist. Best-effort — never blocks the auth flow.
async function syncCommerceOnLogin() {
  try {
    await useCartStore.getState().mergeOnLogin();
  } catch {
    /* ignore */
  }
  useWishlistStore.getState().load();
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  login: async (email, password) => {
    set({ error: null, isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken } = data.data;
      // Only the short-lived access token is kept in JS. The refresh token is
      // set by the server as an httpOnly cookie and never touches localStorage.
      localStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      await syncCommerceOnLogin();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Erreur de connexion';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ error: null, isLoading: true });
    try {
      const { data: res } = await api.post('/auth/register', data);
      const { user, accessToken } = res.data;
      // Refresh token is delivered as an httpOnly cookie (see login).
      localStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      await syncCommerceOnLogin();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors de l'inscription";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      // The server reads the refresh token from the httpOnly cookie and clears it.
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
    // Drop the user's wishlist and reload the (now anonymous) cart.
    useWishlistStore.getState().reset();
    useCartStore.getState().load();
  },

  init: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
      useWishlistStore.getState().load();
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
