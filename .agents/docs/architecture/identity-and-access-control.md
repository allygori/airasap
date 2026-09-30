# Identity and Access Control

This guide distinguishes authentication, tenant context, authorization, and module availability. It records the current Better Auth integration and the future role/permission direction without treating the latter as implemented.

## Terms

- **Authentication (AuthN)** establishes who the actor is, usually from a validated session.
- **Tenant context** identifies the active Organization and, when relevant, Store for a request.
- **Authorization (AuthZ)** decides whether that authenticated actor may perform a specific action on a resource in that tenant context.
- **Module availability** determines whether an Organization can use a product capability such as Finance. It does not grant an individual user permission to perform every action in that capability.
- **Feature flags** control rollout or exposure of behavior. They are not authorization checks.

## Current authentication and context

**[CURRENT]** Better Auth is configured in `lib/auth/auth.ts` and served by `app/api/auth/[...all]/route.ts`. The current configuration enables email/password sign-in, configures Google sign-in, uses the organization and admin plugins, and adds a custom Store/session plugin. `lib/auth/auth-client.ts` configures the client-side Better Auth plugins.

**[CURRENT]** Organization membership is represented through Better Auth organization support and the `Member` model. The current member schema declares `owner` and `admin` role values. The `Invitation` schema accepts an optional free-form role string, so invitation roles and member roles do not yet express one consistent, fully specified role contract.

**[CURRENT]** The custom Store plugin and `getTenantContext()` work with active organization/store values in the session. `getTenantContext()` resolves the user, active organization, and active Store identifiers for server code. Selecting an active tenant context is not itself proof that the user is authorized for every resource or operation in that context.

The `admin()` plugin is part of the Better Auth configuration. Its presence must not be interpreted as a complete application-level permission matrix for Organization and Store workflows. Authorization requirements still need to be explicit at the operation that reads or changes business data.

## Current module access is separate from user permissions

**[CURRENT]** Finance has a `FinanceEntitlementService` and an access endpoint. The current service contains temporary development behavior that returns `available: true`; its plan-based check is commented out. This is not a general module-activation service and does not prove per-Organization enable/disable behavior is implemented end to end.

**[TARGET]** Optional module activation is per Organization. Finance availability, user permissions inside Finance, and gradual rollout flags are three distinct checks with different purposes. A disabled Finance module should not be made available by a user role or client-side flag.

## Authorization principles for future work

The following principles are the recommended direction; the detailed role model remains open:

1. **Enforce on the server.** A UI may hide an unavailable action for usability, but route handlers and server-side use cases must enforce authorization before reading or mutating protected data.
2. **Use a trusted actor and tenant context.** Resolve the actor from the authenticated session. Verify active Organization membership and, for Store-scoped resources, verify that the Store belongs to that Organization.
3. **Check a specific action against a specific resource.** Being signed in, being an Organization member, selecting a Store, or having a module enabled does not automatically authorize every operation.
4. **Default to no access when a required check is absent or fails.** Do not silently widen a query or treat a missing permission value as approval.
5. **Keep permission policy separate from UI and persistence mechanics.** Components can present permission-aware UI; the server-side policy decides access. Tenant-scoped repository filters remain defense in depth, not the complete permission system.
6. **Separate roles from permissions.** A role may group permissions, but business operations should be explainable in terms of explicit actions and resource scope rather than scattered checks for a role name.
7. **Separate module access from user access.** First establish that the Organization can use the capability, then establish that this member can perform the requested action.

## Proposed starting point for discussion

This is a recommendation, not an accepted decision:

- Attach a user's Organization role to that user's **membership**, not globally to the user, because the same person may have different responsibilities in different Organizations.
- Start with a small set of predefined Organization-level roles and permissions. Add Store-scoped grants only if real workflows require different access between Stores in one Organization.
- Defer customer-configurable roles and a permission-builder UI until SaaS requirements demonstrate that predefined roles are insufficient.

The design should be recorded as `[TARGET]` only after you approve the role scope and initial role strategy.

## Open decisions

Keep these decisions `[OPEN]` in the canonical [Open Questions](../open-questions.md) register:

- [Q-002 — Organization and Store role/permission scope](../open-questions.md#q-002--organization-and-store-rolepermission-scope)
- [Q-003 — Membership lifecycle and active tenant switching](../open-questions.md#q-003--membership-lifecycle-and-active-tenant-switching)
- [Q-004 — SaaS operator/support access](../open-questions.md#q-004--saas-operatorsupport-access)
- [Q-005 — Finance entitlement, activation, and disable behavior](../open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior)

Do not encode a proposed role model into code or describe it as current behavior before that point. Consider an ADR only after the options and consequences are reviewed and a durable decision is made.

## Implementation checks for protected operations

For every route or server action that accesses tenant data, document and verify:

1. How the authenticated actor is obtained and what happens when the session is missing or invalid.
2. How active Organization membership is verified for the selected Organization.
3. Whether the resource is Organization-scoped or Store-scoped, and how its parent relationship is verified.
4. Which action permission is required after module availability is checked.
5. How list, search, update, delete, and export paths apply the same tenant and permission scope.
6. That client-provided tenant identifiers and feature-flag state cannot grant access.

The exact code pattern and API response behavior belong in the API/data-access conventions guide. This architecture guide owns the policy concepts and their unresolved choices.
