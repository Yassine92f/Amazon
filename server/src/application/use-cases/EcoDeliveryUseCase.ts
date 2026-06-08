import {
  ECO_DELIVERY_OPTIONS,
  ECO_BASELINE_CO2_KG,
  CAR_KM_PER_KG_CO2,
  EcoDeliveryOptionEntity,
  EcoDeliveryOptionIdEntity,
  findEcoOption,
} from '../../domain/entities/EcoDeliveryOption';
import { CENTS_PER_TREE } from '../../domain/entities/OrderEcoMetric';
import { IOrderEcoMetricRepository } from '../../domain/repositories/IOrderEcoMetricRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';

export interface EcoDeliveryOptionDto {
  id: EcoDeliveryOptionIdEntity;
  i18nKey: string;
  co2KgPerShipment: number;
  estimatedDays: number;
  availability: 'global' | 'urban_only';
  isRecommended?: boolean;
}

export interface EcoDeliveryOptionsResponseDto {
  options: EcoDeliveryOptionDto[];
  baselineCo2Kg: number;
}

export interface EcoDeliveryImpactDto {
  optionId: EcoDeliveryOptionIdEntity;
  co2EmittedKg: number;
  co2SavedKg: number;
  equivalentCarKm: number;
}

export interface OrderEcoMetricDto {
  orderId: string;
  optionId: EcoDeliveryOptionIdEntity;
  co2EmittedKg: number;
  co2SavedKg: number;
  equivalentCarKm: number;
  treeDonationCents: number;
  treesPlanted: number;
  recordedAt: string;
}

export interface TreesPlantedSummaryDto {
  totalTrees: number;
  totalDonationCents: number;
}

export interface RecordChoiceInput {
  optionId: EcoDeliveryOptionIdEntity;
  donateTree?: boolean;
}

export class EcoDeliveryUseCase {
  constructor(
    private metricRepo: IOrderEcoMetricRepository,
    private orderRepo: IOrderRepository,
  ) {}

  /** Static catalogue — no DB read. */
  listOptions(): EcoDeliveryOptionsResponseDto {
    return {
      options: ECO_DELIVERY_OPTIONS.map((o) => ({
        id: o.id,
        i18nKey: o.i18nKey,
        co2KgPerShipment: o.co2KgPerShipment,
        estimatedDays: o.estimatedDays,
        availability: o.availability,
        isRecommended: o.isRecommended,
      })),
      baselineCo2Kg: ECO_BASELINE_CO2_KG,
    };
  }

  /** Compute the CO2 impact preview for a single option (used by the UI live). */
  computeImpact(optionId: EcoDeliveryOptionIdEntity): EcoDeliveryImpactDto {
    const option = this.requireOption(optionId);
    return this.toImpact(option);
  }

  /**
   * Persist the buyer's choice for a given order they own. Returns the stored
   * metric so the UI can show the locked-in impact on the confirmation page.
   * When `donateTree` is true, a €1 pledge for 1 tree is attached to the same
   * row — that's intentionally an add-on (not a separate row) so a single
   * order has at most one eco-metric document.
   */
  async recordChoice(
    userId: string,
    orderId: string,
    input: RecordChoiceInput,
  ): Promise<OrderEcoMetricDto> {
    const option = this.requireOption(input.optionId);

    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new EcoDeliveryError(404, 'Order not found');
    if (order.userId !== userId) {
      throw new EcoDeliveryError(403, 'You can only annotate your own orders');
    }

    const impact = this.toImpact(option);
    const treesPlanted = input.donateTree ? 1 : 0;
    const treeDonationCents = treesPlanted * CENTS_PER_TREE;

    const stored = await this.metricRepo.upsert({
      orderId,
      optionId: option.id,
      co2EmittedKg: impact.co2EmittedKg,
      co2SavedKg: impact.co2SavedKg,
      treeDonationCents,
      treesPlanted,
      recordedAt: new Date(),
    });

    return this.toMetricDto(stored);
  }

  /** Read the locked-in choice for a confirmed order. */
  async getForOrder(userId: string, orderId: string): Promise<OrderEcoMetricDto | null> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new EcoDeliveryError(404, 'Order not found');
    if (order.userId !== userId) {
      throw new EcoDeliveryError(403, 'You can only read your own orders');
    }
    const metric = await this.metricRepo.findByOrderId(orderId);
    if (!metric) return null;
    return this.toMetricDto(metric);
  }

  /** Public counter — fuels the "X trees planted by our community" callout. */
  async getTreesPlantedSummary(): Promise<TreesPlantedSummaryDto> {
    return this.metricRepo.countTreesPlanted();
  }

  private toMetricDto(metric: {
    orderId: string;
    optionId: EcoDeliveryOptionIdEntity;
    co2EmittedKg: number;
    co2SavedKg: number;
    treeDonationCents: number;
    treesPlanted: number;
    recordedAt: Date;
  }): OrderEcoMetricDto {
    return {
      orderId: metric.orderId,
      optionId: metric.optionId,
      co2EmittedKg: metric.co2EmittedKg,
      co2SavedKg: metric.co2SavedKg,
      equivalentCarKm: Math.round(metric.co2SavedKg * CAR_KM_PER_KG_CO2 * 10) / 10,
      treeDonationCents: metric.treeDonationCents,
      treesPlanted: metric.treesPlanted,
      recordedAt: metric.recordedAt.toISOString(),
    };
  }

  private requireOption(id: EcoDeliveryOptionIdEntity): EcoDeliveryOptionEntity {
    const option = findEcoOption(id);
    if (!option) throw new EcoDeliveryError(400, `Unknown eco-delivery option: ${id}`);
    return option;
  }

  private toImpact(option: EcoDeliveryOptionEntity): EcoDeliveryImpactDto {
    const co2SavedKg = Math.max(0, ECO_BASELINE_CO2_KG - option.co2KgPerShipment);
    return {
      optionId: option.id,
      co2EmittedKg: option.co2KgPerShipment,
      co2SavedKg: Math.round(co2SavedKg * 100) / 100,
      equivalentCarKm: Math.round(co2SavedKg * CAR_KM_PER_KG_CO2 * 10) / 10,
    };
  }
}

export class EcoDeliveryError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, EcoDeliveryError.prototype);
  }
}
