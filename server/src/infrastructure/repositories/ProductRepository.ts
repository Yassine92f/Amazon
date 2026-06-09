import mongoose from 'mongoose';
import {
  IProductRepository,
  CreateProductData,
  UpdateProductData,
  ProductListFilters,
  ProductSearchResult,
  ProductFacets,
} from '../../domain/repositories/IProductRepository';
import { ProductEntity, ProductVariantEntity } from '../../domain/entities/Product';
import { ProductModel, ProductDocument, ProductVariantSubdoc } from '../database/models/Product';

export class ProductRepository implements IProductRepository {
  async findById(id: string): Promise<ProductEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await ProductModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByIds(ids: string[]): Promise<ProductEntity[]> {
    const valid = ids.filter((id) => mongoose.isValidObjectId(id));
    if (valid.length === 0) return [];
    const docs = await ProductModel.find({ _id: { $in: valid } });
    return docs.map((doc) => this.toEntity(doc));
  }

  async findBySlug(slug: string): Promise<ProductEntity | null> {
    const doc = await ProductModel.findOne({ slug: slug.toLowerCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const doc = await ProductModel.exists({ slug: slug.toLowerCase() });
    return doc !== null;
  }

  async create(data: CreateProductData): Promise<ProductEntity> {
    const doc = await ProductModel.create(data);
    return this.toEntity(doc);
  }

  async updateById(id: string, data: UpdateProductData): Promise<ProductEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await ProductModel.findById(id);
    if (!doc) return null;
    Object.assign(doc, data);
    await doc.save();
    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return;
    await ProductModel.findByIdAndDelete(id);
  }

  async countBySeller(sellerId: string, activeOnly = false): Promise<number> {
    const filter: Record<string, unknown> = { sellerId };
    if (activeOnly) filter.isActive = true;
    return ProductModel.countDocuments(filter);
  }

  async findIdsBySeller(sellerId: string): Promise<string[]> {
    if (!mongoose.isValidObjectId(sellerId)) return [];
    const docs = await ProductModel.find({ sellerId }, { _id: 1 }).lean();
    return docs.map((d) => (d._id as mongoose.Types.ObjectId).toString());
  }

  async countByCategory(categoryId: string): Promise<number> {
    return ProductModel.countDocuments({ categoryId, isActive: true });
  }

  async decrementVariantStock(
    productId: string,
    variantId: string,
    quantity: number,
  ): Promise<boolean> {
    if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(variantId)) return false;
    // Atomic guard: only decrement when the variant holds at least `quantity` in stock.
    const res = await ProductModel.updateOne(
      { _id: productId, 'variants._id': variantId, 'variants.stock': { $gte: quantity } },
      { $inc: { 'variants.$.stock': -quantity } },
    );
    if (res.modifiedCount !== 1) return false;
    await this.recomputeInStock(productId);
    return true;
  }

  async incrementVariantStock(
    productId: string,
    variantId: string,
    quantity: number,
  ): Promise<void> {
    if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(variantId)) return;
    await ProductModel.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': quantity } },
    );
    await this.recomputeInStock(productId);
  }

  async incrementTotalSold(productId: string, quantity: number): Promise<void> {
    if (!mongoose.isValidObjectId(productId)) return;
    await ProductModel.updateOne({ _id: productId }, { $inc: { totalSold: quantity } });
  }

  async updateRating(productId: string, rating: number, reviewCount: number): Promise<void> {
    if (!mongoose.isValidObjectId(productId)) return;
    await ProductModel.updateOne({ _id: productId }, { $set: { rating, reviewCount } });
  }

  // Keep the denormalized `inStock` flag in sync after a stock mutation (the
  // pre('save') hook does not run on updateOne, so recompute via a pipeline update).
  private async recomputeInStock(productId: string): Promise<void> {
    await ProductModel.updateOne({ _id: productId }, [
      {
        $set: {
          inStock: {
            $anyElementTrue: {
              $map: { input: '$variants', as: 'v', in: { $gt: ['$$v.stock', 0] } },
            },
          },
        },
      },
    ]);
  }

  async search(filters: ProductListFilters): Promise<ProductSearchResult> {
    const match = this.buildMatchStage(filters);
    const useTextScore = Boolean(filters.query) && filters.sortBy === 'relevance';
    const sort = this.buildSortStage(filters, useTextScore);

    const skip = (filters.page - 1) * filters.limit;

    const projection: Record<string, unknown> = useTextScore
      ? { score: { $meta: 'textScore' } }
      : {};

    const pipeline: mongoose.PipelineStage[] = [{ $match: match }];
    if (Object.keys(projection).length) {
      pipeline.push({ $addFields: projection });
    }
    pipeline.push({
      $facet: {
        items: [{ $sort: sort }, { $skip: skip }, { $limit: filters.limit }],
        total: [{ $count: 'count' }],
        categories: [{ $group: { _id: '$categoryId', count: { $sum: 1 } } }],
        brands: [
          { $match: { brand: { $exists: true, $ne: null } } },
          { $group: { _id: '$brand', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
        priceRange: [
          {
            $group: {
              _id: null,
              min: { $min: '$minPrice' },
              max: { $max: '$maxPrice' },
            },
          },
        ],
        ratingDistribution: [
          {
            $bucket: {
              groupBy: '$rating',
              boundaries: [0, 1, 2, 3, 4, 5.01],
              default: 'other',
              output: { count: { $sum: 1 } },
            },
          },
        ],
      },
    });

    type FacetResult = {
      items: ProductDocument[];
      total: { count: number }[];
      categories: { _id: mongoose.Types.ObjectId; count: number }[];
      brands: { _id: string; count: number }[];
      priceRange: { min: number; max: number }[];
      ratingDistribution: { _id: number | string; count: number }[];
    };

    const [result] = (await ProductModel.aggregate<FacetResult>(pipeline)) as FacetResult[];

    const products = (result?.items ?? []).map((doc) =>
      this.toEntity(doc as unknown as ProductDocument),
    );

    const facets: ProductFacets = {
      categories: (result?.categories ?? []).map((c) => ({
        value: c._id.toString(),
        count: c.count,
      })),
      brands: (result?.brands ?? []).map((b) => ({ value: b._id, count: b.count })),
      priceRange: result?.priceRange?.[0] ?? { min: 0, max: 0 },
      ratingDistribution: this.normalizeRatingBuckets(result?.ratingDistribution ?? []),
    };

    return {
      products,
      total: result?.total?.[0]?.count ?? 0,
      facets,
    };
  }

  private buildMatchStage(filters: ProductListFilters): Record<string, unknown> {
    const match: Record<string, unknown> = {};

    if (filters.isActive !== undefined) match.isActive = filters.isActive;
    else if (!filters.anyStatus) match.isActive = true;

    if (filters.isFeatured !== undefined) match.isFeatured = filters.isFeatured;
    if (filters.sellerId) match.sellerId = new mongoose.Types.ObjectId(filters.sellerId);

    if (filters.categoryIds?.length) {
      match.categoryId = { $in: filters.categoryIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    if (filters.brands?.length) match.brand = { $in: filters.brands };
    if (filters.tags?.length) match.tags = { $in: filters.tags };

    if (filters.minRating !== undefined) match.rating = { $gte: filters.minRating };
    if (filters.inStock) match.inStock = true;

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice !== undefined) priceFilter.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceFilter.$lte = filters.maxPrice;
      match.minPrice = priceFilter;
    }

    if (filters.query) {
      match.$text = { $search: filters.query };
    }

    return match;
  }

  private buildSortStage(
    filters: ProductListFilters,
    useTextScore: boolean,
  ): Record<string, 1 | -1 | { $meta: 'textScore' }> {
    const order: 1 | -1 = filters.sortOrder === 'asc' ? 1 : -1;
    switch (filters.sortBy) {
      case 'price':
        return { minPrice: order };
      case 'rating':
        return { rating: order, reviewCount: -1 };
      case 'totalSold':
        return { totalSold: order };
      case 'brand':
        // Alphabetical by brand (asc by default), name as tie-breaker.
        return { brand: order, name: 1 };
      case 'createdAt':
        return { createdAt: order };
      case 'relevance':
      default:
        if (useTextScore) return { score: { $meta: 'textScore' }, createdAt: -1 };
        return { createdAt: -1 };
    }
  }

  private normalizeRatingBuckets(
    raw: { _id: number | string; count: number }[],
  ): { stars: number; count: number }[] {
    const buckets = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: 0 }));
    for (const r of raw) {
      // `$bucket` keys each group by its lower boundary (0,1,2,3,4); the [0,1)
      // bucket must still land on the 1★ level instead of being dropped.
      const lower = typeof r._id === 'number' ? r._id : 0;
      const stars = Math.min(5, Math.floor(lower) + 1);
      const target = buckets.find((b) => b.stars === stars);
      if (target) target.count += r.count;
    }
    return buckets;
  }

  private toEntity(doc: ProductDocument): ProductEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      sellerId: doc.sellerId.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      categoryId: doc.categoryId.toString(),
      brand: doc.brand,
      tags: doc.tags,
      variants: doc.variants.map((v) => this.variantToEntity(v)),
      images: doc.images,
      rating: doc.rating,
      reviewCount: doc.reviewCount,
      totalSold: doc.totalSold,
      isActive: doc.isActive,
      isFeatured: doc.isFeatured,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private variantToEntity(v: ProductVariantSubdoc): ProductVariantEntity {
    const attrs: Record<string, string> = {};
    if (v.attributes instanceof Map) {
      for (const [k, val] of v.attributes) attrs[k] = val;
    } else if (v.attributes && typeof v.attributes === 'object') {
      Object.assign(attrs, v.attributes);
    }
    return {
      id: v._id.toString(),
      name: v.name,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      attributes: attrs,
      images: v.images,
    };
  }
}
