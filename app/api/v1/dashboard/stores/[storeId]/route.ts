import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/connection';
import { StoreService } from '@/modules/stores/store.service';
import { UpdateStoreSchema } from '@/modules/stores/store.schema';

const StoreIdParamsSchema = z
  .object({
    storeId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  })
  .strict();

export const PATCH = withValidation(
  {
    body: UpdateStoreSchema,
    params: StoreIdParamsSchema,
  },
  async (request, { validatedBody, validatedParams }) => {
    if (!validatedBody || !validatedParams) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Validasi input gagal.',
        400
      );
    }

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return apiError(
          ErrorCodes.UNAUTHORIZED,
          'Silakan masuk kembali untuk mengubah toko.',
          401
        );
      }

      const organizationId =
        session.session.activeOrganizationId;
      const activeStoreId = session.session.activeStoreId;

      if (!organizationId || !activeStoreId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Konteks organisasi atau toko aktif tidak tersedia.',
          403
        );
      }

      const organization =
        await auth.api.getFullOrganization({
          headers: request.headers,
          query: { membersLimit: 0 },
          returnStatus: true,
        });

      if (organization.status === 401) {
        return apiError(
          ErrorCodes.UNAUTHORIZED,
          'Silakan masuk kembali untuk mengubah toko.',
          401
        );
      }

      if (organization.status === 403) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Anda tidak memiliki akses ke organisasi aktif ini.',
          403
        );
      }

      if (organization.status >= 500) {
        return apiError(
          ErrorCodes.INTERNAL_ERROR,
          'Toko gagal diperbarui karena terjadi kesalahan server.',
          500
        );
      }

      if (
        organization.status >= 400 ||
        !organization.response
      ) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Organisasi aktif tidak ditemukan.',
          404
        );
      }

      if (validatedParams.storeId !== activeStoreId) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Toko aktif tidak ditemukan.',
          404
        );
      }

      await db.connect();
      const store = await new StoreService({
        organizationId,
        storeId: activeStoreId,
      }).update(validatedParams.storeId, validatedBody);

      if (!store) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Toko aktif tidak ditemukan pada organisasi ini.',
          404
        );
      }

      return apiSuccess({
        store: {
          store_id: String(store._id),
          name: store.name,
          code: store.code ?? '',
          timezone: store.timezone ?? 'Asia/Jakarta',
        },
      });
    } catch {
      console.error(
        '[PATCH /api/v1/dashboard/stores/:storeId] failed'
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Toko gagal diperbarui karena terjadi kesalahan server.',
        500
      );
    }
  }
);
