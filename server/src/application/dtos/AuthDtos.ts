import { UserRole, UserStatus } from '@ecommerce/shared';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResultDto {
  user: {
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
  };
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordDto {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
