import { UserRole, UserStatus } from '@ecommerce/shared';
import { UserEntity } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  updateById(id: string, data: Partial<UpdateUserData>): Promise<UserEntity | null>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  findMany(params: FindUsersParams): Promise<{ users: UserEntity[]; total: number }>;
  deleteById(id: string): Promise<void>;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  status: UserStatus;
  role: UserRole;
}

export interface FindUsersParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  query?: string;
  role?: UserRole;
  status?: UserStatus;
}
