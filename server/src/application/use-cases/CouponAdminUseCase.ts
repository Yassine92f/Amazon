import { PaginatedResponse } from '@ecommerce/shared';
import { ICouponRepository } from '../../domain/repositories/ICouponRepository';
import { CouponEntity, CouponDiscountType } from '../../domain/entities/Coupon';

export interface CouponDto {
  _id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  isActive?: boolean;
}

export type UpdateCouponInput = Partial<Omit<CreateCouponInput, 'code'>>;

export class CouponAdminUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async list(page: number, limit: number): Promise<PaginatedResponse<CouponDto>> {
    const { coupons, total } = await this.couponRepo.findMany(page, limit);
    const totalPages = Math.ceil(total / limit);
    return {
      items: coupons.map((c) => this.toDto(c)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async create(input: CreateCouponInput): Promise<CouponDto> {
    const code = input.code.toUpperCase().trim();
    if (await this.couponRepo.codeExists(code)) {
      throw new CouponAdminError(409, 'Un coupon avec ce code existe déjà');
    }
    this.validateDiscount(input.discountType, input.discountValue);
    const coupon = await this.couponRepo.create({
      code,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      expiresAt: this.parseDate(input.expiresAt),
      usageLimit: input.usageLimit,
      isActive: input.isActive ?? true,
    });
    return this.toDto(coupon);
  }

  async update(id: string, input: UpdateCouponInput): Promise<CouponDto> {
    const existing = await this.couponRepo.findById(id);
    if (!existing) throw new CouponAdminError(404, 'Coupon introuvable');
    if (input.discountType || input.discountValue !== undefined) {
      this.validateDiscount(
        input.discountType ?? existing.discountType,
        input.discountValue ?? existing.discountValue,
      );
    }
    const updated = await this.couponRepo.updateById(id, {
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      expiresAt: input.expiresAt === undefined ? undefined : this.parseDate(input.expiresAt),
      usageLimit: input.usageLimit,
      isActive: input.isActive,
    });
    if (!updated) throw new CouponAdminError(404, 'Coupon introuvable');
    return this.toDto(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.couponRepo.findById(id);
    if (!existing) throw new CouponAdminError(404, 'Coupon introuvable');
    await this.couponRepo.deleteById(id);
  }

  private validateDiscount(type: CouponDiscountType, value: number): void {
    if (value <= 0) throw new CouponAdminError(400, 'La valeur de réduction doit être positive');
    if (type === 'percentage' && value > 100) {
      throw new CouponAdminError(400, 'Un pourcentage ne peut pas dépasser 100');
    }
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new CouponAdminError(400, "Date d'expiration invalide");
    return d;
  }

  private toDto(c: CouponEntity): CouponDto {
    return {
      _id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount,
      expiresAt: c.expiresAt?.toISOString(),
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}

export class CouponAdminError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, CouponAdminError.prototype);
  }
}
