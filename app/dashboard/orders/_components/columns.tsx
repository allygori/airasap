'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle2,
  Loader2,
  GripVertical,
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
// import { CategoryRowActions } from "../../categories/_components/category-row-actions"
// import { CategoryViewDrawer } from "../../categories/_components/category-view-drawer"

type CategoryType = {
  name: string;
};

type UserType = {
  name: string;
};

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
    {
      accessorKey: 'username',
      header: 'Pembeli',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.username || '-'}
        </div>
      ),
    },
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
        <div className="text-sm font-medium">
          {row.original.status || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'Subtotal',
      header: 'Subtotal',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatIDR(row.original.order_subtotal ?? 0)}
        </div>
      ),
    },
    {
      accessorKey: 'released_amount',
      header: 'Income',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatIDR(row.original.released_amount ?? 0)}
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
          {new Date(
            row.original.order_created_at
          ).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: 'Tanggal selesai',
      header: 'Selesai',
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {new Date(
            row.original.order_completed_at
          ).toLocaleDateString()}
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
