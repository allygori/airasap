'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { FilePlus2, Warehouse } from 'lucide-react';

import { DataTableShell } from '@/components/data-table/shell';
import { buttonVariants } from '@/components/ui/button';
import { inventoryLocationColumns } from '../_components/columns';

export default function InventoryLocationsPage() {
  const columns = useMemo(
    () => inventoryLocationColumns,
    []
  );

  return (
    <>
      <div className="animate-in fade-in flex flex-col justify-between gap-5 p-4 duration-700 md:flex-row md:items-end md:p-6">
        <div className="space-y-1.5">
          <div className="text-primary flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
            <Warehouse className="size-4" />
            Inventory control
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Inventory Locations
          </h1>
          <p className="text-muted-foreground max-w-xl font-medium">
            Lokasi fisik atau logis tempat stok disimpan.
            Ini berbeda dari store/workspace dan platform
            penjualan.
          </p>
        </div>
        <Link
          href="/dashboard/inventory/locations/create"
          className={buttonVariants({ size: 'lg' })}
        >
          <FilePlus2 data-icon="inline-start" />
          Tambah lokasi
        </Link>
      </div>
      <DataTableShell
        title="Inventory locations"
        endpoint="/api/v1/dashboard/inventory/locations?sort=code"
        columns={columns}
        searchFields={['code', 'name', 'description']}
        searchOptions={[
          { label: 'Kode', value: 'code' },
          { label: 'Nama lokasi', value: 'name' },
          { label: 'Catatan', value: 'description' },
        ]}
        primarySearchField="code"
        showCreateButton={false}
        isSortable={false}
      />
    </>
  );
}
