'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAppForm } from '@/components/form/form.hook';
import { revalidateLogic } from '@tanstack/react-form';
import { cn } from '@/lib/utils/ui';
import { authClient } from '@/lib/auth/auth-client';
import OnboardingForm from '@/app/onboarding/_components/onboarding.form';
import {
  ZodOnboardingInput,
  ZodOnboardingSchema,
} from '@/app/onboarding/_components/onboarding.schema';
import { ORDER_PLATFORMS } from '@/constant/order-platform';

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
      firstStore: '',
      description: '',
    } as ZodOnboardingInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: ZodOnboardingSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError(null);

      let activeOrgId;
      const { logo, name, slug, firstStore, description } =
        value;

      try {
        /**
         * Create a organization
         */

        const { data: newOrg, error: createOrgError } =
          await authClient.organization.create({
            logo,
            name,
            slug,
            metadata: {
              description,
            },
          });

        activeOrgId = newOrg?.id;

        console.log({ activeOrgId });

        if (
          createOrgError &&
          createOrgError.code !==
            'ORGANIZATION_ALREADY_EXISTS'
        ) {
          setError(
            createOrgError.message ||
              'Gagal membuat organisasi. Silakan coba lagi.'
          );
          return;
        }

        if (
          createOrgError?.code ===
            'ORGANIZATION_ALREADY_EXISTS' &&
          !!activeOrgId
        ) {
          const { data, error } =
            await authClient.organization.list();

          activeOrgId =
            data && data.length > 0 ? data[0]?.id : null;

          if (error) {
            console.error(
              'Failed to fetch organizations:',
              error
            );
            return;
          }
        }

        const { error } =
          await authClient.organization.setActive({
            organizationId: activeOrgId,
            // organization: newOrg.id,
          });

        // const { error } = await authClient.updateSession({
        //   activeStoreId
        // })

        if (error) {
          console.error(
            'Failed to set active organization',
            error
          );
          throw new Error(
            'Failed to set active organization'
          );
        }

        /**
         * Create store
         */
        const response = await fetch(
          'api/v1/dashboard/stores',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // organization: newOrg.id,
              name: firstStore || newOrg?.name || '',
              platform: ORDER_PLATFORMS.shopee.value,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || 'Gagal membuat toko'
          );
        }

        const {
          data: newStore,
          success: successCreateStore,
        } = await response.json();

        if (!successCreateStore) {
          throw new Error('Gagal membuat toko');
        }

        /**
         * Update session to include activeStoreId
         */
        const { error: errorUpdateSession } =
          await authClient.updateSession({
            // active_store: newStore?._id || newStore?.id,
            activeStoreId: newStore?._id || newStore?.id,
            language: 'id',
            theme: 'system',
          });

        if (errorUpdateSession) {
          console.error(
            'Failed to set update session for activeStoreId',
            errorUpdateSession
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
    <div
      className={cn('grid gap-6 py-8 md:py-16', className)}
    >
      <OnboardingForm form={form} error={error} />
    </div>
  );
}
