'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, FilePlus2 } from 'lucide-react';

import { DataTableShell } from '@/components/data-table/shell';
import { buttonVariants } from '@/components/ui/button';
import { inventoryItemMappingColumns } from '../_components/mapping-columns';

export default function InventoryMappingsPage() {
  const columns = useMemo(
    () => inventoryItemMappingColumns,
    []
  );

  return (
    <>
      <div className="animate-in fade-in flex flex-col justify-between gap-5 p-4 duration-700 md:flex-row md:items-end md:p-6">
        <div className="space-y-1.5">
          <div className="text-primary flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
            <ArrowLeftRight className="size-4" />
            Inventory control
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Product mappings
          </h1>
          <p className="text-muted-foreground max-w-2xl font-medium">
            Lihat dan audit hubungan antara listing
            product/variant dengan inventory item internal.
            Ini membuat konversi order dapat dicek tanpa
            mengandalkan pencocokan SKU secara magic.
          </p>
        </div>
        <Link
          href="/dashboard/inventory/mappings/create"
          className={buttonVariants({ size: 'lg' })}
        >
          <FilePlus2 data-icon="inline-start" />
          Tambah mapping
        </Link>
      </div>
      <DataTableShell
        title="Inventory item mappings"
        endpoint="/api/v1/dashboard/inventory/mappings?sort=-updated_at"
        columns={columns}
        searchFields={[
          'variant_id',
          'mapping_method',
          'notes',
        ]}
        searchOptions={[
          { label: 'Variant ID', value: 'variant_id' },
          { label: 'Method', value: 'mapping_method' },
          { label: 'Catatan', value: 'notes' },
        ]}
        primarySearchField="variant_id"
        showCreateButton={false}
        isSortable={false}
      />
    </>
  );
}
