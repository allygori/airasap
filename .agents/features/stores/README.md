# Stores

> This guide describes the current Store record and dashboard collection route. It distinguishes the existing Store/brand concept from the future sales-channel-account model.

## Scope and status

- **[CURRENT]** A Store belongs to one Organization. The persisted record contains a name, code, timezone, active state, soft-delete timestamp, and timestamps.
- **[CURRENT]** Store queries use the Organization tenant context. A Store selection is an operating context; it is not a substitute for checking that the Store belongs to the authenticated Organization. See [Domain and Tenancy](../../docs/architecture/domain-and-tenancy.md).
- **[CURRENT]** Current Order and Product records refer to a Store and carry a platform value. The platform value identifies a platform type; the Store model does not currently contain a general collection of channel accounts.
- **[TARGET]** A Store/brand may have several sales-channel accounts, including multiple accounts on one platform. This is a target relationship, not a verified current Store feature. The broader target model is in [Domain and Tenancy](../../docs/architecture/domain-and-tenancy.md).

## Current operations and limits

- **[CURRENT]** The versioned dashboard Store collection route exposes `GET` with pagination/filtering and `POST` for creation. The reviewed route tree has no Store item route for read/update/delete/restore.
- **[CURRENT]** The `GET` collection handler currently requires both Organization and active Store IDs in tenant context, even though the service query lists Stores for the Organization. Preserve this as observed route behavior; review the context requirement deliberately if changing Store selection flows.
- **[CURRENT]** The service/repository contains methods for retrieving the current Store, active Stores, a Store by ID, soft deletion, and restore. `StoreService.update()` is currently a TODO with no implemented update path.
- **[CURRENT]** Create validation requires a name, code, and timezone. The persisted model defaults timezone to `Asia/Jakarta` and active state to `true`; the API schema is the current request validation contract.
- **[CURRENT]** Soft delete and restore change the Store record's `deleted_at` field. No cascading Order, Product, or Finance deletion should be inferred from these methods.

## Channel and settings boundaries

- Do not model each sales platform as a Store. A Store represents a brand/business operation; channel accounts are a separate identity layer when the product needs them.
- **[CURRENT]** No general Store channel-account entity was found in the reviewed model. Product/Order platform fields alone cannot distinguish two accounts on the same platform.
- **[OPEN]** Whether channel accounts share a Store stock allocation or use separate quotas is tracked in [Q-009](../../docs/open-questions.md#q-009--shared-store-pool-versus-per-account-channel-quotas). The source and freshness needed for channel-specific warnings are tracked in [Q-010](../../docs/open-questions.md#q-010--channel-quantity-source-freshness-and-warnings).
- **[OPEN]** Settings ownership across User, Organization, Store, Finance, and channel account scopes is tracked in [Q-013](../../docs/open-questions.md#q-013--settings-ownership-and-scope). Do not treat every Store field as part of a generic Settings module.

## Source entry points

- [Store service](../../../modules/stores/store.service.ts), [repository](../../../modules/stores/store.repository.ts), [schema](../../../modules/stores/store.schema.ts), and [model](../../../modules/stores/store.model.ts)
- [Store collection API](../../../app/api/v1/dashboard/stores/route.ts)
- [Domain and Tenancy](../../docs/architecture/domain-and-tenancy.md), [Inventory and Sales Channels](../../docs/architecture/inventory-and-channels.md), and [Open Questions](../../docs/open-questions.md)
