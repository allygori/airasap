import { auth } from '@/lib/auth/auth';
import { UpdateOrganizationProfileSchema } from '@/lib/auth/organization-profile.schema';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';

export const PATCH = withValidation(
  UpdateOrganizationProfileSchema,
  async (request, { validatedBody }) => {
    if (!validatedBody) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Validasi input gagal',
        400
      );
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return apiError(
        ErrorCodes.UNAUTHORIZED,
        'Silakan masuk kembali untuk mengubah organisasi.',
        401
      );
    }

    if (!session.session.activeOrganizationId) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        'Organisasi aktif tidak ditemukan.',
        404
      );
    }

    const updateResult = await auth.api.updateOrganization({
      body: { data: { name: validatedBody.name } },
      headers: request.headers,
      returnStatus: true,
    });

    if (updateResult.status === 401) {
      return apiError(
        ErrorCodes.UNAUTHORIZED,
        'Silakan masuk kembali untuk mengubah organisasi.',
        401
      );
    }

    if (updateResult.status === 403) {
      return apiError(
        ErrorCodes.FORBIDDEN,
        'Anda tidak memiliki izin untuk mengubah organisasi ini.',
        403
      );
    }

    if (updateResult.status >= 500) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Organisasi gagal diperbarui karena terjadi kesalahan server.',
        500
      );
    }

    if (updateResult.status >= 400) {
      return apiError(
        updateResult.status === 404
          ? ErrorCodes.NOT_FOUND
          : ErrorCodes.BAD_REQUEST,
        'Organisasi tidak dapat diperbarui. Periksa kembali akses dan data organisasi.',
        updateResult.status === 404 ? 404 : 400
      );
    }

    return apiSuccess({ name: validatedBody.name });
  }
);
