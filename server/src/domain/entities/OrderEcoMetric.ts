import { EcoDeliveryOptionIdEntity } from './EcoDeliveryOption';

export interface OrderEcoMetricEntity {
  orderId: string;
  optionId: EcoDeliveryOptionIdEntity;
  co2EmittedKg: number;
  co2SavedKg: number;
  // Optional pledge to plant a tree alongside the order. Stored in cents so
  // there's no floating-point arithmetic anywhere in the money path.
  treeDonationCents: number;
  treesPlanted: number;
  recordedAt: Date;
}

// Cost (cents) for one tree planted via the platform's reforestation partner.
// Lives on the entity so the use case and tests share a single constant.
export const CENTS_PER_TREE = 100;
