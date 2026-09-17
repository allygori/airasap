import { ComponentProps } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { FieldInfo } from '../partials/field-info';
import { cn } from '@/lib/utils/ui';

type MoneyFieldProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange'
> & {
  label?: string;
  description?: string;
  suffix?: string;
};

export function MoneyField({
  label,
  description,
  suffix = 'IDR',
  className,
  disabled,
  ...props
}: MoneyFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field
      data-invalid={isInvalid}
      data-disabled={disabled}
      className={cn(
        className,
        disabled && 'cursor-not-allowed'
      )}
    >
      {label ? (
        <FieldLabel htmlFor={field.name}>
          {label}
        </FieldLabel>
      ) : null}
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={field.name}
          name={field.name}
          value={field.state.value ?? ''}
          onChange={(event) =>
            field.handleChange(event.target.value)
          }
          onBlur={field.handleBlur}
          disabled={disabled}
          aria-invalid={isInvalid}
          {...props}
        />
      </InputGroup>
      {description ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      <FieldInfo field={field} />
    </Field>
  );
}
