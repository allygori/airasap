'use client';

import { X } from 'lucide-react';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollectionViewOptions } from './view-options';

type CollectionToolbarProps<TData> = {
  table: Table<TData>;
  searchFields?: string[]; // Multiple fields to search in (placeholder for global filter)
  primarySearchField?: string; // The field currently tied to the search input
  placeholder?: string;
};

export function CollectionToolbar<TData>({
  table,
  searchFields,
  primarySearchField,
  placeholder = 'Search...',
}: CollectionToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter;

  // Use primarySearchField if provided, otherwise fallback to global filter
  const searchValue = primarySearchField
    ? ((table
        ?.getColumn(primarySearchField)
        ?.getFilterValue() as string) ?? '')
    : ((table?.getState().globalFilter as string) ?? '');

  const handleSearchChange = (value: string) => {
    if (primarySearchField) {
      table
        ?.getColumn(primarySearchField)
        ?.setFilterValue(value);
    } else {
      table?.setGlobalFilter(value);
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(event) =>
            handleSearchChange(event.target.value)
          }
          className="h-8 w-[200px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter(undefined);
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <CollectionViewOptions table={table} />
    </div>
  );
}
