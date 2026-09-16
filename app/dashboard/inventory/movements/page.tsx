'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Boxes } from 'lucide-react';

import { DataTableShell } from '@/components/data-table/shell';
import { buttonVariants } from '@/components/ui/button';
import { inventoryMovementColumns } from '../_components/columns';

export default function InventoryMovementsPage() {
  const columns = useMemo(
    () => inventoryMovementColumns,
    []
  );

  return (
    <>
      <div className="animate-in fade-in flex flex-col justify-between gap-5 p-4 duration-700 md:flex-row md:items-end md:p-6">
        <div className="space-y-1.5">
          <div className="text-primary flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
            <Boxes className="size-4" />
            Inventory audit trail
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Inventory Movements
          </h1>
          <p className="text-muted-foreground max-w-xl font-medium">
            Semua perubahan quantity dan nilai inventory
            yang berasal dari purchase, sale, return,
            consumption, dan adjustment.
          </p>
        </div>
        <Link
          href="/dashboard/accounting"
          className={buttonVariants({
            variant: 'secondary',
            size: 'lg',
          })}
        >
          <ArrowUpRight data-icon="inline-start" />
          Catat lewat Finance Desk
        </Link>
      </div>
      <DataTableShell
        title="Inventory movements"
        endpoint="/api/v1/dashboard/inventory/movements?sort=-occurred_at"
        columns={columns}
        searchFields={[
          'reference',
          'notes',
          'source_type',
          'source_id',
        ]}
        searchOptions={[
          { label: 'Reference', value: 'reference' },
          { label: 'Catatan', value: 'notes' },
          { label: 'Source type', value: 'source_type' },
        ]}
        primarySearchField="reference"
        showCreateButton={false}
        isSortable={false}
      />
    </>
  );
}
