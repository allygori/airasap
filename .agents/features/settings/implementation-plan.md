# Settings Implementation Plan

> This plan tracks Settings in small, reviewable phases. **[CURRENT]** marks implemented behavior; **[TARGET]** marks planned work. Finish one phase, let the user review it in the browser, then begin the next.

## Principles

1. Keep `/dashboard/settings` as the shared navigation and presentation shell.
2. Let Better Auth and business modules continue to own their data and rules.
3. Do not create a generic `settings` collection, catch-all settings service, or endpoint that mutates unrelated domains.
4. Keep page and form components thin. Use Server Components by default, the existing TanStack React Form primitives, and server-side Zod validation.
5. Respect authenticated actor and trusted Organization/Store context on every write, even for the initial single-user setup.
6. The development database starts fresh. No migration or backfill is planned; document when a reset is required after a schema redesign.
7. Keep Finance configuration extraction until the final phase, after the simpler sections have been reviewed.

## Phase 1 — Settings hub and navigation

**Status: [CURRENT]**

### Scope

- Add `/dashboard/settings` and a Settings layout with persistent section navigation, page title, description, and a responsive content area.
- Point the `Settings` item in `constant/menu.ts` to `/dashboard/settings` and render it in the dashboard sidebar.
- Add section routes as each section is implemented; do not create placeholder forms that imply working behavior.
- Keep the hub UI-only. It should not add a Settings model, API, or shared persistence layer.

### Acceptance checks

- The Settings link opens the hub from the dashboard sidebar.
- At the end of this phase, Ringkasan was the only active destination in Settings navigation.
- At the completion of this phase, Profile, Organization, Store, Finance, and Appearance were marked planned and had no editable controls.
- Navigation works on narrow and wide screens, supports keyboard use, and clearly marks the active section.
- An unimplemented section is not presented as editable.

## Phase 2 — Profile

**Status: [CURRENT]**

### Scope

- Add a Profile page under Settings and read the authenticated Better Auth User.
- Start with the basic display name. Include profile image only after confirming its storage and Better Auth update contract.
- Validate the display name with Zod in `PATCH /api/v1/dashboard/settings/profile`, then call Better Auth's supported `updateUser` operation using the request session. Do not write the `users` collection directly or add a parallel Mongoose User model.
- Keep email change, password change, account deletion, and session management out of the first slice unless their verification/recovery flows are specified.
- Do not create `modules/users/` just for basic Auth profile fields. A User domain module is a future option only if the application gains user-owned business workflows beyond authentication/profile.

### Acceptance checks

- The page shows the signed-in account, not a client-selected user ID.
- The email remains read-only; the name update persists and appears in the account UI after refresh.
- A valid name change persists and is reflected after refresh; invalid or unauthenticated requests fail safely.
- No unrelated user or tenant data is returned.

## Phase 3 — Organization profile

**Status: [CURRENT] for Organization name; [OPEN] for Organization logo.**

### Scope

- **[CURRENT]** Edit only the active Organization display name through Better Auth's supported `updateOrganization` API. The server uses the active Organization in the session; Better Auth enforces membership and update permission.
- Keep authentication-owned Organization identity fields under Better Auth. Any application-owned Organization configuration must be changed through its owning business module.
- Do not expose slug changes, deletion, ownership transfer, or member management in the initial form unless their consequences and authorization rules are separately agreed.
- **[OPEN]** Decide logo upload only after defining how private local and deployment files will be served to the browser. The existing `AvatarField` submits a data URL, while the file-storage helper has no authenticated read route; do not persist the data URL or introduce another storage mechanism in this phase.
- The Organization name update reuses the existing Better Auth field and does not change the database schema.

### Acceptance checks

- **[CURRENT]** The update targets the active Organization from the server-side session; Better Auth verifies the signed-in actor's membership and update permission.
- **[CURRENT]** Changing the Organization name does not change Store ownership or rewrite Finance history, and requires no schema change.
- **[OPEN]** Logo upload needs an authenticated, browser-readable path for local and deployment storage before it is added.

## Phase 4 — Store settings

**Status: [CURRENT]**

### Scope

- **[CURRENT]** Add an Organization-scoped Store edit screen for the active Store name, code, and timezone.
- **[CURRENT]** `StoreService.update()` validates its input and calls a tenant-scoped repository update that does not upsert. It only updates an active, undeleted Store.
- **[CURRENT]** `PATCH /api/v1/dashboard/stores/:storeId` validates ID and payload, verifies active Organization membership through Better Auth, requires the route ID to match the Store ID in session, and calls `modules/stores/`.
- **[CURRENT]** This phase changes request validation and update behavior only; it does not change the Mongoose Store schema or require a database migration.
- Do not accept Organization or Store IDs from the form as proof of access. The route Store ID is checked against trusted session context and the repository also scopes by Organization.
- Treat active Store switching as session/context behavior, not as a Store profile update.

### Acceptance checks

- **[CURRENT]** The screen loads the current Store from trusted session context; the endpoint rejects a different Store ID and the repository scopes updates by Organization.
- **[CURRENT]** Name/code/timezone updates persist and render after refresh.
- **[CURRENT]** Existing Product, Order, and Finance records keep their own snapshots and relationships; the update does not cascade changes into them.

## Phase 5 — Appearance and interface preferences

**Status: [CURRENT]**

### Scope

- **[CURRENT]** Bring system/light/dark mode and dashboard theme choices into `/dashboard/settings/appearance`, reusing the installed theme provider and existing theme selector.
- **[CURRENT]** Persist color mode under the `theme` browser `localStorage` key and the dashboard theme in `airasap-appearance-theme`. Changes apply immediately and synchronize between same-origin tabs.
- **[CURRENT]** Theme selection updates the dashboard root classes and color tokens. No API, database, or Session field is used; preferences are device/browser-specific.
- **[OPEN]** Cross-browser/device synchronization remains out of scope until a User-owned preference contract is explicitly chosen.
- Do not add language, date, or accessibility preferences without defining their effect and scope.

### Acceptance checks

- **[CURRENT]** Settings exposes accessible mode and theme selectors; mode includes system, light, and dark.
- **[CURRENT]** Blue, green, and amber themes update the primary color tokens; scaled and mono options continue to apply their dashboard styles.
- **[CURRENT]** Browser-local choices are restored without server/client markup depending on `localStorage` and without adding User/Session persistence.
- **[OPEN]** A preference that follows a User across devices requires a separate ownership and synchronization decision.

## Phase 6 — Finance configuration ownership (final Settings phase)

**Status: [TARGET]** for Finance ownership; **[OPEN]** for the exact field split and persisted shape.

### Scope

- Inventory the fields currently nested on Organization under `finance` and `accounting`, and identify every onboarding, lifecycle, API, and accounting consumer before moving them.
- Separate Finance lifecycle/activation bookkeeping from editable Finance configuration. Do not move status fields merely because they share a parent document with settings.
- Move Finance-specific configuration—such as Finance calendar timezone, accounting mappings, or cutoff configuration where domain review confirms ownership—behind Finance-owned services and schemas in `modules/finance/`.
- Choose a Finance-owned persistence shape only after reviewing read/write patterns. Prefer a narrowly scoped Finance configuration record over a generic cross-domain Settings model.
- Update Finance onboarding and existing lifecycle/accounting consumers to use the new Finance contract in the same phase. Preserve posting guards and make configuration changes apply prospectively unless a specific historical recalculation is approved.
- Use Finance-owned routes/use cases for Finance settings. Do not let the general Settings page write Organization model fields directly.
- Because development starts fresh, no migration/backfill is planned. If field storage changes, reset development data and update fixtures/docs in this phase.

### Acceptance checks

- No application workflow continues to read/write a Finance-owned preference through a generic Settings or Organization UI path after cutover.
- Existing onboarding, Finance readiness, journal posting, and report behavior use the agreed Finance-owned contract.
- Changing a Finance setting cannot silently rewrite already-posted journals or historical operational records.
- The reset/no-migration assumption is explicit before the schema change is applied.

## Phase 7 — Future settings areas

**Status: [OPEN]**

Defer invitations/member roles, channel-account credentials, marketplace integrations, billing/subscription, notifications, data-retention, and Organization/Store deletion controls. Add an area only after its owning capability, authorization rules, data lifecycle, and acceptance criteria are defined. See [Q-002 through Q-005](../../docs/open-questions.md) and the relevant feature guides.

## Form and component implementation guidance

- Follow [React and UI Conventions](../../docs/conventions/react-and-ui.md) and [API and Data Access](../../docs/conventions/api-and-data-access.md).
- Before each Settings UI implementation slice, reread [React and UI Conventions](../../docs/conventions/react-and-ui.md) and inspect the current route/component examples; the guidance must be applied when the UI is built, not only when this plan is written.
- For forms, inspect and reuse `components/form/form.hook.tsx`, its `useAppForm`/`withForm` patterns, and the existing fields under `components/form/fields/`. Keep client boundaries small and validate again on the server with Zod.
- Use the existing data-table system only if a setting area includes a real collection/list workflow.
- Apply the `shadcn` skill only when adding, searching, fixing, or composing shadcn/ui components. This documentation plan does not require the skill by itself.
- After each implementation phase, run the relevant narrow checks and perform the phase's browser acceptance checks before moving on.
