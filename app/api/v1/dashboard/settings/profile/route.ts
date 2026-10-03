import { auth } from '@/lib/auth/auth';
import { UpdateProfileSchema } from '@/lib/auth/profile.schema';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';

export const PATCH = withValidation(
  UpdateProfileSchema,
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
        'Silakan masuk kembali untuk mengubah profil.',
        401
      );
    }

    const updateResult = await auth.api.updateUser({
      body: validatedBody,
      headers: request.headers,
      returnHeaders: true,
      returnStatus: true,
    });

    const response = apiSuccess(
      { name: validatedBody.name },
      undefined,
      updateResult.status
    );

    for (const cookie of updateResult.headers.getSetCookie()) {
      response.headers.append('set-cookie', cookie);
    }

    return response;
  }
);
