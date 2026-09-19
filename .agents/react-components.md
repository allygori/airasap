# React and UI Component Guidelines

## Component boundary defaults

Use Server Components by default. Add `'use client'` only when a component
needs React state, event handlers, browser APIs, client hooks, or a client-only
library. Keep the client boundary as close as possible to the interactive leaf.

Do not import server-only auth, Mongoose, filesystem APIs, secrets, or database
connections into a Client Component.

Component responsibilities should be clear:

- **Presentational component** — renders props and emits events; no database or business workflow.
- **Feature component** — composes domain UI and calls a typed client/action boundary.
- **Route/page** — loads or composes route data and handles route-level states.
- **Form component** — owns field composition and user interaction; validation rules should come from the feature schema.
- **Primitive** — generic visual/accessibility behavior; no domain names or API calls.

## Component placement

- Put route-only components in `app/<route>/_components/`.
- Put reusable product/domain components near their owning feature or in `components/` when genuinely shared.
- Keep generic primitives in `components/ui/`.
- Do not put domain workflows in `components/ui/`.
- Do not promote a component to global shared code after one use merely to avoid a local file.
- Before adding a new table, form, modal, or icon primitive, inspect the existing `components/` implementations.

## Props and composition

Use explicit props and stable composition:

```tsx
type ProductCardProps = {
  product: ProductSummary;
  onSelect?: (productId: string) => void;
};

export function ProductCard({ product, onSelect }: ProductCardProps) {
  // render only; orchestration belongs to the feature/page
}
```

Rules:

- Name the props type `<ComponentName>Props`.
- Prefer a domain-specific view model over passing a full Mongoose document to the UI.
- Avoid prop objects typed as `any`, `Record<string, any>`, or unbounded JSON.
- Use `children: ReactNode` only when the component is intentionally a layout/container component.
- Prefer composition and small focused components over a component that owns fetching, mutation, modal state, table state, and formatting simultaneously.
- Keep business calculations in services or pure domain functions, not JSX branches.
- Avoid rendering a different data contract based on undocumented property presence.

## Data fetching and mutation

- Server pages may load data through server-side services when the route is allowed to do so.
- Client Components should use a typed API client/fetcher or an existing feature hook.
- Do not call Mongoose or `db.connect()` from a component.
- Do not duplicate API response parsing in every component.
- Handle loading, empty, error, and success states explicitly.
- Mutations must be validated and authorized on the server; UI disabling is only a user-experience improvement.
- Refresh or invalidate the relevant data after a mutation instead of maintaining several unsynchronized copies of the same record.

## Forms

The project uses TanStack React Form through the shared form primitives in
`components/form/`. Follow the existing local form pattern before creating a
new one.

- Define input validation in a Zod schema owned by the feature/module.
- Keep field names aligned with the API contract unless an explicit mapper exists.
- Show field-level validation and a form-level server error.
- Disable submit while the intended mutation is pending, but do not rely on that for correctness.
- Preserve user input when a non-field server error occurs where practical.
- Do not duplicate the same schema with slightly different rules in the page and route.

## Tables and collections

There are multiple existing table systems. For new work, first determine
whether the feature belongs to `components/data-table/` or
`components/dashboard/collection/`. Do not add a third abstraction for a single
screen. Keep sorting, filtering, pagination, and selection state consistent
with the API query contract.

## Styling and accessibility

- Use Tailwind utilities and existing tokens from `app/globals.css`.
- Use `cn()` for conditional class names.
- Reuse `components/ui/` primitives before introducing a new primitive.
- Follow the repository's configured icon library and existing local convention; do not mix icon systems casually.
- Use semantic elements, labels, keyboard-accessible controls, focus states, and meaningful empty/error messages.
- Do not use color alone to communicate status.
- Avoid inline style objects unless a runtime value genuinely requires them.
- Use `next/image` when image optimization is appropriate and preserve explicit dimensions/aspect ratio.
- Use `next/link` for internal navigation; raw `<a>` is for external URLs or downloads.

## Route-level states

Where appropriate, add route-level `loading.tsx`, `error.tsx`, and
`not-found.tsx` instead of forcing every child component to infer route state.
Error boundaries should provide a retry path and avoid exposing internal error
details.

## Common UI anti-patterns

- A Client Component importing server auth or database code.
- Fetching the same endpoint in several sibling components with different response assumptions.
- A generic primitive containing product/order/accounting logic.
- Passing Mongoose documents through the component tree.
- Using hidden UI as authorization.
- Large components with unrelated responsibilities and dozens of boolean flags.
- Raw internal anchors, unlabelled icon buttons, missing pending states, or inaccessible custom controls.
- Adding another modal/form/table/icon system without first checking the existing one.
