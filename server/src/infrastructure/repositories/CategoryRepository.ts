import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/repositories/ICategoryRepository';
import { CategoryEntity } from '../../domain/entities/Category';
import { CategoryModel, CategoryDocument } from '../database/models/Category';

export class CategoryRepository implements ICategoryRepository {
  async findById(id: string): Promise<CategoryEntity | null> {
    const doc = await CategoryModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const doc = await CategoryModel.findOne({ slug: slug.toLowerCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const doc = await CategoryModel.exists({ slug: slug.toLowerCase() });
    return doc !== null;
  }

  async findAll(includeInactive = false): Promise<CategoryEntity[]> {
    const filter = includeInactive ? {} : { isActive: true };
    const docs = await CategoryModel.find(filter).sort({ name: 1 });
    return docs.map((d) => this.toEntity(d));
  }

  async findChildren(parentId: string | null): Promise<CategoryEntity[]> {
    const filter = parentId === null ? { parentId: { $exists: false } } : { parentId };
    const docs = await CategoryModel.find({ ...filter, isActive: true }).sort({ name: 1 });
    return docs.map((d) => this.toEntity(d));
  }

  async create(data: CreateCategoryData): Promise<CategoryEntity> {
    const doc = await CategoryModel.create(data);
    return this.toEntity(doc);
  }

  async updateById(id: string, data: UpdateCategoryData): Promise<CategoryEntity | null> {
    const update: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === null) unset[k] = '';
      else if (v !== undefined) update[k] = v;
    }
    const op: Record<string, unknown> = {};
    if (Object.keys(update).length) op.$set = update;
    if (Object.keys(unset).length) op.$unset = unset;
    const doc = await CategoryModel.findByIdAndUpdate(id, op, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  async deleteById(id: string): Promise<void> {
    await CategoryModel.findByIdAndDelete(id);
  }

  async hasChildren(id: string): Promise<boolean> {
    const doc = await CategoryModel.exists({ parentId: id });
    return doc !== null;
  }

  private toEntity(doc: CategoryDocument): CategoryEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      parentId: doc.parentId?.toString(),
      image: doc.image,
      icon: doc.icon,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
