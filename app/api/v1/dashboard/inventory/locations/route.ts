import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import { CreateInventoryLocationDTO } from '@/modules/inventory/locations/inventory-location.dto';
import {
  CreateInventoryLocationSchema,
  InventoryLocationTypeSchema,
} from '@/modules/inventory/locations/inventory-location.schema';
import { InventoryLocationService } from '@/modules/inventory/locations/inventory-location.service';

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
  type: InventoryLocationTypeSchema.optional(),
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
    is_active: query.is_active,
  };
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
      const result = await new InventoryLocationService(
        tenantContext
      ).getWithPagination(toQueryOptions(validatedQuery!));
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
          : 'Gagal memuat inventory locations.',
        500
      );
    }
  }
);

export const POST = withValidation(
  CreateInventoryLocationSchema,
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
      const location = await new InventoryLocationService(
        tenantContext
      ).create(validatedBody as CreateInventoryLocationDTO);
      return apiSuccess(location, undefined, 201);
    } catch (error: unknown) {
      const isDuplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;
      if (isDuplicate) {
        return apiError(
          ErrorCodes.CONFLICT,
          'Kode lokasi sudah digunakan dalam organization ini.',
          409
        );
      }
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal membuat inventory location.',
        500
      );
    }
  }
);
