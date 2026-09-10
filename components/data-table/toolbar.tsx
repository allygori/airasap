'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollectionViewOptions } from './view-options';

type CollectionToolbarProps<TData> = {
  table: Table<TData>;
  searchFields?: string[];
  searchOptions?: {
    label: string;
    value: string;
  }[];
  primarySearchField?: string;
  placeholder?: string;
  filters?: (args: {
    pendingFilters: Record<string, string>;
    setPendingFilters: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >;
  }) => React.ReactNode;
  updateQueryParams: (
    updates: Record<string, string | null | undefined>
  ) => void;
};

export function CollectionToolbar<TData>({
  table,
  searchFields,
  searchOptions,
  primarySearchField,
  placeholder = 'Search...',
  filters,
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
    return (
      (table
        .getState()
        .columnFilters.find(
          (filter) => filter.id === 'search'
        )?.value as string) ??
      (table.getState().globalFilter as string) ??
      ''
    );
  }, [table, primarySearchField]);

  const [searchValue, setSearchValue] = React.useState(
    getExternalValue()
  );
  const externalValue = getExternalValue();
  const [pendingFilters, setPendingFilters] =
    React.useState<Record<string, string>>({});
  const activeSearchOptions = React.useMemo(() => {
    if (searchOptions?.length) return searchOptions;

    return (searchFields || []).map((field) => ({
      label: field,
      value: field,
    }));
  }, [searchFields, searchOptions]);
  const hasDraftSearchField =
    Object.prototype.hasOwnProperty.call(
      pendingFilters,
      'search_field'
    );
  const selectedSearchField =
    (hasDraftSearchField
      ? pendingFilters.search_field
      : undefined) ||
    primarySearchField ||
    activeSearchOptions[0]?.value ||
    '';
  const selectedSearchOption =
    activeSearchOptions.find(
      (option) => option.value === selectedSearchField
    ) || activeSearchOptions[0];

  React.useEffect(() => {
    setSearchValue(externalValue);
  }, [externalValue]);

  const columnFilters = table.getState().columnFilters;

  React.useEffect(() => {
    const nextFilters: Record<string, string> = {};
    columnFilters.forEach((filter) => {
      if (typeof filter.value === 'string') {
        nextFilters[filter.id] = filter.value;
      }
    });

    setPendingFilters(nextFilters);
  }, [columnFilters]);

  const hasPendingFilters =
    Object.values(pendingFilters).some(Boolean);
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter ||
    !!searchValue ||
    hasPendingFilters;

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
    resetUpdates['search_field'] = null;
    setSearchValue('');
    setPendingFilters({});
    updateQueryParams(resetUpdates);
  };

  const handleApply = () => {
    if (primarySearchField) {
      updateQueryParams({
        ...pendingFilters,
        [primarySearchField]: searchValue || null,
      });
      return;
    }

    updateQueryParams({
      ...pendingFilters,
      search: searchValue || null,
      search_field: searchValue
        ? selectedSearchOption?.value
        : null,
    });
  };

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-md border p-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="border-input bg-background flex h-10 min-w-0 overflow-hidden rounded-md border lg:w-[28rem]">
            {activeSearchOptions.length > 0 && (
              <Select
                value={selectedSearchOption?.value}
                onValueChange={(value) => {
                  setPendingFilters((current) => ({
                    ...current,
                    search_field: value || '',
                  }));
                }}
              >
                <SelectTrigger className="h-full w-[9.5rem] rounded-none border-0 border-r data-[size=default]:h-10">
                  <SelectValue>
                    {selectedSearchOption?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {activeSearchOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              className="h-full min-w-0 flex-1 rounded-none border-0 focus-visible:ring-0"
            />
          </div>

          {filters?.({
            pendingFilters,
            setPendingFilters,
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={handleApply} className="h-10">
            <Search data-icon="inline-start" />
            Terapkan
          </Button>
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-10 px-2 lg:px-3"
            >
              Reset
              <X data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <CollectionViewOptions table={table} />
      </div>
    </div>
  );
}
