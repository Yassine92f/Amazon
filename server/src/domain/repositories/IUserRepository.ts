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
  setResetToken(email: string, token: string, expires: Date): Promise<boolean>;
  findByResetToken(token: string): Promise<UserEntity | null>;
  clearResetToken(id: string): Promise<void>;
  addAddress(userId: string, address: AddAddressData): Promise<UserEntity | null>;
  updateAddress(
    userId: string,
    addressId: string,
    data: Partial<AddAddressData>,
  ): Promise<UserEntity | null>;
  deleteAddress(userId: string, addressId: string): Promise<UserEntity | null>;
  updatePreferences(userId: string, prefs: Partial<PreferencesData>): Promise<UserEntity | null>;
}

export interface AddAddressData {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PreferencesData {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    priceDrops: boolean;
  };
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
