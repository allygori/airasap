import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ShopeeReport from '@/models/ShopeeReport';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const report = await ShopeeReport.findById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { email } = await request.json();
    await connectToDatabase();
    
    const report = await ShopeeReport.findByIdAndUpdate(
      params.id, 
      { email },
      { new: true }
    );
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
