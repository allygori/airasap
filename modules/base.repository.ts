import {
  Model,
  Document,
  QueryFilter,
  UpdateQuery,
  PopulateOptions,
} from 'mongoose';
import {
  paginatedQuery,
  type QueryOptions,
} from '@/lib/api/query-builder';

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

  // Some organization-scoped modules, such as accounting, deliberately do
  // not have a top-level store field. Only add store scoping when the model
  // actually declares that path; otherwise an upsert becomes a strict-schema
  // error and the query would imply a scope the model cannot represent.
  protected getTenantFields() {
    return {
      organization: this.tenantContext.organizationId,
      ...(this.tenantContext.storeId &&
      this.model.schema.path('store')
        ? { store: this.tenantContext.storeId }
        : {}),
    };
  }

  protected getTenantFilter(): QueryFilter<T> {
    return this.getTenantFields() as QueryFilter<T>;
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
      ...this.getTenantFields(),
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
        ...this.getTenantFields(),
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

  async findWithQueryOptions(
    queryOptions: QueryOptions,
    options?: {
      baseFilter?: QueryFilter<T>;
      searchFields?: string[];
      populate?:
        | string
        | string[]
        | PopulateOptions
        | PopulateOptions[];
      select?: string | string[] | Record<string, unknown>;
    }
  ) {
    const baseFilter = {
      ...(options?.baseFilter || {}),
      ...this.getTenantFilter(),
    } as QueryFilter<T>;

    const result = await paginatedQuery(
      this.model as any,
      baseFilter,
      queryOptions,
      {
        searchFields: options?.searchFields,
        populate: options?.populate,
        select: options?.select as any,
      }
    );

    return {
      data: result.data,
      pagination: {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.total_pages,
      },
    };
  }
}
