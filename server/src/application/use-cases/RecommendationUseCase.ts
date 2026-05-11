import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IProductViewRepository } from '../../domain/repositories/IProductViewRepository';
import { ISellerRepository } from '../../domain/repositories/ISellerRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { ProductEntity } from '../../domain/entities/Product';

/**
 * Why a product is being recommended. The backend stays UI-agnostic: it returns
 * a machine code plus the dynamic label (a product/category/brand name), and the
 * frontend composes the localized sentence.
 */
export type RecommendationReason =
  | 'bought_together'
  | 'category_affinity'
  | 'brand_affinity'
  | 'viewed_related'
  | 'similar'
  | 'trending';

export interface RecommendationItemDto {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sellerId: string;
  shopName?: string;
  isFeatured: boolean;
  reasonCode: RecommendationReason;
  reasonLabel?: string;
  score: number;
}

// --- Signal weights -------------------------------------------------------
// A purchase is the strongest intent signal, a recent view the weakest.
const PURCHASE_WEIGHT = 3;
const VIEW_WEIGHT = 1;
// Behavioral signals lose half their weight every ~6 weeks.
const HALF_LIFE_DAYS = 45;

// --- Content sub-weights (which attribute carries taste) ------------------
const CATEGORY_WEIGHT = 1.0;
const BRAND_WEIGHT = 0.6;
const TAG_WEIGHT = 0.4;

// --- Final blend ----------------------------------------------------------
// score = ALPHA*content + BETA*collaborative + GAMMA*popularity (each in [0,1]).
const ALPHA_CONTENT = 0.5;
const BETA_COLLAB = 0.3;
const GAMMA_POP = 0.2;

interface Signal {
  productId: string;
  weight: number;
}

interface ScoredCandidate {
  product: ProductEntity;
  content: number;
  collaborative: number;
  popularity: number;
}

export class RecommendationUseCase {
  constructor(
    private productRepo: IProductRepository,
    private orderRepo: IOrderRepository,
    private viewRepo: IProductViewRepository,
    private sellerRepo: ISellerRepository,
    private categoryRepo: ICategoryRepository,
  ) {}

  /** Record that a user looked at a product (behavioral signal). */
  async recordView(userId: string, productId: string): Promise<void> {
    await this.viewRepo.record(userId, productId);
  }

  /**
   * Personalized recommendations for a user. Combines a content taste profile
   * (categories/brands/tags weighted by purchases > views with recency decay),
   * an item-to-item co-purchase signal, and popularity. Falls back to trending
   * products when the user has no history (cold start).
   */
  async getForUser(userId: string, limit = 10): Promise<RecommendationItemDto[]> {
    const now = Date.now();

    // 1. Gather behavioral signals.
    const { orders } = await this.orderRepo.findByUser(userId, { page: 1, limit: 50 });
    const purchasedIds = new Set<string>();
    const purchasedNames = new Map<string, string>();
    const signals = new Map<string, Signal>();

    for (const order of orders) {
      const decay = this.recency(order.createdAt, now);
      for (const item of order.items) {
        purchasedIds.add(item.productId);
        if (!purchasedNames.has(item.productId)) {
          purchasedNames.set(item.productId, item.productName);
        }
        this.addSignal(signals, item.productId, PURCHASE_WEIGHT * decay);
      }
    }

    const recentViews = await this.viewRepo.findRecentByUser(userId, 20);
    for (const view of recentViews) {
      this.addSignal(signals, view.productId, VIEW_WEIGHT * this.recency(view.viewedAt, now));
    }

    // Cold start: no behavior yet -> trending.
    if (signals.size === 0) {
      return this.trending(limit);
    }

    // 2. Build the taste profile from the products behind the signals.
    const signalProducts = await this.productRepo.findByIds([...signals.keys()]);
    const categoryScore = new Map<string, number>();
    const brandScore = new Map<string, number>();
    const tagScore = new Map<string, number>();

    for (const p of signalProducts) {
      const w = signals.get(p.id)?.weight ?? 0;
      this.bump(categoryScore, p.categoryId, w);
      if (p.brand) this.bump(brandScore, p.brand, w);
      for (const tag of p.tags) this.bump(tagScore, tag, w);
    }

    // 3. Build the candidate pool: products in the user's favorite categories
    //    plus products frequently co-purchased with what they already own.
    const candidates = new Map<string, ProductEntity>();
    const topCategories = this.topKeys(categoryScore, 3);
    if (topCategories.length > 0) {
      const { products } = await this.productRepo.search({
        page: 1,
        limit: 60,
        categoryIds: topCategories,
        inStock: true,
        sortBy: 'rating',
        sortOrder: 'desc',
      });
      for (const p of products) candidates.set(p.id, p);
    }

    const { coCount, coWith } = await this.coPurchase(purchasedIds, signals);
    if (coCount.size > 0) {
      const coProducts = await this.productRepo.findByIds([...coCount.keys()]);
      for (const p of coProducts) candidates.set(p.id, p);
    }

    // 4. Score candidates (exclude what the user already engaged with).
    const scored: ScoredCandidate[] = [];
    for (const product of candidates.values()) {
      if (signals.has(product.id)) continue;
      if (!product.isActive) continue;
      if (!product.variants.some((v) => v.stock > 0)) continue;
      scored.push({
        product,
        content: this.contentScore(product, categoryScore, brandScore, tagScore),
        collaborative: coCount.get(product.id) ?? 0,
        popularity: this.popularity(product),
      });
    }

    if (scored.length === 0) return this.trending(limit);

    const ranked = this.blendAndRank(scored, limit);

    // 5. Attach an explainable reason and map to the output DTO.
    const dtos = await this.toDtos(ranked, (c) =>
      this.reasonForUser(c, { categoryScore, brandScore, coCount, coWith }),
    );

    // 6. Backfill with trending products so the rail is always worth showing,
    //    even when a narrow taste profile yields few personalized candidates.
    if (dtos.length < limit) {
      const exclude = new Set<string>([...signals.keys(), ...dtos.map((d) => d._id)]);
      const fillers = await this.trending(limit + exclude.size);
      for (const item of fillers) {
        if (dtos.length >= limit) break;
        if (!exclude.has(item._id)) dtos.push(item);
      }
    }

    return dtos;
  }

  /**
   * "You may also like" for a product page. Similarity to the anchor product
   * (same category / shared brand / shared tags) blended with co-purchase and
   * popularity. Works for anonymous visitors too.
   */
  async getSimilarToProduct(productId: string, limit = 8): Promise<RecommendationItemDto[]> {
    const anchor = await this.productRepo.findById(productId);
    if (!anchor) return [];

    const candidates = new Map<string, ProductEntity>();
    const { products } = await this.productRepo.search({
      page: 1,
      limit: 40,
      categoryIds: [anchor.categoryId],
      inStock: true,
      sortBy: 'rating',
      sortOrder: 'desc',
    });
    for (const p of products) candidates.set(p.id, p);

    const { coCount } = await this.coPurchase(new Set([anchor.id]), new Map());
    if (coCount.size > 0) {
      const coProducts = await this.productRepo.findByIds([...coCount.keys()]);
      for (const p of coProducts) candidates.set(p.id, p);
    }

    const anchorTags = new Set(anchor.tags);
    const scored: ScoredCandidate[] = [];
    for (const product of candidates.values()) {
      if (product.id === anchor.id) continue;
      if (!product.isActive) continue;
      if (!product.variants.some((v) => v.stock > 0)) continue;
      const sharedTags = product.tags.filter((t) => anchorTags.has(t)).length;
      const content =
        (product.categoryId === anchor.categoryId ? CATEGORY_WEIGHT : 0) +
        (anchor.brand && product.brand === anchor.brand ? BRAND_WEIGHT : 0) +
        sharedTags * TAG_WEIGHT;
      scored.push({
        product,
        content,
        collaborative: coCount.get(product.id) ?? 0,
        popularity: this.popularity(product),
      });
    }

    if (scored.length === 0) return [];

    const ranked = this.blendAndRank(scored, limit);
    return this.toDtos(ranked, (c) => {
      if (c.collaborative > 0 && this.isCollabDominant(c, ranked)) {
        return { reasonCode: 'bought_together', reasonLabel: anchor.name };
      }
      if (anchor.brand && c.product.brand === anchor.brand) {
        return { reasonCode: 'brand_affinity', reasonLabel: anchor.brand };
      }
      return { reasonCode: 'similar', reasonLabel: anchor.name };
    });
  }

  // --- Trending fallback ---------------------------------------------------

  private async trending(limit: number): Promise<RecommendationItemDto[]> {
    const { products } = await this.productRepo.search({
      page: 1,
      limit,
      inStock: true,
      sortBy: 'totalSold',
      sortOrder: 'desc',
    });
    const scored = products.map((product) => ({
      product,
      content: 0,
      collaborative: 0,
      popularity: this.popularity(product),
    }));
    return this.toDtos(scored, () => ({ reasonCode: 'trending' }));
  }

  // --- Co-purchase signal --------------------------------------------------

  private async coPurchase(
    seedIds: Set<string>,
    exclude: Map<string, Signal>,
  ): Promise<{ coCount: Map<string, number>; coWith: Map<string, string> }> {
    const coCount = new Map<string, number>();
    const coWith = new Map<string, string>();
    if (seedIds.size === 0) return { coCount, coWith };

    const { orders } = await this.orderRepo.findByProductIds([...seedIds], { page: 1, limit: 200 });
    for (const order of orders) {
      const seedInOrder = order.items.find((i) => seedIds.has(i.productId));
      for (const item of order.items) {
        if (seedIds.has(item.productId) || exclude.has(item.productId)) continue;
        this.bump(coCount, item.productId, 1);
        if (seedInOrder && !coWith.has(item.productId)) {
          coWith.set(item.productId, seedInOrder.productName);
        }
      }
    }
    return { coCount, coWith };
  }

  // --- Scoring helpers -----------------------------------------------------

  private contentScore(
    p: ProductEntity,
    categoryScore: Map<string, number>,
    brandScore: Map<string, number>,
    tagScore: Map<string, number>,
  ): number {
    let score = (categoryScore.get(p.categoryId) ?? 0) * CATEGORY_WEIGHT;
    if (p.brand) score += (brandScore.get(p.brand) ?? 0) * BRAND_WEIGHT;
    for (const tag of p.tags) score += (tagScore.get(tag) ?? 0) * TAG_WEIGHT;
    return score;
  }

  private popularity(p: ProductEntity): number {
    // Rating scaled to [0,1] times a log-dampened sales volume.
    return (p.rating / 5) * Math.log10(1 + p.totalSold);
  }

  /** Normalize each component to [0,1], blend, sort desc, keep top N. */
  private blendAndRank(scored: ScoredCandidate[], limit: number): ScoredCandidate[] {
    const maxContent = Math.max(...scored.map((s) => s.content), 0) || 1;
    const maxCollab = Math.max(...scored.map((s) => s.collaborative), 0) || 1;
    const maxPop = Math.max(...scored.map((s) => s.popularity), 0) || 1;

    return scored
      .map((s) => ({
        ...s,
        score:
          ALPHA_CONTENT * (s.content / maxContent) +
          BETA_COLLAB * (s.collaborative / maxCollab) +
          GAMMA_POP * (s.popularity / maxPop),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private isCollabDominant(c: ScoredCandidate, all: ScoredCandidate[]): boolean {
    const maxCollab = Math.max(...all.map((s) => s.collaborative), 0) || 1;
    const maxContent = Math.max(...all.map((s) => s.content), 0) || 1;
    return BETA_COLLAB * (c.collaborative / maxCollab) >= ALPHA_CONTENT * (c.content / maxContent);
  }

  private async reasonForUser(
    c: ScoredCandidate & { score: number },
    ctx: {
      categoryScore: Map<string, number>;
      brandScore: Map<string, number>;
      coCount: Map<string, number>;
      coWith: Map<string, string>;
    },
  ): Promise<{ reasonCode: RecommendationReason; reasonLabel?: string }> {
    // A concrete co-purchase ("bought with X") is the most specific and
    // convincing explanation, so it wins whenever one exists.
    if (c.collaborative > 0 && ctx.coWith.has(c.product.id)) {
      return { reasonCode: 'bought_together', reasonLabel: ctx.coWith.get(c.product.id) };
    }
    // Otherwise lean on the strongest content attribute.
    const brandHit = c.product.brand ? (ctx.brandScore.get(c.product.brand) ?? 0) : 0;
    const categoryHit = ctx.categoryScore.get(c.product.categoryId) ?? 0;
    if (categoryHit >= brandHit && categoryHit > 0) {
      const category = await this.categoryRepo.findById(c.product.categoryId);
      return { reasonCode: 'category_affinity', reasonLabel: category?.name };
    }
    if (brandHit > 0 && c.product.brand) {
      return { reasonCode: 'brand_affinity', reasonLabel: c.product.brand };
    }
    return { reasonCode: 'trending' };
  }

  // --- Mapping -------------------------------------------------------------

  private async toDtos(
    scored: Array<ScoredCandidate & { score?: number }>,
    reasonFor: (
      c: ScoredCandidate & { score: number },
    ) =>
      | { reasonCode: RecommendationReason; reasonLabel?: string }
      | Promise<{ reasonCode: RecommendationReason; reasonLabel?: string }>,
  ): Promise<RecommendationItemDto[]> {
    const sellerNames = new Map<string, string | undefined>();
    const out: RecommendationItemDto[] = [];

    for (const s of scored) {
      const withScore = { ...s, score: s.score ?? 0 };
      const reason = await reasonFor(withScore);
      const p = s.product;

      if (!sellerNames.has(p.sellerId)) {
        const seller = await this.sellerRepo.findById(p.sellerId);
        sellerNames.set(p.sellerId, seller?.shopName);
      }
      const cheapest = p.variants.reduce<ProductEntity['variants'][number] | undefined>(
        (min, v) => (!min || v.price < min.price ? v : min),
        undefined,
      );

      out.push({
        _id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        image: p.images[0] ?? cheapest?.images[0] ?? '',
        price: cheapest?.price ?? 0,
        compareAtPrice: cheapest?.compareAtPrice,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.variants.some((v) => v.stock > 0),
        sellerId: p.sellerId,
        shopName: sellerNames.get(p.sellerId),
        isFeatured: p.isFeatured,
        reasonCode: reason.reasonCode,
        reasonLabel: reason.reasonLabel,
        score: Math.round(withScore.score * 1000) / 1000,
      });
    }
    return out;
  }

  // --- Small utilities -----------------------------------------------------

  private recency(date: Date, now: number): number {
    const ageDays = (now - date.getTime()) / 86_400_000;
    return Math.pow(0.5, Math.max(0, ageDays) / HALF_LIFE_DAYS);
  }

  private addSignal(map: Map<string, Signal>, productId: string, weight: number): void {
    const existing = map.get(productId);
    if (existing) existing.weight += weight;
    else map.set(productId, { productId, weight });
  }

  private bump(map: Map<string, number>, key: string, by: number): void {
    map.set(key, (map.get(key) ?? 0) + by);
  }

  private topKeys(map: Map<string, number>, k: number): string[] {
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([key]) => key);
  }
}
