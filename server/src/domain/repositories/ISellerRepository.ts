import { SellerEntity } from '../entities/Seller';

export interface CreateSellerData {
  userId: string;
  shopName: string;
  shopSlug: string;
  description: string;
  logo?: string;
  banner?: string;
}

export interface UpdateSellerData {
  shopName?: string;
  description?: string;
  logo?: string;
  banner?: string;
}

export interface FindSellersParams {
  page: number;
  limit: number;
  query?: string;
  isVerified?: boolean;
}

export interface ISellerRepository {
  findById(id: string): Promise<SellerEntity | null>;
  findByUserId(userId: string): Promise<SellerEntity | null>;
  findBySlug(slug: string): Promise<SellerEntity | null>;
  shopNameExists(shopName: string): Promise<boolean>;
  create(data: CreateSellerData): Promise<SellerEntity>;
  updateByUserId(userId: string, data: UpdateSellerData): Promise<SellerEntity | null>;
  setVerified(
    id: string,
    isVerified: boolean,
    commissionRate?: number,
  ): Promise<SellerEntity | null>;
  findMany(params: FindSellersParams): Promise<{ sellers: SellerEntity[]; total: number }>;
  // Bump a seller's lifetime sales count + revenue when an order is placed.
  incrementSales(sellerId: string, salesDelta: number, revenueDelta: number): Promise<void>;
}
