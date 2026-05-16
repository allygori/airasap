import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ShopeeReport from '@/models/ShopeeReport';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { updates } = await request.json(); // updates: Array<{ id: string, hpp: number }>
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 });
    }

    await connectToDatabase();
    
    const report = await ShopeeReport.findById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Create a map for quick lookup
    const updateMap = new Map(updates.map((u: any) => [u.id, u.hpp]));
    
    // Update the products array
    let totalHppValue = 0;
    report.products = report.products.map((p: any) => {
      const newHpp = updateMap.has(p.id) ? Number(updateMap.get(p.id)) : p.hpp;
      totalHppValue += (newHpp * p.quantity);
      return { ...p.toObject(), hpp: newHpp };
    });
    
    await report.save();
    
    return NextResponse.json({ success: true, report, totalHppValue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
