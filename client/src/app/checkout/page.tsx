'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Elements } from '@stripe/react-stripe-js';
import { MapPin, Tag, Check, ShoppingBag, Pencil, Plus, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import PaymentForm from '../../components/checkout/PaymentForm';
import { useCartStore } from '../../store/cart';
import { api } from '../../lib/api';
import { getStripe } from '../../lib/stripe';
import {
  createOrder,
  createPaymentIntent,
  confirmPayment,
  cancelOrder,
  validateCoupon,
  addToCart,
  shippingFor,
} from '../../lib/commerce';
import { t, formatPrice } from '../../lib/i18n';
import { DeliveryType, type Order, type CartItem, type CouponValidation } from '@ecommerce/shared';
import EcoDeliverySelector from '../../components/checkout/EcoDeliverySelector';
import {
  EcoDeliveryOptionId,
  recordEcoDeliveryChoice,
  ecoOptionToDeliveryType,
} from '../../lib/ecoDelivery';

// €1 pledge → translated to euros once in the UI layer.
const TREE_PLEDGE_EUR = 1;

const stripePromise = getStripe();
const hasStripeKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

function CheckoutInner() {
  const router = useRouter();
  const { cart, load: loadCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  // The eco selector is now the single source of truth for the delivery
  // mode. `delivery` is derived (and mirrored into a memo below for the
  // shipping cost calculation).
  const [ecoOption, setEcoOption] = useState<EcoDeliveryOptionId>(
    EcoDeliveryOptionId.PICKUP_GROUPED,
  );
  const [donateTree, setDonateTree] = useState(false);
  const delivery: DeliveryType = useMemo(() => ecoOptionToDeliveryType(ecoOption), [ecoOption]);

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Snapshot of the lines being purchased — taken before the order clears the
  // server cart, so we can rebuild the cart if the shopper steps back.
  const [snapshot, setSnapshot] = useState<CartItem[]>([]);

  // Inline new-address form
  const [showAddr, setShowAddr] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('France');
  const [savingAddr, setSavingAddr] = useState(false);

  const items = useMemo(
    () => (step === 'payment' ? snapshot : (cart?.items ?? [])),
    [step, snapshot, cart],
  );
  const subtotal = useMemo(
    () =>
      Math.round(items.reduce((s, i) => s + (i.lineTotal ?? i.price * i.quantity), 0) * 100) / 100,
    [items],
  );
  const discount = coupon?.valid ? coupon.discountedAmount : 0;
  const shipping = shippingFor(subtotal, delivery);
  const treePledge = donateTree ? TREE_PLEDGE_EUR : 0;
  const total = Math.max(0, Math.round((subtotal + shipping - discount + treePledge) * 100) / 100);

  const fetchAddresses = useCallback(async () => {
    setAddrLoading(true);
    try {
      const { data } = await api.get('/users/addresses');
      const list: Address[] = data.data;
      setAddresses(list);
      setSelectedAddressId((cur) => cur || list.find((a) => a.isDefault)?.id || list[0]?.id || '');
    } catch {
      /* ignore */
    }
    setAddrLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLabel || !addrStreet || !addrCity || !addrPostal || !addrCountry) return;
    setSavingAddr(true);
    try {
      const { data } = await api.post('/users/addresses', {
        label: addrLabel,
        street: addrStreet,
        city: addrCity,
        postalCode: addrPostal,
        country: addrCountry,
        isDefault: addresses.length === 0,
      });
      const list: Address[] = data.data;
      setAddresses(list);
      // Select the newly added address (last one).
      setSelectedAddressId(list[list.length - 1]?.id ?? '');
      setShowAddr(false);
      setAddrLabel('');
      setAddrStreet('');
      setAddrCity('');
      setAddrPostal('');
      setAddrCountry('France');
    } catch {
      /* ignore */
    }
    setSavingAddr(false);
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await validateCoupon(code, subtotal);
      if (res.valid) {
        setCoupon(res);
        setCouponError(null);
      } else {
        setCoupon(null);
        setCouponError(res.message ?? t.checkout.couponInvalid);
      }
    } catch (err) {
      setCoupon(null);
      setCouponError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t.checkout.couponInvalid,
      );
    }
    setCouponLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || items.length === 0) return;
    setPlacing(true);
    setOrderError(null);
    try {
      const lines = (cart?.items ?? []).map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      setSnapshot(cart?.items ?? []);
      const created = await createOrder({
        items: lines,
        deliveryType: delivery,
        shippingAddressId: selectedAddressId,
        couponCode: coupon?.valid ? coupon.code : undefined,
      });
      // Lock in the eco-delivery choice. Best-effort: a failure here MUST NOT
      // block the order — the metric is informational, not a payment input.
      recordEcoDeliveryChoice(created._id, ecoOption, donateTree).catch(() => {
        /* eco metric is non-blocking; failure is silently ignored */
      });
      const intent = await createPaymentIntent(created._id);
      setOrder(created);
      setClientSecret(intent.clientSecret);
      setStep('payment');
    } catch (err) {
      setOrderError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t.checkout.orderError,
      );
    }
    setPlacing(false);
  };

  // Back to the details step: cancel the PENDING order (restocks) and rebuild
  // the cart from the snapshot so nothing is lost.
  const handleEditDetails = async () => {
    if (order) {
      try {
        await cancelOrder(order._id);
        for (const it of snapshot) {
          await addToCart({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
          });
        }
      } catch {
        /* ignore */
      }
    }
    setOrder(null);
    setClientSecret(null);
    setStep('details');
    await loadCart();
  };

  const handlePaymentSuccess = async () => {
    // Confirm server-side so the order is marked paid without waiting on the
    // webhook, then refresh the (now empty) cart and show the order.
    if (order) {
      try {
        await confirmPayment(order._id);
      } catch {
        /* the order page will retry/confirm as a fallback */
      }
    }
    await loadCart();
    if (order) router.push(`/orders/${order._id}?payment=success`);
  };

  if (!cart) {
    return (
      <div className="container-main flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (step === 'details' && items.length === 0) {
    return (
      <div className="container-main flex flex-col items-center gap-5 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <ShoppingBag className="h-10 w-10 text-brand-300" aria-hidden />
        </div>
        <p className="text-lg font-bold text-brand-900">{t.checkout.emptyCart}</p>
        <Link
          href="/search"
          className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600"
        >
          {t.cart.browse}
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <main className="container-main py-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.checkout.backToCart}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-brand-900">{t.checkout.title}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Left: details or payment */}
        <div className="flex flex-col gap-5">
          {step === 'details' ? (
            <>
              {/* Address */}
              <section className="rounded-2xl border border-border bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-brand-900">
                    <MapPin className="h-5 w-5 text-brand-500" aria-hidden />
                    {t.checkout.shippingAddress}
                  </h2>
                  {!showAddr && (
                    <button
                      type="button"
                      onClick={() => setShowAddr(true)}
                      className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
                    >
                      <Plus className="h-4 w-4" /> {t.checkout.addAddress}
                    </button>
                  )}
                </div>

                {addrLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          selectedAddressId === a.id
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-border bg-white hover:border-brand-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="mt-1 accent-brand-500"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                            {a.label}
                            {a.isDefault && (
                              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                                {t.checkout.defaultBadge}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted">{a.street}</p>
                          <p className="text-sm text-muted">
                            {a.postalCode} {a.city}, {a.country}
                          </p>
                        </div>
                      </label>
                    ))}

                    {!showAddr && addresses.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted">
                        {t.checkout.noAddress}
                      </p>
                    )}

                    <AnimatePresence>
                      {showAddr && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleAddAddress}
                          className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-[var(--color-bg)] p-4"
                        >
                          <p className="text-sm font-semibold text-text">
                            {t.checkout.addAddressInline}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              value={addrLabel}
                              onChange={(e) => setAddrLabel(e.target.value)}
                              placeholder={t.checkout.addr.label}
                              required
                              className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
                            />
                            <input
                              value={addrCountry}
                              onChange={(e) => setAddrCountry(e.target.value)}
                              placeholder={t.checkout.addr.country}
                              required
                              className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
                            />
                          </div>
                          <input
                            value={addrStreet}
                            onChange={(e) => setAddrStreet(e.target.value)}
                            placeholder={t.checkout.addr.street}
                            required
                            className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                              placeholder={t.checkout.addr.city}
                              required
                              className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
                            />
                            <input
                              value={addrPostal}
                              onChange={(e) => setAddrPostal(e.target.value)}
                              placeholder={t.checkout.addr.postalCode}
                              required
                              className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingAddr}
                              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                            >
                              {savingAddr ? '…' : t.checkout.addAddress}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddr(false)}
                              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text"
                            >
                              {t.admin.cancel}
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* Delivery — unified eco-delivery selector. Each option carries
                  its physical mode (home / pickup point) AND its CO2 budget. */}
              <EcoDeliverySelector
                value={ecoOption}
                onChange={setEcoOption}
                subtotal={subtotal}
                donateTree={donateTree}
                onDonateTreeChange={setDonateTree}
              />

              {/* Coupon */}
              <section className="rounded-2xl border border-border bg-white p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-brand-900">
                  <Tag className="h-5 w-5 text-brand-500" aria-hidden />
                  {t.checkout.coupon}
                </h2>
                {coupon?.valid ? (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
                      <Check className="h-4 w-4" />
                      {t.checkout.couponApplied(coupon.code)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCoupon(null);
                        setCouponInput('');
                      }}
                      className="text-xs font-medium text-muted hover:text-[var(--color-error)]"
                    >
                      {t.checkout.couponRemove}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={t.checkout.couponPlaceholder}
                      className="h-10 flex-1 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="rounded-lg bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                    >
                      {couponLoading ? '…' : t.checkout.couponApply}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-xs font-medium text-[var(--color-error)]">
                    {couponError}
                  </p>
                )}
              </section>
            </>
          ) : (
            <>
              {/* Payment step: read-only shipping recap + Stripe */}
              <section className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-brand-900">
                      <MapPin className="h-4 w-4 text-brand-500" aria-hidden />
                      {t.checkout.shippingAddress}
                    </h2>
                    {selectedAddress && (
                      <p className="mt-1 text-sm text-muted">
                        {selectedAddress.street}, {selectedAddress.postalCode}{' '}
                        {selectedAddress.city}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted">
                      {delivery === DeliveryType.HOME
                        ? t.checkout.deliveryHome
                        : t.checkout.deliveryPickup}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEditDetails}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t.checkout.edit}
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-white p-5">
                <h2 className="mb-1 text-base font-extrabold text-brand-900">
                  {t.checkout.paymentTitle}
                </h2>
                <p className="mb-4 text-sm text-muted">{t.checkout.paymentSubtitle}</p>
                {!hasStripeKey && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[var(--color-error)]">
                    {t.checkout.stripeKeyMissing}
                  </p>
                )}
                {clientSecret && hasStripeKey && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      // Load the app font into the Stripe iframe — `inherit` does
                      // not cross the iframe boundary, so the font must be supplied
                      // explicitly here to match the rest of the UI.
                      fonts: [
                        {
                          cssSrc:
                            'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
                        },
                      ],
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#f07d1a',
                          colorText: '#1f1710',
                          colorTextSecondary: '#7a6e62',
                          colorDanger: '#dc3545',
                          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                          borderRadius: '10px',
                          fontSizeBase: '15px',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      amount={total}
                      orderId={order!._id}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )}
              </section>
            </>
          )}
        </div>

        {/* Right: order summary */}
        <aside className="lg:sticky lg:top-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-base font-extrabold text-brand-900">{t.checkout.orderSummary}</h2>

          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {items.map((it) => (
              <li key={`${it.productId}:${it.variantId}`} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-border-strong">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                  )}
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {it.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-semibold text-brand-900">
                    {it.productName}
                  </p>
                  {it.variantName && (
                    <p className="line-clamp-1 text-[11px] text-muted">{it.variantName}</p>
                  )}
                </div>
                <span className="text-xs font-bold text-brand-900">
                  {formatPrice(it.lineTotal ?? it.price * it.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="h-px w-full bg-border" />

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">{t.checkout.subtotal}</dt>
              <dd className="font-semibold text-text">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">{t.checkout.shipping}</dt>
              <dd className="font-semibold text-text">
                {shipping === 0 ? t.cart.freeShipping : formatPrice(shipping)}
              </dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-green-700">
                <dt>{t.checkout.discount}</dt>
                <dd className="font-semibold">−{formatPrice(discount)}</dd>
              </div>
            )}
            {donateTree && (
              <div className="flex items-center justify-between text-green-700">
                <dt className="flex items-center gap-1.5">🌳 {t.checkout.treePledge}</dt>
                <dd className="font-semibold">+{formatPrice(treePledge)}</dd>
              </div>
            )}
            <div className="my-1 h-px w-full bg-border" />
            <div className="flex items-center justify-between">
              <dt className="font-bold text-brand-900">{t.checkout.total}</dt>
              <dd className="text-xl font-extrabold text-brand-900">{formatPrice(total)}</dd>
            </div>
            {donateTree && (
              <p className="mt-1 text-[11px] text-muted">{t.checkout.treePledgeNote}</p>
            )}
          </dl>

          {step === 'details' && (
            <>
              {orderError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[var(--color-error)]">
                  {orderError}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId || items.length === 0}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.checkout.creatingOrder}
                  </>
                ) : (
                  t.checkout.placeOrder
                )}
              </motion.button>
              {!selectedAddressId && !addrLoading && (
                <p className="text-center text-xs text-muted">{t.checkout.selectAddress}</p>
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Header />
      <CheckoutInner />
    </ProtectedRoute>
  );
}
