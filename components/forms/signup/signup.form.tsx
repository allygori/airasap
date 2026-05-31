'use client';

import { Alert } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { withForm } from '@/components/form/form.hook';
import { ZodSignupInput } from './signup.schema';

type FormProps = {
  error?: string | null;
};

const SignupForm = withForm({
  defaultValues: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  } as ZodSignupInput,
  props: {
    error: null,
  } as FormProps,
  render: function Render({ form, error }) {
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
            name="name"
            children={(field) => {
              return (
                <field.TextField
                  label="Full Name"
                  placeholder="Dr. Sarah Smith"
                />
              );
            }}
          />

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

          <form.AppField
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
          />
        </FieldGroup>

        <div className="mt-2 flex flex-col gap-4">
          <form.AppForm>
            <form.SubmitButton
              text="Create Account"
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            />
          </form.AppForm>
        </div>
      </form>
    );
  },
});

export default SignupForm;
