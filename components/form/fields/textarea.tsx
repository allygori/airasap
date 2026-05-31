import { ComponentProps } from 'react';
// import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  // FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { FieldInfo } from '../partials/field-info';

type TextareaFieldProps = ComponentProps<'textarea'> & {
  label?: string;
  description?: string;
};

export function TextareaField({
  label,
  description,
  ...props
}: TextareaFieldProps) {
  const field = useFieldContext<string>();

  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;
  // const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {/* {isInvalid && <FieldError errors={errors} />} */}
      <FieldInfo field={field} />
    </Field>
  );
}
