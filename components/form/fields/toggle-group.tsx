import type { ComponentProps } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { FieldInfo } from '../partials/field-info';
import { cn } from '@/lib/utils/ui';

type ToggleGroupOption = {
  label: string;
  value: string;
};

type ToggleGroupFieldProps = Omit<
  ComponentProps<typeof ToggleGroup>,
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'multiple'
  | 'children'
> & {
  label?: string;
  description?: string;
  groupClassName?: string;
  items: readonly ToggleGroupOption[];
};

export function ToggleGroupField({
  label,
  description,
  groupClassName,
  items,
  className,
  disabled,
  ...props
}: ToggleGroupFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;
  const labelId = `${field.name}-label`;

  return (
    <Field
      data-invalid={isInvalid}
      data-disabled={disabled || undefined}
      className={cn(
        className,
        disabled && 'cursor-not-allowed'
      )}
    >
      {label ? (
        <FieldLabel id={labelId}>{label}</FieldLabel>
      ) : null}
      <ToggleGroup
        {...props}
        multiple={false}
        value={field.state.value ? [field.state.value] : []}
        onValueChange={(values) => {
          const nextValue = values[0];
          if (nextValue !== undefined) {
            field.handleChange(nextValue);
          }
        }}
        onBlur={field.handleBlur}
        disabled={disabled}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={isInvalid || undefined}
        className={cn('flex-wrap', groupClassName)}
      >
        {items.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            disabled={disabled}
          >
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {description ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      <FieldInfo field={field} />
    </Field>
  );
}
