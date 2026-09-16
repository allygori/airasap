import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import type { UpdateStoreChannelDTO } from '@/modules/stores/channels/store-channel.dto';
import { UpdateStoreChannelSchema } from '@/modules/stores/channels/store-channel.schema';
import { StoreChannelService } from '@/modules/stores/channels/store-channel.service';

const ParamsSchema = z.object({ id: z.string().min(1) });

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const GET = withValidation(
  { params: ParamsSchema },
  async (_request, { validatedParams }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const channel = await new StoreChannelService(
        tenantContext
      ).getById(validatedParams!.id);
      if (!channel) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Store channel tidak ditemukan.',
          404
        );
      }
      return apiSuccess(channel);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(
          error,
          'Gagal memuat store channel.'
        ),
        500
      );
    }
  }
);

export const PATCH = withValidation(
  { params: ParamsSchema, body: UpdateStoreChannelSchema },
  async (_request, { validatedParams, validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      await db.connect();
      const channel = await new StoreChannelService(
        tenantContext
      ).update(
        validatedParams!.id,
        validatedBody as UpdateStoreChannelDTO
      );
      if (!channel) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Store channel tidak ditemukan.',
          404
        );
      }
      return apiSuccess(channel);
    } catch (error) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        getErrorMessage(
          error,
          'Gagal memperbarui store channel.'
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
      const channel = await new StoreChannelService(
        tenantContext
      ).archive(validatedParams!.id);
      if (!channel) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Store channel tidak ditemukan.',
          404
        );
      }
      return apiSuccess(channel);
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(
          error,
          'Gagal mengarsipkan store channel.'
        ),
        500
      );
    }
  }
);
