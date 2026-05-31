/**
 * Query Builder — pagination, sorting, filtering, search
 */

import { type NextRequest } from 'next/server';
import {
  type Document,
  type Model,
  type QueryFilter,
  type PopulateOptions,
} from 'mongoose';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || '';
const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION || '';

const config = {
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  site: {
    name: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export interface QueryOptions {
  page: number;
  limit: number;
  sort: Record<string, 1 | -1>;
  search?: string;
  filters: Record<string, unknown>;
}

/**
 * Parse query params from the request URL.
 *
 * Supports: ?page=1&limit=10&sort=-created_at&search=keyword&key=value OR
 * ?page=1&limit=10&sort=-created_at&q=keyword&key=value
 */
export function parseQueryParams(
  request: NextRequest,
  options?: {
    allowedFilters?: string[];
    allowedSorts?: string[];
    searchFields?: string[];
  }
): QueryOptions {
  const url = request.nextUrl;
  const params = url.searchParams;

  // Pagination
  const page = Math.max(
    1,
    parseInt(params.get('page') || '1', 10)
  );
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(
      1,
      parseInt(
        params.get('limit') ||
          String(config.pagination.defaultLimit),
        10
      )
    )
  );

  // Sorting — e.g. "created_at" (asc) or "-created_at" (desc)
  const sortParam = params.get('sort') || '-created_at';
  const sort: Record<string, 1 | -1> = {};
  for (const field of sortParam.split(',')) {
    const trimmed = field.trim();
    if (trimmed.startsWith('-')) {
      sort[trimmed.slice(1)] = -1;
    } else {
      sort[trimmed] = 1;
    }
  }

  // Search
  const search =
    params.get('search') || params.get('q') || undefined;

  // Filters — only allow specific keys
  const filters: Record<string, unknown> = {};
  const allowedFilters = options?.allowedFilters || [];
  for (const key of allowedFilters) {
    const val = params.get(key);
    if (val !== null) {
      filters[key] = val;
    }
  }

  return { page, limit, sort, search, filters };
}

/**
 * Execute a paginated Mongoose query.
 */
export async function paginatedQuery<T extends Document>(
  model: Model<T>,
  baseFilter: QueryFilter<T>,
  queryOptions: QueryOptions,
  options?: {
    searchFields?: string[];
    populate?:
      | string
      | string[]
      | PopulateOptions
      | PopulateOptions[];
    select?:
      | string
      | string[]
      | Record<string, number | boolean | object>;
  }
) {
  let filter: QueryFilter<T> = { ...baseFilter };

  // Full-text search
  if (
    queryOptions.search &&
    options?.searchFields?.length
  ) {
    const searchRegex = new RegExp(
      queryOptions.search,
      'i'
    );
    const searchConditions = options.searchFields.map(
      (field) => ({
        [field]: searchRegex,
      })
    );
    filter = {
      ...filter,
      $or: searchConditions,
    } as QueryFilter<T>;
  }

  const total = await model.countDocuments(filter);
  const total_pages = Math.ceil(total / queryOptions.limit);
  const skip = (queryOptions.page - 1) * queryOptions.limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = model
    .find(filter)
    .sort(queryOptions.sort)
    .skip(skip)
    .limit(queryOptions.limit);

  if (options?.select) {
    query = query.select(options.select);
  }

  if (options?.populate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.populate(options.populate as any);
  }

  const data = await query.lean().exec();

  return {
    data,
    meta: {
      page: queryOptions.page,
      limit: queryOptions.limit,
      total,
      total_pages,
    },
  };
}
