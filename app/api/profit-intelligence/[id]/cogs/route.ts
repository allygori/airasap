import { NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import ToolMarketplaceIncomeReport from '@/modules/tools/marketing/profit-intelligence/profit-intelligence.model';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { updates } = await request.json(); // updates: Array<{ id: string, cogs: number }>

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid updates payload' },
        { status: 400 }
      );
    }

    await db.connect();

    const report =
      await ToolMarketplaceIncomeReport.findById(id);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Create a map for quick lookup (supporting cogs or fallback hpp)
    const updateMap = new Map(
      updates.map((u: any) => [
        u.key,
        u.cogs !== undefined ? u.cogs : u.hpp,
      ])
    );

    // Update the products array in the database
    let totalCogs = 0;
    report.products = report.products.map((p: any) => {
      const newCogs = updateMap.has(p.key)
        ? Number(updateMap.get(p.key))
        : p.cogs || 0;
      totalCogs += newCogs * p.quantity;
      return {
        id: p.id,
        key: p.key,
        name: p.name,
        variationName: p.variationName || '',
        quantity: p.quantity,
        cogs: newCogs,
      };
    });

    // Build a map of product COGS keyed by product key, which is
    // combined product id and variation name, only if exist
    // if variation name not exists use product id
    const productCogsMap = new Map<string, number>(
      report.products.map((p: any) => [
        p.key,
        p.cogs as number,
      ])
    );

    // Accumulator for prorated profit per product
    const productProfitMap = new Map<string, number>();

    if (report.orders && Array.isArray(report.orders)) {
      report.orders = report.orders.map((order: any) => {
        let orderTotalCogs = 0;

        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const itemCogs =
              productCogsMap.get(item.productKey) || 0;
            orderTotalCogs +=
              (item.quantity || 1) * itemCogs;
          }
        }

        const orderProfit =
          (order.income || 0) - orderTotalCogs;
        order.profit = orderProfit;

        // Prorate order profit to each item proportionally based on revenue share
        if (order.items && Array.isArray(order.items)) {
          const totalRevenue = order.items.reduce(
            (sum: number, item: any) =>
              sum +
              (item.discountedPrice ||
                item.originalPrice ||
                0) *
                (item.quantity || 1),
            0
          );

          for (const item of order.items) {
            const itemRevenue =
              (item.discountedPrice ||
                item.originalPrice ||
                0) * (item.quantity || 1);
            const share =
              totalRevenue > 0
                ? itemRevenue / totalRevenue
                : 0;
            const itemProfit = orderProfit * share;
            const productKey = item.productKey || '';

            productProfitMap.set(
              productKey,
              (productProfitMap.get(productKey) || 0) +
                itemProfit
            );
          }
        }

        return order;
      });
      report.markModified('orders');
    }

    // Apply totalProfit to each product
    report.products = report.products.map((p: any) => ({
      ...p,
      totalProfit: productProfitMap.get(p.key) ?? undefined,
    }));

    report.markModified('products');
    await report.save();

    return NextResponse.json({
      success: true,
      report,
      totalCogs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
