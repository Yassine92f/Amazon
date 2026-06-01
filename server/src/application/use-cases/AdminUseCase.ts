import { UserRole, UserStatus } from '@ecommerce/shared';
import { IUserRepository, FindUsersParams } from '../../domain/repositories/IUserRepository';
import {
  IAuditLogRepository,
  FindAuditLogsParams,
} from '../../domain/repositories/IAuditLogRepository';
import {
  IProductRepository,
  ProductListFilters,
} from '../../domain/repositories/IProductRepository';
import { ISellerRepository } from '../../domain/repositories/ISellerRepository';
import { UserEntity } from '../../domain/entities/User';
import { ProductEntity } from '../../domain/entities/Product';
import { AuditAction, AuditLogEntity } from '../../domain/entities/AuditLog';
import { UserModel } from '../../infrastructure/database/models/User';

export interface UserDto {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsersDto {
  items: UserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DashboardStatsDto {
  totalUsers: number;
  newUsersThisMonth: number;
  usersTrend: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface AdminActor {
  id: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogDto {
  _id: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaginatedAuditLogsDto {
  items: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminProductDto {
  _id: string;
  name: string;
  slug: string;
  brand?: string;
  image: string;
  sellerId: string;
  shopName: string;
  minPrice: number;
  rating: number;
  reviewCount: number;
  totalSold: number;
  inStock: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedAdminProductsDto {
  items: AdminProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class AdminUseCase {
  constructor(
    private userRepo: IUserRepository,
    private auditLogRepo: IAuditLogRepository,
    private productRepo: IProductRepository,
    private sellerRepo: ISellerRepository,
  ) {}

  // ── Product moderation ─────────────────────────────────────
  async listProducts(params: {
    page: number;
    limit: number;
    query?: string;
    isActive?: boolean;
  }): Promise<PaginatedAdminProductsDto> {
    const filters: ProductListFilters = {
      page: params.page,
      limit: params.limit,
      query: params.query,
      sortBy: params.query ? 'relevance' : 'createdAt',
      sortOrder: 'desc',
      isActive: params.isActive,
      anyStatus: params.isActive === undefined,
    };
    const { products, total } = await this.productRepo.search(filters);

    // Resolve shop names for the distinct sellers in this page.
    const shopNames = new Map<string, string>();
    for (const sellerId of new Set(products.map((p) => p.sellerId))) {
      const seller = await this.sellerRepo.findById(sellerId);
      shopNames.set(sellerId, seller?.shopName ?? '—');
    }

    const totalPages = Math.ceil(total / params.limit) || 1;
    return {
      items: products.map((p) => this.toProductDto(p, shopNames.get(p.sellerId) ?? '—')),
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  async setProductActive(
    productId: string,
    isActive: boolean,
    actor: AdminActor,
  ): Promise<AdminProductDto> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new AdminError(404, 'Product not found');

    const updated = await this.productRepo.updateById(productId, { isActive });
    if (!updated) throw new AdminError(500, 'Failed to update product');

    await this.logAction(
      actor,
      AuditAction.PRODUCT_STATUS_CHANGED,
      productId,
      { from: product.isActive, to: isActive, name: product.name },
      'Product',
    );

    const seller = await this.sellerRepo.findById(updated.sellerId);
    return this.toProductDto(updated, seller?.shopName ?? '—');
  }

  async deleteProduct(productId: string, actor: AdminActor): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new AdminError(404, 'Product not found');

    await this.productRepo.deleteById(productId);
    await this.logAction(
      actor,
      AuditAction.PRODUCT_DELETED,
      productId,
      { name: product.name, sellerId: product.sellerId },
      'Product',
    );
  }

  private toProductDto(p: ProductEntity, shopName: string): AdminProductDto {
    const prices = p.variants.map((v) => v.price);
    return {
      _id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      image: p.images[0] ?? '',
      sellerId: p.sellerId,
      shopName,
      minPrice: prices.length ? Math.min(...prices) : 0,
      rating: p.rating,
      reviewCount: p.reviewCount,
      totalSold: p.totalSold,
      inStock: p.variants.some((v) => v.stock > 0),
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    };
  }

  async getUsers(params: FindUsersParams): Promise<PaginatedUsersDto> {
    const { users, total } = await this.userRepo.findMany(params);
    const totalPages = Math.ceil(total / params.limit);

    return {
      items: users.map((u) => this.toUserDto(u)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  async getUserById(id: string): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AdminError(404, 'User not found');
    }
    return this.toUserDto(user);
  }

  async updateUserStatus(
    id: string,
    status: UserStatus,
    actor: AdminActor,
    reason?: string,
  ): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AdminError(404, 'User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new AdminError(403, "Cannot modify an administrator's status");
    }

    const previousStatus = user.status;
    const updated = await this.userRepo.updateById(id, { status });
    if (!updated) {
      throw new AdminError(500, 'Failed to update user');
    }

    await this.logAction(actor, AuditAction.USER_STATUS_CHANGED, id, {
      from: previousStatus,
      to: status,
      reason,
    });

    return this.toUserDto(updated);
  }

  async updateUserRole(id: string, role: UserRole, actor: AdminActor): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AdminError(404, 'User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new AdminError(403, "Cannot modify an administrator's role");
    }

    const previousRole = user.role;
    const updated = await this.userRepo.updateById(id, { role });
    if (!updated) {
      throw new AdminError(500, 'Failed to update user role');
    }

    await this.logAction(actor, AuditAction.USER_ROLE_CHANGED, id, {
      from: previousRole,
      to: role,
    });

    return this.toUserDto(updated);
  }

  async deleteUser(id: string, actor: AdminActor): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AdminError(404, 'User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new AdminError(403, 'Cannot delete an administrator');
    }

    await this.userRepo.deleteById(id);

    await this.logAction(actor, AuditAction.USER_DELETED, id, {
      email: user.email,
      role: user.role,
    });
  }

  async getAuditLogs(params: FindAuditLogsParams): Promise<PaginatedAuditLogsDto> {
    const { logs, total } = await this.auditLogRepo.findMany(params);
    const totalPages = Math.ceil(total / params.limit);
    return {
      items: logs.map((log) => this.toAuditLogDto(log)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  private async logAction(
    actor: AdminActor,
    action: AuditAction,
    targetId: string,
    metadata: Record<string, unknown>,
    targetType = 'User',
  ): Promise<void> {
    try {
      await this.auditLogRepo.create({
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        targetType,
        targetId,
        metadata,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    } catch (err) {
      console.error('[AdminUseCase] Failed to write audit log:', err);
    }
  }

  private toAuditLogDto(log: AuditLogEntity): AuditLogDto {
    return {
      _id: log.id,
      actorId: log.actorId,
      actorEmail: log.actorEmail,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    };
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalUsers, newUsersThisMonth, newUsersLastMonth, totalSellers] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      UserModel.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: startOfMonth } }),
      UserModel.countDocuments({ role: UserRole.SELLER }),
    ]);

    const usersTrend =
      newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : newUsersThisMonth > 0
          ? 100
          : 0;

    return {
      totalUsers,
      newUsersThisMonth,
      usersTrend,
      totalSellers,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }

  private toUserDto(user: UserEntity): UserDto {
    return {
      _id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      phone: user.phone,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export class AdminError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, AdminError.prototype);
  }
}
