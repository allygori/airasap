'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CollectionRowActions } from '@/components/dashboard/collection/row-actions';

export type InventoryItemMappingTableRow = {
  _id: string;
  product?:
    | {
        _id?: string;
        name?: string;
        platform?: string;
        product_id?: string;
      }
    | string;
  variant_id?: string;
  variant_key: string;
  inventory_item?:
    | {
        _id?: string;
        sku?: string;
        name?: string;
        item_type?: string;
      }
    | string;
  mapping_method: string;
  is_active: boolean;
  notes?: string;
};

const methodLabels: Record<string, string> = {
  manual: 'Manual',
  sku: 'SKU',
  product_match: 'Product matching',
  imported: 'Imported',
};

export const inventoryItemMappingColumns: ColumnDef<InventoryItemMappingTableRow>[] =
  [
    {
      id: 'product',
      header: 'Product / variant',
      cell: ({ row }) => {
        const product = row.original.product;
        const productObject =
          typeof product === 'object' && product
            ? product
            : undefined;
        return (
          <div className="min-w-48">
            <div className="font-medium">
              {productObject?.name ||
                String(product || '-')}
            </div>
            <div className="text-muted-foreground text-xs">
              {productObject?.platform || '-'} ·{' '}
              {productObject?.product_id || '-'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'variant_id',
      header: 'Variant ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.variant_id || 'Product-level'}
        </span>
      ),
    },
    {
      id: 'inventory_item',
      header: 'Inventory item',
      cell: ({ row }) => {
        const item = row.original.inventory_item;
        const itemObject =
          typeof item === 'object' && item
            ? item
            : undefined;
        return (
          <div className="min-w-44">
            <div className="font-mono text-sm font-semibold">
              {itemObject?.sku || String(item || '-')}
            </div>
            <div className="text-muted-foreground text-xs">
              {itemObject?.name || '-'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'mapping_method',
      header: 'Method',
      cell: ({ row }) => (
        <Badge variant="outline">
          {methodLabels[row.original.mapping_method] ||
            row.original.mapping_method}
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
      accessorKey: 'notes',
      header: 'Catatan',
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-56 truncate text-sm">
          {row.original.notes || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <CollectionRowActions
          row={row}
          editUrl="/dashboard/inventory/mappings"
          endpoint="/api/v1/dashboard/inventory/mappings"
          label="Inventory mapping"
        />
      ),
      enableHiding: false,
    },
  ];
