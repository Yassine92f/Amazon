import { UserRole, UserStatus } from '@ecommerce/shared';
import { IUserRepository, FindUsersParams } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';
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
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
}

export class AdminUseCase {
  constructor(private userRepo: IUserRepository) {}

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
      throw new AdminError(404, 'Utilisateur introuvable');
    }
    return this.toUserDto(user);
  }

  async updateUserStatus(id: string, status: UserStatus, _reason?: string): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AdminError(404, 'Utilisateur introuvable');
    }

    if (user.role === UserRole.ADMIN) {
      throw new AdminError(403, "Impossible de modifier le statut d'un administrateur");
    }

    const updated = await this.userRepo.updateById(id, { status });
    if (!updated) {
      throw new AdminError(500, 'Erreur lors de la mise à jour');
    }

    return this.toUserDto(updated);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AdminError(404, 'Utilisateur introuvable');
    }

    if (user.role === UserRole.ADMIN) {
      throw new AdminError(403, 'Impossible de supprimer un administrateur');
    }

    await this.userRepo.deleteById(id);
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, newUsersThisMonth, totalSellers] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      UserModel.countDocuments({ role: UserRole.SELLER }),
    ]);

    return {
      totalUsers,
      newUsersThisMonth,
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
