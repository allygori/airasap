import {
  Model,
  Document,
  QueryFilter,
  UpdateQuery,
} from 'mongoose';

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

  protected getTenantFilter(): QueryFilter<T> {
    return {
      organization: this.tenantContext.organizationId,
      ...(this.tenantContext.storeId && {
        store: this.tenantContext.storeId,
      }),
    } as QueryFilter<T>;
  }

  async findById(id: string) {
    return this.model
      .findOne({ _id: id, ...this.getTenantFilter() })
      .lean();
  }

  async findOne(filter: QueryFilter<T> = {}) {
    return this.model
      .findOne({ ...filter, ...this.getTenantFilter() })
      .lean();
  }

  async findAll(filter: QueryFilter<T> = {}) {
    return this.model
      .find({ ...this.getTenantFilter(), ...filter })
      .lean();
  }

  async create(data: any) {
    return this.model.create({
      ...data,
      organizationId: this.tenantContext.organizationId,
      storeId: this.tenantContext.storeId,
    });
  }

  async update(id: string, data: UpdateQuery<T>) {
    return this.model
      .findOneAndUpdate(
        { _id: id, ...this.getTenantFilter() },
        { $set: data },
        { new: true } // Mengembalikan data terbaru setelah di-update
      )
      .lean();
  }

  async delete(id: string) {
    return this.model
      .findOneAndDelete({
        _id: id,
        ...this.getTenantFilter(),
      })
      .lean();
  }
}
