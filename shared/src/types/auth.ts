import { BaseEntity, PaginationParams } from './common';

// ── Enums ───────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

// ── Entities ────────────────────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  addresses: Address[];
  preferences: UserPreferences;
  lastLoginAt?: string;
}

export interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
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

export interface SellerProfile extends BaseEntity {
  userId: string;
  shopName: string;
  description: string;
  logo?: string;
  banner?: string;
  rating: number;
  totalSales: number;
  totalRevenue: number;
  isVerified: boolean;
  commissionRate: number;
  joinedAt: string;
}

// ── Lightweight projections ─────────────────────────────────

export interface UserSummary {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SellerSummary {
  _id: string;
  userId: string;
  shopName: string;
  logo?: string;
  rating: number;
  totalSales: number;
  isVerified: boolean;
}

// ── Auth DTOs ───────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterSellerRequest extends RegisterRequest {
  shopName: string;
  shopDescription: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'addresses' | 'preferences'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ── User profile DTOs ───────────────────────────────────────

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdatePreferencesRequest {
  language?: string;
  currency?: string;
  notifications?: Partial<UserPreferences['notifications']>;
}

export interface AddAddressRequest {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type UpdateAddressRequest = Partial<AddAddressRequest>;

// ── Seller DTOs ─────────────────────────────────────────────

export interface UpdateSellerProfileRequest {
  shopName?: string;
  description?: string;
  logo?: string;
  banner?: string;
}

export interface SellerDashboardStats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueTrend: number; // percentage change vs last month
  totalOrders: number;
  ordersThisMonth: number;
  ordersTrend: number;
  totalProducts: number;
  activeProducts: number;
  averageRating: number;
  pendingOrders: number;
  topProducts: { productId: string; name: string; sales: number; revenue: number }[];
}

// ── Admin DTOs ──────────────────────────────────────────────

export interface AdminUserSearchParams extends PaginationParams {
  query?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
  reason?: string;
}

export interface VerifySellerRequest {
  isVerified: boolean;
  commissionRate?: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalSellers: number;
  verifiedSellers: number;
  totalOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingSellerVerifications: number;
  topSellers: { sellerId: string; shopName: string; revenue: number }[];
  ordersByStatus: Record<string, number>;
}
