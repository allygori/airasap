'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAppForm } from '@/components/form/form.hook';
import { revalidateLogic } from '@tanstack/react-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/auth-client';
import { Spinner } from '@/components/ui/spinner';
import { FieldDescription } from '@/components/ui/field';
import OnboardingForm from '@/app/onboarding/_components/onboarding.form';
import {
  ZodOnboardingInput,
  ZodOnboardingSchema,
} from '@/app/onboarding/_components/onboarding.schema';
import GoogleIcon from '@/components/icons/google';

type OnboardingClientProps = {
  className?: string;
};

export default function OnboardingClient({
  className,
}: OnboardingClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      logo: '',
      name: '',
      slug: '',
      description: '',
    } as ZodOnboardingInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: ZodOnboardingSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError(null);

      const { logo, name, slug, description } = value;

      try {
        const { data: newOrg, error: createOrgError } =
          await authClient.organization.create({
            logo,
            name,
            slug,
            metadata: {
              description,
            },
          });

        if (createOrgError) {
          setError(
            createOrgError.message ||
              'Gagal membuat organisasi. Silakan coba lagi.'
          );
          return;
        }

        const { error } =
          await authClient.organization.setActive({
            organizationId: newOrg.id,
          });

        if (error) {
          console.error(
            'Failed to set active organization',
            error
          );
        }

        router.push('/dashboard');
        router.refresh();
      } catch (err) {
        setError(
          'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
        );
      } finally {
        setIsLoading(false);
      }
    },
  });
  return (
    <div className={cn('grid gap-6', className)}>
      <OnboardingForm form={form} error={error} />
    </div>
  );
}
