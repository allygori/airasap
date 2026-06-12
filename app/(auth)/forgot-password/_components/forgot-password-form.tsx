'use client';

import { ComponentProps, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export default function ForgotPasswordForm({
  className,
  ...props
}: ComponentProps<'div'>) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } =
        await authClient.requestPasswordReset({
          email,
          redirectTo: '/reset-password',
        });

      if (authError) {
        setError(
          authError.message ||
            'Gagal mengirim email pemulihan.'
        );
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError(
        'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        className={cn('grid gap-6 text-center', className)}
        {...props}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Email pemulihan telah dikirim!
          </p>
          <p className="text-muted-foreground text-sm">
            Silakan periksa kotak masuk email Anda untuk
            melanjutkan proses pemulihan kata sandi.
          </p>
        </div>
        <Button variant="outline">
          <Link href="/login">Kembali ke Masuk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={onSubmit}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              placeholder="nama@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </Field>

          {error && (
            <div className="text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <Button disabled={isLoading} className="w-full">
            {isLoading && <Spinner className="mr-2" />}
            Kirim Tautan Pemulihan
          </Button>
        </FieldGroup>
      </form>
      <div className="text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-primary inline-flex items-center text-sm transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Masuk
        </Link>
      </div>
    </div>
  );
}
