export interface SellerEntity {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  description: string;
  logo?: string;
  banner?: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalRevenue: number;
  isVerified: boolean;
  commissionRate: number;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
