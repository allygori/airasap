'use client';

import { ComponentProps, useState } from 'react';
import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  // FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FieldInfo } from '../partials/field-info';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type PasswordFieldProps = ComponentProps<'input'> & {
  label?: string;
  description?: string;
  // props: ComponentProps<"input">;
};

export function PasswordField({
  label,
  description,
  disabled,
  className,
  ...props
}: PasswordFieldProps) {
  const field = useFieldContext<string>();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;
  // const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field
      data-invalid={isInvalid}
      className={cn(
        className,
        disabled ? 'cursor-not-allowed' : ''
      )}
    >
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onChange={(e) => {
            setPassword(e.target.value);
            field.handleChange(e.target.value);
          }}
          onBlur={field.handleBlur}
          placeholder="••••••••"
          disabled={disabled}
          {...props}
          type={showPassword ? 'text' : 'password'}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          // disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>

      {/* <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
        type="password"
      /> */}
      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {/* {isInvalid && <FieldError errors={errors} />} */}
      {/* {isInvalid && <FieldInfo field={field} />} */}
      <FieldInfo field={field} />
    </Field>
  );
}
