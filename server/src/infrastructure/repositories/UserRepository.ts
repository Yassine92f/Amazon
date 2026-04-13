import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  FindUsersParams,
  AddAddressData,
  PreferencesData,
} from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/User';
import { UserModel, UserDocument } from '../database/models/User';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id).select('+password');
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const doc = await UserModel.create(data);
    return this.toEntity(doc);
  }

  async updateById(id: string, data: Partial<UpdateUserData>): Promise<UserEntity | null> {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).select(
      '+password',
    );
    return doc ? this.toEntity(doc) : null;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { password: hashedPassword } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } });
  }

  async findMany(params: FindUsersParams): Promise<{ users: UserEntity[]; total: number }> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', query, role, status } = params;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (query) {
      filter.$or = [
        { email: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      UserModel.countDocuments(filter),
    ]);

    return { users: docs.map((d) => this.toEntity(d)), total };
  }

  async deleteById(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }

  async setResetToken(email: string, token: string, expires: Date): Promise<boolean> {
    const doc = await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { resetPasswordToken: token, resetPasswordExpires: expires } },
    );
    return doc !== null;
  }

  async findByResetToken(token: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');
    return doc ? this.toEntity(doc) : null;
  }

  async clearResetToken(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    });
  }

  async addAddress(userId: string, address: AddAddressData): Promise<UserEntity | null> {
    if (address.isDefault) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: { 'addresses.$[].isDefault': false },
      });
    }
    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { $push: { addresses: address } },
      { new: true },
    );
    return doc ? this.toEntity(doc) : null;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<AddAddressData>,
  ): Promise<UserEntity | null> {
    if (data.isDefault) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: { 'addresses.$[].isDefault': false },
      });
    }
    const setFields: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) setFields[`addresses.$.${key}`] = val;
    }
    const doc = await UserModel.findOneAndUpdate(
      { _id: userId, 'addresses._id': addressId },
      { $set: setFields },
      { new: true },
    );
    return doc ? this.toEntity(doc) : null;
  }

  async deleteAddress(userId: string, addressId: string): Promise<UserEntity | null> {
    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true },
    );
    return doc ? this.toEntity(doc) : null;
  }

  async updatePreferences(
    userId: string,
    prefs: Partial<PreferencesData>,
  ): Promise<UserEntity | null> {
    const setFields: Record<string, unknown> = {};
    if (prefs.language !== undefined) setFields['preferences.language'] = prefs.language;
    if (prefs.currency !== undefined) setFields['preferences.currency'] = prefs.currency;
    if (prefs.notifications) {
      for (const [key, val] of Object.entries(prefs.notifications)) {
        if (val !== undefined) setFields[`preferences.notifications.${key}`] = val;
      }
    }
    const doc = await UserModel.findByIdAndUpdate(userId, { $set: setFields }, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  private toEntity(doc: UserDocument): UserEntity {
    return {
      id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      role: doc.role,
      status: doc.status,
      avatar: doc.avatar,
      phone: doc.phone,
      addresses: doc.addresses.map((a) => ({
        id: a._id.toString(),
        label: a.label,
        street: a.street,
        city: a.city,
        postalCode: a.postalCode,
        country: a.country,
        isDefault: a.isDefault,
      })),
      preferences: doc.preferences,
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
