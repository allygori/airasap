// lib/repository/base.repository.ts
import { Model, Document, QueryFilter } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;
  protected tenantContext: {
    organizationId: string;
    workspaceId?: string;
  };

  constructor(
    model: Model<T>,
    tenantContext: {
      organizationId: string;
      workspaceId?: string;
    }
  ) {
    this.model = model;
    this.tenantContext = tenantContext;
  }

  // Enforce tenant filter otomatis
  protected getTenantFilter(): QueryFilter<T> {
    return {
      organizationId: this.tenantContext.organizationId,
      ...(this.tenantContext.workspaceId && {
        workspaceId: this.tenantContext.workspaceId,
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
      workspaceId: this.tenantContext.workspaceId,
    });
  }

  // ... update, delete, etc. dengan tenant filter
}
