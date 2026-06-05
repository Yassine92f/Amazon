/**
 * Commerce API services — cart, orders, payment, coupons and wishlist.
 *
 * The cart is fully server-side: an anonymous shopper is tracked by an httpOnly
 * `cartId` cookie set by the backend, so every call here works logged-out as
 * well as logged-in (axios sends credentials). After login the client calls
 * `mergeCart()` to fold the guest cart into the user's.
 */
import {
  Cart,
  Order,
  OrderSummary,
  OrderStatus,
  DeliveryType,
  CreateOrderRequest,
  CouponValidation,
  CreatePaymentIntentResponse,
  SellerOrderDto,
} from '@ecommerce/shared';
import { api } from './api';
import type { PaginatedResponse } from './catalog';

/* ── Cart ─────────────────────────────────────────────────────────────── */

export async function getCart(): Promise<Cart> {
  const { data } = await api.get('/cart');
  return data.data;
}

export async function addToCart(input: {
  productId: string;
  variantId: string;
  quantity: number;
}): Promise<Cart> {
  const { data } = await api.post('/cart/items', input);
  return data.data;
}

export async function updateCartItem(
  productId: string,
  variantId: string,
  quantity: number,
): Promise<Cart> {
  const { data } = await api.put(`/cart/items/${productId}/${variantId}`, { quantity });
  return data.data;
}

export async function removeCartItem(productId: string, variantId: string): Promise<Cart> {
  const { data } = await api.delete(`/cart/items/${productId}/${variantId}`);
  return data.data;
}

export async function clearCart(): Promise<void> {
  await api.delete('/cart');
}

/** Fold the guest cart (cartId cookie) into the authenticated user's cart. */
export async function mergeCart(): Promise<Cart> {
  const { data } = await api.post('/cart/merge');
  return data.data;
}

/* ── Coupons ──────────────────────────────────────────────────────────── */

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const { data } = await api.post('/coupons/validate', { code, subtotal });
  return data.data;
}

/* ── Orders (buyer) ───────────────────────────────────────────────────── */

export async function createOrder(input: CreateOrderRequest): Promise<Order> {
  const { data } = await api.post('/orders', input);
  return data.data;
}

export interface OrderHistoryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export async function listOrders(
  params: OrderHistoryParams = {},
): Promise<PaginatedResponse<OrderSummary>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.status) query.status = params.status;
  const { data } = await api.get('/orders', { params: query });
  return data.data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await api.post(`/orders/${id}/cancel`);
  return data.data;
}

/* ── Orders (seller) ──────────────────────────────────────────────────── */

export async function listSellerOrders(
  params: OrderHistoryParams = {},
): Promise<PaginatedResponse<SellerOrderDto>> {
  const query: Record<string, string> = {};
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.status) query.status = params.status;
  const { data } = await api.get('/orders/seller', { params: query });
  return data.data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data.data;
}

/* ── Payment ──────────────────────────────────────────────────────────── */

export async function createPaymentIntent(orderId: string): Promise<CreatePaymentIntentResponse> {
  const { data } = await api.post('/payments/intent', { orderId });
  return data.data;
}

/**
 * Confirm the order server-side right after Stripe reports success, so it is
 * marked paid deterministically instead of waiting on the async webhook.
 */
export async function confirmPayment(
  orderId: string,
): Promise<{ status: OrderStatus; paid: boolean }> {
  const { data } = await api.post('/payments/confirm', { orderId });
  return data.data;
}

/* ── Wishlist ─────────────────────────────────────────────────────────── */

export interface WishlistItemDto {
  productId: string;
  addedAt: string;
  name?: string;
  slug?: string;
  image?: string;
  price?: number;
  inStock?: boolean;
}

export interface WishlistDto {
  items: WishlistItemDto[];
  count: number;
}

export async function getWishlist(): Promise<WishlistDto> {
  const { data } = await api.get('/wishlist');
  return data.data;
}

export async function toggleWishlist(
  productId: string,
): Promise<{ wishlisted: boolean; wishlist: WishlistDto }> {
  const { data } = await api.post(`/wishlist/${productId}/toggle`);
  return data.data;
}

export async function removeWishlist(productId: string): Promise<WishlistDto> {
  const { data } = await api.delete(`/wishlist/${productId}`);
  return data.data;
}

/* ── Shipping helpers (mirror server OrderUseCase) ────────────────────── */

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST: Record<DeliveryType, number> = {
  [DeliveryType.HOME]: 4.99,
  [DeliveryType.PICKUP_POINT]: 2.99,
};

/** Shipping cost for a subtotal + delivery choice (free above the threshold). */
export function shippingFor(subtotal: number, delivery: DeliveryType): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST[delivery];
}
