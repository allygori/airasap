# Settings Ownership and API Contracts

> **[TARGET]** The Settings UI is a cross-domain composition. A setting's persistence and business rules stay with the capability that owns the setting.

## 1. Does every module need its own Settings endpoint?

Not one endpoint per field or form card. Each owner needs an explicit server-side write operation when a setting is editable, but the transport should follow the existing owner and use case.

- **Better Auth-owned User and Organization identity:** use Better Auth's supported operations for the installed version where they cover the required behavior. Profile name updates use `auth.api.updateUser`; Organization name updates use `auth.api.updateOrganization` for the active Organization, without accepting a client-supplied Organization ID. Better Auth enforces membership and the `organization.update` permission. Do not duplicate those writes with raw Mongoose operations.
- **Store:** add an Organization-scoped Store update use case and item route in the existing Store API because no update route exists and `StoreService.update()` is a TODO. A target route is `PATCH /api/v1/dashboard/stores/:storeId`.
- **Finance:** in the final Finance phase, expose changes through a Finance-owned service/schema and route. Do not patch Finance data through a general Settings endpoint.
- **Appearance:** use browser persistence for a device-local preference, or a User-owned preference contract if cross-device sync is selected. The latter remains open.

A page may compose more than one owner when a screen genuinely needs it, but it must call each owner's contract. Do not create `PATCH /api/v1/dashboard/settings` as a generic endpoint that accepts mixed User, Organization, Store, and Finance payloads. The Settings route group may be used for read-only composition or genuinely cross-cutting preferences only after ownership is explicit.

All application-owned routes still validate with Zod, resolve the authenticated actor and tenant context on the server, enforce the action, use the standard response envelope, and delegate business rules to the owning module. A client-provided Organization/Store ID is not authorization. See [API and Data Access](../../docs/conventions/api-and-data-access.md).

## 2. Does Profile belong in `modules/users/`?

**[CURRENT]** No `modules/users/` domain exists. Better Auth is configured with the `users` model in `lib/auth/configs/user.ts`, and authentication/profile identity fields belong to the Auth integration. Settings has a basic Profile workflow for the signed-in user.

**[CURRENT]** `/dashboard/settings/profile` edits only the signed-in User's display name. `PATCH /api/v1/dashboard/settings/profile` validates the payload with Zod and delegates persistence to Better Auth's `auth.api.updateUser`, forwarding the updated session cookie. The page is UI composition; `lib/auth/` remains the Better Auth integration boundary. Do not create a second User model, repository, or `modules/users/` only to edit basic identity fields.

**[OPEN]** If the application later adds user-owned business data or workflows that are not authentication/profile concerns, review a dedicated user-domain module then. Cross-device preferences may also need an explicitly User-owned preference contract; they should not be added as arbitrary Better Auth fields without a defined owner and lifecycle.

Email changes, password changes, recovery, and account deletion are security workflows rather than ordinary profile text edits. Use Better Auth-supported flows, including verification where required, and implement them only after the user-facing recovery contract is defined.

## Data ownership map

| Setting | Current source / owner | Settings behavior |
| --- | --- | --- |
| Display name and Auth profile | Better Auth User | **[CURRENT]** A validated profile route calls Better Auth's supported update operation for the current session |
| Organization display name | Better Auth Organization plugin | **[CURRENT]** A validated `PATCH /api/v1/dashboard/settings/organization` sends only `name`; Better Auth resolves the active Organization from the session and enforces membership/update permission |
| Organization logo | Better Auth logo string plus private-file storage boundary | **[OPEN]** No logo edit until local and deployment files have an authenticated browser-readable path. The current shared AvatarField emits data URLs |
| Organization slug | Better Auth Organization plugin | **[CURRENT]** Not editable from Settings; changing it requires a separate product and routing decision |
| Store name/code/timezone | `modules/stores/` and `StoreModel` | Add a Store update use case and tenant-scoped route |
| Finance lifecycle | Currently nested in `Organization.finance` / `Organization.accounting` and managed partly by Finance onboarding/lifecycle code | Keep lifecycle semantics distinct; do not move as a blind settings-field copy |
| Finance preferences/configuration | Currently mixed into Organization subdocuments | Target Finance-owned configuration contract in the final phase; exact fields and storage shape remain open pending inventory |
| Light/dark mode and color theme | Current dashboard theme components/providers | Group in Appearance; decide device-local versus User-synced persistence |

## Implementation boundaries

- The `modules/organizations/OrganizationService` is not a general Settings service. Inspect its actual operations before reusing it; do not infer update capabilities from the module name.
- `modules/stores/` owns Store rules and writes. The Settings page must not import its Mongoose model directly.
- `modules/finance/` owns Finance behavior, including accounting lifecycle guards and posting effects. The final settings phase must preserve those boundaries.
- Use `components/form/form.hook.tsx`, existing field components, and Zod schemas for forms. Keep page composition server-side where possible and isolate interactive form behavior in route-local components.
- Keep one-user scope in the initial UX, but continue server-side session and tenant checks. Do not add member management or role configuration as a side effect of making Profile/Organization settings editable.
