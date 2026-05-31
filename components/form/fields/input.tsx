import { ComponentProps } from 'react';
// import { useStore } from '@tanstack/react-form'`
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  // FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FieldInfo } from '../partials/field-info';

type InputFieldProps = ComponentProps<'input'> & {
  label?: string;
  description?: string;
  // props: ComponentProps<"input">;
};

// function FieldInfo({ field }: { field: AnyFieldApi }) {
//   return (
//     <>
//       {field.state.meta.isTouched && !field.state.meta.isValid
//         ? field.state.meta.errors.map((err) => (
//             <FieldError key={err.message} errors={err.message} />
//             // <em key={err.message}>{err.message}</em>
//           ))
//         : null}
//       {field.state.meta.isValidating ? 'Validating...' : null}
//     </>
//   )
// }

export function InputField({
  label,
  description,
  ...props
}: InputFieldProps) {
  const field = useFieldContext<string>();

  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;
  // const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
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
      {/* {isInvalid && <FieldInfo field={field} />} */}
      <FieldInfo field={field} />
    </Field>
  );
}
