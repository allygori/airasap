'use client';

import { Alert } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { withForm } from '@/components/form/form.hook';
import { type ZodLoginInput } from './login.schema';

type FormProps = {
  error?: string | null;
};

const LoginForm = withForm({
  defaultValues: {
    email: '',
    password: '',
  } as ZodLoginInput,
  props: {
    error: null,
  } as FormProps,
  render: function Render({ form, error }) {
    return (
      <form
        id="login-form"
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
                  placeholder="username@example.com"
                />
              );
            }}
          />

          <form.AppField
            name="password"
            children={(field) => {
              return (
                <field.TextField
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                />
              );
            }}
          />
        </FieldGroup>

        <div className="mt-2 flex flex-col gap-4">
          <form.AppForm>
            <form.SubmitButton
              text="Sign In"
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            />
          </form.AppForm>
        </div>
      </form>
    );
  },
});

export default LoginForm;
