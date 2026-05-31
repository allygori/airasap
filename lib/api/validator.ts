/**
 * Zod Validation Wrapper
 *
 * Validates request body against a Zod schema and returns
 * a typed result or a formatted error response.
 */

import { type ZodType, type ZodError } from 'zod';
import { apiError } from './response';

interface ValidationSuccess<T> {
  success: true;
  data: T;
}

interface ValidationFailure {
  success: false;
  error: Response;
}

export type ValidationResult<T> =
  | ValidationSuccess<T>
  | ValidationFailure;

/**
 * Validate a request body against a Zod schema.
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return {
        success: false,
        error: apiError(
          'VALIDATION_ERROR',
          'Data tidak valid',
          400,
          details
        ),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      error: apiError(
        'VALIDATION_ERROR',
        'Request body tidak valid (bukan JSON)',
        400
      ),
    };
  }
}
