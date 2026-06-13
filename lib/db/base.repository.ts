// lib/repository/base.repository.ts
import { Model, Document, QueryFilter } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;
  protected tenantContext: {
    organizationId: string;
    storeId?: string;
  };

  constructor(
    model: Model<T>,
    tenantContext: {
      organizationId: string;
      storeId?: string;
    }
  ) {
    this.model = model;
    this.tenantContext = tenantContext;
  }

  // Enforce tenant filter otomatis
  protected getTenantFilter(): QueryFilter<T> {
    return {
      organizationId: this.tenantContext.organizationId,
      ...(this.tenantContext.storeId && {
        storeId: this.tenantContext.storeId,
      }),
    };
  }

  async findById(id: string) {
    return this.model.findOne({
      _id: id,
      ...this.getTenantFilter(),
    });
  }

  async findAll(filter: QueryFilter<T> = {}) {
    return this.model.find({
      ...this.getTenantFilter(),
      ...filter,
    });
  }

  async create(data: any) {
    return this.model.create({
      ...data,
      organizationId: this.tenantContext.organizationId,
      storeId: this.tenantContext.storeId,
    });
  }

  // ... update, delete, etc. dengan tenant filter
}
