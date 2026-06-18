'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollectionViewOptions } from './view-options';

type CollectionToolbarProps<TData> = {
  table: Table<TData>;
  searchFields?: string[];
  primarySearchField?: string;
  placeholder?: string;
  updateQueryParams: (
    updates: Record<string, string | null | undefined>
  ) => void;
};

export function CollectionToolbar<TData>({
  table,
  searchFields,
  primarySearchField,
  placeholder = 'Search...',
  updateQueryParams,
}: CollectionToolbarProps<TData>) {
  // Sync the local search input state to make typing responsive
  const getExternalValue = React.useCallback(() => {
    if (primarySearchField) {
      return (
        (table
          .getColumn(primarySearchField)
          ?.getFilterValue() as string) ?? ''
      );
    }
    // Check if table has global filter or check query params for 'search' or 'q'
    return (table.getState().globalFilter as string) ?? '';
  }, [table, primarySearchField]);

  const [searchValue, setSearchValue] = React.useState(
    getExternalValue()
  );
  const externalValue = getExternalValue();

  React.useEffect(() => {
    setSearchValue(externalValue);
  }, [externalValue]);

  // Debounce input to update URL parameters after 400ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== externalValue) {
        if (primarySearchField) {
          updateQueryParams({
            [primarySearchField]: searchValue || null,
          });
        } else {
          updateQueryParams({
            search: searchValue || null,
          });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    searchValue,
    externalValue,
    primarySearchField,
    updateQueryParams,
  ]);

  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter ||
    !!searchValue;

  const handleReset = () => {
    const resetUpdates: Record<string, null> = {};
    table.getState().columnFilters.forEach((filter) => {
      resetUpdates[filter.id] = null;
    });
    if (primarySearchField) {
      resetUpdates[primarySearchField] = null;
    }
    resetUpdates['search'] = null;
    resetUpdates['q'] = null;
    setSearchValue('');
    updateQueryParams(resetUpdates);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(event) =>
            setSearchValue(event.target.value)
          }
          className="h-8 w-[200px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
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
