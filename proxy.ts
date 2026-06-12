// proxy.ts
import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/dashboard'];
const authPaths = ['/login', '/signup', '/forgot-password'];

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Ambil Session Token (Better Auth)
  const sessionToken =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get(
      '_Secure-better-auth.session_token'
    ) ??
    request.cookies.get(
      '__Secure-better-auth.session_token'
    ) ??
    request.cookies
      .getAll()
      .find((c) =>
        c.name.endsWith('better-auth.session_token')
      );

  // // 2. Proteksi Khusus Rute API
  // if (pathname.startsWith('/api')) {
  //   const apiSecretHeader =
  //     request.headers.get('x-api-secret');

  //   // Izinkan jika ada API Secret yang cocok ATAU ada Session Token
  //   const isValidSecret =
  //     apiSecretHeader === process.env.INTERNAL_API_SECRET;
  //   const isValidSession = !!sessionToken;

  //   if (!isValidSecret && !isValidSession) {
  //     return NextResponse.json(
  //       {
  //         error:
  //           'Unauthorized: Invalid API Secret or Session',
  //       },
  //       { status: 401 }
  //     );
  //   }
  //   return NextResponse.next();
  // }

  // 3. Proteksi Rute Halaman (Dashboard/Login)
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !sessionToken) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Sekarang mencakup rute API.
     * Mengecualikan file statis agar tidak membebani performa.
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
};
