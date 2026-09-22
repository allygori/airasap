# Finance Plan 01 — Foundation and Optional Access

Status: [TARGET]

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

Open question: reuse the existing organization accounting state or introduce a
Finance-owned state. Do not decide by naming alone; inspect current consumers
first.

### Phase 1.2 — Finance route and UI shell

Prepare the Finance dashboard shell, navigation boundary, page composition,
and API route boundary under the finance paths.

Acceptance criteria:

- financeNav is the only navigation entry point for the optional module;
- inactive Finance shows a simple gate or onboarding entry;
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

