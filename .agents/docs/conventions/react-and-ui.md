# React and UI Conventions

> The UI should feel like one product and keep server-side business rules in their owning modules. Reuse the established primitives and screen systems before introducing new ones.

## Current UI foundations

- **[CURRENT]** The application uses Next.js App Router, React Server Components, Tailwind CSS 4, and shadcn/ui tooling. Shared style tokens and theme variables are defined in `app/globals.css`; `components.json` configures the current component aliases and Hugeicons.
- **[CURRENT]** Generic UI primitives live in `components/ui/`. Shared TanStack React Form primitives live in `components/form/`.
- **[CURRENT]** There are two existing TanStack Table screen implementations: `components/data-table/` and `components/dashboard/collection/`. Their presence is current implementation, not a recommendation to create a third system.
- **[CURRENT]** `app/` owns routing and page composition. Route-local `_components/` are available for UI that should not become a shared component.
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
- Place domain behavior with its business module. A visual component may own presentation and local interaction, but it should not become the source of business invariants or data access policy.
- Follow [Naming Conventions](./naming.md): kebab-case file names and PascalCase exported React components, for example `order-summary.tsx` exporting `OrderSummary`.
- Give component props a precise type and expose only the data and callbacks the component uses. Avoid broad untyped pass-through objects.

## Forms

- **[CURRENT]** The project uses TanStack React Form with shared primitives and field components under `components/form/`, composed through `components/form/form.hook.tsx`.
- **[TARGET]** Reuse the shared form hook, fields, and submit controls for new feature forms. Do not introduce a second form library or parallel field system without an explicit decision.
- Keep field-level validation useful for immediate feedback, but validate again on the server with the owning Zod input schema and business rules.
- Use accessible labels, descriptions, errors, and keyboard interaction. Make pending, success, and failure states visible and prevent accidental duplicate submissions when an operation is still pending.
- For complex domain editors, compose existing primitives into feature-specific fields; add a new shared field only when more than one workflow has a stable common need.

## Tables and collection screens

- **[CURRENT]** `components/data-table/` and `components/dashboard/collection/` both build on TanStack Table, but expose different composition options.
- **[TARGET]** Select and reuse the closest existing implementation for a new screen. Do not clone a table or create a third generic table framework for one page.
- Keep row/column presentation in the UI and sorting/filter data contracts on the server aligned with the API schemas. Allowlist sortable/filterable fields and bound pagination server-side.
- Provide understandable loading, error, empty, and populated states. Keep selection and bulk actions explicit about their scope and effect.
- **[OPEN]** Whether the two existing table systems should eventually converge is a separate architecture decision; do not force a broad migration as part of an unrelated feature.

## Styling and visual consistency

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
