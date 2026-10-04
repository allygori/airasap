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
3. During `in_progress`, Step 2 (Kas, bank, dan e-wallet) is required in both entered-balance and start-from-zero modes. Finance activation requires at least one active, postable bank or e-wallet account. Physical Store Cash remains optional.
4. Bank accounts are postable children of the seeded nonpostable `1120 Bank Operasional` group; e-wallet accounts are postable children of the seeded nonpostable `1140 Saldo E-wallet` group. Their add forms are separate and remain hidden until requested. Bank and e-wallet account creation is available during onboarding only; post-onboarding account management is a separate plan.
5. The first bank or e-wallet account added during onboarding becomes the initial Shopee payout bookkeeping destination. The owner can change it in `/dashboard/settings/finance` while Finance is `in_progress` or `active`. This does not configure payout instructions in Shopee.
6. The owner may set the Finance calendar timezone during onboarding through `FinanceSettingsService`. It is locked after Finance becomes active or after the first journal exists; the Settings screen uses the same server-side guard.
7. Opening-balance setup accepts a draft, supports preview, and finalizes the selected balances at a cut-off date. Entered-balance mode can create an opening journal, inventory opening movements, and receivable/payable subledger items; start-from-zero mode skips opening balances. Both paths require a receiving account before activation.
8. **[CURRENT]** The onboarding URL stores its view state in readable query parameters: `mode=entered|zero` and `step=start|accounts|inventory|liabilities|review`. The mode is included even for shared steps such as `accounts`, because each mode has different balance-entry behavior. Invalid or mode-incompatible steps are normalized to an available step. Step changes use browser history, so Back and Forward restore the previous mode and step.
9. **[CURRENT]** The opening-balance wizard keeps one TanStack form instance for the draft. Each step is a route-local `withForm` subform under `app/dashboard/finance/onboarding/_components/steps/`; shared step UI and form helpers live in `steps/shared/`, while entered-balance-only steps live in `steps/existing-balance-mode/`. Keep workflow persistence and server validation in the client controller and Finance domain services; the step components only present and edit the shared draft.

An opening-balance line marked `skipped` is an explicit onboarding choice; do not assume it creates a posted balance. Inspect the opening-balance service and its preview before changing this workflow.

## Boundaries and limitations

- **[CURRENT]** Finance readiness is not equivalent to user authorization for every Finance action. The current owner check is used specifically by onboarding paths; future role/permission scope remains in [Q-002](../../docs/open-questions.md#q-002--organization-and-store-rolepermission-scope).
- **[CURRENT]** The Finance lifecycle is not yet the general Organization-level runtime plugin/module registry.
- **[CURRENT]** Chart of Accounts seeding uses insert-only defaults. The changed account hierarchy and flags apply to newly initialized Finance data; no migration updates an existing Organization's seeded accounts. Manual browser verification of this change should use a fresh Finance setup as agreed.
- **[OPEN]** Add, edit, deactivate, and archive bank/e-wallet accounts after Finance activation as a separate account-management feature. The current Settings control only changes the Shopee payout bookkeeping destination among existing eligible accounts.
- **[OPEN]** Entitlement versus activation and read/export/finish behavior after Finance disablement are tracked in [Q-005](../../docs/open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior).

## Source entry points

- [Lifecycle service](../../../modules/finance/finance-lifecycle.service.ts), [settings service](../../../modules/finance/finance-settings.service.ts), [Finance state types](../../../modules/finance/finance.types.ts), and [entitlement service](../../../modules/finance/finance-entitlement.service.ts)
- [Opening-balance service](../../../modules/finance/onboarding/finance-opening-balance.service.ts), [bank-account onboarding service](../../../modules/finance/onboarding/finance-bank-account-onboarding.service.ts), and [e-wallet onboarding service](../../../modules/finance/onboarding/finance-e-wallet-account-onboarding.service.ts)
- [Opening-balance client controller](../../../app/dashboard/finance/onboarding/_components/finance-opening-balance.client.tsx), [wizard shell](../../../app/dashboard/finance/onboarding/_components/finance-opening-balance.form.tsx), and the step subforms in [steps/shared](../../../app/dashboard/finance/onboarding/_components/steps/shared/)
- [Finance onboarding API routes](../../../app/api/v1/dashboard/finance/onboarding/), including bank and e-wallet account creation
- [Identity and access control](../../docs/architecture/identity-and-access-control.md) and [optional modules](../../docs/architecture/optional-modules-and-flags.md)
