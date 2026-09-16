'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { FilePlus2, PackageSearch } from 'lucide-react';

import { DataTableShell } from '@/components/data-table/shell';
import { buttonVariants } from '@/components/ui/button';
import { inventoryItemColumns } from '../_components/columns';

export default function InventoryItemsPage() {
  const columns = useMemo(() => inventoryItemColumns, []);

  return (
    <>
      <div className="animate-in fade-in flex flex-col justify-between gap-5 p-4 duration-700 md:flex-row md:items-end md:p-6">
        <div className="space-y-1.5">
          <div className="text-primary flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
            <PackageSearch className="size-4" />
            Inventory control
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Inventory Items
          </h1>
          <p className="text-muted-foreground max-w-xl font-medium">
            Master data item yang menjadi dasar purchase,
            stock movement, COGS, dan konversi order ke
            accounting.
          </p>
        </div>
        <Link
          href="/dashboard/inventory/items/create"
          className={buttonVariants({ size: 'lg' })}
        >
          <FilePlus2 data-icon="inline-start" />
          Tambah item
        </Link>
      </div>
      <DataTableShell
        title="Inventory items"
        endpoint="/api/v1/dashboard/inventory/items?sort=sku"
        columns={columns}
        searchFields={['sku', 'name', 'description']}
        searchOptions={[
          { label: 'SKU', value: 'sku' },
          { label: 'Nama item', value: 'name' },
          { label: 'Catatan', value: 'description' },
        ]}
        primarySearchField="sku"
        showCreateButton={false}
        isSortable={false}
      />
    </>
  );
}
