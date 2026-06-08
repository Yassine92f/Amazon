import { api } from './api';
import { DeliveryType, EcoDeliveryOptionId } from '@ecommerce/shared';
import type {
  EcoDeliveryOption,
  EcoDeliveryOptionsResponse,
  EcoDeliveryImpact,
  OrderEcoMetric,
  TreesPlantedSummary,
} from '@ecommerce/shared';

// Re-export the enum/types under one roof so consumer components import from
// a single place.
export type { EcoDeliveryOption, EcoDeliveryImpact, OrderEcoMetric, TreesPlantedSummary };
export { EcoDeliveryOptionId } from '@ecommerce/shared';

// Each eco option maps to one of the existing DeliveryType values for the
// backend Order — the eco axis (how the parcel is delivered) is orthogonal to
// the physical destination (your door vs a pickup point), so we route each
// option to the most accurate physical mode.
export const ECO_OPTION_TO_DELIVERY: Record<EcoDeliveryOptionId, DeliveryType> = {
  [EcoDeliveryOptionId.STANDARD]: DeliveryType.HOME,
  [EcoDeliveryOptionId.BIKE_CARGO]: DeliveryType.HOME,
  [EcoDeliveryOptionId.PICKUP_GROUPED]: DeliveryType.PICKUP_POINT,
  [EcoDeliveryOptionId.SLOW_GROUPED]: DeliveryType.PICKUP_POINT,
};

export function ecoOptionToDeliveryType(id: EcoDeliveryOptionId): DeliveryType {
  return ECO_OPTION_TO_DELIVERY[id] ?? DeliveryType.HOME;
}

export async function getEcoDeliveryOptions(): Promise<EcoDeliveryOptionsResponse> {
  const { data } = await api.get('/eco-delivery/options');
  return data.data;
}

export async function getEcoDeliveryImpact(
  optionId: EcoDeliveryOptionId,
): Promise<EcoDeliveryImpact> {
  const { data } = await api.get('/eco-delivery/impact', { params: { optionId } });
  return data.data;
}

export interface RecordedEcoMetric extends OrderEcoMetric {
  equivalentCarKm: number;
}

export async function recordEcoDeliveryChoice(
  orderId: string,
  optionId: EcoDeliveryOptionId,
  donateTree = false,
): Promise<RecordedEcoMetric> {
  const { data } = await api.post(`/eco-delivery/orders/${orderId}/choice`, {
    optionId,
    donateTree,
  });
  return data.data;
}

export async function getOrderEcoMetric(orderId: string): Promise<RecordedEcoMetric | null> {
  const { data } = await api.get(`/eco-delivery/orders/${orderId}/metric`);
  return data.data;
}

export async function getTreesPlantedSummary(): Promise<TreesPlantedSummary> {
  const { data } = await api.get('/eco-delivery/trees-planted');
  return data.data;
}
