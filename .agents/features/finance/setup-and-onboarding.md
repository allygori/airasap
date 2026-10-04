# Finance Setup and Onboarding

> This guide describes the current Organization-scoped Finance lifecycle and setup workflows. It does not define the future Organization-level module toggle or subscription policy.

## Access and lifecycle

- **[CURRENT]** Finance tenant context requires an Organization ID and may carry a user and Store ID. Finance lifecycle and settings state are stored in `finance_onboarding_states` through the `FinanceOnboarding` model, scoped by its required `organization` reference.
- **[CURRENT]** Lifecycle states are `not_started`, `in_progress`, `blocked`, and `active`. When state is absent, the current normalizer treats it as `not_started` with `Asia/Jakarta` as the calendar timezone.
- **[CURRENT]** Readiness reports the lifecycle state and checks whether the current user is an Organization owner for starting or continuing setup. Starting Finance requires owner access and initializes the default Chart of Accounts.
- **[CURRENT]** `FinanceEntitlementService` currently returns Finance as available for every Organization in development. It does not implement a runtime Organization module switch or enforce the commented premium-plan check.
- **[CURRENT]** `assertFinanceModuleActive()` and lifecycle guards protect workflows that require Finance to be active. Entitlement, Organization activation, user authorization, and setup readiness remain distinct checks; see [Optional Modules and Feature Flags](../../docs/architecture/optional-modules-and-flags.md).
- **[TARGET]** Runtime activation is per Organization and Inventory is included in Finance. The accepted scope is recorded in [ADR-0002](../../ADR/0002-organization-scoped-module-activation.md); what users can read or finish after disablement remains open in [Q-005](../../docs/open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior).

## Current onboarding workflow

1. An Organization owner checks Finance readiness and starts onboarding.
2. Finance ensures the default accounts exist and moves Finance lifecycle state to `in_progress`.
3. The owner may set the Finance calendar timezone during onboarding through `FinanceSettingsService`. It is locked after Finance becomes active or after the first journal exists; the Settings screen uses the same server-side guard.
4. Opening-balance setup accepts a draft, supports preview, and finalizes the selected balances at a cut-off date. Finalization can create an opening journal, inventory opening movements, and receivable/payable subledger items, then activates Finance.
5. During `in_progress`, an owner can add bank accounts under the seeded Bank account role. This setup flow is not a general account-management permission model.

An opening-balance line marked `skipped` is an explicit onboarding choice; do not assume it creates a posted balance. Inspect the opening-balance service and its preview before changing this workflow.

## Boundaries and limitations

- **[CURRENT]** Finance readiness is not equivalent to user authorization for every Finance action. The current owner check is used specifically by onboarding paths; future role/permission scope remains in [Q-002](../../docs/open-questions.md#q-002--organization-and-store-rolepermission-scope).
- **[CURRENT]** The Finance lifecycle is not yet the general Organization-level runtime plugin/module registry.
- **[OPEN]** Entitlement versus activation and read/export/finish behavior after Finance disablement are tracked in [Q-005](../../docs/open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior).

## Source entry points

- [Lifecycle service](../../../modules/finance/finance-lifecycle.service.ts), [settings service](../../../modules/finance/finance-settings.service.ts), [Finance state types](../../../modules/finance/finance.types.ts), and [entitlement service](../../../modules/finance/finance-entitlement.service.ts)
- [Opening-balance service](../../../modules/finance/onboarding/finance-opening-balance.service.ts) and [bank-account onboarding service](../../../modules/finance/onboarding/finance-bank-account-onboarding.service.ts)
- [Finance onboarding API routes](../../../app/api/v1/dashboard/finance/onboarding/)
- [Identity and access control](../../docs/architecture/identity-and-access-control.md) and [optional modules](../../docs/architecture/optional-modules-and-flags.md)
