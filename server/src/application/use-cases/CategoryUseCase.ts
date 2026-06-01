import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/repositories/ICategoryRepository';
import { CategoryEntity } from '../../domain/entities/Category';
import { slugify } from '../utils/slugify';

export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryNode extends CategoryDto {
  children: CategoryNode[];
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  slug?: string;
}

export class CategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async list(includeInactive = false): Promise<CategoryDto[]> {
    const categories = await this.categoryRepo.findAll(includeInactive);
    return categories.map((c) => this.toDto(c));
  }

  async tree(): Promise<CategoryNode[]> {
    const categories = await this.categoryRepo.findAll(false);
    const byParent = new Map<string | undefined, CategoryEntity[]>();
    for (const c of categories) {
      const key = c.parentId;
      const list = byParent.get(key) ?? [];
      list.push(c);
      byParent.set(key, list);
    }
    const build = (parentId: string | undefined): CategoryNode[] =>
      (byParent.get(parentId) ?? []).map((c) => ({
        ...this.toDto(c),
        children: build(c.id),
      }));
    return build(undefined);
  }

  async getBySlug(slug: string): Promise<CategoryDto> {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) throw new CategoryError(404, 'Category not found');
    return this.toDto(category);
  }

  async getById(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new CategoryError(404, 'Category not found');
    return this.toDto(category);
  }

  async create(input: CreateCategoryInput): Promise<CategoryDto> {
    if (input.parentId) {
      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) throw new CategoryError(404, 'Parent category not found');
    }

    const slug = await this.generateUniqueSlug(input.slug ?? input.name);

    const data: CreateCategoryData = {
      name: input.name.trim(),
      slug,
      description: input.description?.trim(),
      parentId: input.parentId,
      image: input.image,
      icon: input.icon,
    };

    const category = await this.categoryRepo.create(data);
    return this.toDto(category);
  }

  async update(id: string, input: UpdateCategoryData & { name?: string }): Promise<CategoryDto> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) throw new CategoryError(404, 'Category not found');

    const update: UpdateCategoryData = { ...input };

    if (input.parentId) {
      if (input.parentId === id) {
        throw new CategoryError(400, 'A category cannot be its own parent');
      }
      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) throw new CategoryError(404, 'Parent category not found');
    }

    if (input.slug) {
      const taken = await this.categoryRepo.slugExists(input.slug);
      if (taken && input.slug !== existing.slug) {
        throw new CategoryError(409, 'Slug already in use');
      }
      update.slug = input.slug.toLowerCase();
    } else if (input.name) {
      const newSlug = slugify(input.name);
      if (newSlug && newSlug !== existing.slug) {
        update.slug = await this.generateUniqueSlug(newSlug);
      }
    }

    const updated = await this.categoryRepo.updateById(id, update);
    if (!updated) throw new CategoryError(500, 'Failed to update category');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) throw new CategoryError(404, 'Category not found');
    const hasChildren = await this.categoryRepo.hasChildren(id);
    if (hasChildren) {
      throw new CategoryError(409, 'Cannot delete a category with subcategories');
    }
    await this.categoryRepo.deleteById(id);
  }

  private async generateUniqueSlug(input: string): Promise<string> {
    const base = slugify(input) || `cat-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    while (await this.categoryRepo.slugExists(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private toDto(c: CategoryEntity): CategoryDto {
    return {
      _id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      image: c.image,
      icon: c.icon,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}

export class CategoryError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, CategoryError.prototype);
  }
}
