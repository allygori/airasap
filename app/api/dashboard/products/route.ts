import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Product from '@/lib/db/schema/products';
import Store from '@/lib/db/schema/stores';
import { getTenantBoundModel } from '@/lib/api/scoped-by-organization';
import { parseQueryParams } from '@/lib/api/query-builder';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { validateBody } from '@/lib/api/validator';
import { createProductSchema } from '@/lib/schema/product.schema';

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan tidak diketahui.';
}

export async function GET(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const orgId = reqHeaders.get('x-organization-id');

    const ScopedProduct =
      await getTenantBoundModel(Product);

    const queryOptions = parseQueryParams(request, {
      allowedFilters: ['platform', 'is_active', 'store'],
      searchFields: ['name'],
    });

    const baseFilter: Record<string, unknown> = {
      deleted_at: null,
    };

    if (queryOptions.filters.platform) {
      baseFilter.platform = queryOptions.filters.platform;
    }
    if (queryOptions.filters.is_active !== undefined) {
      baseFilter.is_active = queryOptions.filters.is_active;
    }
    if (queryOptions.filters.store) {
      baseFilter.store = queryOptions.filters.store;
    }

    if (queryOptions.search) {
      const searchRegex = new RegExp(
        queryOptions.search,
        'i'
      );
      baseFilter.$or = ['name'].map((field) => ({
        [field]: searchRegex,
      }));
    }

    const total = await Product.countDocuments(baseFilter)
      .setOptions({ organizationId: orgId })
      .exec();

    const total_pages = Math.ceil(
      total / queryOptions.limit
    );
    const skip =
      (queryOptions.page - 1) * queryOptions.limit;

    const data = await ScopedProduct.find(baseFilter)
      .sort(queryOptions.sort)
      .skip(skip)
      .limit(queryOptions.limit)
      .lean()
      .exec();

    return apiSuccess(data, {
      page: queryOptions.page,
      limit: queryOptions.limit,
      total,
      total_pages,
    });
  } catch (error: unknown) {
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      getErrorMessage(error) ||
        'Gagal mengambil data produk.',
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ScopedProduct =
      await getTenantBoundModel(Product);

    const validation = await validateBody(
      request,
      createProductSchema
    );
    if (!validation.success) {
      return validation.error;
    }

    const { store: storeId, ...productData } =
      validation.data;

    const reqHeaders = await headers();
    const orgId = reqHeaders.get('x-organization-id');

    const store = await Store.findOne({
      _id: storeId,
      organization: orgId,
    });
    if (!store) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Store tidak ditemukan atau bukan milik organisasi ini.',
        400
      );
    }

    const product = await ScopedProduct.create({
      ...productData,
      store: storeId,
    });

    return apiSuccess(product, undefined, 201);
  } catch (error: unknown) {
    const mongooseError = error as { code?: number };
    if (mongooseError.code === 11000) {
      return apiError(
        ErrorCodes.CONFLICT,
        'Produk dengan data yang sama sudah ada.',
        409
      );
    }
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      getErrorMessage(error) || 'Gagal membuat produk.',
      500
    );
  }
}
