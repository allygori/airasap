import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import type { CreateInventoryItemMappingDTO } from '@/modules/inventory/mappings/inventory-item-mapping.dto';
import {
  CreateInventoryItemMappingSchema,
  InventoryItemMappingMethodSchema,
} from '@/modules/inventory/mappings/inventory-item-mapping.schema';
import { InventoryItemMappingService } from '@/modules/inventory/mappings/inventory-item-mapping.service';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
  search: z.string().optional(),
  search_field: z.string().optional(),
  sort: z.string().optional().default('-updated_at'),
  product: z.string().optional(),
  inventory_item: z.string().optional(),
  mapping_method:
    InventoryItemMappingMethodSchema.optional(),
  is_active: z.preprocess(
    (value) =>
      value === undefined
        ? undefined
        : value === true || value === 'true',
    z.boolean().optional()
  ),
});

function toQueryOptions(
  query: z.infer<typeof QuerySchema>
) {
  const sortValue = query.sort || '-updated_at';
  return {
    page: query.page,
    limit: query.limit,
    sort: {
      [sortValue.startsWith('-')
        ? sortValue.slice(1)
        : sortValue]: sortValue.startsWith('-') ? -1 : 1,
    } as Record<string, 1 | -1>,
    search: query.search,
    searchField: query.search_field,
    filters: {},
    product: query.product,
    inventory_item: query.inventory_item,
    mapping_method: query.mapping_method,
    is_active: query.is_active,
  };
}

function getErrorMessage(
  result: unknown,
  fallback: string
) {
  return result instanceof Error
    ? result.message
    : fallback;
}

export const GET = withValidation(
  { query: QuerySchema },
  async (_request, { validatedQuery }) => {
    try {
      const tenantContext = await getTenantContext();
      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }
      await db.connect();
      const result = await new InventoryItemMappingService(
        tenantContext
      ).getWithPagination(toQueryOptions(validatedQuery!));

      return apiSuccess(result.data, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages,
      });
    } catch (error) {
      console.error('[GET /inventory/mappings]', error);
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(
          error,
          'Gagal memuat inventory item mappings.'
        ),
        500
      );
    }
  }
);

export const POST = withValidation(
  CreateInventoryItemMappingSchema,
  async (_request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }
      await db.connect();
      const mapping = await new InventoryItemMappingService(
        tenantContext
      ).create(
        validatedBody as CreateInventoryItemMappingDTO
      );
      return apiSuccess(mapping, undefined, 201);
    } catch (error: unknown) {
      console.error('[POST /inventory/mappings]', error);
      const isDuplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;
      if (isDuplicate) {
        return apiError(
          ErrorCodes.CONFLICT,
          'Mapping aktif untuk product/variant tersebut sudah ada.',
          409
        );
      }
      return apiError(
        ErrorCodes.BAD_REQUEST,
        getErrorMessage(
          error,
          'Gagal membuat inventory item mapping.'
        ),
        400
      );
    }
  }
);
