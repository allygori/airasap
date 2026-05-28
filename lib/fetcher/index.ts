/**
 * Standardized Fetch Wrapper for Internal API
 * Reference: AGENTS.md § 5 - Coding Standards
 */

export interface FetchOptions extends RequestInit {
  params?: Record<
    string,
    string | number | boolean | undefined | string[]
  >;
  revalidate?: number | false;
  tags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

/**
 * Robust fetch wrapper that handles:
 * - Base URL resolution
 * - API Secret headers
 * - Query parameter serialization
 * - Revalidation & Caching
 * - Error handling & Type safety
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const {
    params,
    revalidate,
    tags,
    headers: customHeaders,
    ...rest
  } = options;

  const baseUrl =
    process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const apiSecret = process.env.INTERNAL_API_SECRET;

  // 1. Construct URL with parameters
  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl}${endpoint}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }

  // 2. Prepare Headers
  const headers = new Headers(customHeaders);
  if (apiSecret) {
    headers.set('x-api-secret', apiSecret);
  }

  if (
    !headers.has('Content-Type') &&
    rest.body &&
    !(rest.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. Prepare Fetch Options
  const fetchOptions: RequestInit = {
    ...rest,
    headers,
  };

  // Next.js specific caching options
  if (revalidate !== undefined || tags !== undefined) {
    fetchOptions.next = {
      ...(revalidate !== undefined ? { revalidate } : {}),
      ...(tags !== undefined ? { tags } : {}),
    };
  }

  try {
    const response = await fetch(
      url.toString(),
      fetchOptions
    );

    // Handle HTTP errors
    if (!response.ok) {
      let errorMsg = `Fetch failed: ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMsg =
          errorJson.error?.message ||
          errorJson.message ||
          errorMsg;
      } catch {
        // Fallback if not JSON
      }
      console.error(
        `[fetchAPI Error] ${url.pathname}:`,
        errorMsg
      );
      return null;
    }

    // Parse JSON response
    const json = (await response.json()) as ApiResponse<T>;

    if (!json.success) {
      console.error(
        `[fetchAPI API Error] ${url.pathname}:`,
        json.error?.message || 'Unknown error'
      );
      return null;
    }

    return json.data;
  } catch (error) {
    console.error(
      `[fetchAPI Network Error] ${endpoint}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
