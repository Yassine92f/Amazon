import { IPriceHistoryRepository } from '../../domain/repositories/IPriceHistoryRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { PriceHistoryEntity } from '../../domain/entities/PriceHistory';
import { ProductEntity, ProductVariantEntity } from '../../domain/entities/Product';

export interface PriceHistoryPointDto {
  date: string;
  price: number;
}

export interface PriceHistorySummaryDto {
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  lowestEverPrice: number;
  isLowestEver: boolean;
  dropFromMaxPercent: number;
}

export interface PriceHistoryResponseDto {
  productId: string;
  variantId?: string;
  variantName?: string;
  period: { from: string; to: string; days: number };
  points: PriceHistoryPointDto[];
  summary: PriceHistorySummaryDto;
}

// Period bounds — keep a small whitelist to avoid abusive ranges.
const MIN_DAYS = 7;
const MAX_DAYS = 365;
const DEFAULT_DAYS = 90;

export class PriceHistoryUseCase {
  constructor(
    private historyRepo: IPriceHistoryRepository,
    private productRepo: IProductRepository,
  ) {}

  /**
   * Record the initial price of every variant when a product is created. Without
   * this seed point, the chart would have nothing to plot until the seller's
   * first edit.
   */
  async recordCreate(product: ProductEntity): Promise<void> {
    await this.historyRepo.recordPrices(
      product.variants.map((v) => ({
        productId: product.id,
        variantId: v.id,
        price: v.price,
        recordedAt: product.createdAt,
      })),
    );
  }

  /**
   * Diff the new variant list against the previous one and append an entry for
   * each variant whose price changed. The repository de-dups identical prices,
   * so passing every variant is safe — but skipping unchanged ones keeps the
   * write cost minimal.
   */
  async recordUpdate(
    previous: ProductVariantEntity[],
    next: ProductVariantEntity[],
    productId: string,
  ): Promise<void> {
    const prevByKey = new Map<string, number>();
    for (const v of previous) {
      // Track price both by id (for updated variants) and by sku (for variants
      // recreated through full-list replacement, which keep the same sku but
      // get a fresh ObjectId on update).
      prevByKey.set(`id:${v.id}`, v.price);
      if (v.sku) prevByKey.set(`sku:${v.sku}`, v.price);
    }

    const toRecord = next
      .filter((v) => {
        const prevPrice = prevByKey.get(`id:${v.id}`) ?? prevByKey.get(`sku:${v.sku}`);
        return prevPrice === undefined || prevPrice !== v.price;
      })
      .map((v) => ({ productId, variantId: v.id, price: v.price }));

    if (toRecord.length > 0) {
      await this.historyRepo.recordPrices(toRecord);
    }
  }

  /** Wipe the audit series for a deleted product so we don't leak data. */
  async deleteForProduct(productId: string): Promise<void> {
    await this.historyRepo.deleteByProduct(productId);
  }

  /** Public read endpoint backing the chart on the product detail page. */
  async getHistory(input: {
    productId: string;
    variantId?: string;
    days?: number;
  }): Promise<PriceHistoryResponseDto> {
    const days = this.clampDays(input.days);

    const product = await this.productRepo.findById(input.productId);
    if (!product) throw new PriceHistoryError(404, 'Product not found');

    // Resolve the requested variant — fall back to the cheapest variant when no
    // id is given so the buy box default and the chart default stay in sync.
    const variant = input.variantId
      ? product.variants.find((v) => v.id === input.variantId)
      : product.variants.reduce<ProductVariantEntity | undefined>(
          (min, v) => (!min || v.price < min.price ? v : min),
          undefined,
        );

    if (input.variantId && !variant) {
      throw new PriceHistoryError(404, 'Variant not found');
    }

    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

    const [entries, lowestEver, latest] = await Promise.all([
      this.historyRepo.findInRange({
        productId: product.id,
        variantId: variant?.id,
        from,
        to,
      }),
      this.historyRepo.findLowestEver(product.id, variant?.id),
      this.historyRepo.findLatest(product.id, variant?.id),
    ]);

    const points = this.aggregateByDay(entries, from, to, variant);
    const summary = this.buildSummary(points, variant, lowestEver, latest);

    return {
      productId: product.id,
      variantId: variant?.id,
      variantName: variant?.name,
      period: { from: from.toISOString(), to: to.toISOString(), days },
      points,
      summary,
    };
  }

  private clampDays(raw: number | undefined): number {
    if (!raw || !Number.isFinite(raw)) return DEFAULT_DAYS;
    const days = Math.floor(raw);
    if (days < MIN_DAYS) return MIN_DAYS;
    if (days > MAX_DAYS) return MAX_DAYS;
    return days;
  }

  /**
   * Collapse raw observations into one point per day (last price observed that
   * day wins). Days with no observation reuse the previous day's price so the
   * chart stays continuous — a flat line means "price unchanged".
   */
  private aggregateByDay(
    entries: PriceHistoryEntity[],
    from: Date,
    to: Date,
    variant: ProductVariantEntity | undefined,
  ): PriceHistoryPointDto[] {
    if (entries.length === 0) {
      // No history at all: emit two points so the chart can still render a flat
      // line at the current price.
      const price = variant?.price ?? 0;
      return [
        { date: this.dateKey(from), price },
        { date: this.dateKey(to), price },
      ];
    }

    // Group by ISO day, keeping the latest observation of each day.
    const byDay = new Map<string, number>();
    for (const e of entries) {
      byDay.set(this.dateKey(e.recordedAt), e.price);
    }

    const points: PriceHistoryPointDto[] = [];
    // If the first observation is after `from`, back-fill with the most recent
    // earlier price — that's the price the product had at the start of the
    // window.
    let runningPrice = entries[0]?.price ?? variant?.price ?? 0;
    const days = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
    for (let i = 0; i <= days; i++) {
      const cursor = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      const key = this.dateKey(cursor);
      if (byDay.has(key)) runningPrice = byDay.get(key)!;
      points.push({ date: key, price: runningPrice });
    }
    return points;
  }

  private buildSummary(
    points: PriceHistoryPointDto[],
    variant: ProductVariantEntity | undefined,
    lowestEver: number | null,
    latest: PriceHistoryEntity | null,
  ): PriceHistorySummaryDto {
    const prices = points.map((p) => p.price);
    const minPrice = prices.length ? Math.min(...prices) : (variant?.price ?? 0);
    const maxPrice = prices.length ? Math.max(...prices) : (variant?.price ?? 0);
    const avgPrice = prices.length
      ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
      : (variant?.price ?? 0);

    // Trust the variant's current price first (it's the source of truth shown
    // in the buy box), fall back to the latest recorded observation.
    const currentPrice = variant?.price ?? latest?.price ?? 0;
    const effectiveLowest = lowestEver ?? currentPrice;
    const isLowestEver = currentPrice <= effectiveLowest;
    const dropFromMaxPercent =
      maxPrice > 0 && maxPrice > currentPrice
        ? Math.round(((maxPrice - currentPrice) / maxPrice) * 100)
        : 0;

    return {
      currentPrice,
      minPrice,
      maxPrice,
      avgPrice,
      lowestEverPrice: effectiveLowest,
      isLowestEver,
      dropFromMaxPercent,
    };
  }

  private dateKey(d: Date): string {
    // YYYY-MM-DD in UTC to dodge timezone drift across day boundaries.
    return d.toISOString().slice(0, 10);
  }
}

export class PriceHistoryError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, PriceHistoryError.prototype);
  }
}
