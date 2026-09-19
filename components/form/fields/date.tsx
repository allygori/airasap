'use client';

import {
  useMemo,
  useState,
  type ComponentProps,
} from 'react';
import {
  format,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns/locale';
import {
  Calendar03Icon,
  Cancel01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { useFieldContext } from '../form.hook';
import { FieldInfo } from '../partials/field-info';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils/ui';

export type DateFieldGranularity =
  | 'date'
  | 'month'
  | 'year';
export type DateFieldValue =
  | string
  | Date
  | null
  | undefined;

type CalendarProps = ComponentProps<typeof Calendar>;
type ButtonProps = ComponentProps<typeof Button>;
type PopoverContentProps = ComponentProps<
  typeof PopoverContent
>;
type DateFieldCalendarProps = Omit<
  CalendarProps,
  'mode' | 'selected' | 'onSelect' | 'month'
>;

export type DateFieldProps = {
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  granularity?: DateFieldGranularity;
  valueType?: 'string' | 'date';
  displayFormat?: string;
  dateFnsLocale?: DateFnsLocale;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonClassName?: string;
  popoverClassName?: string;
  calendarProps?: DateFieldCalendarProps;
  buttonProps?: Omit<
    ButtonProps,
    'children' | 'id' | 'disabled' | 'onClick'
  >;
  popoverProps?: Omit<PopoverContentProps, 'children'>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: DateFieldValue) => void;
};

const valueFormats: Record<DateFieldGranularity, string> = {
  date: 'yyyy-MM-dd',
  month: 'yyyy-MM',
  year: 'yyyy',
};

const defaultDisplayFormats: Record<
  DateFieldGranularity,
  string
> = {
  date: 'PPP',
  month: 'LLLL yyyy',
  year: 'yyyy',
};

function parseFieldValue(
  value: DateFieldValue,
  granularity: DateFieldGranularity
) {
  if (value instanceof Date) {
    return isValid(value) ? value : undefined;
  }

  if (!value) return undefined;

  const referenceDate = new Date();
  const valueFormat = valueFormats[granularity];

  try {
    const parsed = parse(value, valueFormat, referenceDate);
    if (isValid(parsed)) return parsed;
  } catch {
    // Fall back to ISO parsing for values such as an ISO datetime.
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

function normalizeDate(
  date: Date,
  granularity: DateFieldGranularity
) {
  if (granularity === 'month') return startOfMonth(date);
  if (granularity === 'year') return startOfYear(date);
  return date;
}

export function DateField({
  label,
  description,
  placeholder,
  className,
  disabled = false,
  required = false,
  clearable = true,
  granularity = 'date',
  valueType = 'string',
  displayFormat,
  dateFnsLocale,
  buttonVariant = 'outline',
  buttonSize = 'default',
  buttonClassName,
  popoverClassName,
  calendarProps,
  buttonProps,
  popoverProps,
  open: controlledOpen,
  onOpenChange,
  onValueChange,
}: DateFieldProps) {
  const field = useFieldContext<DateFieldValue>();
  const [uncontrolledOpen, setUncontrolledOpen] =
    useState(false);

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const selectedDate = useMemo(
    () => parseFieldValue(field.state.value, granularity),
    [field.state.value, granularity]
  );
  const initialMonth =
    selectedDate ?? calendarProps?.defaultMonth;
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(initialMonth ?? new Date())
  );

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    if (nextOpen) {
      setCalendarMonth(
        startOfMonth(
          selectedDate ??
            calendarProps?.defaultMonth ??
            new Date()
        )
      );
    }
    onOpenChange?.(nextOpen);
  };

  const commitValue = (date: Date | undefined) => {
    const normalizedDate = date
      ? normalizeDate(date, granularity)
      : undefined;
    const nextValue: DateFieldValue = normalizedDate
      ? valueType === 'date'
        ? normalizedDate
        : format(normalizedDate, valueFormats[granularity])
      : null;

    field.handleChange(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    commitValue(date);
    setOpen(false);
  };

  const handleMonthChange = (nextMonth: Date) => {
    setCalendarMonth(startOfMonth(nextMonth));
    calendarProps?.onMonthChange?.(nextMonth);

    if (granularity !== 'date') {
      commitValue(nextMonth);
      setOpen(false);
    }
  };

  const clearValue = () => {
    commitValue(undefined);
    setOpen(false);
  };

  const defaultPlaceholder =
    granularity === 'date'
      ? 'Select date'
      : granularity === 'month'
        ? 'Select month'
        : 'Select year';

  const formattedValue = selectedDate
    ? format(
        selectedDate,
        displayFormat ?? defaultDisplayFormats[granularity],
        { locale: dateFnsLocale }
      )
    : undefined;

  const {
    className: calendarClassName,
    classNames: calendarClassNames,
    hideNavigation,
    captionLayout,
    ...restCalendarProps
  } = calendarProps ?? {};
  const {
    className: triggerClassName,
    ...restButtonProps
  } = buttonProps ?? {};
  const {
    className: contentClassName,
    ...restPopoverProps
  } = popoverProps ?? {};

  const calendarCaptionLayout =
    captionLayout ??
    (granularity === 'year'
      ? 'dropdown-years'
      : 'dropdown');
  const isCompactCalendar = granularity !== 'date';
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field
      data-invalid={isInvalid}
      data-disabled={disabled || undefined}
      className={cn(
        className,
        disabled && 'cursor-not-allowed'
      )}
    >
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
        </FieldLabel>
      )}

      <div className="flex w-full gap-2">
        <Popover open={isOpen} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                {...restButtonProps}
                type="button"
                id={field.name}
                variant={buttonVariant}
                size={buttonSize}
                disabled={disabled}
                aria-invalid={isInvalid || undefined}
                aria-required={required || undefined}
                className={cn(
                  'min-w-0 flex-1 justify-between font-normal',
                  !formattedValue &&
                    'text-muted-foreground',
                  triggerClassName,
                  buttonClassName
                )}
                onBlur={field.handleBlur}
              >
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={2}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="truncate">
                    {formattedValue ??
                      placeholder ??
                      defaultPlaceholder}
                  </span>
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Button>
            }
          />
          <PopoverContent
            {...restPopoverProps}
            align={popoverProps?.align ?? 'start'}
            className={cn(
              'w-auto overflow-hidden p-0',
              contentClassName,
              popoverClassName
            )}
          >
            <Calendar
              {...restCalendarProps}
              mode="single"
              month={calendarMonth}
              selected={selectedDate}
              onSelect={handleSelect}
              onMonthChange={handleMonthChange}
              captionLayout={calendarCaptionLayout}
              hideNavigation={
                hideNavigation ?? isCompactCalendar
              }
              className={cn(
                calendarClassName,
                isCompactCalendar && 'pb-3'
              )}
              classNames={{
                ...calendarClassNames,
                ...(isCompactCalendar
                  ? {
                      month_grid: cn(
                        'hidden',
                        calendarClassNames?.month_grid
                      ),
                      weekdays: cn(
                        'hidden',
                        calendarClassNames?.weekdays
                      ),
                    }
                  : {}),
              }}
            />
          </PopoverContent>
        </Popover>

        {clearable && !required && formattedValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label="Clear date"
            onClick={clearValue}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="text-destructive"
            />
          </Button>
        )}
      </div>

      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldInfo field={field} />
    </Field>
  );
}
