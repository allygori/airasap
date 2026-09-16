import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import { UpdateInventoryItemDTO } from '@/modules/inventory/items/inventory-item.dto';
import { UpdateInventoryItemSchema } from '@/modules/inventory/items/inventory-item.schema';
import { InventoryItemService } from '@/modules/inventory/items/inventory-item.service';

const ParamsSchema = z.object({ id: z.string().min(1) });

export const GET = withValidation(
  { params: ParamsSchema },
  async (_request, { validatedParams }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const item = await new InventoryItemService(
        tenantContext
      ).getById(validatedParams!.id);
      if (!item) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory item tidak ditemukan.',
          404
        );
      }
      return apiSuccess(item);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat inventory item.',
        500
      );
    }
  }
);

export const PATCH = withValidation(
  { params: ParamsSchema, body: UpdateInventoryItemSchema },
  async (_request, { validatedParams, validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const item = await new InventoryItemService(
        tenantContext
      ).update(
        validatedParams!.id,
        validatedBody as UpdateInventoryItemDTO
      );
      if (!item) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory item tidak ditemukan.',
          404
        );
      }
      return apiSuccess(item);
    } catch (error: unknown) {
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
          : 'Gagal memperbarui inventory item.',
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
      const item = await new InventoryItemService(
        tenantContext
      ).archive(validatedParams!.id);
      if (!item) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Inventory item tidak ditemukan.',
          404
        );
      }
      return apiSuccess(item);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mengarsipkan inventory item.',
        500
      );
    }
  }
);
