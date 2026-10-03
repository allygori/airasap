# Naming Conventions

> Naming is part of the code's shared vocabulary. Prefer names that help a reader find the owning capability and understand the business meaning without opening several unrelated files.

## Status

- **[CURRENT]** Repository guidance uses lower-case kebab-case file names, PascalCase React component, class, type, and Zod schema names, and camelCase functions, variables, and hooks. The `orders` and `products` modules use plural capability directories with singular entity file names and symbols, such as `orders/order.service.ts` and `products/product.repository.ts`.
- **[TARGET]** Apply the conventions below to new work. Existing inconsistent names are not a reason to rename unrelated code; handle cleanup in a scoped refactor.

## General principles

- Name things after their business meaning or responsibility, not the current implementation detail.
- Prefer specific, searchable names over vague names such as `data`, `item`, `helper`, `common`, `manager`, or `process` when a domain term is available.
- Use one canonical domain term for one concept. Do not introduce synonyms such as `sale`, `transaction`, and `order` interchangeably when they represent different states or concepts.
- Use established terms from the domain and tenancy guides, including `Organization`, `Store`, `Order`, `Product`, and `Finance`. Preserve the distinction between a Product and a Finance inventory item.
- Avoid unexplained abbreviations. Keep standard framework, protocol, or domain abbreviations only when they are widely recognized in this codebase.
- Do not encode transient implementation details in a domain name. If a name includes a platform/version because the behavior is genuinely provider-specific, keep it inside that integration area.

## Files, directories, and routes

- Use lower-case kebab-case for ordinary file and directory names: `order-summary.tsx`, `finance-inventory-stock-read.service.ts`.
- Follow the `orders` and `products` core-file pattern: use the singular domain entity as the file stem, followed by the role suffix: `order.schema.ts`, `order.repository.ts`, `order.service.ts`, and `order.model.ts`.
- Name a UI file in kebab-case and export its React component in PascalCase: `order-summary.tsx` exports `OrderSummary`.
- Name custom hook files in kebab-case and hook functions with the `use` prefix and camelCase: `use-order-filters.ts` exports `useOrderFilters`.
- Use `route.ts`, `page.tsx`, and other Next.js-reserved file names exactly as the framework requires. Keep App Router conventions such as route groups `(group)`, dynamic segments `[id]`, and private folders `_components` intact; do not normalize their special syntax.
- Name an entity-focused module directory in the plural and its core files/symbols in the singular, following `orders/order.*` and `products/product.*`. Finance subcapabilities prefix the entity name with `finance-`, for example `finance/suppliers/finance-supplier.service.ts`. Capability modules without one plural entity concept may keep a capability name such as `finance/` and prefix or group their cohesive subfeatures explicitly.
- Keep the primary module files (`*.schema.ts`, `*.model.ts`, `*.repository.ts`, `*.service.ts`, and `*.dto.ts`) at the module root when the module is small, as in `orders` and `products`. Put genuinely separate workflows in a descriptive subdirectory or use a descriptive, domain-specific filename; do not create layers or folders just to make all modules look identical.
- `orders` has a `services/` directory for supporting workflows. `products` keeps its focused `product-inventory-source.service.ts` at the module root and exposes a narrow surface through `index.ts`; `orders` currently has no module `index.ts`. Treat these as current structural differences. Use a module entry point only when it is the deliberate public surface described in [Module Boundaries](../architecture/module-boundaries.md).
- Name tests after the file or behavior they cover, then append `.test.ts` or `.test.tsx`: for example, `order.service.test.ts` and `product.service.test.ts`. Keep a test beside the related module code when following the current module-local pattern.
- **[CURRENT]** Orders also contains generic or differently named support files such as `services/utils.ts` and `services/product-matching.ts`. **[TARGET]** For new files, prefer a specific domain name; include a role suffix when it clarifies the file's responsibility. Do not copy a generic `utils.ts` name for business rules.
- Use lower-case kebab-case for documentation files. ADR numbering and the `.agents/ADR/` directory follow the ADR-specific naming convention when that guide is in place.
- Put exported reusable/static value declarations, option lists, and lookup values under the root `constant/` directory, grouped by domain or concern (for example, `constant/order/shopee/`, `constant/finance/`, or `constant/files/`). Keep function-local `const` values, schemas, models, and behavior beside the owning code; `constant/` is not a home for workflows or constructed runtime objects.
- When a value list defines a domain type, keep the derived type alongside that value list so both have one canonical definition.
- Keep implementation-coupled configuration beside its owner when it contains behavior or framework-specific assets—for example, XLSX field maps that include parser functions or page-specific image data. Do not move such code into `constant/` solely because it uses `const`.
- When centralizing an existing constant, keep its old import path as a re-export while callers or compatibility-sensitive code may still rely on it. Maintain one definition of the value; do not copy the constant into both the canonical file and the compatibility path.

## TypeScript symbols

| Symbol | Convention | Example |
| --- | --- | --- |
| React component | PascalCase | `OrderSummary` |
| Class | PascalCase | `OrderRepository` |
| Type or type alias | PascalCase | `CreateOrderInput` |
| Function, method, variable, or hook | camelCase | `calculateOrderTotal`, `useOrderFilters` |
| Boolean value or predicate | Readable question/predicate prefix | `isFinanceEnabled`, `hasPermission`, `canPostJournal` |
| Async operation | Verb describing the action | `reserveInventory`, `findActiveById` |
| Zod schema | PascalCase concept plus `Schema` where helpful | `CreateOrderSchema`, `ProductFilterSchema` |

- Use verbs for actions and nouns for values or records. Make read versus write behavior apparent when the distinction matters, for example `findActiveById` and `postJournalEntry`.
- Name parameters and local variables for the domain value they carry. Avoid one-letter names except for small, conventional local iteration variables or generic type parameters where the meaning is clear.
- Use type names that identify their role, such as `CreateOrderInput`, `OrderSummary`, or `FinanceTenantContext`; avoid ambiguous suffix-only names such as `Data`, `Info`, or `Payload` without a clear subject.
- Do not include redundant type words when the context already makes the role clear. For example, a function inside `OrderService` does not need an `OrderService` prefix.
- Follow established casing for external library contracts and persisted fields. Naming this guide does not authorize renaming API fields or MongoDB fields.

## Business module vocabulary

- Prefer the business capability or domain concept in module and public-surface names: `orders`, `products`, `finance`.
- For entity modules such as Orders and Products, use the plural capability folder and singular entity prefix in core files and exported classes: `orders/order.service.ts` exports `OrderService`; `products/product.repository.ts` exports `ProductRepository`.
- Use subdirectory names to express cohesive capabilities within a larger module, such as `inventory`, `cash-and-bank`, or `marketplace-releases`.
- Name a public operation in the language callers use, not after a collection or Mongoose model. Keep persistence-specific names inside repository/model files.
- Keep provider-specific names at the integration edge. A Shopee-specific parser may name Shopee and a source format/version; a core Order use case should not need a platform suffix unless the rule is truly platform-specific.
- Do not use generic directories like `shared`, `utils`, or `helpers` as a default home for domain behavior. If behavior is genuinely shared, name the capability or neutral concern it represents and document ownership.
- When terminology changes, update the relevant guide and callers together. If persisted data or public API contracts are affected, use their dedicated schema/API guidance and consider migration compatibility before renaming.

## Database and API field names

Database fields and API wire-format names have compatibility and migration consequences, so they are governed by their data/API conventions rather than by source-symbol naming rules in this file. Keep library-owned contracts—such as Better Auth fields—in the casing required by that library. Do not rename a stored or serialized field merely to make its source-code spelling match a local variable.

## Related guidance

- [Module Boundaries](../architecture/module-boundaries.md) — naming modules and exposing deliberate public surfaces.
- [Business Logic](./business-logic.md) — naming operations around the owning capability and its use cases.
- [MongoDB and Schema](./mongodb-and-schema.md) governs persisted fields; [API and Data Access](./api-and-data-access.md) governs wire-format naming and compatibility.
