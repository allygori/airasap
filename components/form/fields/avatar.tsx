'use client';
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

import { useState, useRef } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

type AvatarFieldProps = ComponentProps<'input'> & {
  label?: string;
  description?: string;
};

export function AvatarField({
  label,
  description,
  ...props
}: AvatarFieldProps) {
  const field = useFieldContext<string>();
  const [avatar, setAvatar] = useState<string | null>(
    '/placeholder-user.jpg'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid;
  // const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

      <div className="flex flex-col items-center gap-4">
        <div className="group relative">
          <Avatar
            className="border-muted h-24 w-24 cursor-pointer border-2"
            onClick={triggerFileInput}
          >
            <AvatarImage
              src={avatar || ''}
              alt="Profile Avatar"
              className="object-cover"
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>

          {/* Hover overlay for uploading */}
          <div
            onClick={triggerFileInput}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Camera className="h-6 w-6" />
          </div>
        </div>

        {/* <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        /> */}

        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          // onChange={(e) => field.handleChange(e.target.value)}
          // onBlur={field.handleBlur}
          onChange={handleImageChange}
          {...props}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
        >
          Change Avatar
        </Button>
      </div>

      {/* <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
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
