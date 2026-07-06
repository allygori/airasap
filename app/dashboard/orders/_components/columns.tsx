'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle2,
  Loader2,
  GripVertical,
  CheckCircleIcon,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
// import { BlogPostType, CategoryType, UserType } from "@/components/blog/types"
import { CollectionRowActions } from '@/components/dashboard/collection/row-actions';
// import { ViewDrawer } from '@/components/dashboard/collection/view-drawer';
import { ViewDrawer } from '@/app/dashboard/orders/_components/view-drawer';
import { formatIDR } from '@/lib/formatter';
import { cn } from '@/lib/utils/ui';
import { formatDate } from '@/lib/formatter/date';
import { SHOPEE_ORDER_STATUS } from '@/modules/constant';
// import { CategoryRowActions } from "../../categories/_components/category-row-actions"
// import { CategoryViewDrawer } from "../../categories/_components/category-view-drawer"

// type CategoryType = {
//   name: string;
// };

// type UserType = {
//   name: string;
// };

// Drag handle component for sortable columns
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

export const getProductsColumn = (
  isSortable: boolean = false
): ColumnDef<Record<string, any>>[] => {
  const baseColumns: ColumnDef<Record<string, any>>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              (table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() &&
                  'indeterminate')) as unknown as boolean
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) =>
              row.toggleSelected(!!value)
            }
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'order_id',
      header: 'No Pesanan',
      cell: ({ row }) => (
        <div>
          <ViewDrawer
            item={row.original}
            editUrl="/dashboard/orders"
            viewUrl="/orders"
          >
            <Button
              variant="link"
              className="text-foreground block h-10 w-fit px-0 text-left font-semibold underline-offset-4 hover:underline"
            >
              {row.original.order_id}
            </Button>
          </ViewDrawer>
          <div className="text-sm font-medium">
            {row.original.username || '-'}
          </div>
          {/* <p className="text-sm">
            {row.original.product_id}
          </p> */}
        </div>
      ),
      enableHiding: false,
    },
    // {
    //   accessorKey: 'username',
    //   header: 'Pembeli',
    //   cell: ({ row }) => (
    //     <div className="text-sm font-medium">
    //       {row.original.username || '-'}
    //     </div>
    //   ),
    // },
    {
      accessorKey: 'Jumlah Item',
      header: 'Item',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.number_of_products_ordered || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div
          className={cn(
            'text-sm font-medium',
            row.original.status === 'batal'
              ? 'text-destructive'
              : [
                    'telah-dikirim',
                    'sedang-dikirim',
                  ].includes(row.original.status)
                ? 'text-blue-500'
                : 'text-green-400'
          )}
        >
          {Object.values(SHOPEE_ORDER_STATUS).find(
            (s: { value: string }) =>
              s.value === row.original.status
          )?.label ?? '-'}
        </div>
      ),
    },
    {
      accessorKey: 'total_payment',
      header: 'Pembayaran Pembeli',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatIDR(row.original.total_payment ?? 0)}
        </div>
      ),
    },
    {
      accessorKey: 'total_product_cost',
      header: 'HPP',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatIDR(row.original.total_product_cost ?? 0)}
        </div>
      ),
    },
    {
      accessorKey: 'released_amount',
      header: 'Pendapatan',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatIDR(row.original.released_amount ?? 0)}
        </div>
      ),
    },
    {
      accessorKey: 'total_profit',
      header: 'Profit',
      cell: ({ row }) => (
        <div
          className={cn(
            'text-base font-medium',
            row.original.total_profit > 0
              ? 'text-green-400'
              : row.original.total_profit < 0
                ? 'text-red-400'
                : ''
          )}
        >
          {formatIDR(row.original.total_profit ?? 0)}
        </div>
      ),
    },
    {
      accessorKey: 'enriched_at',
      header: 'Dilengkapi',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          <CheckCircleIcon
            className={cn(
              'text-muted-foreground size-3',
              row.original.enriched_at
                ? 'text-green-500 dark:text-green-400'
                : 'text-gray-500'
            )}
          />
        </div>
      ),
    },

    // {
    //   accessorKey: 'category.name',
    //   header: 'Category',
    //   cell: ({ row }) => (
    //     <div className="w-32">
    //       <Badge
    //         variant="outline"
    //         className="text-muted-foreground px-1.5"
    //       >
    //         {(
    //           row.original
    //             .category as unknown as CategoryType
    //         )?.name || 'Uncategorized'}
    //       </Badge>
    //     </div>
    //   ),
    // },
    // {
    //   accessorKey: 'published_status',
    //   header: 'Status',
    //   cell: ({ row }) => (
    //     <Badge
    //       variant="outline"
    //       className="text-muted-foreground gap-2 px-1.5 capitalize"
    //     >
    //       {row.original.published_status === 'published' ? (
    //         <CheckCircle2 className="size-3 fill-green-500 dark:fill-green-400" />
    //       ) : (
    //         <Loader2 className="size-3 animate-spin" />
    //       )}
    //       {row.original.published_status}
    //     </Badge>
    //   ),
    // },
    // {
    //   accessorKey: 'author.name',
    //   header: 'Author',
    //   cell: ({ row }) => (
    //     <div className="text-sm font-medium">
    //       {(row.original.author as unknown as UserType)
    //         ?.name || 'Unknown'}
    //     </div>
    //   ),
    // },
    {
      accessorKey: 'Tanggal dibuat',
      header: 'Dibuat',
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {formatDate(row.original.placed_at)}
        </div>
      ),
    },
    {
      accessorKey: 'Tanggal selesai',
      header: 'Selesai',
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {formatDate(row.original.completed_at)}
        </div>
      ),
    },
    // {
    //   id: "actions",
    //   cell: ({ row }) => <CollectionRowActions
    //     row={row}
    //     editUrl="/dashboard/posts"
    //     viewUrl="/posts"
    //     label="Article"
    //   />,
    // },
  ];

  if (isSortable) {
    return [
      {
        id: 'drag',
        header: () => null,
        cell: ({ row }) => (
          <DragHandle id={row.original._id} />
        ),
      },
      ...baseColumns,
    ];
  }

  return baseColumns;
};
