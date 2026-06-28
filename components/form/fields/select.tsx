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
import { cn } from '@/lib/utils';

type SelectValueType = {
  label: string;
  value: string | number | boolean | object | null;
};

type RemoteDataConfig = {
  url?: string;
  resultsKey?: string; // e.g. "data" or "categories"
  valueKey?: string; // e.g. "_id" or "id"
  labelKey?: string; // e.g. "name" or "title"
  searchParam?: string; // e.g. "search" or "q"
  limit?: number;
};

type SelectFieldProps = Omit<
  ComponentProps<typeof Combobox>,
  'value' | 'onValueChange'
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
        const result = await response.json();

        const rawData = remote.resultsKey
          ? result[remote.resultsKey]
          : result;
        const dataArray = Array.isArray(rawData)
          ? rawData
          : rawData?.data || [];

        const mappedItems: SelectValueType[] =
          dataArray.map((item: Record<string, unknown>) => {
            const labelKey = remote?.labelKey || 'label';
            const valueKey = remote?.valueKey || 'value';

            return {
              label: String(
                item[labelKey] ||
                  item['name'] ||
                  item['title'] ||
                  'Unknown'
              ),
              value: (item[valueKey] ||
                item['_id'] ||
                item['id']) as SelectValueType['value'],
            };
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
