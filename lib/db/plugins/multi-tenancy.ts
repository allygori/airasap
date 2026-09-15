import mongoose from 'mongoose';

/**
 * Tenant path used by application-owned Mongoose models.
 *
 * Better Auth uses `organizationId` in its own adapter models. That field
 * must not be confused with the `organization` ObjectId reference used by
 * Pasaria's business-domain models.
 */
const TENANT_PATH = 'organization';

const TENANT_QUERY_METHODS = [
  'find',
  'findOne',
  'countDocuments',
  'distinct',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'replaceOne',
] as const;

type TenantQuery = mongoose.Query<unknown, unknown> & {
  op: string;
  getOptions(): Record<string, unknown>;
  getQuery(): Record<string, unknown>;
  setQuery(value: Record<string, unknown>): void;
};

export function multiTenancyPlugin(
  schema: mongoose.Schema
) {
  // The plugin can safely be attached to all application schemas. Auth,
  // session, and other non-tenant schemas are ignored because they do not
  // contain the business tenant path.
  if (!schema.path(TENANT_PATH)) return;

  for (const method of TENANT_QUERY_METHODS) {
    schema.pre(
      // Mongoose's overloads do not expose the complete query-operation
      // union, although these operation names are supported at runtime.
      method as any,
      function (
        this: TenantQuery,
        next: (error?: Error) => void
      ) {
        const query = this;
        const options = query.getOptions();
        const filter = query.getQuery();
        const organizationId =
          options.organizationId ?? filter[TENANT_PATH];

        if (!organizationId) {
          return next(
            new Error(
              `CRITICAL: Tenant-scoped ${String(
                this.op
              )} query requires an organization context.`
            )
          );
        }

        // Prefer the repository-provided option when available. This prevents
        // a caller from overriding the active tenant through a query filter.
        query.setQuery({
          ...filter,
          [TENANT_PATH]: organizationId,
        });

        next();
      }
    );
  }
}
