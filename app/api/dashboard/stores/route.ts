import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Store from '@/lib/db/schema/stores';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/connection';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const orgId = session?.session?.activeOrganizationId;
    if (!orgId) {
      return apiError(
        ErrorCodes.UNAUTHORIZED,
        'Unauthorized',
        401
      );
    }
    await db.connect();
    const stores = await Store.find({
      organization: orgId,
      deleted_at: null,
    })
      .lean()
      .exec();

    return apiSuccess(stores);
  } catch (error: any) {
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Internal Server Error',
      500
    );
  }
}
