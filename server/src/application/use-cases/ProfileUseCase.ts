import { UserRole, UserStatus } from '@ecommerce/shared';
import {
  IUserRepository,
  AddAddressData,
  PreferencesData,
} from '../../domain/repositories/IUserRepository';
import { IHashService } from '../../domain/services/IHashService';
import { UserEntity, AddressEntity, UserPreferencesEntity } from '../../domain/entities/User';

export interface ProfileDto {
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

export interface UpdateProfileDto {
  currentPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export class ProfileUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hashService: IHashService,
  ) {}

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ProfileError(404, 'Utilisateur introuvable');
    }
    return this.toProfileDto(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ProfileError(404, 'Utilisateur introuvable');
    }

    const valid = await this.hashService.compare(data.currentPassword, user.password);
    if (!valid) {
      throw new ProfileError(403, 'Mot de passe incorrect');
    }

    const updateData: Record<string, string> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.avatar !== undefined) updateData.avatar = data.avatar.trim();

    const updated = await this.userRepo.updateById(userId, updateData);
    if (!updated) {
      throw new ProfileError(500, 'Erreur lors de la mise à jour du profil');
    }

    return this.toProfileDto(updated);
  }

  async getAddresses(userId: string): Promise<AddressEntity[]> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new ProfileError(404, 'Utilisateur introuvable');
    return user.addresses;
  }

  async addAddress(userId: string, data: AddAddressData): Promise<AddressEntity[]> {
    if (!data.label || !data.street || !data.city || !data.postalCode || !data.country) {
      throw new ProfileError(400, 'Tous les champs sont requis');
    }
    const user = await this.userRepo.addAddress(userId, data);
    if (!user) throw new ProfileError(500, "Erreur lors de l'ajout de l'adresse");
    return user.addresses;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<AddAddressData>,
  ): Promise<AddressEntity[]> {
    const user = await this.userRepo.updateAddress(userId, addressId, data);
    if (!user) throw new ProfileError(404, 'Adresse introuvable');
    return user.addresses;
  }

  async deleteAddress(userId: string, addressId: string): Promise<AddressEntity[]> {
    const user = await this.userRepo.deleteAddress(userId, addressId);
    if (!user) throw new ProfileError(404, 'Adresse introuvable');
    return user.addresses;
  }

  async getPreferences(userId: string): Promise<UserPreferencesEntity> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new ProfileError(404, 'Utilisateur introuvable');
    return user.preferences;
  }

  async updatePreferences(
    userId: string,
    data: Partial<PreferencesData>,
  ): Promise<UserPreferencesEntity> {
    const user = await this.userRepo.updatePreferences(userId, data);
    if (!user) throw new ProfileError(500, 'Erreur lors de la mise a jour des preferences');
    return user.preferences;
  }

  private toProfileDto(user: UserEntity): ProfileDto {
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

export class ProfileError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, ProfileError.prototype);
  }
}
