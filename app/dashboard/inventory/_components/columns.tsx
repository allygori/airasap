'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CollectionRowActions } from '@/components/dashboard/collection/row-actions';
import type { InventoryItemResponseDTO } from '@/modules/inventory/items/inventory-item.dto';
import type { InventoryLocationResponseDTO } from '@/modules/inventory/locations/inventory-location.dto';
import { formatDate } from '@/lib/formatter/date';
import { formatIDR } from '@/lib/formatter';

const itemTypeLabels: Record<string, string> = {
  merchandise: 'Merchandise',
  packaging: 'Packaging',
  supplies: 'Supplies',
  fixed_asset: 'Fixed asset',
};

export const inventoryItemColumns: ColumnDef<InventoryItemResponseDTO>[] =
  [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <div className="font-mono text-sm font-semibold">
          {row.original.sku}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nama item',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.name}
          </div>
          <div className="text-muted-foreground text-xs">
            {row.original.description ||
              'Belum ada catatan'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'item_type',
      header: 'Tipe',
      cell: ({ row }) => (
        <Badge variant="outline">
          {itemTypeLabels[row.original.item_type] ||
            row.original.item_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Satuan',
    },
    {
      id: 'tracking',
      header: 'Tracking',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.track_quantity && (
            <Badge variant="secondary">Qty</Badge>
          )}
          {row.original.track_value && (
            <Badge variant="secondary">Nilai</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.is_active ? 'success' : 'secondary'
          }
        >
          {row.original.is_active ? 'Aktif' : 'Diarsipkan'}
        </Badge>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: 'Diperbarui',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.updated_at
            ? formatDate(row.original.updated_at)
            : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <CollectionRowActions
          row={row}
          editUrl="/dashboard/inventory/items"
          endpoint="/api/v1/dashboard/inventory/items"
          label="Inventory item"
        />
      ),
      enableHiding: false,
    },
  ];

const locationTypeLabels: Record<string, string> = {
  warehouse: 'Warehouse',
  store_room: 'Store room',
  other: 'Lainnya',
};

export const inventoryLocationColumns: ColumnDef<InventoryLocationResponseDTO>[] =
  [
    {
      accessorKey: 'code',
      header: 'Kode',
      cell: ({ row }) => (
        <span className="font-mono font-semibold">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nama lokasi',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.name}
          </div>
          <div className="text-muted-foreground text-xs">
            {row.original.description ||
              'Belum ada catatan'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipe',
      cell: ({ row }) => (
        <Badge variant="outline">
          {locationTypeLabels[row.original.type] ||
            row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.is_active ? 'success' : 'secondary'
          }
        >
          {row.original.is_active ? 'Aktif' : 'Diarsipkan'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <CollectionRowActions
          row={row}
          editUrl="/dashboard/inventory/locations"
          endpoint="/api/v1/dashboard/inventory/locations"
          label="Inventory location"
        />
      ),
      enableHiding: false,
    },
  ];

export type InventoryMovementTableRow = {
  _id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  occurred_at: string;
  status: string;
  source_type?: string;
  reference?: string;
  notes?: string;
  journal_entry?: string;
  inventory_item?:
    | { sku?: string; name?: string; unit?: string }
    | string;
  location?: { code?: string; name?: string } | string;
};

const movementTypeLabels: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  return: 'Return',
  damage: 'Damage',
  loss: 'Loss',
  adjustment: 'Adjustment',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
  consumption: 'Consumption',
};

export const inventoryMovementColumns: ColumnDef<InventoryMovementTableRow>[] =
  [
    {
      accessorKey: 'occurred_at',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.occurred_at)}
        </span>
      ),
    },
    {
      id: 'item',
      header: 'Item',
      cell: ({ row }) => {
        const item = row.original.inventory_item;
        return typeof item === 'object' && item ? (
          <div>
            <div className="font-mono text-sm font-semibold">
              {item.sku || '-'}
            </div>
            <div className="text-muted-foreground text-xs">
              {item.name || '-'}
            </div>
          </div>
        ) : (
          String(item || '-')
        );
      },
    },
    {
      id: 'location',
      header: 'Lokasi',
      cell: ({ row }) => {
        const location = row.original.location;
        return typeof location === 'object' && location
          ? `${location.code || '-'} · ${location.name || '-'}`
          : String(location || '-');
      },
    },
    {
      accessorKey: 'movement_type',
      header: 'Movement',
      cell: ({ row }) => (
        <Badge variant="outline">
          {movementTypeLabels[row.original.movement_type] ||
            row.original.movement_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.quantity}
        </span>
      ),
    },
    {
      accessorKey: 'total_cost',
      header: 'Nilai',
      cell: ({ row }) =>
        formatIDR(row.original.total_cost ?? 0),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'posted'
              ? 'success'
              : 'secondary'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-48 truncate text-sm">
          {row.original.reference ||
            row.original.source_type ||
            '-'}
        </span>
      ),
    },
  ];
