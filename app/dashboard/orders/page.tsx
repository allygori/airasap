'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { DataTableShell } from '@/components/data-table/shell';
import { ColumnDef } from '@tanstack/react-table';
import { getProductsColumn } from './_components/columns';
import { OrderResponseDTO } from '@/modules/orders/order.dto';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function OrderIndexPage() {
  const columns = useMemo(
    () => getProductsColumn(false),
    []
  ) as ColumnDef<OrderResponseDTO>[];

  return (
    <>
      <div className="animate-in fade-in flex flex-1 flex-row justify-between space-y-4 p-4 duration-700 md:p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-1.5">
            {/* <div className="text-primary animate-in slide-in-from-left-4 flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase duration-500">
              <FileText className="h-4 w-4" />
              Goods
            </div> */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
              Orders
            </h1>
            <p className="max-w-lg font-medium text-slate-500 dark:text-slate-400">
              Manage Title, COGS and many.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders/mass-upload"
            className={buttonVariants({
              variant: 'secondary',
              size: 'lg',
            })}
          >
            <FileSpreadsheet
              className="size-4 text-green-600"
              data-icon="inline-start"
            />
            <span className="inline">Upload Massal</span>
          </Link>
          <Link
            href="/dashboard/orders/mass-upload/enrich/order-completed"
            className={buttonVariants({
              variant: 'secondary',
              size: 'lg',
            })}
          >
            <FileSpreadsheet
              className="size-4 text-green-600"
              data-icon="inline-start"
            />
            <span className="inline">
              Perkaya dengan Laporan Order Selesai
            </span>
          </Link>
          <Link
            href="/dashboard/orders/mass-upload/enrich/released-funds"
            className={buttonVariants({
              variant: 'secondary',
              size: 'lg',
            })}
          >
            <FileSpreadsheet
              className="size-4 text-green-600"
              data-icon="inline-start"
            />
            <span className="inline">
              Perkaya dengan Laporan Dana Dilepas
            </span>
          </Link>
        </div>
      </div>

      <DataTableShell
        title="Orders"
        endpoint="/api/v1/dashboard/orders?sort=-order_created_at"
        columns={columns}
        searchFields={['order_id']}
        primarySearchField="order_id"
        createUrl="/dashboard/orders/create"
        createText="Create Order"
        isSortable={false}
      />
    </>
  );
}
