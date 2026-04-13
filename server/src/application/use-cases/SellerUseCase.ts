import { UserRole } from '@ecommerce/shared';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import {
  ISellerRepository,
  FindSellersParams,
  UpdateSellerData,
} from '../../domain/repositories/ISellerRepository';
import { SellerEntity } from '../../domain/entities/Seller';
import { slugify } from '../utils/slugify';

export interface RegisterSellerInput {
  userId: string;
  shopName: string;
  description: string;
}

export interface SellerDto {
  _id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  description: string;
  logo?: string;
  banner?: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  isVerified: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSellersDto {
  items: SellerDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class SellerUseCase {
  constructor(
    private sellerRepo: ISellerRepository,
    private userRepo: IUserRepository,
  ) {}

  async becomeSeller(input: RegisterSellerInput): Promise<SellerDto> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new SellerError(404, 'User not found');
    }
    if (user.role === UserRole.ADMIN) {
      throw new SellerError(403, 'Admins cannot become sellers');
    }

    const existing = await this.sellerRepo.findByUserId(input.userId);
    if (existing) {
      throw new SellerError(409, 'You already have a seller profile');
    }

    const shopName = input.shopName.trim();
    if (!shopName) {
      throw new SellerError(400, 'Shop name is required');
    }

    const nameExists = await this.sellerRepo.shopNameExists(shopName);
    if (nameExists) {
      throw new SellerError(409, 'A shop with this name already exists');
    }

    const shopSlug = await this.generateUniqueSlug(shopName);

    const seller = await this.sellerRepo.create({
      userId: input.userId,
      shopName,
      shopSlug,
      description: input.description.trim(),
    });

    await this.userRepo.updateById(input.userId, { role: UserRole.SELLER });

    return this.toDto(seller);
  }

  async getMyShop(userId: string): Promise<SellerDto> {
    const seller = await this.sellerRepo.findByUserId(userId);
    if (!seller) {
      throw new SellerError(404, 'Seller profile not found');
    }
    return this.toDto(seller);
  }

  async updateMyShop(userId: string, data: UpdateSellerData): Promise<SellerDto> {
    const update: UpdateSellerData = {};
    if (data.shopName !== undefined) update.shopName = data.shopName.trim();
    if (data.description !== undefined) update.description = data.description.trim();
    if (data.logo !== undefined) update.logo = data.logo;
    if (data.banner !== undefined) update.banner = data.banner;

    if (update.shopName) {
      const current = await this.sellerRepo.findByUserId(userId);
      if (current && current.shopName.toLowerCase() !== update.shopName.toLowerCase()) {
        const taken = await this.sellerRepo.shopNameExists(update.shopName);
        if (taken) throw new SellerError(409, 'A shop with this name already exists');
      }
    }

    const seller = await this.sellerRepo.updateByUserId(userId, update);
    if (!seller) {
      throw new SellerError(404, 'Seller profile not found');
    }
    return this.toDto(seller);
  }

  async getPublicShop(slug: string): Promise<SellerDto> {
    const seller = await this.sellerRepo.findBySlug(slug);
    if (!seller) {
      throw new SellerError(404, 'Shop not found');
    }
    return this.toDto(seller);
  }

  async listSellers(params: FindSellersParams): Promise<PaginatedSellersDto> {
    const { sellers, total } = await this.sellerRepo.findMany(params);
    const totalPages = Math.ceil(total / params.limit);
    return {
      items: sellers.map((s) => this.toDto(s)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  async verifySeller(id: string, isVerified: boolean, commissionRate?: number): Promise<SellerDto> {
    const seller = await this.sellerRepo.setVerified(id, isVerified, commissionRate);
    if (!seller) {
      throw new SellerError(404, 'Seller not found');
    }
    return this.toDto(seller);
  }

  private async generateUniqueSlug(shopName: string): Promise<string> {
    const base = slugify(shopName) || `shop-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    while (await this.sellerRepo.findBySlug(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private toDto(seller: SellerEntity): SellerDto {
    return {
      _id: seller.id,
      userId: seller.userId,
      shopName: seller.shopName,
      shopSlug: seller.shopSlug,
      description: seller.description,
      logo: seller.logo,
      banner: seller.banner,
      rating: seller.rating,
      reviewCount: seller.reviewCount,
      totalSales: seller.totalSales,
      isVerified: seller.isVerified,
      joinedAt: seller.joinedAt.toISOString(),
      createdAt: seller.createdAt.toISOString(),
      updatedAt: seller.updatedAt.toISOString(),
    };
  }
}

export class SellerError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, SellerError.prototype);
  }
}
