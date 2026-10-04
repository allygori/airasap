# Settings

> **[CURRENT]** Settings is a centralized dashboard hub that composes user-facing configuration from its owning capabilities. The hub owns navigation and presentation; it is not a second home for User, Organization, Store, or Finance data.

## Summary

- **[CURRENT]** `/dashboard/settings` is a hub with responsive section navigation, and the dashboard sidebar links to it. Profile supports display-name updates; Organization supports name updates; Store supports active Store name, code, and timezone updates; Finance supports the Finance calendar timezone during onboarding; Appearance supports browser-local mode and theme preferences.
- **[CURRENT]** Better Auth owns authentication and User records. Settings allows the signed-in User to update the display name; email, password, and image editing remain outside this screen.
- **[CURRENT]** The Organization screen lets the signed-in user update the active Organization name through Better Auth. No database schema change is needed for this field.
- **[OPEN]** Organization logo editing is deferred until a private-file serving contract exists for local development and deployment storage. The current shared avatar field creates data URLs and is not used for this workflow.
- **[CURRENT]** `modules/stores/` supports Store creation, listing, and update. Settings edits only the active Store through `PATCH /api/v1/dashboard/stores/:storeId`; membership, session Store ID, Organization scope, and active/non-deleted state are checked server-side.
- **[CURRENT]** Finance lifecycle and configuration state are owned by `modules/finance/` and stored in the Organization-scoped `finance_onboarding_states` collection through the `FinanceOnboarding` model, with separate `lifecycle` and `settings` subdocuments. The unused legacy `Organization.accounting` path and the former `Organization.finance` field are removed from the Organization model; active Accounting workflows remain part of `modules/finance/`.
- **[CURRENT]** Appearance controls are collected at `/dashboard/settings/appearance`. Mode uses the `theme` localStorage key through `@wrksz/themes`; dashboard color/style selection uses `airasap-appearance-theme`. These preferences are device/browser-specific and do not write to the database or Session model.
- **[CURRENT]** `/dashboard/settings` is the Settings entry point with persistent section navigation. Profile, Organization, active Store, Finance, and Appearance have focused screens.
- **[TARGET]** Each screen calls the API or use case owned by the capability that owns the data. Do not add a generic Settings model or a handler that writes unrelated domains.
- **[CURRENT]** Finance settings use Finance-owned schemas, services, persistence, and `/api/v1/dashboard/finance/settings`; Settings owns only the UI composition. The split is recorded in [ADR-0003](../../ADR/0003-finance-owned-organization-state.md).

## Settings areas

| Area | Data owner | Initial scope | Status |
| --- | --- | --- | --- |
| Profile | Better Auth User | Update the signed-in account display name; email/password security flows remain separate | **[CURRENT]** |
| Organization | Better Auth Organization for core identity; the owning business module for its own configuration | Edit active Organization name; do not edit slug or logo in this slice | Name **[CURRENT]**; logo **[OPEN]** |
| Store | `modules/stores/` | Edit the active Store's name, code, and timezone | **[CURRENT]** |
| Appearance | Browser-local preference | Set system/light/dark mode and dashboard theme/style for this browser | **[CURRENT]**; cross-device sync **[OPEN]** |
| Finance | `modules/finance/` | Edit Finance calendar timezone during onboarding; lifecycle and settings data use Finance-owned persistence | **[CURRENT]** |
| Members, integrations, billing, notifications | Their future owning capabilities | Add only after a concrete workflow and permission contract exist | **[OPEN]** |

## Decisions and assumptions

- **[CURRENT]** The Settings hub uses nested navigation, and each implemented screen has a focused form that can be reviewed one section at a time.
- **[CURRENT]** Basic identity fields remain in Better Auth. Do not create `modules/users/` only to edit the existing Auth User name or email.
- **[CURRENT]** The application currently has one user. Member invitations, role administration, and user-management screens are outside the initial Settings scope. Authentication and trusted Organization/Store scoping remain required.
- **[TARGET]** The initial implementation assumes fresh development data. No data migration or backfill is planned; any intentional schema redesign must state the development database reset requirement.
- **[CURRENT]** Appearance preferences are stored in browser localStorage and do not add persistence fields. **[OPEN]** Whether they should later sync across browsers/devices is undecided.

## Guides

- [Implementation plan](implementation-plan.md) — phases, scope, dependencies, and manual acceptance checks.
- [Ownership and API contracts](ownership-and-api.md) — answers about update endpoints, Better Auth, and module boundaries.
- [Authentication and Organization Access](../authentication-and-access/README.md)
- [Stores](../stores/README.md)
- [Finance](../finance/README.md)
- [Q-013 — Settings ownership and scope](../../docs/open-questions.md#q-013--settings-ownership-and-scope)
