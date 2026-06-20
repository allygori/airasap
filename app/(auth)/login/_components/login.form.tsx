'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginInput } from './login.schema';
import { Alert } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { withForm } from '@/components/form/form.hook';
import { Checkbox } from '@/components/ui/checkbox';

type LoginFormProps = {
  error?: string | null;
};

const LoginForm = withForm({
  defaultValues: {
    email: '',
    password: '',
  } as LoginInput,
  props: {
    error: null,
  } as LoginFormProps,
  render: function Render({ form, error }) {
    const [rememberMe, setRememberMe] = useState(false);

    return (
      <form
        id="signup-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        {error && (
          <Alert className="bg-destructive/10 text-destructive border-destructive/20 rounded-md">
            <p className="text-sm font-medium">{error}</p>
          </Alert>
        )}

        <FieldGroup className="gap-5">
          <form.AppField
            name="email"
            children={(field) => {
              return (
                <field.TextField
                  label="Email"
                  placeholder="nama@email.com"
                />
              );
            }}
          />

          <form.AppField
            name="password"
            children={(field) => {
              return (
                <field.PasswordField
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                />
              );
            }}
          />

          {/* <form.AppField
            name="confirmPassword"
            children={(field) => {
              return (
                <field.TextField
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                />
              );
            }}
          /> */}
        </FieldGroup>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setRememberMe(checked === true)
              }
              // disabled={isLoading}
            />
            <label
              htmlFor="remember"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ingat saya
            </label>
          </div>
          {/* <Link
            href="/register"
            className="text-primary hover:text-primary/80 text-sm leading-none font-medium transition-colors"
          >
            Lupa Password?
          </Link> */}
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary/80 text-xs underline-offset-4 hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <div className="mt-2 flex flex-col gap-4">
          <form.AppForm>
            <form.SubmitButton
              text="Masuk"
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            />
          </form.AppForm>
        </div>
      </form>
    );
  },
});

export default LoginForm;
