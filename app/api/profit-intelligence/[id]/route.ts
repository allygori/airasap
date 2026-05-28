import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ToolMarketplaceIncomeReport from '@/lib/mongoose/schema/tool-marketplace-income-report';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.connect();
    const report = mongoose.Types.ObjectId.isValid(id)
      ? await ToolMarketplaceIncomeReport.findById(id)
      : await ToolMarketplaceIncomeReport.findOne({
          sid: id,
        });
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ report });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to get report';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email } = await request.json();
    await db.connect();

    const report =
      await ToolMarketplaceIncomeReport.findByIdAndUpdate(
        id,
        { email },
        { new: true }
      );

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update report';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
