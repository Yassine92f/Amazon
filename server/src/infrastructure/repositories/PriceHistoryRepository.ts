import mongoose from 'mongoose';
import {
  IPriceHistoryRepository,
  PriceHistoryQuery,
  RecordPriceData,
} from '../../domain/repositories/IPriceHistoryRepository';
import { PriceHistoryEntity } from '../../domain/entities/PriceHistory';
import { PriceHistoryModel, PriceHistoryDocument } from '../database/models/PriceHistory';

export class PriceHistoryRepository implements IPriceHistoryRepository {
  async recordPrice(data: RecordPriceData): Promise<PriceHistoryEntity | null> {
    if (!mongoose.isValidObjectId(data.productId) || !mongoose.isValidObjectId(data.variantId)) {
      return null;
    }
    // De-dup: when the latest price for this variant equals the new one, skip
    // — observations should only land in the series when the price actually
    // changes (or it's the very first one).
    const latest = await PriceHistoryModel.findOne(
      { productId: data.productId, variantId: data.variantId },
      undefined,
      { sort: { recordedAt: -1 } },
    );
    if (latest && latest.price === data.price) return this.toEntity(latest);

    const doc = await PriceHistoryModel.create({
      productId: new mongoose.Types.ObjectId(data.productId),
      variantId: new mongoose.Types.ObjectId(data.variantId),
      price: data.price,
      recordedAt: data.recordedAt ?? new Date(),
    });
    return this.toEntity(doc);
  }

  async recordPrices(data: RecordPriceData[]): Promise<PriceHistoryEntity[]> {
    const out: PriceHistoryEntity[] = [];
    for (const entry of data) {
      const result = await this.recordPrice(entry);
      if (result) out.push(result);
    }
    return out;
  }

  async findInRange(query: PriceHistoryQuery): Promise<PriceHistoryEntity[]> {
    if (!mongoose.isValidObjectId(query.productId)) return [];
    const filter: Record<string, unknown> = {
      productId: new mongoose.Types.ObjectId(query.productId),
      recordedAt: { $gte: query.from, $lte: query.to },
    };
    if (query.variantId) {
      if (!mongoose.isValidObjectId(query.variantId)) return [];
      filter.variantId = new mongoose.Types.ObjectId(query.variantId);
    }
    const docs = await PriceHistoryModel.find(filter).sort({ recordedAt: 1 });
    return docs.map((d) => this.toEntity(d));
  }

  async findLowestEver(productId: string, variantId?: string): Promise<number | null> {
    if (!mongoose.isValidObjectId(productId)) return null;
    const filter: Record<string, unknown> = {
      productId: new mongoose.Types.ObjectId(productId),
    };
    if (variantId) {
      if (!mongoose.isValidObjectId(variantId)) return null;
      filter.variantId = new mongoose.Types.ObjectId(variantId);
    }
    const doc = await PriceHistoryModel.findOne(filter).sort({ price: 1 }).limit(1);
    return doc ? doc.price : null;
  }

  async findLatest(productId: string, variantId?: string): Promise<PriceHistoryEntity | null> {
    if (!mongoose.isValidObjectId(productId)) return null;
    const filter: Record<string, unknown> = {
      productId: new mongoose.Types.ObjectId(productId),
    };
    if (variantId) {
      if (!mongoose.isValidObjectId(variantId)) return null;
      filter.variantId = new mongoose.Types.ObjectId(variantId);
    }
    const doc = await PriceHistoryModel.findOne(filter).sort({ recordedAt: -1 });
    return doc ? this.toEntity(doc) : null;
  }

  async deleteByProduct(productId: string): Promise<void> {
    if (!mongoose.isValidObjectId(productId)) return;
    await PriceHistoryModel.deleteMany({
      productId: new mongoose.Types.ObjectId(productId),
    });
  }

  private toEntity(doc: PriceHistoryDocument): PriceHistoryEntity {
    return {
      id: (doc._id as mongoose.Types.ObjectId).toString(),
      productId: doc.productId.toString(),
      variantId: doc.variantId.toString(),
      price: doc.price,
      recordedAt: doc.recordedAt,
    };
  }
}
