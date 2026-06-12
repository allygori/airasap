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
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox';
import { useDebounce } from '@/hooks/use-debounce';
import { Spinner } from '@/components/ui/spinner';

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

type MultiselectFieldProps = Omit<
  ComponentProps<typeof Combobox>,
  'value' | 'onValueChange' | 'multiple' | 'defaultValue'
> & {
  label?: string;
  description?: string;
  placeholder?: string;
  items?: SelectValueType[];
  remote?: RemoteDataConfig;
  defaultValue?: SelectValueType[];
  limit?: number;
};

export function MultiselectField({
  label,
  description,
  placeholder = 'Select options...',
  items: staticItems = [],
  limit = 3,
  remote,
  ...props
}: MultiselectFieldProps) {
  const field = useFieldContext<any[]>();
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
        console.error(
          'MultiselectField fetch error:',
          error
        );
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

  // Map primitive values to actual items array, correctly handling incoming DB objects
  const selectedItems = useMemo(() => {
    const val = Array.isArray(field.state.value)
      ? field.state.value
      : [];

    return val.map((v) => {
      // Check if `v` is a populated object from the database
      const isObject = v !== null && typeof v === 'object';

      // Attempt to extract the primitive value using remote keys or standard fallbacks
      const primitiveValue = isObject
        ? v[remote?.valueKey || '_id'] || v.id || v.value
        : v;

      // Try finding the item in the fetched/static list
      const found = allItems.find(
        (item) => item.value === primitiveValue
      );
      if (found) return found;

      // If item is not in list but it was an object, dynamically rebuild its label
      if (isObject) {
        const extractedLabel =
          v[remote?.labelKey || 'name'] ||
          v.title ||
          v.label ||
          String(primitiveValue);
        return {
          label: String(extractedLabel),
          value: primitiveValue,
        };
      }

      // Fallback
      return { label: String(v), value: v };
    });
  }, [allItems, field.state.value, remote]);

  return (
    <Field data-invalid={isInvalid}>
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
        </FieldLabel>
      )}
      <Combobox
        items={allItems}
        multiple
        value={selectedItems}
        onValueChange={(newItems: unknown) => {
          const typedItems = newItems as
            | SelectValueType[]
            | null;
          if (typedItems) {
            // Check if limit exceeded before updating value
            if (typedItems.length > limit) return;
            field.handleChange(
              typedItems.map((t) => t.value)
            );
          } else {
            field.handleChange([]);
          }
        }}
        inputValue={searchValue}
        onInputValueChange={setSearchValue}
        itemToStringValue={(item) =>
          typeof item === 'object' && item !== null
            ? String((item as SelectValueType).label)
            : String(item)
        }
        {...props}
      >
        <ComboboxChips>
          <ComboboxValue>
            {selectedItems.map((item, idx) => (
              // key={item.value?.toString() || JSON.stringify(item.value)}
              <ComboboxChip key={idx}>
                {item.label}
              </ComboboxChip>
            ))}
          </ComboboxValue>
          {selectedItems.length < limit && (
            <ComboboxChipsInput placeholder={placeholder} />
          )}
        </ComboboxChips>

        {selectedItems.length < limit && (
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
        )}
      </Combobox>
      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldInfo field={field} />
    </Field>
  );
}
