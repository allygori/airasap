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
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
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
import { cn } from '@/lib/utils/ui';

type DateRangePresetMode =
  | 'today'
  | 'yesterday'
  | '7-days'
  | '30-days'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannually'
  | 'annually'
  | 'range';

type DateRangePresetValue = DateRange & {
  mode?: DateRangePresetMode;
};

type PresetOption = {
  label: string;
  mode: DateRangePresetMode;
  value: DateRangePresetValue;
};

type DateRangePresetsFieldProps =
  ComponentProps<'input'> & {
    label?: string;
    description?: string;
    onValueChange?: (
      value: DateRangePresetValue | undefined
    ) => void;
  };

const modeLabels: Record<DateRangePresetMode, string> = {
  today: 'Hari Ini',
  yesterday: 'Kemarin',
  '7-days': '7 Hari Terakhir',
  '30-days': '30 Hari Terakhir',
  daily: 'Per Hari',
  weekly: 'Per Minggu',
  monthly: 'Per Bulan',
  quarterly: 'Per Quarter',
  semiannually: 'Per Semester',
  annually: 'Per Tahun',
  range: 'Free Range',
};

const monthLabels = [
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
];

const quarters = [
  { label: 'Q1', month: 0 },
  { label: 'Q2', month: 3 },
  { label: 'Q3', month: 6 },
  { label: 'Q4', month: 9 },
];

const semesters = [
  { label: 'S1', fromMonth: 0, toMonth: 5 },
  { label: 'S2', fromMonth: 6, toMonth: 11 },
];

const yearOffsets = [-3, -2, -1, 0, 1, 2];

const createSemesterRange = (
  year: number,
  fromMonth: number,
  toMonth: number
) => ({
  from: startOfDay(new Date(year, fromMonth, 1)),
  to: endOfDay(new Date(year, toMonth + 1, 0)),
});

export function DateRangePresetsField({
  label,
  description,
  placeholder,
  className,
  onValueChange,
  ...props
}: DateRangePresetsFieldProps) {
  const field = useFieldContext<
    DateRangePresetValue | undefined
  >();
  const [open, setOpen] = useState(false);

  const value = field.state.value;
  const selectionMode = value?.mode || 'range';
  const selectedModeLabel = modeLabels[selectionMode];

  const [currentYear, setCurrentYear] = useState<number>(
    () => {
      return value?.from
        ? getYear(value.from)
        : getYear(new Date());
    }
  );

  const handleChange = (
    nextValue: DateRange | undefined,
    mode: DateRangePresetMode
  ) => {
    const value = nextValue
      ? {
          ...nextValue,
          mode,
        }
      : undefined;

    field.handleChange(value);
    onValueChange?.(value);
  };

  const today = new Date();
  const currentSemester =
    today.getMonth() < 6
      ? createSemesterRange(getYear(today), 0, 5)
      : createSemesterRange(getYear(today), 6, 11);

  const quickPresets: PresetOption[] = [
    {
      label: 'Hari Ini',
      value: {
        from: startOfDay(today),
        to: endOfDay(today),
        mode: 'today',
      },
      mode: 'today',
    },
    {
      label: 'Kemarin',
      value: {
        from: startOfDay(subDays(today, 1)),
        to: endOfDay(subDays(today, 1)),
        mode: 'yesterday',
      },
      mode: 'yesterday',
    },
    {
      label: '7 Hari Terakhir',
      value: {
        from: startOfDay(subDays(today, 6)),
        to: endOfDay(today),
        mode: '7-days',
      },
      mode: '7-days',
    },
    {
      label: '30 Hari Terakhir',
      value: {
        from: startOfDay(subDays(today, 29)),
        to: endOfDay(today),
        mode: '30-days',
      },
      mode: '30-days',
    },
    {
      label: 'Free Range',
      value: {
        from: value?.from,
        to: value?.to,
        mode: 'range',
      },
      mode: 'range',
    },
  ];

  const periodPresets: PresetOption[] = [
    {
      label: 'Per Hari',
      value: {
        from: startOfDay(today),
        to: endOfDay(today),
        mode: 'daily',
      },
      mode: 'daily',
    },
    {
      label: 'Per Minggu',
      value: {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
        mode: 'weekly',
      },
      mode: 'weekly',
    },
    {
      label: 'Per Bulan',
      value: {
        from: startOfMonth(today),
        to: endOfMonth(today),
        mode: 'monthly',
      },
      mode: 'monthly',
    },
    {
      label: 'Per Quarter',
      value: {
        from: startOfQuarter(today),
        to: endOfQuarter(today),
        mode: 'quarterly',
      },
      mode: 'quarterly',
    },
    {
      label: 'Per Semester',
      value: {
        ...currentSemester,
        mode: 'semiannually',
      },
      mode: 'semiannually',
    },
    {
      label: 'Per Tahun',
      value: {
        from: startOfYear(today),
        to: endOfYear(today),
        mode: 'annually',
      },
      mode: 'annually',
    },
  ];

  return (
    <Field className={cn('w-full', className)}>
      {label && (
        <FieldLabel htmlFor={`${field.name}`}>
          {/* {label} */}
        </FieldLabel>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              id={`${field.name}`}
              className={cn(
                'w-full justify-between gap-2 text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <CalendarIcon className="text-muted-foreground h-4 w-4 shrink-0 font-light" />
                {value?.from ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0">
                      Periode:{' '}
                      <strong className="font-medium">
                        {selectedModeLabel}
                      </strong>
                    </span>
                    <span className="text-muted-foreground truncate">
                      {value.to
                        ? `${format(value.from, 'dd.LL.y')} - ${format(
                            value.to,
                            'dd.LL.y'
                          )}`
                        : format(value.from, 'LLL dd, y')}
                    </span>
                  </span>
                ) : (
                  <span className="truncate">
                    {placeholder}
                  </span>
                )}
              </span>
              <ChevronDownIcon
                className="shrink-0"
                data-icon="inline-end"
              />

              {/* <CalendarIcon className="text-muted-foreground h-4 w-4 shrink-0 font-light" /> */}
            </Button>
          }
        />
        <PopoverContent
          className="flex w-[max(var(--anchor-width),26.25rem)] max-w-(--available-width) flex-col overflow-hidden p-0"
          align="start"
        >
          <div className="flex min-w-0 flex-row">
            <div className="bg-muted/20 flex w-[8.75rem] shrink-0 flex-col gap-1 border-r p-2">
              {quickPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    selectionMode === preset.mode
                      ? 'secondary'
                      : 'ghost'
                  }
                  className="h-8 w-full justify-start truncate px-2 text-xs font-normal"
                  onClick={() => {
                    handleChange(preset.value, preset.mode);
                  }}
                >
                  <span className="truncate">
                    {preset.label}
                  </span>
                </Button>
              ))}
              <div className="bg-border my-1 h-px" />
              {periodPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    selectionMode === preset.mode
                      ? 'secondary'
                      : 'ghost'
                  }
                  className="h-8 w-full justify-start truncate px-2 text-xs font-normal"
                  onClick={() => {
                    handleChange(preset.value, preset.mode);
                  }}
                >
                  <span className="truncate">
                    {preset.label}
                  </span>
                </Button>
              ))}
            </div>

            {selectionMode === 'monthly' ||
            selectionMode === 'quarterly' ||
            selectionMode === 'semiannually' ||
            selectionMode === 'annually' ? (
              <div className="flex min-w-[12rem] flex-1 flex-col p-3">
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setCurrentYear((year) => year - 1)
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
                      setCurrentYear((year) => year + 1)
                    }
                  >
                    &gt;
                  </Button>
                </div>

                {selectionMode === 'monthly' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {monthLabels.map((monthLabel, idx) => {
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
                            isSelected
                              ? 'default'
                              : 'outline'
                          }
                          className="h-9 text-xs"
                          onClick={() => {
                            handleChange(
                              {
                                from: startOfMonth(
                                  monthDate
                                ),
                                to: endOfMonth(monthDate),
                              },
                              'monthly'
                            );
                          }}
                        >
                          {monthLabel}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}

                {selectionMode === 'quarterly' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {quarters.map((quarter) => {
                      const quarterDate = new Date(
                        currentYear,
                        quarter.month,
                        1
                      );
                      const isSelected =
                        value?.from &&
                        format(value.from, 'yyyy-MM') ===
                          format(quarterDate, 'yyyy-MM');

                      return (
                        <Button
                          key={quarter.label}
                          variant={
                            isSelected
                              ? 'default'
                              : 'outline'
                          }
                          className="h-9 text-xs"
                          onClick={() => {
                            handleChange(
                              {
                                from: startOfQuarter(
                                  quarterDate
                                ),
                                to: endOfQuarter(
                                  quarterDate
                                ),
                              },
                              'quarterly'
                            );
                          }}
                        >
                          {quarter.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}

                {selectionMode === 'semiannually' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {semesters.map((semester) => {
                      const range = createSemesterRange(
                        currentYear,
                        semester.fromMonth,
                        semester.toMonth
                      );
                      const isSelected =
                        value?.from &&
                        format(value.from, 'yyyy-MM') ===
                          format(range.from, 'yyyy-MM');

                      return (
                        <Button
                          key={semester.label}
                          variant={
                            isSelected
                              ? 'default'
                              : 'outline'
                          }
                          className="h-9 text-xs"
                          onClick={() => {
                            handleChange(
                              range,
                              'semiannually'
                            );
                          }}
                        >
                          {semester.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}

                {selectionMode === 'annually' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {yearOffsets.map((offset) => {
                      const year = currentYear + offset;
                      const yearDate = new Date(year, 0, 1);
                      const isSelected =
                        value?.from &&
                        getYear(value.from) === year;

                      return (
                        <Button
                          key={year}
                          variant={
                            isSelected
                              ? 'default'
                              : 'outline'
                          }
                          className="h-9 text-xs"
                          onClick={() => {
                            handleChange(
                              {
                                from: startOfYear(yearDate),
                                to: endOfYear(yearDate),
                              },
                              'annually'
                            );
                          }}
                        >
                          {year}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : selectionMode === 'today' ||
              selectionMode === 'daily' ||
              selectionMode === 'yesterday' ? (
              <div className="min-w-[17.5rem] flex-1 p-1">
                <Calendar
                  mode="single"
                  defaultMonth={value?.from}
                  selected={value?.from}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      handleChange(
                        {
                          from: startOfDay(selectedDate),
                          to: endOfDay(selectedDate),
                        },
                        selectionMode
                      );
                    }
                  }}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                  endMonth={new Date()}
                />
              </div>
            ) : (
              <div className="min-w-[17.5rem] flex-1 p-1">
                <Calendar
                  mode="range"
                  defaultMonth={value?.from}
                  selected={value}
                  onSelect={(selectedRange) => {
                    if (selectionMode === 'weekly') {
                      if (selectedRange?.from) {
                        handleChange(
                          {
                            from: startOfWeek(
                              selectedRange.from,
                              { weekStartsOn: 1 }
                            ),
                            to: endOfWeek(
                              selectedRange.from,
                              { weekStartsOn: 1 }
                            ),
                          },
                          'weekly'
                        );
                      }
                    } else {
                      handleChange(selectedRange, 'range');
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
