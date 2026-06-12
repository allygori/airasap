'use client';

import { ComponentProps, useState, useEffect } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldGroup,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { FieldInfo } from '../partials/field-info';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type DateTimeFieldProps = ComponentProps<'input'> & {
  label?: string;
  description?: string;
};

export function DateTimeField({
  label,
  description,
  ...props
}: DateTimeFieldProps) {
  const field = useFieldContext<string | undefined>();
  const [open, setOpen] = useState(false);

  // Parse initial value from field.state.value if available
  const initialValue = field.state.value
    ? new Date(field.state.value)
    : undefined;

  const [date, setDate] = useState<Date | undefined>(
    initialValue && !isNaN(initialValue.getTime())
      ? initialValue
      : undefined
  );

  const [time, setTime] = useState<string>(
    initialValue && !isNaN(initialValue.getTime())
      ? format(initialValue, 'HH:mm:ss')
      : '10:30:00'
  );

  // Combine local state and notify form
  useEffect(() => {
    if (date && time) {
      const [hours, minutes, seconds] = time.split(':');
      const newDateTime = new Date(date);
      newDateTime.setHours(
        parseInt(hours || '0'),
        parseInt(minutes || '0'),
        parseInt(seconds || '0')
      );

      const isoString = newDateTime.toISOString();
      if (isoString !== field.state.value) {
        field.handleChange(isoString);
      }
    }
  }, [date, time]);

  return (
    <FieldGroup className="flex-row">
      <Field className="flex-1">
        <FieldLabel htmlFor={`${field.name}-date-picker`}>
          {label || 'Date'}
        </FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                id={`${field.name}-date-picker`}
                className="w-full justify-between font-normal"
              >
                {date ? format(date, 'PPP') : 'Select date'}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            }
          />
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="start"
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                }
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="flex-1">
        <FieldLabel htmlFor={`${field.name}-time-picker`}>
          Time
        </FieldLabel>
        <Input
          type="time"
          id={`${field.name}-time-picker`}
          step="1"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-background min-w-30 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          {...(props as any)}
        />
      </Field>

      {description && (
        <FieldDescription className="w-full">
          {description}
        </FieldDescription>
      )}
      <FieldInfo field={field as any} />
    </FieldGroup>
  );
}
