'use client';

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AccountingScopeOptions = {
  stores: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
  platforms: string[];
};

export default function AccountingScopeFilters({
  options,
  storeId,
  platform,
  onStoreChange,
  onPlatformChange,
  disabled = false,
}: {
  options: AccountingScopeOptions;
  storeId: string;
  platform: string;
  onStoreChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <FieldGroup className="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="accounting-store-filter">
          Store / workspace
        </FieldLabel>
        <Select
          value={storeId || 'all'}
          onValueChange={(value) =>
            onStoreChange(value || 'all')
          }
          disabled={disabled}
        >
          <SelectTrigger
            id="accounting-store-filter"
            className="w-full"
            aria-label="Filter store atau workspace"
          >
            <SelectValue placeholder="Semua store" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">
                Semua store
              </SelectItem>
              {options.stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  <span>{store.name}</span>
                  {store.code ? (
                    <span className="text-muted-foreground text-xs">
                      {store.code}
                    </span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>
          Default menampilkan seluruh store dalam
          organization.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="accounting-platform-filter">
          Platform
        </FieldLabel>
        <Select
          value={platform || 'all'}
          onValueChange={(value) =>
            onPlatformChange(value || 'all')
          }
          disabled={disabled}
        >
          <SelectTrigger
            id="accounting-platform-filter"
            className="w-full"
            aria-label="Filter platform"
          >
            <SelectValue placeholder="Semua platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">
                Semua platform
              </SelectItem>
              {options.platforms.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>
          Filter berdasarkan dimensi platform pada posting.
        </FieldDescription>
      </Field>
    </FieldGroup>
  );
}
