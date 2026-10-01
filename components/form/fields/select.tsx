'use client';

import {
  ComponentProps,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useFieldContext } from '../form.hook';
import { FieldInfo } from '../partials/field-info';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { useDebounce } from '@/hooks/use-debounce';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';

type SelectValueType = {
  label: string;
  value: string | number | boolean | object | null;
};

type RemoteDataConfig = {
  url?: string;
  resultsKey?: string; // e.g. "data" or "categories"
  valueKey?: string; // e.g. "_id" or "id"
  labelKey?: string | string[]; // e.g. "name" or ["sku", "name"]
  searchParam?: string; // e.g. "search" or "q"
  limit?: number;
};

type SelectFieldProps = Omit<
  ComponentProps<typeof Combobox>,
  'value' | 'onValueChange' | 'itemToStringValue'
> & {
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  items?: SelectValueType[];
  remote?: RemoteDataConfig;
};

export function SelectField({
  label,
  description,
  placeholder = 'Select an option...',
  items: staticItems = [],
  remote,
  disabled,
  className,
  ...props
}: SelectFieldProps) {
  const field = useFieldContext<
    string | number | boolean | object | null
  >();
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedItems, setFetchedItems] = useState<
    SelectValueType[]
  >([]);

  const debouncedSearchValue = useDebounce(
    searchValue,
    500
  );

  // Merge static items and fetched items
  const allItems = useMemo(() => {
    const combined = [...staticItems, ...fetchedItems];
    return combined.filter(
      (item, index, self) =>
        index ===
        self.findIndex((bit) => bit.value === item.value)
    );
  }, [staticItems, fetchedItems]);

  const fetchRemoteData = useCallback(
    async (search: string) => {
      if (!remote?.url) return;

      setIsLoading(true);
      try {
        const url = new URL(
          remote.url,
          window.location.origin
        );
        if (search) {
          url.searchParams.set(
            remote.searchParam || 'search',
            search
          );
        }

        if (remote?.limit) {
          url.searchParams.set(
            'limit',
            remote.limit.toString()
          );
        }

        const response = await fetch(url.toString());
        const result: unknown = await response.json();
        const rawData = remote.resultsKey
          ? getValueAtPath(result, remote.resultsKey)
          : result;
        const dataArray = getResponseArray(rawData);
        const labelKeys = Array.isArray(remote.labelKey)
          ? remote.labelKey
          : [remote.labelKey || 'label'];
        const valueKey = remote.valueKey || 'value';

        const mappedItems: SelectValueType[] =
          dataArray.flatMap((value) => {
            if (!isRecord(value)) return [];

            const label = labelKeys
              .map((key) => value[key])
              .filter(
                (part): part is string | number =>
                  typeof part === 'string' ||
                  typeof part === 'number'
              )
              .map(String)
              .filter(Boolean)
              .join(' — ');
            const itemValue =
              value[valueKey] ??
              value['_id'] ??
              value['id'];

            return [
              {
                label:
                  label ||
                  String(
                    value['name'] ||
                      value['title'] ||
                      'Unknown'
                  ),
                value: (itemValue ??
                  null) as SelectValueType['value'],
              },
            ];
          });

        setFetchedItems(mappedItems);
      } catch (error) {
        console.error('SelectField fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [remote]
  );

  // Initial fetch and fetch on debounced value change
  useEffect(() => {
    if (remote?.url) {
      fetchRemoteData(debouncedSearchValue);
    }
  }, [debouncedSearchValue, fetchRemoteData, remote?.url]);

  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;

  // Map primitive value in form state to object for Combobox
  const selectedItem = useMemo(() => {
    return (
      allItems.find(
        (item) => item.value === field.state.value
      ) ?? null
    );
  }, [allItems, field.state.value]);

  // Sync search value with selected item's label (crucial for display)
  useEffect(() => {
    if (selectedItem && !searchValue) {
      setSearchValue(selectedItem.label);
    }
  }, [selectedItem, searchValue]);

  return (
    <Field
      data-invalid={isInvalid}
      className={cn(
        className,
        disabled ? 'cursor-not-allowed' : ''
      )}
    >
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
        </FieldLabel>
      )}
      <Combobox
        items={allItems}
        itemToStringValue={(item) =>
          isRecord(item) && typeof item.label === 'string'
            ? item.label
            : ''
        }
        value={selectedItem}
        onValueChange={(item: unknown) => {
          const typedItem = item as SelectValueType | null;
          field.handleChange(typedItem?.value ?? null);
          // Also immediately update search value on selection
          if (typedItem) {
            setSearchValue(typedItem.label);
          }
        }}
        disabled={disabled}
        inputValue={searchValue}
        onInputValueChange={setSearchValue}
        {...props}
      >
        <ComboboxInput placeholder={placeholder} />
        <ComboboxContent>
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Spinner className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                Searching...
              </span>
            </div>
          )}
          {!isLoading && allItems.length === 0 && (
            <ComboboxEmpty>No items found.</ComboboxEmpty>
          )}
          <ComboboxList>
            {(item: SelectValueType) => (
              <ComboboxItem
                key={
                  item.value?.toString() ||
                  JSON.stringify(item.value)
                }
                value={item}
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldInfo field={field} />
    </Field>
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getValueAtPath(value: unknown, path: string) {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        isRecord(current) ? current[key] : undefined,
      value
    );
}

function getResponseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;
  return [];
}
