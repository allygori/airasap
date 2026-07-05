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
import { ViewDrawer } from '@/app/dashboard/products/_components/view-drawer';
// import { CategoryRowActions } from "../../categories/_components/category-row-actions"
// import { CategoryViewDrawer } from "../../categories/_components/category-view-drawer"
import { formatIDR } from '@/lib/formatter';

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
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => (
        <div className="max-w-64">
          <ViewDrawer
            item={row.original}
            editUrl="/dashboard/products"
            viewUrl="/products"
          >
            <Button
              variant="link"
              className="text-foreground block h-auto w-fit px-0 py-2 text-left font-semibold wrap-break-word whitespace-normal underline-offset-4 hover:underline"
            >
              {row.original.name}
            </Button>
          </ViewDrawer>
          <p className="text-sm">
            {row.original.product_id}
          </p>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'options',
      header: 'Variant Options',
      cell: ({ row }) => (
        <div className="w-48">
          {/* <Badge
            variant="outline"
            className="text-muted-foreground px-1.5"
          > */}
          {row.original.options.length >= 1 ? (
            (row.original.options || []).map(
              (option: string[], idx: number) => {
                return (
                  <div key={idx} className="mb-4">
                    <p className="text-muted-foreground/50 mb-2 flex min-w-0 items-center gap-1 text-xs font-bold">
                      Opsi &nbsp; {idx + 1}:
                    </p>
                    <ul className="flex flex-1 flex-row flex-wrap gap-2">
                      {(option || []).map((opt, idx2) => {
                        return (
                          <li key={idx2}>
                            <Badge>{opt}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }
            )
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground px-1.5"
            >
              Tidak Ada{' '}
            </Badge>
          )}
          {/* </Badge> */}
        </div>
      ),
    },
    {
      accessorKey: 'variant',
      header: 'Total Variants',
      cell: ({ row }) => (
        <div className="w-24">
          <Badge
            variant="outline"
            className="text-muted-foreground px-1.5"
          >
            {row.original.variants.length >= 1
              ? row.original.variants.length
              : 0}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'hpp',
      header: 'HPP',
      cell: ({ row }) => (
        <div className="w-32">
          {row.original.variants.length > 1 ? (
            <div>
              {/* <p>Min: {Math.min(row.original.variants.map((v: { default_cost: number }) => v.default_cost))}</p> */}
              <p>
                Min:{' '}
                {formatIDR(
                  (row.original.variants || []).reduce(
                    (
                      min: number,
                      item: { default_cost: number }
                    ) => {
                      return item.default_cost < min
                        ? item.default_cost
                        : min;
                    },
                    0
                  ) || 0
                )}
              </p>
              <p>
                Max:{' '}
                {formatIDR(
                  (row.original.variants || []).reduce(
                    (
                      max: number,
                      item: { default_cost: number }
                    ) => {
                      return item.default_cost > max
                        ? item.default_cost
                        : max;
                    },
                    0
                  ) || 0
                )}
              </p>
            </div>
          ) : (
            formatIDR(
              row.original.variants[0].default_cost,
              { fallback: 0 }
            )
          )}
          {/* <Badge
            variant="outline"
            className="text-muted-foreground px-1.5"
          >
            {(
              row.original
                .category as unknown as CategoryType
            )?.name || 'Uncategorized'}
          </Badge> */}
        </div>
      ),
    },
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
      accessorKey: 'created_at',
      header: 'Date Created',
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {new Date(
            row.original.created_at
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
