'use client';

import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

// // import { cn } from "@/lib/utils"
// // import buttonVariants from "@/components/ui/variants/button-cva"
// import { FieldDescription } from '@/components/ui/field';
// // import RegisterForm from '@/app/(auth)/register/_components/register-form';
// import RegisterForm from '@/app/(auth)/register/_components/register.form';
import { GalleryVerticalEnd } from 'lucide-react';
// // import { useRouter } from 'next/router';
// import { useRouter } from 'next/navigation';
// import { useState } from 'react';
// import { useAppForm } from '@/components/form/form.hook';
// import {
//   ZodRegisterInput,
//   ZodRegisterSchema,
// } from '@/app/(auth)/register/_components/register.schema';
// import { revalidateLogic } from '@tanstack/react-form';
import RegisterClient from './_components/register.client';

// export const metadata: Metadata = {
//   title: 'Daftar | Pasaria',
//   description: 'Buat akun Pasaria baru.',
// };

export default function RegisterPage() {
  // const router = useRouter();
  // const [error, setError] = useState<string | null>(null);

  // const form = useAppForm({
  //   defaultValues: {
  //     name: '',
  //     email: '',
  //     password: '',
  //     // confirmPassword: "",
  //   } as ZodRegisterInput,
  //   validationLogic: revalidateLogic(),
  //   validators: {
  //     onDynamic: ZodRegisterSchema,
  //   },
  //   onSubmit: async ({ value }) => {
  //     setError(null);
  //     try {
  //       const response = await fetch(
  //         '/api/auth/sign-up/email',
  //         {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({
  //             name: value.name,
  //             email: value.email,
  //             password: value.password,
  //           }),
  //         }
  //       );

  //       if (!response.ok) {
  //         const errorData = await response.json();
  //         throw new Error(
  //           errorData.message || 'Sign up failed'
  //         );
  //       }

  //       router.push('/dashboard');
  //       router.refresh();
  //       // router.reload();
  //     } catch (err) {
  //       setError(
  //         err instanceof Error
  //           ? err.message
  //           : 'An error occurred'
  //       );
  //     }
  //   },
  // });

  return (
    <div className="relative container flex-1 shrink-0 items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="text-primary relative hidden h-full flex-col p-10 lg:flex dark:border-r">
        <div className="bg-primary/5 absolute inset-0" />
        <div className="relative z-20 flex items-center text-lg font-medium">
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
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="leading-normal text-balance">
            &ldquo;Bergabunglah dengan ribuan profesional
            lainnya yang telah menggunakan Pasaria untuk
            mengoptimalkan operasional bisnis mereka.&rdquo;
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
        <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-87.5">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Buat Akun Baru
            </h1>
            <p className="text-muted-foreground text-sm">
              Masukkan email Anda di bawah ini untuk
              mendaftar
            </p>
          </div>
          <RegisterClient />
        </div>
      </div>
    </div>
  );
}
