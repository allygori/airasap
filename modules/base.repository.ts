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

  async findById(id: string, populate?: string) {
    let query = this.model.findOne({
      _id: id,
      ...this.getTenantFilter(),
    });
    if (populate) {
      const fields = populate
        .split(',')
        .map((f) => f.trim());
      fields.forEach((field) => {
        query = query.populate(field) as any;
      });
    }
    return query.lean();
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
        // { new: true } // Mengembalikan data terbaru setelah di-update
        {
          returnDocument: 'after',
          upsert: true,
          runValidators: true,
        }
      )
      .lean();
  }

  async overwrite(id: string, data: UpdateQuery<T>) {
    try {
      const { _id, ...payload } = data;

      if (!id) {
        throw new Error('Document id is required');
      }

      const doc = await this.model.findOne({
        _id: id,
        ...this.getTenantFilter(),
      });

      if (!doc) {
        throw new Error(
          `Document with id: ${id} not found`
        );
      }

      doc.overwrite({
        ...payload,
        organization: this.tenantContext.organizationId,
        ...(this.tenantContext.storeId && {
          store: this.tenantContext.storeId,
        }),
      });

      return doc.save();
    } catch (error) {
      console.log(`[base.repository] overwrite:`, error);
      throw error;
    }
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
