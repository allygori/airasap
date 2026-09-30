# MongoDB and Schema Conventions

> Persisted data is a long-lived contract. Choose document shape, tenant scope, indexes, and lifecycle rules from the business concept and its access patterns—not from convenience at one call site.

## Status and scope

- **[CURRENT]** The application uses MongoDB with Mongoose. Application-owned business models generally use an `organization` tenant reference; Better Auth-owned records use the library's `organizationId` contract.
- **[CURRENT]** `lib/db/connection.ts` owns the cached Mongoose connection and imports application models for registration. `modules/base.repository.ts` is the current domain repository base.
- **[TARGET]** Keep persistence owned by its business module, enforce Organization scope on every tenant-data operation, and choose embed/reference boundaries from lifecycle and access patterns.
- **[TARGET]** New persisted business fields use `snake_case`, following the repository-wide convention. Preserve external library contracts where the library requires another naming shape.

## Tenant and parent scope

- **[TARGET]** Every Organization-owned business record must carry a required Organization reference, conventionally `organization: ObjectId` with the appropriate model reference. Do not treat a Store ID or active UI selection as the tenant boundary.
- **[TARGET]** Add a Store reference only when the business record is Store-owned or Store-scoped. Organization-scoped Finance and consolidated inventory records may be valid without a top-level Store field; some such records may still carry Store context for an individual movement or reservation.
- **[TARGET]** When a record references a Store, verify that the Store belongs to the same Organization. Apply equivalent parent-ownership checks to nested or referenced resources.
- **[CURRENT]** Better Auth-owned records use `organizationId`; application-owned models use `organization`. Do not mix these names or aliases without an explicit mapping at the auth/domain seam.
- **[CURRENT]** `multiTenancyPlugin` is registered on business schemas that declare `organization` and requires tenant context for several common query operations. Its presence is defense in depth, not blanket coverage of every Mongoose operation: explicitly scope creates, aggregations, bulk operations, and any operation not covered by its middleware.
- **[CURRENT]** The base repository also adds tenant filters, but correctness depends on how each operation combines caller filters with trusted scope. Never let request data override Organization or Store scope.
- **[TARGET]** Treat client-provided tenant identifiers as untrusted selectors, not as authorization. See [Domain and Tenancy](../architecture/domain-and-tenancy.md) and [API and Data Access](./api-and-data-access.md).

## Embed versus reference

MongoDB embedding is useful for bounded data that belongs to a parent and is normally loaded and changed with it. It is not a rule to embed every related object.

### Prefer embedding when

- The child set has a known practical bound.
- The child has no independent lifecycle, tenant scope, authorization, or retention policy.
- The parent and child are usually read together and updated as one business operation.
- Embedding makes the aggregate easier to reason about without creating a high-contention document.

**[CURRENT]** Products embed variants, and Orders embed line items. These are current examples of data that is normally interpreted in the context of its parent; they are not a rule that every future relationship should be embedded.

### Prefer a separate collection when

- The data grows independently or could become unbounded.
- It has its own lifecycle, audit history, idempotency, tenant access, or retention requirements.
- It is queried, paginated, updated, or authorized independently.
- Concurrent updates to one parent document would become a source of contention.
- It needs indexes that are easier to express and maintain on independent records.

**[CURRENT]** Finance inventory movements and reservations are separate, independently addressable records. **[TARGET]** Keep such histories separate rather than embedding an unbounded movement or reservation history inside an item document.

When embedding arrays, define the expected bound and update behavior. If array elements need to be addressed independently, give them a stable identity and define how updates avoid replacing unrelated elements.

## Indexes and uniqueness

- **[TARGET]** Add indexes to support real query patterns and document the operation they serve. An index can improve lookup speed; it does not grant authorization or replace tenant filters.
- **[TARGET]** For tenant-local uniqueness, include the correct tenant scope (and Store scope where required) in the compound unique index. Examples include Organization + Store + external product ID, or Organization + platform + Store + source Order/line identifiers.
- **[TARGET]** Use a global unique index only when the value is truly unique across all tenants by business definition. A field-level Mongoose `unique: true` may create a global unique index; do not use it as a substitute for a tenant-scoped compound index.
- **[CURRENT]** Orders and Products have Organization/Store compound indexes. The Product schema also has field-level uniqueness declarations on external IDs alongside compound indexes; inspect actual index scope before copying that pattern into new schemas.
- **[TARGET]** Decide how soft-deleted records interact with uniqueness. If a value may be reused after deletion, choose an explicit partial-index or restoration policy; do not assume a `deleted_at` field automatically changes unique-index behavior.
- **[TARGET]** Keep indexes selective and based on observed reads, sorts, uniqueness, and aggregation needs. Review write/storage cost when adding indexes to high-volume collections.

## Field, timestamp, and lifecycle conventions

- Use `snake_case` for new application-owned persisted field names. Keep Better Auth's library-defined names unchanged.
- Use explicit references and types for Organization, Store, user, and other related records. Avoid storing multiple competing representations of the same relationship unless a documented integration contract requires them.
- **[CURRENT]** Several Mongoose models use `created_at` and `updated_at` through Mongoose timestamps; older models may differ. **[TARGET]** Use these names for new application-owned timestamp fields when timestamps are appropriate, and do not add duplicate timestamp fields alongside Mongoose timestamps.
- **[CURRENT]** Some business models use `deleted_at` for soft deletion. Existing null/missing behavior is not perfectly uniform across all collections.
- **[TARGET]** For new soft-deletable models, use an explicit `deleted_at` lifecycle and make active/deleted filtering consistent across list, search, update, restore, and uniqueness paths. Hard deletion versus retention remains a domain decision; do not infer it from an omitted field.
- Define persisted state transitions in the owning domain module. A schema enum or Mongoose validator helps constrain stored values but does not replace the use case's lifecycle checks.
- Do not expose persistence-specific aliases or internal fields as an accidental API contract. Map records to deliberate response shapes at the application boundary.

## Validation and writes

- Validate external values with Zod at the request/import edge, then enforce state-dependent business invariants in the owning module. Mongoose schema validation is an additional persistence guard, not the only validation layer.
- Use atomic MongoDB operations for single-document invariants where suitable. Use a Mongoose session/transaction when several writes must commit or roll back together, and propagate that session through all participating repositories.
- Make retryable writes idempotent when duplicate execution could create incorrect business records. Scope idempotency keys to Organization and operation as required by the domain.
- Do not assume a transaction spans MongoDB and a marketplace API or file system. Record progress and support reconciliation for workflows that cross those boundaries.
- Avoid unbounded `populate`, unrestricted aggregation, user-controlled regular expressions, and unbounded array writes. Enforce explicit limits and safe query shapes.
- Changes to persisted fields, unique indexes, deletion behavior, or embedded document shape may require data migration or compatibility handling. Plan that work before renaming or removing stored fields.

## Unresolved domain choices

- **[OPEN]** Product catalog ownership across Stores is not decided. Current Store-scoped Products and Organization-scoped Finance inventory mappings do not settle that future ownership model.
- **[OPEN]** The persistent representation for future Store allocations is undecided. Choose embedding versus a separate collection after expected Store counts, contention, audit requirements, and query needs are known; see [Inventory and Sales Channels](../architecture/inventory-and-channels.md).
- **[OPEN]** Define a consistent soft-delete/reuse policy where unique identifiers may be imported again or restored.

## Related guides

- [API and Data Access](./api-and-data-access.md) — input validation, tenant context, repositories, and response mapping.
- [Business Logic](./business-logic.md) — ownership of invariants, transactions, retries, and state changes.
- [Naming Conventions](./naming.md) — source-symbol names versus persisted and API field names.
- [Domain and Tenancy](../architecture/domain-and-tenancy.md) — Organization and Store ownership.
- [Inventory and Sales Channels](../architecture/inventory-and-channels.md) — inventory record boundaries and unresolved allocation model.
