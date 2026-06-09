import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Product from '@/lib/db/schema/products';
import Store from '@/lib/db/schema/stores';
import { getTenantBoundModel } from '@/lib/api/scoped-by-organization';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { validateBody } from '@/lib/api/validator';
import { updateProductSchema } from '@/lib/schema/product.schema';

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan tidak diketahui.';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ScopedProduct =
      await getTenantBoundModel(Product);

    const product = await ScopedProduct.findOne({
      _id: id,
      deleted_at: null,
    });

    if (!product) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        'Produk tidak ditemukan.',
        404
      );
    }

    return apiSuccess(product);
  } catch (error: unknown) {
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      getErrorMessage(error) ||
        'Gagal mengambil data produk.',
      500
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ScopedProduct =
      await getTenantBoundModel(Product);

    const validation = await validateBody(
      request,
      updateProductSchema
    );
    if (!validation.success) {
      return validation.error;
    }

    const updateData = validation.data;

    if (updateData.store) {
      const reqHeaders = await headers();
      const orgId = reqHeaders.get('x-organization-id');

      const store = await Store.findOne({
        _id: updateData.store,
        organization: orgId,
      });
      if (!store) {
        return apiError(
          ErrorCodes.VALIDATION_ERROR,
          'Store tidak ditemukan atau bukan milik organisasi ini.',
          400
        );
      }
    }

    const existing = await ScopedProduct.findOne({
      _id: id,
      deleted_at: null,
    });

    if (!existing) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        'Produk tidak ditemukan.',
        404
      );
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return apiSuccess(updated);
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
      getErrorMessage(error) || 'Gagal memperbarui produk.',
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reqHeaders = await headers();
    const orgId = reqHeaders.get('x-organization-id');

    const ScopedProduct =
      await getTenantBoundModel(Product);

    const product = await ScopedProduct.findOne({
      _id: id,
      deleted_at: null,
    });

    if (!product) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        'Produk tidak ditemukan.',
        404
      );
    }

    await Product.findByIdAndUpdate(id, {
      deleted_at: new Date(),
    }).setOptions({ organizationId: orgId });

    return apiSuccess(null);
  } catch (error: unknown) {
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      getErrorMessage(error) || 'Gagal menghapus produk.',
      500
    );
  }
}
