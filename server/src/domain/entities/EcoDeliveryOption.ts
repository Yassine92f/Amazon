// Static catalogue of eco-delivery options the buyer can pick on checkout.
// CO2 figures are rough industry estimates for a single average parcel — they
// are intended to drive an informed choice, not to claim precision.
// Sources used for the baseline (kept in comments for transparency):
//   - ADEME Base Carbone 2024: ~2.2–3.0 kg CO2 for a home-delivered parcel
//     under 5 kg in metropolitan France.
//   - Last-mile bike vs van studies: bike-cargo emits roughly 80–95 % less.
//   - Grouped pickup-point delivery: ~50–70 % less than a dedicated round.

export enum EcoDeliveryOptionIdEntity {
  STANDARD = 'standard',
  PICKUP_GROUPED = 'pickup_grouped',
  BIKE_CARGO = 'bike_cargo',
  SLOW_GROUPED = 'slow_grouped',
}

export interface EcoDeliveryOptionEntity {
  id: EcoDeliveryOptionIdEntity;
  i18nKey: string;
  co2KgPerShipment: number;
  estimatedDays: number;
  availability: 'global' | 'urban_only';
  isRecommended?: boolean;
}

// Baseline against which every other option's savings are computed.
export const ECO_BASELINE_CO2_KG = 2.5;

// One average car kilometre in metropolitan France emits ~0.12 kg CO2 (ADEME),
// used to translate kg savings into a tangible equivalence in the UI.
export const CAR_KM_PER_KG_CO2 = 1 / 0.12;

export const ECO_DELIVERY_OPTIONS: readonly EcoDeliveryOptionEntity[] = [
  {
    id: EcoDeliveryOptionIdEntity.STANDARD,
    i18nKey: 'standard',
    co2KgPerShipment: ECO_BASELINE_CO2_KG,
    estimatedDays: 2,
    availability: 'global',
  },
  {
    id: EcoDeliveryOptionIdEntity.PICKUP_GROUPED,
    i18nKey: 'pickup_grouped',
    co2KgPerShipment: 0.8,
    estimatedDays: 3,
    availability: 'global',
    isRecommended: true,
  },
  {
    id: EcoDeliveryOptionIdEntity.BIKE_CARGO,
    i18nKey: 'bike_cargo',
    co2KgPerShipment: 0.2,
    estimatedDays: 2,
    availability: 'urban_only',
  },
  {
    id: EcoDeliveryOptionIdEntity.SLOW_GROUPED,
    i18nKey: 'slow_grouped',
    co2KgPerShipment: 0.5,
    estimatedDays: 7,
    availability: 'global',
  },
];

export function findEcoOption(id: EcoDeliveryOptionIdEntity): EcoDeliveryOptionEntity | undefined {
  return ECO_DELIVERY_OPTIONS.find((o) => o.id === id);
}
