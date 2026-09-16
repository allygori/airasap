import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import { UpdateInventoryLocationDTO } from '@/modules/inventory/locations/inventory-location.dto';
import { UpdateInventoryLocationSchema } from '@/modules/inventory/locations/inventory-location.schema';
import { InventoryLocationService } from '@/modules/inventory/locations/inventory-location.service';

const ParamsSchema = z.object({ id: z.string().min(1) });

export const GET = withValidation(
  { params: ParamsSchema },
  async (_request, { validatedParams }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const location = await new InventoryLocationService(
        tenantContext
      ).getById(validatedParams!.id);
      if (!location) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory location tidak ditemukan.',
          404
        );
      }
      return apiSuccess(location);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat inventory location.',
        500
      );
    }
  }
);

export const PATCH = withValidation(
  {
    params: ParamsSchema,
    body: UpdateInventoryLocationSchema,
  },
  async (_request, { validatedParams, validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const location = await new InventoryLocationService(
        tenantContext
      ).update(
        validatedParams!.id,
        validatedBody as UpdateInventoryLocationDTO
      );
      if (!location) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory location tidak ditemukan.',
          404
        );
      }
      return apiSuccess(location);
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
          : 'Gagal memperbarui inventory location.',
        500
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
      const location = await new InventoryLocationService(
        tenantContext
      ).archive(validatedParams!.id);
      if (!location) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory location tidak ditemukan.',
          404
        );
      }
      return apiSuccess(location);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mengarsipkan inventory location.',
        500
      );
    }
  }
);
