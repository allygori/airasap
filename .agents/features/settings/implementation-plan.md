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
- The route provides a responsive Settings-specific sub-navigation; only Ringkasan is an active destination in this phase.
- Profile, Organization, Store, Finance, and Appearance are clearly marked as planned and have no editable controls.
- Navigation works on narrow and wide screens, supports keyboard use, and clearly marks the active section.
- An unimplemented section is not presented as editable.

## Phase 2 — Profile

**Status: [TARGET]**

### Scope

- Add a Profile page under Settings and read the authenticated Better Auth User.
- Start with the basic display name. Include profile image only after confirming its storage and Better Auth update contract.
- Use Better Auth's supported User update API; do not write the `users` collection directly from a page or add a parallel Mongoose User model.
- Keep email change, password change, account deletion, and session management out of the first slice unless their verification/recovery flows are specified.
- Do not create `modules/users/` just for basic Auth profile fields. A User domain module is a future option only if the application gains user-owned business workflows beyond authentication/profile.

### Acceptance checks

- The page shows the signed-in account, not a client-selected user ID.
- A valid name change persists and is reflected after refresh; invalid or unauthenticated requests fail safely.
- No unrelated user or tenant data is returned.

## Phase 3 — Organization profile

**Status: [TARGET]**

### Scope

- Add Organization name/logo editing through the Organization plugin's supported Better Auth operations, after confirming the installed contract and actor restrictions.
- Keep authentication-owned Organization identity fields under Better Auth. Any application-owned Organization configuration must be changed through its owning business module.
- Do not expose slug changes, deletion, ownership transfer, or member management in the initial form unless their consequences and authorization rules are separately agreed.
- Reuse the existing file-storage boundary if logo upload is included; do not put uploaded files under `public/` or introduce a second storage mechanism.

### Acceptance checks

- The update targets the active Organization resolved by the server and confirms the actor may change it.
- Changing Organization display data does not change Store ownership or rewrite Finance history.
- File upload uses the existing development-local/deployment storage configuration if image upload is in scope.

## Phase 4 — Store settings

**Status: [TARGET]**

### Scope

- Add an Organization-scoped Store edit flow for existing fields such as name, code, and timezone.
- Complete the `StoreService.update()` use case, its validation, and tenant-scoped repository operation before adding the form.
- Add an item route such as `PATCH /api/v1/dashboard/stores/:storeId`; keep the route thin and call `modules/stores/`.
- Validate that the requested Store belongs to the authenticated Organization. Do not accept an Organization ID from the form as authorization.
- Treat active Store switching as session/context behavior, not as a Store profile update.

### Acceptance checks

- The current Store loads from trusted session context; a requested Store ID cannot escape Organization scope.
- Name/code/timezone updates persist and render after refresh.
- Existing Product, Order, and Finance records keep their own snapshots and relationships; the update does not cascade changes into them.

## Phase 5 — Appearance and interface preferences

**Status: [TARGET]**

### Scope

- Bring the existing light/dark mode and dashboard color-theme controls into an Appearance screen, reusing the current theme provider and selector.
- Before implementing persistence, decide whether the preference is browser-local or should follow the User across devices.
- A browser-local first version can avoid database changes, but must be documented as device-specific. Do not store the preference in a session field unless the preference is intentionally session-scoped.
- Do not add density, language, date, or accessibility preferences without defining their effect and scope.

### Acceptance checks

- Mode and color theme controls remain accessible and work with the existing theme tokens.
- A saved preference is restored according to the selected persistence scope and does not cause a hydration mismatch or flash that breaks the dashboard.
- No User/Session schema field is added unless cross-device or session-scoped behavior is an explicit decision.

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


