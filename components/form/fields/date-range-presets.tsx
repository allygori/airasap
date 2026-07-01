'use client';

import { ComponentProps, useState } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { FieldInfo } from '../partials/field-info';
import {
  subDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getYear,
} from 'date-fns';
import {
  CalendarIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateRangePresetsFieldProps =
  ComponentProps<'input'> & {
    label?: string;
    description?: string;
  };

export function DateRangePresetsField({
  label,
  description,
  placeholder,
  className,
  ...props
}: DateRangePresetsFieldProps) {
  const field = useFieldContext<DateRange | undefined>();
  const [open, setOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<
    'day' | 'week' | 'month' | 'range'
  >('range');

  const value = field.state.value;

  const [currentYear, setCurrentYear] = useState<number>(
    () => {
      return value?.from
        ? getYear(value.from)
        : getYear(new Date());
    }
  );

  const presets = [
    {
      label: 'Hari Ini',
      value: {
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      },
      mode: 'day' as const,
    },
    {
      label: '7 Hari Terakhir',
      value: {
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
      },
      mode: 'range' as const,
    },
    {
      label: '30 Hari Terakhir',
      value: {
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
      },
      mode: 'range' as const,
    },

    {
      label: 'Per Minggu',
      value: {
        from: startOfWeek(new Date(), {
          weekStartsOn: 1,
        }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
      mode: 'week' as const,
    },
    {
      label: 'Per Bulan',
      value: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
      mode: 'month' as const,
    },
  ];

  return (
    <Field className={cn('w-full', className)}>
      {label && (
        <FieldLabel htmlFor={`${field.name}`}>
          {label}
        </FieldLabel>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              id={`${field.name}`}
              className={cn(
                'w-full justify-between text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="text-muted-foreground h-4 w-4 font-light" />
                {value?.from ? (
                  value.to ? (
                    <>
                      {format(value.from, 'dd.LL.y')} -{' '}
                      {format(value.to, 'dd.LL.y')}
                    </>
                  ) : (
                    format(value.from, 'LLL dd, y')
                  )
                ) : (
                  <span>{placeholder}</span>
                )}
              </span>
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          }
        />
        <PopoverContent
          className="flex w-auto flex-col overflow-hidden p-0"
          align="start"
        >
          {/* Tabs for Selection Mode */}
          {/* <div className="bg-muted/10 flex items-center justify-between gap-1 border-b p-1.5">
            <span className="text-muted-foreground px-2 text-[10px] font-bold tracking-wider uppercase">
              Mode
            </span>
            <div className="bg-muted/40 flex gap-0.5 rounded-md p-0.5">
              {(
                [
                  { id: 'day', label: 'Hari' },
                  { id: 'week', label: 'Minggu' },
                  { id: 'month', label: 'Bulan' },
                  { id: 'range', label: 'Range' },
                ] as const
              ).map((modeOption) => (
                <Button
                  key={modeOption.id}
                  variant={
                    selectionMode === modeOption.id
                      ? 'secondary'
                      : 'ghost'
                  }
                  className="h-6 px-2 text-[11px] font-medium"
                  onClick={() => {
                    setSelectionMode(modeOption.id);
                  }}
                >
                  {modeOption.label}
                </Button>
              ))}
            </div>
          </div> */}

          <div className="flex flex-row">
            {/* Sidebar for Predefined Ranges */}
            <div className="bg-muted/20 flex w-[140px] flex-col gap-1 border-r p-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="h-8 justify-start text-xs font-normal"
                  onClick={() => {
                    field.handleChange(preset.value);
                    setSelectionMode(preset.mode);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar / Month Picker */}
            {selectionMode === 'month' ? (
              <div className="flex w-[280px] flex-col p-3">
                {/* Year Navigation */}
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setCurrentYear((y) => y - 1)
                    }
                  >
                    &lt;
                  </Button>
                  <span className="text-sm font-semibold">
                    {currentYear}
                  </span>
                  <Button
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setCurrentYear((y) => y + 1)
                    }
                  >
                    &gt;
                  </Button>
                </div>
                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ].map((monthLabel, idx) => {
                    const monthDate = new Date(
                      currentYear,
                      idx,
                      1
                    );
                    const isSelected =
                      value?.from &&
                      value?.to &&
                      format(value.from, 'yyyy-MM') ===
                        format(monthDate, 'yyyy-MM') &&
                      format(value.to, 'yyyy-MM') ===
                        format(monthDate, 'yyyy-MM');

                    return (
                      <Button
                        key={monthLabel}
                        variant={
                          isSelected ? 'default' : 'outline'
                        }
                        className="h-9 text-xs"
                        onClick={() => {
                          const start =
                            startOfMonth(monthDate);
                          const end = endOfMonth(monthDate);
                          field.handleChange({
                            from: start,
                            to: end,
                          });
                        }}
                      >
                        {monthLabel}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-1">
                <Calendar
                  mode="range"
                  defaultMonth={value?.from}
                  selected={value}
                  onSelect={(selectedRange) => {
                    if (selectionMode === 'day') {
                      if (selectedRange?.from) {
                        field.handleChange({
                          from: startOfDay(
                            selectedRange.from
                          ),
                          to: endOfDay(selectedRange.from),
                        });
                      }
                    } else if (selectionMode === 'week') {
                      if (selectedRange?.from) {
                        field.handleChange({
                          from: startOfWeek(
                            selectedRange.from,
                            { weekStartsOn: 1 }
                          ),
                          to: endOfWeek(
                            selectedRange.from,
                            { weekStartsOn: 1 }
                          ),
                        });
                      }
                    } else {
                      field.handleChange(selectedRange);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                  endMonth={new Date()}
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {description && (
        <FieldDescription className="w-full">
          {description}
        </FieldDescription>
      )}
      <FieldInfo field={field} />
    </Field>
  );
}
