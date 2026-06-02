'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';

import { CollectionHeader } from './header';
import { CollectionTable } from './table';

type CollectionShellProps<TData extends { _id: string }> = {
  title: string;
  endpoint: string;
  columns: ColumnDef<TData, any>[];
  searchFields?: string[];
  primarySearchField?: string;
  createUrl?: string;
  createText?: string;
  isSortable?: boolean;
  onRowClick?: (row: TData) => void;
  onDataUpdate?: (data: TData[]) => void;
};

export function CollectionShell<
  TData extends { _id: string },
>({
  title,
  endpoint,
  columns,
  searchFields,
  primarySearchField,
  createUrl,
  createText,
  isSortable = false,
  onRowClick,
  onDataUpdate,
}: CollectionShellProps<TData>) {
  const [data, setData] = React.useState<TData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [rowSelection, setRowSelection] = React.useState(
    {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] =
    React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] =
    React.useState('');

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // Build URL with search/filters if needed in future
      // For now, simple fetch as current implementation does
      const res = await fetch(endpoint);
      if (!res.ok)
        throw new Error(
          `Failed to fetch ${title.toLowerCase()}`
        );
      const json = await res.json();
      const fetchedData = json.data || [];
      setData(fetchedData);
      onDataUpdate?.(fetchedData);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, title, onDataUpdate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    getRowId: (row) => row._id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full flex-col justify-start gap-6 space-y-4">
          <CollectionHeader
            title={title}
            count={data.length}
            createUrl={createUrl}
            createText={createText}
          />
          <div className="px-4 lg:px-6">
            <CollectionTable
              table={table}
              data={data}
              setData={isSortable ? setData : undefined}
              isLoading={isLoading}
              searchFields={searchFields}
              primarySearchField={primarySearchField}
              isSortable={isSortable}
              onRowClick={onRowClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
