import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import * as xlsx from 'xlsx';
import mongoose from 'mongoose';

import { db } from '@/lib/db/connection';
import FileModel from '@/lib/db/schema/files';
import Product from '@/lib/db/schema/products';
import Store from '@/lib/db/schema/stores';
import {
  calculateCRC32,
  calculateSHA256,
} from '@/lib/file/checksum';
import { auth } from '@/lib/auth/auth';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const orgId = session?.session?.activeOrganizationId;
    const userId = session?.user?.id;

    if (!orgId || !userId) {
      return apiError(
        ErrorCodes.UNAUTHORIZED,
        'Unauthorized',
        401
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // const storeId = formData.get('storeId') as string | null;

    if (!file) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'File Excel wajib diunggah.',
        400
      );
    }

    // if (!storeId) {
    //   return apiError(
    //     ErrorCodes.VALIDATION_ERROR,
    //     'Store wajib dipilih.',
    //     400
    //   );
    // }

    await db.connect();

    // // Verify store belongs to the active organization
    // const store = await Store.findOne({
    //   _id: storeId,
    //   organization: orgId,
    //   deleted_at: null,
    // });

    // if (!store) {
    //   return apiError(
    //     ErrorCodes.VALIDATION_ERROR,
    //     'Store tidak ditemukan atau bukan milik organisasi ini.',
    //     400
    //   );
    // }

    const buffer = await file.arrayBuffer();

    // Checksum and SHA-256 calculation
    const crc32Checksum = calculateCRC32(buffer);
    const sha256Filename = await calculateSHA256(buffer);

    // Local file storage
    const uploadDir = path.join(process.cwd(), 'upload');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = 'xlsx';
    const diskFilename = `${sha256Filename}.${ext}`;
    const storagePath = path.join(uploadDir, diskFilename);

    // Write file to disk
    await fs.writeFile(storagePath, Buffer.from(buffer));

    // Upsert the file in the database
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
        uploaded_by: new mongoose.Types.ObjectId(userId),
      });
    }

    // Parse Excel workbook
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<any[]>(
      worksheet,
      { header: 1 }
    );

    if (data.length < 7) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Format Excel tidak valid atau data kosong.',
        400
      );
    }

    // Parse data rows (starts at index 6)
    type ExcelRow = {
      productId: number;
      productName: string;
      variationId: number;
      variationName: string;
      sku: string;
      price: number;
      gtin: string;
      quantity: number;
    };

    const rows: ExcelRow[] = [];
    for (let i = 6; i < data.length; i++) {
      const row: any = data[i];
      if (!row || !row[0]) continue;

      const productId = Number(row[0]);
      if (isNaN(productId)) continue;

      // In Shopee template: variation_id is row[2]. If empty, treat as non-variant product.
      const variationId = Number(row[2] || 0);

      rows.push({
        productId,
        productName: String(row[1] || ''),
        variationId: isNaN(variationId) ? 0 : variationId,
        variationName: String(row[3] || ''),
        sku: String(row[5] || ''),
        price: Number(row[6] || 0),
        gtin: String(row[7] || ''),
        quantity: Number(row[8] || 0),
      });
    }

    // Group by product id
    const productsMap = new Map<number, ExcelRow[]>();
    for (const r of rows) {
      if (!productsMap.has(r.productId)) {
        productsMap.set(r.productId, []);
      }
      productsMap.get(r.productId)!.push(r);
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const [
      productId,
      group,
    ] of productsMap.entries()) {
      const name = group[0].productName;
      const variants = group.map((item) => ({
        variation_id: item.variationId || undefined,
        name:
          item.variationName ||
          item.productName ||
          'Default',
        product_key: `${item.productId}::${item.variationName || 'Default'}`,
        price: item.price,
        quantity: item.quantity,
        discount: 0,
        finalPrice: item.price,
        SKU: item.sku || undefined,
        GTIN: item.gtin || undefined,
      }));

      const productKey = `${productId}::${group[0].variationName || 'Default'}`;

      const existingProduct = await Product.findOne({
        organization: orgId,
        // store: storeId,
        product_id: productId,
        deleted_at: null,
      });

      if (existingProduct) {
        existingProduct.name = name;
        existingProduct.variants = variants;
        existingProduct.product_key = productKey;
        existingProduct.is_active = true;
        await existingProduct.save();
        updatedCount++;
      } else {
        await Product.create({
          organization: orgId,
          // store: storeId,
          platform: 'shopee',
          name,
          product_id: productId,
          product_key: productKey,
          variants,
          is_active: true,
        });
        createdCount++;
      }
    }

    return apiSuccess({
      fileId: fileDoc._id.toString(),
      created: createdCount,
      updated: updatedCount,
    });
  } catch (error: any) {
    console.error('Mass Upload Error:', error);
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal memproses unggahan massal.',
      500
    );
  }
}
