'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAppForm } from '@/components/form/form.hook';
import { revalidateLogic } from '@tanstack/react-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  signIn,
  signUp,
  authClient,
} from '@/lib/auth/auth-client';
import type { Session } from '@/lib/auth/auth-client';
import { Spinner } from '@/components/ui/spinner';
import { FieldDescription } from '@/components/ui/field';
import RegisterForm from '@/app/(auth)/register/_components/register.form';
import { LoginSchema, LoginInput } from './login.schema';
import GoogleIcon from '@/components/icons/google';
import LoginForm from './login.form';
import { auth } from '@/lib/auth/auth';

type RegisterClientProps = {
  className?: string;
};

export default function RegisterClient({
  className,
}: RegisterClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: LoginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError(null);

      const { email, password } = value;

      try {
        const { error: authError } =
          await authClient.signIn.email({
            email,
            password,
            // callbackURL: '/dashboard',
          });

        if (authError) {
          setError(
            authError.message ||
              'Gagal membuat akun. Silakan coba lagi.'
          );
          return;
        }

        // 1. Fetch existing organizations
        const { data: orgs } =
          await authClient.organization.list();

        if (!orgs || orgs.length === 0) {
          router.push('/onboarding');
          return;
        }

        // 2. Update active org and store
        await authClient.store.setActive({
          organizationId: orgs[0].id,
          storeId: null,
        });

        // 3. Force a database re-fetch and refresh the cookie cache
        await authClient.getSession({
          query: {
            disableCookieCache: true,
          },
        });

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

  // const handleGoogleSignUp = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     await signIn.social({
  //       provider: 'google',
  //       callbackURL: '/onboarding',
  //     });
  //   } catch (err) {
  //     setError('Gagal mendaftar dengan Google.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (err) {
      setError('Gagal masuk dengan Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('grid gap-6', className)}>
      <LoginForm form={form} error={error} />

      <div className="text-center text-sm">
        <span className="text-slate-500">
          Belum memiliki akun?
        </span>{' '}
        <Link
          href="/register"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Buat Akun
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Atau lanjutkan dengan
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="w-full"
      >
        {isLoading ? (
          <Spinner className="mr-2" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Masuk dengan Google
      </Button>
    </div>
  );
}
