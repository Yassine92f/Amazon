import { UserRole, UserStatus } from '@ecommerce/shared';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  addresses: AddressEntity[];
  preferences: UserPreferencesEntity;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressEntity {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferencesEntity {
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
