/**
 * One-off backfill for seller lifetime sales/revenue.
 *
 * Historically `Seller.totalSales` / `totalRevenue` were only set by the seed and
 * never updated when an order was placed, so a real seller (created via the app)
 * stayed at 0 sales. The live increment now happens in OrderUseCase.createOrder;
 * this script credits orders that predate that fix.
 *
 * To avoid wiping the seeded demo numbers, it only recomputes sellers currently
 * at 0 sales, summing their own line items across all non-cancelled / non-refunded
 * orders.
 *
 * Run: pnpm --filter @ecommerce/server exec tsx src/scripts/backfill-seller-sales.ts
 */
import mongoose from 'mongoose';
import { config } from '../config';
import { SellerModel } from '../infrastructure/database/models/Seller';
import { ProductModel } from '../infrastructure/database/models/Product';
import { OrderModel } from '../infrastructure/database/models/Order';

async function main() {
  await mongoose.connect(config.mongodb.uri);
  console.log('[backfill] connected');

  const sellers = await SellerModel.find({ totalSales: { $lte: 0 } });
  console.log(`[backfill] ${sellers.length} seller(s) at 0 sales to recompute`);

  for (const seller of sellers) {
    const productIds = (await ProductModel.find({ sellerId: seller._id }, { _id: 1 }).lean()).map(
      (p) => p._id,
    );
    if (productIds.length === 0) continue;

    const [agg] = await OrderModel.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled', 'refunded'] },
          'items.productId': { $in: productIds },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          sales: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
    ]);

    const sales = agg?.sales ?? 0;
    const revenue = Math.round((agg?.revenue ?? 0) * 100) / 100;
    if (sales === 0) continue;

    await SellerModel.updateOne(
      { _id: seller._id },
      { $set: { totalSales: sales, totalRevenue: revenue } },
    );
    console.log(`[backfill] ${seller.shopName}: ${sales} sales, ${revenue} € revenue`);
  }

  await mongoose.disconnect();
  console.log('[backfill] done');
}

main().catch((err) => {
  console.error('[backfill] failed:', err);
  process.exit(1);
});
