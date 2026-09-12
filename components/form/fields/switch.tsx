import { ComponentProps } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { FieldInfo } from '../partials/field-info';
import { cn } from '@/lib/utils/ui';

type SwitchFieldProps = Omit<
  ComponentProps<typeof Switch>,
  'className'
> & {
  label?: string;
  description?: string;
  className?: string;
};

export function SwitchField({
  label,
  description,
  className,
  disabled,
  ...props
}: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      data-disabled={disabled}
      className={cn(className, 'flex flex-col items-start')}
    >
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

      <Switch
        id={field.name}
        name={field.name}
        checked={Boolean(field.state.value)}
        onCheckedChange={(checked) =>
          field.handleChange(checked)
        }
        onBlur={field.handleBlur}
        disabled={disabled}
        aria-invalid={isInvalid}
        {...props}
      />
      {/* <FieldContent> */}
      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldInfo field={field} />
      {/* </FieldContent> */}
    </Field>
  );
}
