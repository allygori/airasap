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
import {
  ZodRegisterInput,
  ZodRegisterSchema,
} from '@/app/(auth)/register/_components/register.schema';
import GoogleIcon from '@/components/icons/google';

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
      name: '',
      email: '',
      password: '',
      // confirmPassword: "",
    } as ZodRegisterInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: ZodRegisterSchema,
    },
    onSubmit: async ({ value }) => {
      // setIsLoading(true);
      // setError(null);
      // try {
      //   const response = await fetch(
      //     '/api/auth/sign-up/email',
      //     {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         name: value.name,
      //         email: value.email,
      //         password: value.password,
      //       }),
      //     }
      //   );

      //   if (!response.ok) {
      //     const errorData = await response.json();
      //     throw new Error(
      //       errorData.message || 'Sign up failed'
      //     );
      //   }

      //   router.push('/dashboard');
      //   router.refresh();
      //   // router.reload();
      // } catch (err) {
      //   setError(
      //     err instanceof Error
      //       ? err.message
      //       : 'An error occurred'
      //   );
      // } finally {
      //   setIsLoading(false);
      // }

      setIsLoading(true);
      setError(null);

      const { name, email, password } = value;

      try {
        const { error: authError } = await signUp.email({
          name,
          email,
          password,
          // callbackURL: '/onboarding/create-organization',
          callbackURL: '/onboarding',
        });

        if (authError) {
          setError(
            authError.message ||
              'Gagal membuat akun. Silakan coba lagi.'
          );
          return;
        }

        // await authClient.updateSession({
        //   theme: 'system',
        //   // theme: 'dark',
        //   language: 'en',
        //   activeStoreId: '113431423',
        // }); // satisfies Session

        // await authClient.updateUser({})

        router.push('/onboarding');
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

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/onboarding',
      });
    } catch (err) {
      setError('Gagal mendaftar dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('grid gap-6', className)}>
      <RegisterForm form={form} error={error} />

      <div className="text-center text-sm">
        <span className="text-slate-500">
          Sudah memiliki akun?
        </span>{' '}
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Masuk
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Atau daftar dengan
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleSignUp}
        className="w-full"
      >
        {isLoading ? (
          <Spinner className="mr-2" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>

      <FieldDescription className="px-6 text-center">
        Dengan mengklik lanjut, Anda menyetujui{' '}
        <Link
          href="/terms"
          className="hover:text-primary underline underline-offset-4"
        >
          Ketentuan Layanan
        </Link>{' '}
        dan{' '}
        <Link
          href="/privacy"
          className="hover:text-primary underline underline-offset-4"
        >
          Kebijakan Privasi
        </Link>{' '}
        kami.
      </FieldDescription>
    </div>
  );
}
