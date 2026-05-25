import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ToolMarketplaceIncomeReport from '@/lib/mongoose/schema/tool-marketplace-income-report';
import importer from '@/lib/xlsx/shopee/income/v1/importer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    // Parse the data using the v1 importer
    const reportData = importer(arrayBuffer, file.name);

    await db.connect();

    // Save to DB
    const report = new ToolMarketplaceIncomeReport(reportData);

    await report.save();

    return NextResponse.json({
      success: true,
      reportId: report._id,
      report, // Returning full report immediately for manual testing
      teaser: {
        grossSales: reportData.summary.total_income,
        totalFees: reportData.summary.total_expense.total,
        netPayout: reportData.summary.released_amount
      }
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
