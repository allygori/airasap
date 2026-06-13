import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

// Tipe data untuk handler yang sudah tervalidasi data body-nya
type ValidatedHandler<T> = (
  request: Request,
  context: { params: Promise<any>; validatedBody: T }
) => Promise<Response> | Response;

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>
) {
  return async (
    request: Request,
    context: { params: Promise<any> }
  ) => {
    try {
      // 1. Ambil body dari request
      const body = await request.json();

      // 2. Validasi dengan Zod
      const validatedBody = schema.parse(body);

      // 3. Teruskan ke handler asli dengan menyertakan data yang sudah valid
      return await handler(request, {
        ...context,
        validatedBody,
      });
    } catch (error: any) {
      // Tangani jika json body kosong atau rusak
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Format JSON tidak valid atau kosong',
          },
          { status: 400 }
        );
      }

      // Tangani jika skema Zod tidak cocok
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validasi input gagal',
            details: error.errors.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }

      // Tangani error tidak terduga lainnya
      return NextResponse.json(
        {
          success: false,
          error: 'Terjadi kesalahan pada server internal',
        },
        { status: 500 }
      );
    }
  };
}
