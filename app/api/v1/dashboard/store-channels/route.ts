import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import type { CreateStoreChannelDTO } from '@/modules/stores/channels/store-channel.dto';
import {
  CreateStoreChannelSchema,
  StoreChannelPlatformSchema,
} from '@/modules/stores/channels/store-channel.schema';
import { StoreChannelService } from '@/modules/stores/channels/store-channel.service';

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
  store: z.string().optional(),
  platform: StoreChannelPlatformSchema.optional(),
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
    store: query.store,
    platform: query.platform,
    is_active: query.is_active,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
      const result = await new StoreChannelService(
        tenantContext
      ).getWithPagination(toQueryOptions(validatedQuery!));

      return apiSuccess(result.data, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages,
      });
    } catch (error) {
      console.error('[GET /store-channels]', error);
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(
          error,
          'Gagal memuat store channels.'
        ),
        500
      );
    }
  }
);

export const POST = withValidation(
  CreateStoreChannelSchema,
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
      const channel = await new StoreChannelService(
        tenantContext
      ).create(validatedBody as CreateStoreChannelDTO);
      return apiSuccess(channel, undefined, 201);
    } catch (error) {
      console.error('[POST /store-channels]', error);
      return apiError(
        ErrorCodes.BAD_REQUEST,
        getErrorMessage(
          error,
          'Gagal membuat store channel.'
        ),
        400
      );
    }
  }
);
