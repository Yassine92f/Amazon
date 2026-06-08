// Eco-delivery options surface alongside the regular delivery method on
// checkout. They expose a CO2 budget per shipment so buyers can pick the
// least-emitting option that still fits their delivery window.
//
// Lives in its own file (not order.ts) so other delivery work can land in
// parallel without merge conflicts on shared types.

export enum EcoDeliveryOptionId {
  STANDARD = 'standard',
  PICKUP_GROUPED = 'pickup_grouped',
  BIKE_CARGO = 'bike_cargo',
  SLOW_GROUPED = 'slow_grouped',
}

export interface EcoDeliveryOption {
  id: EcoDeliveryOptionId;
  // i18n key used by the client to look up the localized label/description.
  i18nKey: string;
  // Estimated CO2 (kg) emitted per shipment for this option. This is the
  // BASELINE we use to score every other option — it doesn't depend on the
  // cart content, just on the logistics chain.
  co2KgPerShipment: number;
  // Typical delivery delay in days, lower bound. Used by the UI badge.
  estimatedDays: number;
  // Whether the option is available everywhere or only in some zones.
  availability: 'global' | 'urban_only';
  // Marketing label used to surface the most-recommended option in the UI.
  isRecommended?: boolean;
}

export interface EcoDeliveryImpact {
  optionId: EcoDeliveryOptionId;
  co2EmittedKg: number;
  // CO2 saved compared with the STANDARD baseline. Always ≥ 0 (the baseline
  // itself reports 0 saved).
  co2SavedKg: number;
  // Human-friendly equivalence used for the UI (e.g. "soit 12 km en voiture").
  equivalentCarKm: number;
}

export interface EcoDeliveryOptionsResponse {
  options: EcoDeliveryOption[];
  // Baseline used to compute the savings — exposed so the UI can show a
  // crossed-out reference.
  baselineCo2Kg: number;
}

// Persisted choice — one row per order in a dedicated collection so we don't
// have to touch the Order entity / model owned by feature/cart-orders.
export interface OrderEcoMetric {
  orderId: string;
  optionId: EcoDeliveryOptionId;
  co2EmittedKg: number;
  co2SavedKg: number;
  // Optional add-on: buyer pledges €1 to plant a tree alongside their order.
  // Stored in cents to dodge floating-point pitfalls. Zero / undefined when
  // the buyer skipped the pledge.
  treeDonationCents?: number;
  treesPlanted?: number;
  recordedAt: string;
}

export interface RecordEcoChoiceRequest {
  optionId: EcoDeliveryOptionId;
  // Toggle on the checkout selector — when true, one tree is pledged for this
  // order (current pricing: 100 cents = 1 tree).
  donateTree?: boolean;
}

// Aggregated public counter used by a "X trees planted by our community"
// callout.
export interface TreesPlantedSummary {
  totalTrees: number;
  totalDonationCents: number;
}
