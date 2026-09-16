import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import { CreateInventoryItemDTO } from '@/modules/inventory/items/inventory-item.dto';
import {
  CreateInventoryItemSchema,
  InventoryItemTypeSchema,
} from '@/modules/inventory/items/inventory-item.schema';
import { InventoryItemService } from '@/modules/inventory/items/inventory-item.service';

const InventoryItemQuerySchema = z.object({
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
  item_type: InventoryItemTypeSchema.optional(),
  is_active: z.preprocess(
    (value) =>
      value === undefined
        ? undefined
        : value === true || value === 'true',
    z.boolean().optional()
  ),
});

function toQueryOptions(
  query: z.infer<typeof InventoryItemQuerySchema>
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
    item_type: query.item_type,
    is_active: query.is_active,
  };
}

export const GET = withValidation(
  { query: InventoryItemQuerySchema },
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
      const query = validatedQuery!;
      const result = await new InventoryItemService(
        tenantContext
      ).getWithPagination(toQueryOptions(query));

      return apiSuccess(result.data, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages,
      });
    } catch (error) {
      console.error('[GET /inventory/items]', error);
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat inventory items.',
        500
      );
    }
  }
);

export const POST = withValidation(
  CreateInventoryItemSchema,
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
      const item = await new InventoryItemService(
        tenantContext
      ).create(validatedBody as CreateInventoryItemDTO);
      return apiSuccess(item, undefined, 201);
    } catch (error: unknown) {
      console.error('[POST /inventory/items]', error);
      const isDuplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;
      if (isDuplicate) {
        return apiError(
          ErrorCodes.CONFLICT,
          'SKU inventory sudah digunakan dalam organization ini.',
          409
        );
      }
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal membuat inventory item.',
        500
      );
    }
  }
);
