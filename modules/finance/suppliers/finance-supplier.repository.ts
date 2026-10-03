import {
  Types,
  type ClientSession,
  type QueryFilter,
} from 'mongoose';
import { escapeRegex } from '@/lib/string';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FinanceSupplierModel,
  type TFinanceSupplier,
} from './finance-supplier.model';
import type { FinanceSupplierListQueryDTO } from './finance-supplier.dto';

export type FinanceSupplierPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CreateFinanceSupplierRecord = Omit<
  FinanceSupplierPersistenceRecord,
  | '_id'
  | 'organization'
  | 'is_active'
  | 'created_at'
  | 'updated_at'
>;

export class FinanceSupplierRepository extends BaseRepository<TFinanceSupplier> {
  constructor(context: FinanceTenantContext) {
    super(FinanceSupplierModel, context);
  }

  async list(filter: FinanceSupplierListQueryDTO): Promise<{
    records: FinanceSupplierPersistenceRecord[];
    total: number;
  }> {
    const queryFilter: QueryFilter<TFinanceSupplier> = {
      ...this.getTenantFilter(),
      ...(filter.status === 'active'
        ? { is_active: true }
        : {}),
      ...(filter.status === 'inactive'
        ? { is_active: false }
        : {}),
    };
    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { name: search },
        { contact_name: search },
        { phone: search },
        { email: search },
      ];
    }

    const [records, total] = await Promise.all([
      this.model
        .find(queryFilter)
        .sort({ is_active: -1, name: 1, _id: 1 })
        .skip((filter.page - 1) * filter.limit)
        .limit(filter.limit)
        .lean<FinanceSupplierPersistenceRecord[]>()
        .exec(),
      this.model.countDocuments(queryFilter).exec(),
    ]);
    return { records, total };
  }

  async findActiveById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceSupplierPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
      is_active: true,
    });
    if (session) query.session(session);
    return query
      .lean<FinanceSupplierPersistenceRecord | null>()
      .exec();
  }

  async createSupplier(
    data: CreateFinanceSupplierRecord
  ): Promise<FinanceSupplierPersistenceRecord> {
    const supplier = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      is_active: true,
    });
    const saved = await supplier.save();
    return saved.toObject() as unknown as FinanceSupplierPersistenceRecord;
  }

  async updateSupplier(
    id: string,
    data: Partial<CreateFinanceSupplierRecord> & {
      is_active?: boolean;
    }
  ): Promise<FinanceSupplierPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model
      .findOneAndUpdate(
        {
          ...this.getTenantFilter(),
          _id: new Types.ObjectId(id),
        },
        { $set: data },
        { returnDocument: 'after', runValidators: true }
      )
      .lean<FinanceSupplierPersistenceRecord | null>()
      .exec();
  }
}
