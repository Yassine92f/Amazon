import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  FindUsersParams,
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
