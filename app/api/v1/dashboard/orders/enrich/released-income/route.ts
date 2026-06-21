/**
 * Enrich order data with released incomes from Shopee Endpoint
 * POST /api/v1/dashboard/orders/enrich/released-income
 */

import path from 'path';
import fs from 'fs/promises';
import { db } from '@/lib/db';
import {
  calculateCRC32,
  calculateSHA256,
} from '@/lib/file/checksum';
import { OrderService } from '@/modules/orders/order.service';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { FileService } from '@/modules/files/file.service';
import { FILE_TYPES_KV } from '@/modules/files/file.constant';

export const POST = withValidation({}, async (request) => {
  try {
    const tenantContext = await getTenantContext();

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID tidak ditemukan',
        400
      );
    }

    if (!tenantContext.storeId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Store ID tidak ditemukan.',
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

    const fileService = new FileService(tenantContext);
    let fileDoc =
      await fileService.getByFilename(sha256Filename);

    if (!fileDoc) {
      fileDoc = await fileService.create({
        filename: sha256Filename,
        original_name: file.name,
        mime_type:
          file.type ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_type: FILE_TYPES_KV.DOC,
        size: file.size,
        url: `/upload/${diskFilename}`,
        checksum: crc32Checksum,
        storage_provider: 'local',
        storage_path: storagePath,
        uploaded_by: tenantContext.userId,
      });
    }

    const orderService = new OrderService(tenantContext);
    const result =
      await orderService.enrichWithReleasedIncome(buffer);

    return apiSuccess(
      {
        // fileId: fileDoc._id.toString(),
        // ...result,
        result,
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error('[POST /orders/mass-upload]', error);
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message ||
        'Gagal memproses mass upload produk.',
      500
    );
  }
});
