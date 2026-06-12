import { type Metadata } from 'next';
import Link from 'next/link';

import { FieldDescription } from '@/components/ui/field';
import ForgotPasswordForm from '@/app/(auth)/forgot-password/_components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi | Pasaria',
  description: 'Pulihkan kata sandi akun Pasaria Anda.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="relative container flex-1 shrink-0 items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="flex h-screen items-center justify-center p-8">
        <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Lupa Kata Sandi
            </h1>
            <p className="text-muted-foreground text-sm">
              Masukkan email Anda di bawah ini untuk
              menerima tautan pemulihan
            </p>
          </div>
          <ForgotPasswordForm />
          {/* <FieldDescription className="px-6 text-center">
            Dengan melanjutkan, Anda menyetujui{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Ketentuan Layanan</Link> dan{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Kebijakan Privasi</Link> kami.
          </FieldDescription> */}
        </div>
      </div>
      <div className="text-primary relative hidden h-full flex-col p-10 lg:flex dark:border-r">
        <div className="bg-primary/5 absolute inset-0" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2"
          >
            <div className="from-gradient-start to-gradient-end flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br">
              <span className="text-sm font-bold text-white">
                O
              </span>
            </div>
            <span className="text-foreground text-xl font-bold">
              Pasaria
            </span>
          </a>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="leading-normal text-balance">
            &ldquo;Keamanan akun Anda adalah prioritas kami.
            Pulihkan kata sandi Anda dengan aman melalui
            proses terverifikasi kami.&rdquo;
          </blockquote>
        </div>
      </div>
    </div>
  );
}
