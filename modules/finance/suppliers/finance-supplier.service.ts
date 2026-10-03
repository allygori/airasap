import { Types, type ClientSession } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type {
  FinanceSupplierCreateInputDTO,
  FinanceSupplierDTO,
  FinanceSupplierListQueryDTO,
  FinanceSupplierListResponseDTO,
  FinanceSupplierMutationResponseDTO,
  FinanceSupplierUpdateInputDTO,
} from './finance-supplier.dto';
import {
  FinanceSupplierCreateInputSchema,
  FinanceSupplierListQuerySchema,
  FinanceSupplierListResponseSchema,
  FinanceSupplierMutationResponseSchema,
  FinanceSupplierResponseSchema,
  FinanceSupplierUpdateInputSchema,
} from './finance-supplier.schema';
import {
  FinanceSupplierRepository,
  type FinanceSupplierPersistenceRecord,
} from './finance-supplier.repository';

type SupplierRepositoryPort = Pick<
  FinanceSupplierRepository,
  | 'list'
  | 'findActiveById'
  | 'createSupplier'
  | 'updateSupplier'
>;

const toResponse = (
  record: FinanceSupplierPersistenceRecord
): FinanceSupplierDTO =>
  FinanceSupplierResponseSchema.parse({
    supplier_id: String(record._id),
    name: record.name,
    contact_name: record.contact_name || null,
    phone: record.phone || null,
    email: record.email || null,
    address: record.address || null,
    notes: record.notes || null,
    is_active: record.is_active,
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString(),
  });

export class FinanceSupplierService {
  private readonly repository: SupplierRepositoryPort;

  constructor(
    context: FinanceTenantContext,
    dependencies?: { repository?: SupplierRepositoryPort }
  ) {
    assertFinanceTenant(context);
    this.repository =
      dependencies?.repository ??
      new FinanceSupplierRepository(context);
  }

  async list(
    input: FinanceSupplierListQueryDTO | unknown
  ): Promise<FinanceSupplierListResponseDTO> {
    const query =
      FinanceSupplierListQuerySchema.parse(input);
    const result = await this.repository.list(query);
    return FinanceSupplierListResponseSchema.parse({
      suppliers: result.records.map(toResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / query.limit),
      },
    });
  }

  async create(
    input: FinanceSupplierCreateInputDTO | unknown
  ): Promise<FinanceSupplierMutationResponseDTO> {
    const data =
      FinanceSupplierCreateInputSchema.parse(input);
    const supplier =
      await this.repository.createSupplier(data);
    return FinanceSupplierMutationResponseSchema.parse({
      supplier: toResponse(supplier),
    });
  }

  async update(
    supplierId: string,
    input: FinanceSupplierUpdateInputDTO | unknown
  ): Promise<FinanceSupplierMutationResponseDTO> {
    if (!Types.ObjectId.isValid(supplierId)) {
      throw this.notFound();
    }
    const data =
      FinanceSupplierUpdateInputSchema.parse(input);
    const supplier = await this.repository.updateSupplier(
      supplierId,
      data
    );
    if (!supplier) throw this.notFound();
    return FinanceSupplierMutationResponseSchema.parse({
      supplier: toResponse(supplier),
    });
  }

  async findActiveById(
    supplierId: string,
    session?: ClientSession
  ): Promise<{ _id: Types.ObjectId; name: string } | null> {
    const supplier = await this.repository.findActiveById(
      supplierId,
      session
    );
    return supplier
      ? { _id: supplier._id, name: supplier.name }
      : null;
  }

  private notFound() {
    return new FinanceDomainError(
      'Supplier tidak ditemukan pada organisasi ini.',
      'FINANCE_SUPPLIER_NOT_FOUND'
    );
  }
}
