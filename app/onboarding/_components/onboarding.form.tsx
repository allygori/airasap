'use client';

import { Alert } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { withForm } from '@/components/form/form.hook';
import { ZodOnboardingInput } from './onboarding.schema';

type FormProps = {
  error?: string | null;
};

const OnboardingForm = withForm({
  defaultValues: {
    logo: '',
    name: '',
    slug: '',
    firstStore: '',
    description: '',
  } as ZodOnboardingInput,
  props: {
    error: null,
  } as FormProps,
  render: function Render({ form, error }) {
    return (
      <form
        id="onboarding-form"
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

        <FieldGroup className="gap-6">
          <form.AppField
            name="logo"
            children={(field) => {
              return <field.AvatarField label="Logo" />;
            }}
          />

          <form.AppField
            name="name"
            children={(field) => {
              return (
                <field.TextField
                  label="Nama Organisasi"
                  placeholder="Acme Inc."
                />
              );
            }}
          />

          <form.AppField
            name="slug"
            children={(field) => {
              return (
                <field.TextField
                  label="Slug"
                  placeholder="acme-inc"
                  // disabled={true}
                />
              );
            }}
          />

          <form.AppField
            name="firstStore"
            children={(field) => {
              return (
                <field.TextField
                  label="Nama Toko"
                  placeholder="Toserba 88"
                  description="Satu organisasi dapat memiliki lebih dari satu toko"
                />
              );
            }}
          />

          <form.AppField
            name="description"
            children={(field) => {
              return (
                <field.TextareaField
                  label="Deskripsi Singkat (opsional)"
                  className="min-h-24 resize-none"
                  placeholder="Penjelasan singkat tentang organisasi Anda"
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

export default OnboardingForm;
