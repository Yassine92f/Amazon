import { UserRole, UserStatus } from '@ecommerce/shared';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';

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
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export class ProfileUseCase {
  constructor(private userRepo: IUserRepository) {}

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
