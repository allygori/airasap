import { ComponentProps } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { FieldInfo } from '../partials/field-info';
import { cn } from '@/lib/utils/ui';

type StringArrayFieldProps = ComponentProps<'textarea'> & {
  label?: string;
  description?: string;
};

export function StringArrayField({
  label,
  description,
  className,
  ...props
}: StringArrayFieldProps) {
  const field = useFieldContext<string[]>();
  const value = Array.isArray(field.state.value)
    ? field.state.value
    : [];
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field
      data-invalid={isInvalid}
      className={cn(
        className,
        props.disabled ? 'cursor-not-allowed' : ''
      )}
    >
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={value.join('\n')}
        onChange={(event) =>
          field.handleChange(
            event.target.value
              .split('\n')
              .map((item) => item.trim())
              .filter(Boolean)
          )
        }
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        {...props}
      />
      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldInfo field={field} />
    </Field>
  );
}
