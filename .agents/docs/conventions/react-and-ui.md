# React and UI Conventions

> The UI should feel like one product and keep server-side business rules in their owning modules. Reuse the established primitives and screen systems before introducing new ones.

## Current UI foundations

- **[CURRENT]** The application uses Next.js App Router, React Server Components, Tailwind CSS 4, and shadcn/ui tooling. Shared style tokens and theme variables are defined in `app/globals.css`; `components.json` configures the current component aliases, Base UI based style, and Hugeicons.
- **[CURRENT]** Generic UI primitives live in `components/ui/`; interactive primitives use Base UI. Shared TanStack React Form primitives live in `components/form/`.
- **[CURRENT]** `components/data-table/` is the reusable TanStack Table screen system for dashboard lists.
- **[CURRENT]** Cross-route presentation components live in `components/shared/`, grouped by purpose. Current groups include `layout/` and `display/`.
- **[CURRENT]** `app/` owns routing and page composition. Route-local `_components/` are available for UI that should not become a shared component.
- **[TARGET]** Use `components/shared/feedback/` for stable feedback patterns that are reused across routes; add components there when a real shared need exists.
- **[TARGET]** Compose feature screens from the established shared systems. Keep domain workflows in server-side modules and keep client-side code focused on interaction.

## Server and Client Components

- **[TARGET]** Use Server Components by default. Add `'use client'` only for state, event handlers, browser APIs, or client-only hooks.
- Keep client boundaries as small as practical. Place the interactive control or sub-tree behind the client boundary instead of marking an entire page or layout client-side for one small interaction.
- Do not access Mongoose or secrets from client components. Server Components, route handlers, and server actions must call the appropriate module operation and preserve tenant/auth checks.
- Pass serializable, intentional view data to Client Components. Do not pass live Mongoose documents, server-only objects, or more tenant data than the screen needs.
- Use `next/link` for internal navigation and ordinary anchors for external destinations.
- Keep `page.tsx`, `layout.tsx`, and route handlers focused on composition. Extract reusable UI when it has a clear purpose; avoid splitting simple markup into layers that make the screen harder to follow.

## Component organization and naming

- Keep route-specific components under that route's `_components/` directory when they are not reused elsewhere.
- Put generic primitives in `components/ui/`; put shared form primitives in `components/form/`; put cross-route dashboard shell components in the existing dashboard area.
- Put reusable, app-level presentation components in `components/shared/`, grouped by purpose such as `layout/`, `display/`, or `feedback/`. Do not use catch-all folders such as `general/` or `misc/`.
- Decide ownership from the component's purpose and contract, not only its current number of call sites. A shared building block can remain in `components/shared/` when it has a clear app-wide role, even if current usage is concentrated in one route group.
- Keep components tied to one route or workflow near that route. Do not move them into `components/shared/` solely to shorten a file or import path.
- Place domain behavior with its business module. A visual component may own presentation and local interaction, but it should not become the source of business invariants or data access policy.
- Follow [Naming Conventions](./naming.md): kebab-case file names and PascalCase exported React components, for example `order-summary.tsx` exporting `OrderSummary`.
- Give component props a precise type and expose only the data and callbacks the component uses. Avoid broad untyped pass-through objects.

## Forms

- **[CURRENT]** The project uses TanStack React Form with shared primitives and field components under `components/form/`, composed through `components/form/form.hook.tsx`.
- **[TARGET]** Reuse the shared form hook, fields, and submit controls for new feature forms. Do not introduce a second form library or parallel field system without an explicit decision.
- Keep field-level validation useful for immediate feedback, but validate again on the server with the owning Zod input schema and business rules.
- Use accessible labels, descriptions, errors, and keyboard interaction. Make pending, success, and failure states visible and prevent accidental duplicate submissions when an operation is still pending.
- Reuse a field in `components/form/fields/` when its interaction and data contract fit. Add a shared field when no existing field supports the required contract and the new field has a reusable purpose; keep one-off fields near their route.
- Before changing a shared field, search all consumers and preserve its existing props and behavior. Prefer additive props with safe defaults. If a change is breaking, update every affected consumer in the same change and verify them together.

## Tables

- **[CURRENT]** `components/data-table/` is the shared TanStack Table system for dashboard lists.
- **[TARGET]** Reuse `components/data-table/` for a new dashboard list. Keep domain-specific columns and filters close to their route. Do not clone the table system or create another generic table framework for one page.
- Keep row/column presentation in the UI and sorting/filter data contracts on the server aligned with the API schemas. Allowlist sortable/filterable fields and bound pagination server-side.
- Provide understandable loading, error, empty, and populated states. Keep selection and bulk actions explicit about their scope and effect.

## Styling and visual consistency

- When adding or changing shadcn/ui primitives, use the `shadcn` skill when available and preserve this repository's Base UI based setup and `components.json` configuration.
- Use the existing Tailwind CSS 4 utilities, shared UI primitives, and theme tokens from `app/globals.css`. Do not introduce a parallel design-token file or component styling framework without documenting the decision.
- Prefer semantic theme values for background, foreground, border, muted, accent, destructive, and status colors. Avoid one-off hard-coded colors where an existing token expresses the intent.
- Reuse established spacing, typography, radii, and interaction states from the shared primitives. A feature may have its own visual hierarchy, but should still use the common theme vocabulary.
- Keep styles close to their component when they are local. Use shared tokens or a reusable primitive when the same visual rule must stay consistent across screens.
- Use CSS modules only where they solve a local styling need that Tailwind/shared tokens do not express cleanly; do not create a second global styling system.
- Preserve responsive behavior and test keyboard, focus, contrast, and reduced-motion needs during UI work. Do not rely on color alone to communicate status.

## Accessibility and user feedback

- Prefer semantic HTML and existing accessible UI primitives over custom interactive elements.
- Ensure controls have accessible names, visible focus, keyboard support, and appropriate disabled/loading state semantics.
- Associate validation and help text with their fields. Announce asynchronous results or errors where needed, and keep feedback close to the action that caused it.
- Use clear empty states and recovery guidance so the user can distinguish “no data yet” from “the request failed.”
- Keep user-facing UI independent of internal implementation details such as repository names, exception strings, or raw platform payloads.

## Review checklist

1. Is the page a Server Component unless client behavior is required?
2. Is the client boundary limited to the interactive subtree?
3. Are database access, authorization, tenant scope, and business rules on the server?
4. Does this use the existing form, table, and generic UI systems?
5. Are shared theme tokens and naming conventions followed?
6. Are loading, empty, error, and success states clear?
7. Are inputs, controls, navigation, and status indicators accessible by keyboard and assistive technology?
8. Does the screen receive only the data it needs in a serializable view shape?

## Related guides

- [Naming Conventions](./naming.md) — filenames and component symbols.
- [Business Logic](./business-logic.md) — module ownership and rules outside the UI.
- [API and Data Access](./api-and-data-access.md) — server-side validation, tenant scope, and response mapping.
- [Module Boundaries](../architecture/module-boundaries.md) — business module ownership and cross-module calls.
