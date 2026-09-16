import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import type { UpdateInventoryItemMappingDTO } from '@/modules/inventory/mappings/inventory-item-mapping.dto';
import { UpdateInventoryItemMappingSchema } from '@/modules/inventory/mappings/inventory-item-mapping.schema';
import { InventoryItemMappingService } from '@/modules/inventory/mappings/inventory-item-mapping.service';

const ParamsSchema = z.object({ id: z.string().min(1) });

function getErrorMessage(
  result: unknown,
  fallback: string
) {
  return result instanceof Error
    ? result.message
    : fallback;
}

export const GET = withValidation(
  { params: ParamsSchema },
  async (_request, { validatedParams }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const mapping = await new InventoryItemMappingService(
        tenantContext
      ).getById(validatedParams!.id);
      if (!mapping) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory item mapping tidak ditemukan.',
          404
        );
      }
      return apiSuccess(mapping);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(
          error,
          'Gagal memuat inventory item mapping.'
        ),
        500
      );
    }
  }
);

export const PATCH = withValidation(
  {
    params: ParamsSchema,
    body: UpdateInventoryItemMappingSchema,
  },
  async (_request, { validatedParams, validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const mapping = await new InventoryItemMappingService(
        tenantContext
      ).update(
        validatedParams!.id,
        validatedBody as UpdateInventoryItemMappingDTO
      );
      if (!mapping) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory item mapping tidak ditemukan.',
          404
        );
      }
      return apiSuccess(mapping);
    } catch (error: unknown) {
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
          'Gagal memperbarui inventory item mapping.'
        ),
        400
      );
    }
  }
);

export const DELETE = withValidation(
  { params: ParamsSchema },
  async (_request, { validatedParams }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const mapping = await new InventoryItemMappingService(
        tenantContext
      ).archive(validatedParams!.id);
      if (!mapping) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory item mapping tidak ditemukan.',
          404
        );
      }
      return apiSuccess(mapping);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(
          error,
          'Gagal mengarsipkan inventory item mapping.'
        ),
        500
      );
    }
  }
);
