import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  InventoryMovementStatusSchema,
  InventoryMovementTypeSchema,
} from '@/modules/inventory/movements/inventory-movement.schema';
import { InventoryMovementRepository } from '@/modules/inventory/movements/inventory-movement.repository';

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
  sort: z.string().optional().default('-occurred_at'),
  movement_type: InventoryMovementTypeSchema.optional(),
  status: InventoryMovementStatusSchema.optional(),
});

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
      const query = validatedQuery!;
      const sortValue = query.sort || '-occurred_at';
      const repository = new InventoryMovementRepository(
        tenantContext
      );
      const result = await repository.findWithQueryOptions(
        {
          page: query.page,
          limit: query.limit,
          sort: {
            [sortValue.startsWith('-')
              ? sortValue.slice(1)
              : sortValue]: sortValue.startsWith('-')
              ? -1
              : 1,
          },
          search: query.search,
          searchField: query.search_field,
          filters: {
            ...(query.movement_type
              ? { movement_type: query.movement_type }
              : {}),
            ...(query.status
              ? { status: query.status }
              : {}),
          },
        },
        {
          searchFields: [
            'reference',
            'notes',
            'source_type',
            'source_id',
          ],
          populate: [
            {
              path: 'inventory_item',
              select: 'sku name unit',
              match: {
                organization: tenantContext.organizationId,
              },
              options: {
                organizationId:
                  tenantContext.organizationId,
              },
            },
            {
              path: 'location',
              select: 'code name type',
              match: {
                organization: tenantContext.organizationId,
              },
              options: {
                organizationId:
                  tenantContext.organizationId,
              },
            },
          ],
        }
      );
      return apiSuccess(result.data, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages,
      });
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat inventory movements.',
        500
      );
    }
  }
);
