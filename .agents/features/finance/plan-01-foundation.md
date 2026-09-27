# Finance Plan 01 — Foundation and Optional Access

Status: [CURRENT / IMPLEMENTED]

## Goal

Create an isolated Finance application boundary without changing the basic
Orders, Products, or Reports experience.

## Phases

### Phase 1.1 — Boundary and activation contract

Define the organization-level Finance activation state and the minimum
server-side access contract.

Acceptance criteria:

- the state has explicit inactive, onboarding, and active behavior;
- the contract does not depend on browser-only state;
- disabled Finance does not block basic application features;
- the exact persistence owner is documented before implementation.

Implementation status: Finance lifecycle state is organization-owned at
`organization.finance`. The Finance route/UI shell, shared API/auth/tenant
infrastructure, and server-side activation guard are in place. Finance
disabled paths are covered by focused tests. Sales source integration with the
Orders import/enrichment flows is implemented in Plan 04. A temporary
development override currently allows Finance access for all organization
plans so the owner can test the module. The premium-plan check is kept
commented at `FinanceEntitlementService`; restore it only after Finance flows
have been verified. Authentication, an active organization, and the Finance
lifecycle are still required for their respective pages/actions.

Legacy Accounting compatibility fields and retry/reconstruction services
remain [LEGACY] while that package is still present. New Finance modules do
not import or use them. Remove the compatibility surface together with the
legacy Accounting package after the Finance review, without a data migration.

### Phase 1.2 — Finance route and UI shell

Prepare the Finance dashboard shell, navigation boundary, page composition,
and API route boundary under the finance paths.

Acceptance criteria:

- financeNav is the only navigation entry point for the optional module;
- inactive Finance shows its landing/onboarding state;
- the premium-plan gate is temporarily bypassed for development testing;
- no old accounting page is required to render the Finance shell;
- route-level access is enforced server-side.

### Phase 1.3 — Shared contract and verification baseline

Define the Finance response, error, tenant, and test conventions by reusing the
repository's shared infrastructure.

Acceptance criteria:

- no second database connection, auth configuration, or response envelope;
- Finance endpoints have tenant-scoped access checks;
- disabled and active paths have focused tests;
- the old Orders import still works when Finance is disabled.

## Not in scope

- generic feature-flag provider;
- rollout percentage system;
- permission engine redesign;
- changes to Orders, Products, or Reports UI;
- accounting posting behavior.

## Dependencies

- existing tenant context and auth;
- financeNav;
- current dashboard layout;
- decision on Finance activation persistence.
