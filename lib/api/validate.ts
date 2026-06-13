import { NextResponse } from 'next/server';
import { type ZodSchema, ZodError } from 'zod';
import { apiError, ErrorCodes } from './response';

export interface ValidationSchemas<
  Body = unknown,
  Query = unknown,
  Params = unknown,
> {
  body?: ZodSchema<Body>;
  query?: ZodSchema<Query>;
  params?: ZodSchema<Params>;
}

export type ValidatedHandler<
  Body = unknown,
  Query = unknown,
  Params = unknown,
> = (
  request: Request,
  context: {
    params: Promise<any>;
    validatedBody?: Body;
    validatedQuery?: Query;
    validatedParams?: Params;
  }
) => Promise<Response> | Response;

function isZodSchema(
  value: any
): value is ZodSchema<unknown> {
  return value && typeof value.parse === 'function';
}

function parseQueryObject(request: Request) {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    raw[key] = value;
  }
  return raw;
}

export function withValidation<
  Body = unknown,
  Query = unknown,
  Params = unknown,
>(
  schemaOrSchemas:
    | ZodSchema<Body>
    | ValidationSchemas<Body, Query, Params>,
  handler: ValidatedHandler<Body, Query, Params>
) {
  const schemas: ValidationSchemas<Body, Query, Params> =
    isZodSchema(schemaOrSchemas)
      ? { body: schemaOrSchemas }
      : schemaOrSchemas;

  return async (
    request: Request,
    context: { params: Promise<any> }
  ) => {
    try {
      let validatedBody: Body | undefined;
      let validatedQuery: Query | undefined;
      let validatedParams: Params | undefined;

      if (schemas.body) {
        const body = await request.json();
        validatedBody = schemas.body.parse(body);
      }

      if (schemas.query) {
        const rawQuery = parseQueryObject(request);
        validatedQuery = schemas.query.parse(rawQuery);
      }

      if (schemas.params) {
        const rawParams = await context.params;
        validatedParams = schemas.params.parse(rawParams);
      }

      return await handler(request, {
        ...context,
        validatedBody,
        validatedQuery,
        validatedParams,
      });
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return apiError(
          ErrorCodes.VALIDATION_ERROR,
          'Format JSON tidak valid atau kosong',
          400
        );
      }

      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return apiError(
          ErrorCodes.VALIDATION_ERROR,
          'Validasi input gagal',
          400,
          details
        );
      }

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Terjadi kesalahan pada server internal',
        500
      );
    }
  };
}
