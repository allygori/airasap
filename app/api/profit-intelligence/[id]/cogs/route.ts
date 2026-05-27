import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ToolMarketplaceIncomeReport from '@/lib/mongoose/schema/tool-marketplace-income-report';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { updates } = await request.json(); // updates: Array<{ id: string, cogs: number }>

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 });
    }

    await db.connect();

    const report = await ToolMarketplaceIncomeReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Create a map for quick lookup (supporting cogs or fallback hpp)
    const updateMap = new Map(updates.map((u: any) => [u.id, u.cogs !== undefined ? u.cogs : u.hpp]));

    // Update the products array in the database
    let totalCogs = 0;
    report.products = report.products.map((p: any) => {
      const newCogs = updateMap.has(p.id) ? Number(updateMap.get(p.id)) : (p.cogs || 0);
      totalCogs += (newCogs * p.quantity);
      return {
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        cogs: newCogs
      };
    });

    const productCogsMap = new Map<string, number | undefined | null>(report.products.map((p: any) => [p.id, p.cogs]));

    if (report.orders && Array.isArray(report.orders)) {
      report.orders = report.orders.map((order: any) => {
        let orderTotalCogs = 0;
        
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const itemCogs = productCogsMap.get(item.productId) || 0;
            orderTotalCogs += (item.quantity || 1) * itemCogs;
          }
        }
        
        order.profit = (order.income || 0) - orderTotalCogs;
        return order;
      });
      report.markModified('orders');
    }

    report.markModified('products');
    await report.save();

    return NextResponse.json({ success: true, report, totalCogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
