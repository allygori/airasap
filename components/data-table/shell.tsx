'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  useRouter,
  usePathname,
  useSearchParams,
} from 'next/navigation';
import { toast } from 'sonner';

import { CollectionHeader } from './header';
import { CollectionTable } from './table';

type DataTableShellProps<TData extends { _id: string }> = {
  title: string;
  endpoint: string;
  columns: ColumnDef<TData, unknown>[];
  searchFields?: string[];
  primarySearchField?: string;
  showCreateButton?: boolean;
  createUrl?: string;
  createText?: string;
  isSortable?: boolean;
  onRowClick?: (row: TData) => void;
  onDataUpdate?: (data: TData[]) => void;
};

export function DataTableShell<
  TData extends { _id: string },
>({
  title,
  endpoint,
  columns,
  searchFields,
  primarySearchField,
  showCreateButton = true,
  createUrl,
  createText,
  isSortable = false,
  onRowClick,
  onDataUpdate,
}: DataTableShellProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = React.useState<TData[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(
    null
  );

  const [rowSelection, setRowSelection] = React.useState(
    {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Parse query params from URL
  const page = React.useMemo(() => {
    const p = Number(searchParams.get('page'));
    return p && p > 0 ? p : 1;
  }, [searchParams]);

  const limit = React.useMemo(() => {
    const l = Number(
      searchParams.get('limit') ||
        searchParams.get('pageSize')
    );
    return l && l > 0 ? l : 10;
  }, [searchParams]);

  const sort = React.useMemo(() => {
    return searchParams.get('sort') || '';
  }, [searchParams]);

  // Sync sorting state from URL sort param
  const sorting = React.useMemo<SortingState>(() => {
    if (!sort) return [];
    const desc = sort.startsWith('-');
    const id = desc ? sort.slice(1) : sort;
    return [{ id, desc }];
  }, [sort]);

  // Parse remaining search parameters as column filters
  const columnFilters =
    React.useMemo<ColumnFiltersState>(() => {
      const filters: ColumnFiltersState = [];
      const paginationKeys = [
        'page',
        'limit',
        'pageSize',
        'sort',
      ];
      searchParams.forEach((value, key) => {
        if (!paginationKeys.includes(key) && value) {
          filters.push({ id: key, value });
        }
      });
      return filters;
    }, [searchParams]);

  // Centralized URL search parameter updater
  const updateQueryParams = React.useCallback(
    (
      updates: Record<string, string | null | undefined>
    ) => {
      const newParams = new URLSearchParams(
        searchParams.toString()
      );
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      // Always reset page to 1 when changing filters or sorting, unless page is explicitly updated
      if (!updates.hasOwnProperty('page')) {
        newParams.set('page', '1');
      }
      router.push(`${pathname}?${newParams.toString()}`, {
        scroll: false,
      });
    },
    [searchParams, router, pathname]
  );

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams(
        searchParams.toString()
      );
      if (!params.has('page'))
        params.set('page', String(page));
      if (!params.has('limit') && !params.has('pageSize')) {
        params.set('limit', String(limit));
      } else if (
        params.has('pageSize') &&
        !params.has('limit')
      ) {
        params.set(
          'limit',
          params.get('pageSize') || String(limit)
        );
      }

      // Merge client search parameters with endpoint parameters
      const baseEndpoint = endpoint.split('?')[0];
      const endpointParams = new URLSearchParams(
        endpoint.split('?')[1] || ''
      );

      params.forEach((value, key) => {
        endpointParams.set(key, value);
      });

      const fetchUrl = `${baseEndpoint}?${endpointParams.toString()}`;
      const res = await fetch(fetchUrl);

      if (!res.ok) {
        throw new Error(
          `Failed to fetch ${title.toLowerCase()}`
        );
      }

      const json = await res.json();
      const fetchedData = json.data || [];
      setData(fetchedData);
      setTotalCount(json.meta?.total ?? fetchedData.length);
      setTotalPages(json.meta?.total_pages ?? 1);
      onDataUpdate?.(fetchedData);
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${title.toLowerCase()}`);
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    endpoint,
    title,
    onDataUpdate,
    searchParams,
    page,
    limit,
  ]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // TanStack table handlers
  const handleSortingChange = React.useCallback(
    (
      updaterOrValue:
        | SortingState
        | ((old: SortingState) => SortingState)
    ) => {
      const nextState =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (nextState.length > 0) {
        const sortVal = `${nextState[0].desc ? '-' : ''}${nextState[0].id}`;
        updateQueryParams({ sort: sortVal });
      } else {
        updateQueryParams({ sort: null });
      }
    },
    [sorting, updateQueryParams]
  );

  const handlePaginationChange = React.useCallback(
    (updaterOrValue: any) => {
      const nextState =
        typeof updaterOrValue === 'function'
          ? updaterOrValue({
              pageIndex: page - 1,
              pageSize: limit,
            })
          : updaterOrValue;
      updateQueryParams({
        page: String(nextState.pageIndex + 1),
        limit: String(nextState.pageSize),
      });
    },
    [page, limit, updateQueryParams]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    getRowId: (row) => row._id.toString(),
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full flex-col justify-start gap-6 space-y-4">
          <CollectionHeader
            title={title}
            count={totalCount}
            showCreateButton={showCreateButton}
            createUrl={createUrl}
            createText={createText}
          />
          <div className="px-4 lg:px-6">
            <CollectionTable
              table={table}
              data={data}
              setData={isSortable ? setData : undefined}
              isLoading={isLoading}
              error={error}
              searchFields={searchFields}
              primarySearchField={primarySearchField}
              isSortable={isSortable}
              onRowClick={onRowClick}
              updateQueryParams={updateQueryParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
