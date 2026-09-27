# ADR 0001 — Finance Is an Optional Module

Status: Accepted

## Context

The application must remain useful for marketplace sellers and UMKM users who
only need Orders, Products, and Reports. Finance is an additional capability,
not a prerequisite for the basic dashboard.

## Decision

Finance is activated per organization through a server-side module access
state. The basic product must remain usable when Finance is inactive.

The UI may hide or replace Finance navigation with an onboarding entry, but
page, route, and service boundaries must also reject Finance operations when
the module is inactive.

No generic feature-flag provider or permission engine is implemented as part of
the first Finance release. The boundary should remain small enough to migrate
to the future platform-level feature flag or entitlement system.

For development testing, the premium-organization-plan check is temporarily
bypassed in `FinanceEntitlementService`. This does not make Finance globally
active: a signed-in user still needs an active organization, and journal
posting remains gated by that organization's `organization.finance` lifecycle
state. Restore the plan check only after the Finance workflows are verified.

## Consequences

- Orders import must not post Finance journals when Finance is inactive.
- Finance routes need a simple server-side guard.
- Basic modules must not depend on Finance completion.
- Future generic rollout and entitlement infrastructure remains a separate
  platform goal.
