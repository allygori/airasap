import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// import { Geist } from 'next/font/google';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { cn } from '@/lib/utils/ui';
import { Toaster } from '@/components/ui/sonner';

// const geist = Geist({
//   subsets: ['latin'],
//   variable: '--font-sans',
// });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Pasaria.id',
  description:
    'Platform commerce conversion-first untuk seller Indonesia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        'h-full antialiased',
        'font-sans',
        inter.variable
      )}
    >
      <body
        className={`${plusJakarta.variable} flex min-h-full flex-col font-sans antialiased`}
      >
        <Providers>
          {children}

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
