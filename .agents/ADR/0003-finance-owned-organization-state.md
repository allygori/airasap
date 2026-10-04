# ADR-0003: Finance-Owned Organization State

- **Status:** accepted
- **Date:** 2026-10-04
- **Decision scope:** [CURRENT] implementation
- **Supersedes:** None
- **Superseded by:** None

## Context

Finance lifecycle and calendar configuration were stored in the `Organization.finance` subdocument. Finance onboarding, period calculation, reports, and operational workflows all consume this state, while Finance owns the rules that interpret it. The separate legacy `Organization.accounting` subdocument was unused and had already been removed.

Keeping Finance state in the Organization model made a Finance-owned workflow depend on Organization persistence paths and mixed module activation bookkeeping with editable configuration. The Settings hub also needs a Finance-owned read/write contract. Development data is disposable and no migration or backfill is required.

## Decision drivers

- Finance should own its lifecycle transitions, settings validation, and persistence.
- Lifecycle facts and editable preferences should remain distinguishable.
- All state must remain scoped to the trusted Organization.
- Settings must not bypass onboarding rules or rewrite financial history.
- The fresh-data development workflow must not introduce a migration requirement.

## Options considered

### Option A — Keep Finance fields on Organization and move only service ownership

This avoids creating a collection and keeps lifecycle reads near Organization identity. It also leaves Finance state in an Organization-owned persistence schema and retains a cross-module write seam for every Finance transition.

### Option B — Store Finance state in a Finance-owned Organization record

This adds one Organization-scoped record and query, but places lifecycle and settings persistence with the Finance rules that own them. Nested `lifecycle` and `settings` paths keep activation bookkeeping separate from editable configuration.

## Decision

Use the Finance-owned `finance_onboarding_states` collection with one uniquely indexed record per Organization. The Mongoose model is named `FinanceOnboarding` and is defined in `modules/finance/onboarding/finance-onboarding.model.ts`; the explicit collection name is only the MongoDB collection name. Store lifecycle fields under `lifecycle` and editable Finance configuration under `settings`. `FinanceLifecycleService` owns activation transitions; `FinanceSettingsService` owns settings reads and writes.

Remove `Organization.finance` from the Organization Zod and Mongoose schemas and remove Finance lifecycle repository operations from `OrganizationRepository`. Organization continues to own its identity and plan fields. Finance entitlement may read the Organization plan through the Organization repository, while Finance lifecycle and settings data come from the Finance repository.

The current editable Finance setting is `settings.calendar_timezone`. Owners may update it during Finance onboarding before any Finance journal exists. The existing lock after activation or journal creation remains in force. The old unused account mappings are not recreated without an active consumer.

## Consequences

### Positive

- Finance onboarding, readiness, periods, reports, and settings now use Finance-owned state.
- Lifecycle metadata and editable settings have distinct persistence paths and service ownership.
- The Settings UI calls a Finance-owned endpoint instead of writing Organization fields.

### Costs and constraints

- Finance state reads now query `finance_onboarding_states` separately from Organization identity or plan data.
- The application does not copy values from the former `Organization.finance` field or the prior intermediate `finance_organization_states` collection. Existing development data should be reset or the obsolete fields/collection removed manually.
- New Finance state records rely on a unique Organization index and tenant-scoped repository operations.

## Implementation status

- **[CURRENT]** The Finance model, repository, lifecycle service, settings service, onboarding flow, periods, reports, and Settings route use the new contract.
- **[CURRENT]** The Organization schema/model no longer declare `finance`.
- **[CURRENT]** `/dashboard/settings/finance` edits the calendar timezone when Finance onboarding permits it.

See the [Finance guide](../features/finance/README.md), [Settings plan](../features/settings/implementation-plan.md), [Settings ownership contracts](../features/settings/ownership-and-api.md), and [MongoDB conventions](../docs/conventions/mongodb-and-schema.md).

## Open questions and related records

- [Q-013 — Settings ownership and scope](../docs/open-questions.md#q-013--settings-ownership-and-scope) remains open for Organization logo delivery, cross-device preference sync, and future multi-member access requirements.
- [ADR-0002 — Organization-scoped optional module activation](0002-organization-scoped-module-activation.md) describes the separate future module entitlement/activation boundary.
