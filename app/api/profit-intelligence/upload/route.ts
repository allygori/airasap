import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ToolMarketplaceIncomeReport from '@/lib/mongoose/schema/tool-marketplace-income-report';
import generateProfitIntelligenceReport from '@/lib/xlsx/shopee/profit-intelligence/v1';

import { calculateCRC32 } from '@/lib/file';

function getUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error))
    return 'Gagal menganalisis file. Pastikan kedua file berupa Excel dari Shopee.';

  if (
    error.message.includes('Sheet Laporan Penghasilan') ||
    error.message.includes('Laporan Penghasilan')
  ) {
    return 'File pertama harus berupa Excel Income Sudah Dilepas dari Shopee.';
  }

  if (
    error.message.includes('Sheet Laporan Pesanan') ||
    error.message.includes('Laporan Pesanan')
  ) {
    return 'File kedua harus berupa Excel Download Pesanan Selesai dari Shopee.';
  }

  if (error.message.includes('No. Pesanan')) {
    return 'Format file tidak sesuai. Kolom No. Pesanan tidak ditemukan di salah satu file.';
  }

  return error.message;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const incomeFile = formData.get('incomeFile') as File;
    const orderFile = formData.get('orderFile') as File;

    if (!incomeFile || !orderFile) {
      return NextResponse.json(
        {
          error:
            'Kedua file (Laporan Penghasilan & Laporan Pesanan Selesai) harus disediakan.',
        },
        { status: 400 }
      );
    }

    const incomeBuffer = await incomeFile.arrayBuffer();
    const orderBuffer = await orderFile.arrayBuffer();

    const incomeChecksum = calculateCRC32(incomeBuffer);
    const orderChecksum = calculateCRC32(orderBuffer);

    await db.connect();

    // Check for duplicate entry based on checksums
    const existingReport =
      await ToolMarketplaceIncomeReport.findOne({
        $or: [
          {
            'source_pair.income_checksum': incomeChecksum,
            'source_pair.order_checksum': orderChecksum,
          },
          {
            $and: [
              {
                source_files: {
                  $elemMatch: {
                    file_type: 'income',
                    checksum: incomeChecksum,
                  },
                },
              },
              {
                source_files: {
                  $elemMatch: {
                    file_type: 'order',
                    checksum: orderChecksum,
                  },
                },
              },
            ],
          },
        ],
      });

    if (existingReport) {
      return NextResponse.json({
        success: true,
        sid: existingReport.sid,
        reportId: existingReport._id.toString(),
        alreadyExists: true,
      });
    }

    // Parse the data using the combined importer
    const reportData = generateProfitIntelligenceReport(
      incomeBuffer,
      incomeFile.name,
      orderBuffer,
      orderFile.name
    );

    // Save new report to DB
    const report = new ToolMarketplaceIncomeReport(
      reportData
    );
    await report.save();

    return NextResponse.json({
      success: true,
      sid: report.sid,
      reportId: report._id.toString(),
      alreadyExists: false,
    });
  } catch (error: unknown) {
    console.error('Upload Error:', error);
    const message = getUploadErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
