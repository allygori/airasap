# Settings

> **[TARGET]** Settings is a centralized dashboard hub that composes user-facing configuration from its owning capabilities. The hub owns navigation and presentation; it is not a second home for User, Organization, Store, or Finance data.

## Summary

- **[CURRENT]** `/dashboard/settings` is a read-only hub with responsive section navigation, and the dashboard sidebar links to it. Profile, Organization, Store, Finance, and Appearance entries are visible but not editable yet.
- **[CURRENT]** Better Auth owns authentication and User records. Its Organization plugin is configured, but no dashboard profile-edit workflow was found.
- **[CURRENT]** `modules/stores/` supports Store creation and listing. The Store service update method is a TODO and there is no Store item update route.
- **[CURRENT]** Finance and Accounting lifecycle/configuration fields are nested in the Organization record and are written by Finance onboarding and lifecycle code.
- **[CURRENT]** Appearance controls already exist in the dashboard, but they are not collected under Settings. Persistence for every appearance choice has not been verified as one durable user preference.
- **[CURRENT]** `/dashboard/settings` is the Settings entry point with a persistent section navigation and route-local screens planned for each setting area.
- **[TARGET]** Each screen calls the API or use case owned by the capability that owns the data. Do not add a generic Settings model or a handler that writes unrelated domains.
- **[TARGET]** Move Finance-specific configuration behind a Finance-owned boundary in the final Settings phase. **[OPEN]** The exact split between lifecycle state and editable configuration must be reviewed before implementation; see [Q-013](../../docs/open-questions.md#q-013--settings-ownership-and-scope).

## Settings areas

| Area | Data owner | Initial scope | Status |
| --- | --- | --- | --- |
| Profile | Better Auth User | Basic account profile; keep email/password security flows on Better Auth | **[TARGET]** |
| Organization | Better Auth Organization for core identity; the owning business module for its own configuration | Organization name/logo and explicitly approved core fields | **[TARGET]** |
| Store | `modules/stores/` | Edit the active Organization's Store name, code, and timezone | **[TARGET]**; update path is missing |
| Appearance | Cross-cutting user preference | Bring current theme/mode controls together; decide browser-only versus account-synced persistence | **[OPEN]** |
| Finance | `modules/finance/` | Own Finance configuration after classifying and moving Finance-specific fields out of generic Organization storage | **[TARGET]**, final phase |
| Members, integrations, billing, notifications | Their future owning capabilities | Add only after a concrete workflow and permission contract exist | **[OPEN]** |

## Decisions and assumptions

- **[CURRENT]** The Settings page is a read-only hub with nested navigation; individual forms will remain focused and can be reviewed one section at a time.
- **[TARGET]** Basic identity fields remain in Better Auth. Do not create `modules/users/` only to edit the existing Auth User name or email.
- **[TARGET]** The initial account has one user. Member invitations, role administration, and user-management screens are outside the initial Settings scope. Authentication and trusted Organization/Store scoping remain required.
- **[TARGET]** The initial implementation assumes fresh development data. No data migration or backfill is planned; any intentional schema redesign must state the development database reset requirement.
- **[OPEN]** Whether Appearance preferences should sync across browsers/devices is not decided. A browser-local preference avoids adding persistence fields, but is device-specific.

## Guides

- [Implementation plan](implementation-plan.md) — phases, scope, dependencies, and manual acceptance checks.
- [Ownership and API contracts](ownership-and-api.md) — answers about update endpoints, Better Auth, and module boundaries.
- [Authentication and Organization Access](../authentication-and-access/README.md)
- [Stores](../stores/README.md)
- [Finance](../finance/README.md)
- [Q-013 — Settings ownership and scope](../../docs/open-questions.md#q-013--settings-ownership-and-scope)
