'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppForm } from '@/components/form/form.hook';
import { revalidateLogic } from '@tanstack/react-form';
import SignupForm, {
  ZodSignupSchema,
  type ZodSignupInput,
} from '@/components/forms/signup';
import { GalleryVerticalEnd } from 'lucide-react';

export default function Signup2Page() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    } as ZodSignupInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: ZodSignupSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const response = await fetch(
          '/api/auth/sign-up/email',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: value.name,
              email: value.email,
              password: value.password,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || 'Sign up failed'
          );
        }

        router.push('/dashboard');
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred'
        );
      }
    },
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a
            href="#"
            className="flex items-center gap-2 font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Pasaria.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="mb-6 text-center">
              <h2 className="dark:text-foreground text-2xl font-semibold tracking-tight text-slate-900">
                Create an account
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your details to register
              </p>
            </div>

            <SignupForm form={form} error={error} />

            <div className="mt-8 text-center text-sm">
              <span className="text-slate-500">
                Already have an account?
              </span>{' '}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1612736777093-461fb48101d7?q=80&w=1024&auto=format&fit=crop&ixlib=rb-4.1.0"
          alt="Image"
          width={1024}
          height={1536}
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7] dark:grayscale"
        />
      </div>
    </div>
  );
}
