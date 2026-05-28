import { CategoryEntity } from '../entities/Category';

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  icon?: string;
  isActive?: boolean;
}

export interface ICategoryRepository {
  findById(id: string): Promise<CategoryEntity | null>;
  findBySlug(slug: string): Promise<CategoryEntity | null>;
  slugExists(slug: string): Promise<boolean>;
  findAll(includeInactive?: boolean): Promise<CategoryEntity[]>;
  findChildren(parentId: string | null): Promise<CategoryEntity[]>;
  create(data: CreateCategoryData): Promise<CategoryEntity>;
  updateById(id: string, data: UpdateCategoryData): Promise<CategoryEntity | null>;
  deleteById(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
}
