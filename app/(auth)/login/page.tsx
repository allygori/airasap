import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { FieldDescription } from '@/components/ui/field';
import LoginClient from './_components/login.client';
import { GalleryVerticalEnd } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Masuk | Pasaria',
  description: 'Masuk ke akun Pasaria Anda.',
};

export default function AuthenticationPage() {
  return (
    <div className="relative container flex-1 shrink-0 items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="text-primary relative hidden h-full flex-col p-10 lg:flex dark:border-r">
        <div className="bg-primary/5 absolute inset-0" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Pasaria */}
          {/* <a
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
          </a> */}
          <div className="flex justify-center gap-2 md:justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 font-medium"
            >
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Pasaria.
            </Link>
          </div>

          {/* <div className="bg-muted relative hidden lg:block"> */}

          {/* </div> */}
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="leading-normal text-balance">
            &ldquo;Platform Pasaria sangat membantu saya
            dalam mengelola jadwal dan pelanggan dengan
            lebih profesional.&rdquo;
          </blockquote>
        </div>

        <Image
          src="https://images.unsplash.com/photo-1709880945165-d2208c6ad2ec?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Image"
          width={1024}
          height={1536}
          className="absolute inset-0 hidden h-full w-full object-cover brightness-50 md:block"
        />
      </div>
      <div className="flex h-screen items-center justify-center p-8">
        <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Masuk ke Akun
            </h1>
            <p className="text-muted-foreground text-sm">
              Masukkan email Anda di bawah ini untuk memulai
            </p>
          </div>
          <LoginClient />
        </div>
      </div>
    </div>
  );
}
