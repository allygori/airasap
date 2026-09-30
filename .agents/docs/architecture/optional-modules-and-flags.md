# Optional Modules and Feature Flags

This guide separates Organization-level module availability from Finance setup state, user authorization, and release rollout. The product direction is to enable or disable optional modules per Organization at runtime; a general module or feature-flag service is not currently established.

## Concepts that must stay distinct

| Concept | Question it answers | Scope | Current state |
| --- | --- | --- | --- |
| Authentication | Who is making this request? | User/session | Better Auth is configured. |
| Tenant membership and authorization | May this user access this Organization, Store, resource, or action? | Membership and resource | Membership context exists; the complete future roles/permissions policy remains open. See `identity-and-access-control.md`. |
| Module entitlement | Is this Organization allowed to use a module under the applicable product/subscription policy? | Organization + module | Finance has a specific entitlement service, but its current development behavior returns `available: true`; the plan check is commented out. No general entitlement service was found. |
| Module activation | Has this Organization enabled the module for its own use? | Organization + module | Per-Organization runtime activation is the agreed target; there is no general module registry or toggle system today. |
| Module readiness/lifecycle | Has the Organization completed required setup to use the module's workflows? | Organization + module | Finance has a persisted onboarding lifecycle. `finance.status === 'active'` means the Finance lifecycle is active; it is not the same thing as an independent module-toggle setting. |
| Release feature flag | Should a new behavior be exposed to a rollout audience? | Release audience, possibly Organization or user | No general feature-flag service was found. |

One check must not impersonate another: being a member does not activate a module; an active module does not grant a member every permission; onboarding readiness does not equal subscription entitlement; a release flag never authorizes a request.

## Current Finance behavior

**[CURRENT]** Finance access uses `FinanceEntitlementService`, `FinanceLifecycleService`, and `assertFinanceModuleActive()` in different paths. The entitlement service currently reports Finance as available for every Organization during development. The lifecycle service separately tracks onboarding/setup status and guards workflows that require Finance to be active. Finance pages and API routes use these checks, but this is Finance-specific behavior rather than a shared optional-module system.

**[TARGET]** Finance can be enabled or disabled per Organization at runtime. Inventory belongs to Finance, so disabling Finance also makes its Inventory capabilities unavailable. Other modules must not depend on Finance being enabled for their core workflows. This direction is accepted in [ADR-0002 — Organization-Scoped Optional Module Activation](../../ADR/0002-organization-scoped-module-activation.md); entitlement and disablement details remain open in Q-005.

## Recommended target behavior

1. **Keep code deployed; gate capability at runtime.** Optional means the Organization cannot use that capability while it is disabled. It does not mean loading and unloading code packages or installing arbitrary third-party plugins.
2. **Evaluate capability on the server.** Pages can adapt their navigation and presentation, but protected API routes and server-side use cases must enforce the module's availability. Client state is never the gate that protects data or writes.
3. **Separate module availability from action permissions.** The server first establishes actor and tenant context, then applies module policy, authorization, and domain lifecycle/invariant checks as appropriate for the operation.
4. **Use one policy per module, not scattered booleans.** Each module should expose a documented capability/readiness policy to application composition and consumers rather than repeating ad hoc `if (organization.finance)` checks across routes and components.
5. **Preserve tenant isolation.** Every capability decision is for the resolved Organization and must not be selected or overridden by a client-provided tenant ID.
6. **Do not erase data when a module is disabled.** Disabling a module should not implicitly delete its persisted data. Whether data remains readable, exportable, or read-only after disablement must be decided explicitly.

A conceptual server-side flow is:

```text
authenticated actor + verified tenant context
  -> module entitlement/activation policy
  -> user authorization for the action and resource
  -> module readiness and business invariants
  -> module use case
```

This is a policy checklist, not a requirement to create a universal framework before multiple modules need one.

## Feature-flag guidance

**[TARGET]** Use feature flags for controlled rollout of a change, such as enabling a new workflow for a small set of Organizations before wider release. Use module activation for a durable Organization choice, and entitlement for a subscription or product policy. If a flag is removed after rollout, the underlying module entitlement and authorization behavior should remain clear.

When a feature-flag system is introduced:

- Evaluate security-sensitive flags on the server. A browser flag may hide UI, but cannot grant access.
- Give each flag a name, purpose, owner, default behavior, rollout scope, and removal condition.
- Choose a safe default for unavailable flag state; do not accidentally grant module access or permissions when evaluation fails.
- Avoid permanent flags for ordinary user preferences or module licensing. Remove temporary rollout flags after rollout or rollback decisions are complete.
- Cover both enabled and disabled behavior for the affected workflow in its tests.

Do not build a dynamic plugin loader, marketplace for plugins, or generic event framework solely to support feature flags. Runtime activation selects which deployed business capability is available; it does not make the source code itself pluggable.

## Open questions

Keep these decisions `[OPEN]` or `deferred` in the canonical [Open Questions](../open-questions.md) register:

- [Q-005 — Finance entitlement, activation, and disable behavior](../open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior)
- [Q-006 — Feature-flag scope and ownership](../open-questions.md#q-006--feature-flag-scope-and-ownership)
- [Q-016 — Marketing capability scope and optionality](../open-questions.md#q-016--marketing-capability-scope-and-optionality)

Do not create accepted ADRs for these questions until the options, trade-offs, and decision are reviewed together. Once a choice is made, update this guide and record an ADR if it is durable or costly to reverse.
