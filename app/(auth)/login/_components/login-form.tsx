'use client';

import { ComponentProps, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils/ui';
import { authClient } from '@/lib/auth/auth-client';
import GoogleIcon from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginForm({
  className,
  ...props
}: ComponentProps<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } =
        await authClient.signIn.email({
          email,
          password,
          rememberMe,
        });

      if (authError) {
        setError(
          authError.message ||
            'Email atau kata sandi salah.'
        );
        return;
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
  };

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
          <Field>
            <div className="mb-1 flex items-center justify-between">
              <FieldLabel htmlFor="password">
                Kata Sandi
              </FieldLabel>
              <Link
                href="/forgot-password"
                className="text-xs underline-offset-4 hover:underline"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={isLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </Field>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked === true)
                }
                disabled={isLoading}
              />
              <label
                htmlFor="remember"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ingat saya
              </label>
            </div>
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 text-sm leading-none font-medium transition-colors"
            >
              Buat Akun
            </Link>
          </div>

          {error && (
            <div className="text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <Button disabled={isLoading} className="w-full">
            {isLoading && <Spinner className="mr-2" />}
            Masuk
          </Button>
        </FieldGroup>
      </form>

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
        Google
      </Button>
    </div>
  );
}
