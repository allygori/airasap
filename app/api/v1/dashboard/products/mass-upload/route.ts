/**
 * Mass Upload Shopee Products Endpoint
 * POST /api/v1/dashboard/products/mass-upload
 */

import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { db } from '@/lib/db';
import { FileModel } from '@/modules/files/file.model';
import {
  calculateCRC32,
  calculateSHA256,
} from '@/lib/file/checksum';
import { ProductService } from '@/modules/products/product.service';
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
    userId: req.headers.get('x-user-id') || undefined,
  };
}

export const POST = withValidation({}, async (request) => {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'File Excel wajib diunggah.',
        400
      );
    }

    const buffer = await file.arrayBuffer();

    await db.connect();

    const crc32Checksum = calculateCRC32(buffer);
    const sha256Filename = await calculateSHA256(buffer);

    const uploadDir = path.join(process.cwd(), '.upload');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = 'xlsx';
    const diskFilename = `${sha256Filename}.${ext}`;
    const storagePath = path.join(uploadDir, diskFilename);

    await fs.writeFile(storagePath, Buffer.from(buffer));

    let fileDoc = await FileModel.findOne({
      filename: sha256Filename,
    });

    if (!fileDoc) {
      fileDoc = await FileModel.create({
        filename: sha256Filename,
        original_name: file.name,
        mime_type:
          file.type ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_type: 'xlsx',
        size: file.size,
        url: `/upload/${diskFilename}`,
        checksum: crc32Checksum,
        storage_provider: 'local',
        storage_path: storagePath,
        uploaded_by: tenantContext.userId
          ? new mongoose.Types.ObjectId(
              tenantContext.userId
            )
          : undefined,
      });
    }

    const productService = new ProductService(
      tenantContext
    );
    const result =
      await productService.massUploadShopeeProducts(buffer);

    return apiSuccess(
      {
        fileId: fileDoc._id.toString(),
        ...result,
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error('[POST /products/mass-upload]', error);
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message ||
        'Gagal memproses mass upload produk.',
      500
    );
  }
});
