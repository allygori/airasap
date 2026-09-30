# TypeScript Conventions

> These conventions apply to new TypeScript and TSX code. They describe the repository's strict compiler setup and the preferred ways to express runtime and compile-time contracts.

## Current configuration and status

- **[CURRENT]** `tsconfig.json` enables `strict`, `noEmit`, isolated modules, bundler module resolution, and the `@/*` alias to the repository root.
- **[CURRENT]** TypeScript is the primary language for the Next.js application. The compiler includes `.ts`, `.tsx`, and `.mts` files; `allowJs` remains enabled for existing JavaScript.
- **[TARGET]** New code should use precise types, preserve strict null checking, and make unsafe assumptions visible rather than suppressing the type system.

## Core rules

- Do not introduce `any`. Use a precise type when known; use `unknown` at an untrusted boundary and narrow it before use.
- Prefer `type` for new object types. Use `interface` when a library/API contract or declaration merging requires it, or when extending an existing interface-based contract.
- Use `const` by default. Use mutable bindings only when reassignment is part of the operation. Avoid `var`.
- Use the `@/*` alias for repository-root imports. Use relative imports for nearby files within the same module when that matches the local module pattern.
- Use `import type` for imports that exist only at type level. Keep runtime imports explicit so module dependencies remain visible.
- Follow the file and symbol conventions in [Naming Conventions](./naming.md), including the `orders`/`products` module pattern and TypeScript symbol casing.

## Modeling types

- Name types after the business concept and their role: `Order`, `CreateOrderInput`, `FinanceTenantContext`, or `ReservationSyncResult`. Avoid vague types such as `Data`, `Info`, or `Payload` without a clear subject.
- Represent finite workflow outcomes with discriminated unions when callers need to handle different cases explicitly. Do not represent an expected state transition as an unstructured string when the allowed values are finite.
- Keep optional, nullable, and absent values distinct. Use `null` when it has a meaningful domain/persistence meaning; do not widen a type with both `null` and `undefined` without a reason.
- Model IDs according to their boundary. Convert external strings and Mongoose identifiers deliberately; do not assume a string-shaped value is a validated ObjectId or tenant reference.
- Prefer the narrowest useful type. Do not expose an entire Mongoose document when a use case or UI only needs a stable result shape.
- Add generics when they preserve a real relationship between input and output types. Avoid generic frameworks that obscure a simple domain operation.

## Runtime validation and type safety

- TypeScript types are erased at runtime. Validate HTTP, file-import, environment, and other external input with the established Zod schemas before using it.
- Prefer deriving a static input/output type from its Zod schema where that schema is the authoritative contract. Avoid maintaining a second hand-written type that can silently drift from the runtime validator.
- Do not use `as SomeType` as a substitute for parsing, authorization, or a runtime check. If a type assertion is required at a library boundary, keep it narrow and document the invariant that makes it safe.
- Prefer `satisfies` for checking object literals against a contract when retaining narrow inferred values is useful; do not add it when a normal annotation is clearer.
- Handle caught errors as `unknown`. Narrow known error types and map them to safe outcomes at the appropriate boundary.
- Avoid non-null assertions and unchecked indexing in new code. Validate presence or use a safe lookup when a value may be absent.

## Functions and async work

- Use names that state an action or query and whose return value is clear, such as `reserveInventory`, `findActiveById`, or `calculateOrderTotal`.
- Keep function inputs and outputs cohesive. Introduce an input object when an operation has multiple related parameters or callers benefit from a stable named contract.
- Prefer inferred return types for local implementation details. Add explicit return types to exported/public contracts when they clarify the module surface or prevent an accidental contract change.
- Await asynchronous work whose result or failure matters. Do not leave rejected promises unhandled or launch side effects from constructors and ordinary read functions.
- Use `Promise.all` only for independent operations. Preserve ordering when operations depend on earlier state changes or share transaction semantics.

## Dependencies and module contracts

- Import another module through its deliberate public surface. Do not use type-only imports as a loophole for reaching into private module internals.
- Keep domain types with their owning module. Place a type in shared infrastructure only when it is genuinely technical and independent of a business capability.
- Avoid circular type imports; if two modules need each other's private types, revisit ownership or define a narrow neutral contract at the correct seam.
- Do not create duplicate DTO, schema, model, and response types that all claim to represent the same shape without a clear translation boundary. A persistence record, validated input, domain outcome, and API response may differ, but name and map those differences deliberately.

## Suppressions and escape hatches

- Do not disable compiler checking globally or add broad `@ts-ignore` directives to make a change pass.
- If a narrow suppression is unavoidable for a known library typing defect, use the least broad directive available, explain the reason next to it, and remove it when the defect is resolved.
- Avoid `as any`, double assertions, and untyped object spreading across tenant or authorization boundaries.
- Existing code may contain unsafe casts or `any`; do not copy those as the standard for new work. Improve them when they are in the scoped change and the correction is safe.

## Related guides

- [Naming Conventions](./naming.md) — file and symbol casing.
- [Business Logic](./business-logic.md) — module-owned rules and use-case responsibilities.
- [API and Data Access](./api-and-data-access.md) — runtime validation, tenant context, and request/response contracts.
- [React and UI](./react-and-ui.md) — TSX, Server Components, and client boundaries.
