/**
 * Product API Routes
 * GET  /api/v1/dashboard/files - List files with pagination & filtering
 * POST /api/v1/dashboard/files - Create new file
 */

import { NextRequest } from 'next/server';
import { FileService } from '@/modules/files/file.service';
import {
  CreateFileSchema,
  CreateFileDTO,
  FileFilterSchema,
  FileFilterDTO,
} from '@/modules/files/file.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';

function getTenantContext(req: Request) {
  return {
    organizationId:
      req.headers.get('x-organization-id') || '',
    storeId: req.headers.get('x-store-id') || undefined,
  };
}

export const GET = withValidation(
  {
    query: FileFilterSchema,
  },
  async (request, context) => {
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const fileService = new FileService(tenantContext);
    const validatedFilter =
      context.validatedQuery as FileFilterDTO;

    const result =
      await fileService.getFilesWithPagination(
        validatedFilter
      );

    return apiSuccess(result.data, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      total_pages: result.pagination.totalPages,
    });
  }
);

export const POST = withValidation(
  CreateFileSchema,
  async (request, { validatedBody }) => {
    try {
      const tenantContext = getTenantContext(request);

      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Organization ID wajib diisi dalam header (x-organization-id)',
          400
        );
      }

      const fileService = new FileService(tenantContext);
      const body = validatedBody as CreateFileDTO;
      const newProduct = await fileService.createFile(body);

      return apiSuccess(newProduct, undefined, 201);
    } catch (error: any) {
      console.error('[POST /files]', error);

      if (error.message?.includes('sudah ada')) {
        return apiError(
          ErrorCodes.CONFLICT,
          error.message,
          409
        );
      }

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal membuat produk',
        500
      );
    }
  }
);
