/**
 * Standardized API Response Helpers
 */

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Success response with data
 */
export function apiSuccess<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200
): Response {
  return Response.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

/**
 * Error response
 */
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown[]
): Response {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export { ErrorCodes } from '@/constant/api/error-codes';
