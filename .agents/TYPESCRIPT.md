# TypeScript and Naming Conventions

## Compiler baseline

`tsconfig.json` enables strict mode, `noEmit`, `moduleResolution: bundler`, and
the `@/*` alias to the repository root. The current typecheck command also
generates Next route types before running `tsc`.

Run:

```bash
pnpm run typecheck
```

Do not weaken strictness or add broad compiler exceptions to make a change
pass. If an exception is unavoidable, document its scope and removal plan.

## Type choices

- Prefer `type` for new object and union types.
- Use `interface` only when declaration merging, library extension, or an existing local contract requires it.
- Never introduce `any` in new code. Replace unknown external data with a schema or narrow `unknown`.
- Avoid `as` assertions when a runtime check or schema can establish the type.
- Prefer discriminated unions for state/result variants.
- Use `satisfies` to validate configuration while preserving literal types.
- Use `readonly` where mutation is not part of the contract.
- Prefer `const`; never use `var`; use `let` only when reassignment is required.
- Do not make optional fields optional merely to avoid deciding whether the data is actually required.

Example:

```ts
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

## External and persistence boundaries

Treat request bodies, query strings, headers, uploaded files, Mongo documents,
and third-party responses as untrusted boundaries.

- Validate external input with Zod at the route or importer boundary.
- Keep persistence types separate from API response types when their contracts differ.
- Use explicit mappers for snake_case database fields, camelCase UI state, and third-party marketplace formats.
- Do not spread arbitrary `Record<string, unknown>` values through business logic without narrowing.
- Keep `ObjectId`, dates, decimals, and nullable fields explicit in types.

## Error typing

Use `catch (error: unknown)` and narrow deliberately:

```ts
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof DomainError) {
    throw error;
  }

  throw new InternalOperationError('Operation failed', { cause: error });
}
```

Do not turn every error into `new Error(error.message)` because this loses the
original type and stack context. Do not expose the raw error to the client.

## Naming

- Files: lower-case kebab-case with an intentional suffix, such as `product.service.ts`, `order.schema.ts`, and `report.client.tsx`.
- Components/classes: PascalCase, such as `ProductForm` and `ProductService`.
- Functions, variables, hooks, and methods: camelCase, such as `getProduct` and `useProductFilters`.
- Constants: existing code uses both uppercase constants and camelCase configuration; follow the local convention and prefer descriptive names over abbreviations.
- Types: PascalCase, such as `ProductSummary` and `CreateProductInput`.
- Zod schemas: PascalCase plus `Schema`, such as `CreateProductSchema`.
- DTOs/input/output types: use an explicit suffix such as `DTO`, `Input`, `Output`, or `Response`.
- React props: `<ComponentName>Props`.
- Test files: match the implementation name with `.test.ts` or `.test.tsx`.
- Next special files must retain framework names: `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, and so on.

## Field naming

MongoDB and API/domain persistence fields mostly use snake_case, including
`created_at`, `updated_at`, `deleted_at`, `organization`, and `store`. Do not
rename fields for aesthetic consistency during an unrelated change. Map to
camelCase only at a deliberate UI/client boundary.

Marketplace importers may preserve third-party labels and legacy field names;
normalize them at the importer/domain boundary rather than mixing conventions
throughout the application.

## Imports and module boundaries

- Prefer `@/*` for root-relative imports.
- Keep imports grouped according to the existing formatter/linter output.
- Do not use deep imports into another module's private files; see `module-boundaries.md`.
- Keep server-only imports out of Client Components.
- Avoid barrel files that re-export an entire large subsystem; expose only the public module API.

## Functions and data flow

- Give public functions explicit parameter and return types when inference would hide a boundary.
- Prefer small pure functions for parsing, formatting, normalization, and calculations.
- Keep side effects at service, repository, route, or adapter boundaries.
- Avoid boolean parameters whose meaning is unclear; use an options object or discriminated configuration.
- Avoid functions that accept an unbounded bag of options without a documented contract.

## Formatting and lint

Prettier is configured at the repository root. The package scripts currently use
`npx`; the reliable direct commands in this project are:

```bash
pnpm exec prettier . --check
pnpm exec prettier . --write
pnpm run lint
```

Do not mass-format unrelated files while implementing a focused feature. If a
lint or formatting change is intentionally broad, keep it as a separate change.
