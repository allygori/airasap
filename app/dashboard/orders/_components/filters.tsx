'use client';

import * as React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';

import { useAppForm } from '@/components/form/form.hook';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SHOPEE_ORDER_STATUS_LABEL_VALUE } from '@/constant/order/shopee/status';

type OrderListFiltersProps = {
  pendingFilters: Record<string, string>;
  setPendingFilters: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
};

type DateRangePresetValue = DateRange & {
  mode?: string;
};

const parseDateParam = (value: string | null) => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

export function OrderListFilters({
  pendingFilters,
  setPendingFilters,
}: OrderListFiltersProps) {
  const searchParams = useSearchParams();
  const hasDraftDateFrom =
    Object.prototype.hasOwnProperty.call(
      pendingFilters,
      'date_from'
    );
  const hasDraftDateTo =
    Object.prototype.hasOwnProperty.call(
      pendingFilters,
      'date_to'
    );
  const hasDraftDateMode =
    Object.prototype.hasOwnProperty.call(
      pendingFilters,
      'date_mode'
    );
  const hasDraftStatus =
    Object.prototype.hasOwnProperty.call(
      pendingFilters,
      'status'
    );

  const dateFrom = parseDateParam(
    hasDraftDateFrom
      ? pendingFilters.date_from
      : searchParams.get('date_from')
  );
  const dateTo = parseDateParam(
    hasDraftDateTo
      ? pendingFilters.date_to
      : searchParams.get('date_to')
  );
  const dateMode =
    (hasDraftDateMode
      ? pendingFilters.date_mode
      : searchParams.get('date_mode')) || 'range';
  const appliedDateKey = `${searchParams.get('date_from') || 'empty'}-${searchParams.get('date_to') || 'empty'}-${searchParams.get('date_mode') || 'range'}`;

  const form = useAppForm({
    defaultValues: {
      date:
        dateFrom || dateTo
          ? {
              from: dateFrom,
              to: dateTo,
              mode: dateMode,
            }
          : undefined,
    } as { date?: DateRangePresetValue },
  });

  const selectedStatus =
    (hasDraftStatus
      ? pendingFilters.status
      : searchParams.get('status')) || 'all';
  const selectedStatusLabel =
    selectedStatus === 'all'
      ? 'Semua Status'
      : SHOPEE_ORDER_STATUS_LABEL_VALUE.find(
          (status) => status.value === selectedStatus
        )?.label || 'Semua Status';

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
      <div className="border-input bg-background flex h-10 min-w-0 items-center gap-2 rounded-md border px-2 sm:w-[22rem]">
        <form.AppField key={appliedDateKey} name="date">
          {(field) => (
            <field.DateRangePresetsField
              placeholder="Filter tanggal order"
              className="min-w-0"
              onValueChange={(value) => {
                setPendingFilters((current) => ({
                  ...current,
                  date_from: value?.from
                    ? format(value.from, 'yyyy-MM-dd')
                    : '',
                  date_to: value?.to
                    ? format(value.to, 'yyyy-MM-dd')
                    : '',
                  date_mode: value?.mode || '',
                }));
              }}
            />
          )}
        </form.AppField>
      </div>

      <Select
        value={selectedStatus}
        onValueChange={(value) => {
          const nextValue = value || 'all';
          setPendingFilters((current) => ({
            ...current,
            status: nextValue === 'all' ? '' : nextValue,
          }));
        }}
      >
        <SelectTrigger className="h-10 w-full data-[size=default]:h-10 sm:w-[11rem]">
          <SelectValue>{selectedStatusLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            <SelectItem value="all">
              Semua Status
            </SelectItem>
            {SHOPEE_ORDER_STATUS_LABEL_VALUE.map(
              (status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </SelectItem>
              )
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
