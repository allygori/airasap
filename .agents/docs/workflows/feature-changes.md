# Feature Change Workflow

> Use this workflow for a new feature or a behavior change. It helps identify the owning business module, preserve existing contracts, and update the right guidance without imposing a new architecture layer for every change.

## 1. Understand the request and current behavior

1. Restate the user-visible outcome and identify what is explicitly in scope.
2. Inspect the current route/page, owning module, data model, relevant tests, and package/configuration behavior before choosing a pattern.
3. Search for existing flows that solve the same business problem. Reuse their stable contracts; do not assume all code in a similarly named folder is a good pattern.
4. Classify the behavior as `[CURRENT]`, `[TARGET]`, `[LEGACY]`, `[DEPRECATED]`, or `[OPEN]`. Resolve conflicts using the repository-root `AGENTS.md` source-of-truth order.
5. Read the relevant architecture and convention guides before changing that area. Check the docs index for the shortest path to the guidance.

## 2. Choose ownership and boundaries

1. Identify the business capability that owns the rule and persisted state.
2. Keep core Order behavior independent of optional Finance. If a feature composes multiple modules, use their deliberate public contracts and keep the composition point explicit.
3. Check whether the feature is Organization-scoped, Store-scoped, or intentionally cross-Store. Verify Store-to-Organization ownership where applicable.
4. Keep HTTP and UI concerns at the edge; put business invariants and lifecycle decisions in the owning module.
5. Avoid adding a new module, shared helper, repository base, event framework, plugin loader, table/form system, or flag service unless the feature establishes a real responsibility or seam.
6. If the feature depends on an unresolved item in [Open Questions](../open-questions.md), avoid silently choosing a policy. Ask the user or keep the implementation within an already agreed behavior.

## 3. Design the request and data flow

For a dashboard API operation, start from the current target composition:

```text
route -> Zod validation -> authenticated actor and trusted tenant context
      -> authorization/module availability -> module use case
      -> tenant-scoped repository -> model -> explicit response mapping
```

- Validate body, query, and route parameters at the server boundary. TypeScript casts alone do not validate input.
- Resolve Organization and Store from trusted server context; do not trust client headers or body fields as authorization.
- Make authorization, module availability, and business lifecycle checks explicit and server-side.
- Pass only the business input needed by the module. Do not pass raw Request/Next.js objects deep into domain logic.
- Reuse the versioned dashboard API envelope and established forms, tables, and theme primitives where applicable.
- Keep imports and platform-specific formats at the integration edge, then map to a clear application input.

See [API and Data Access](../conventions/api-and-data-access.md), [Business Logic](../conventions/business-logic.md), and [React and UI](../conventions/react-and-ui.md).

## 4. Preserve data integrity and tenant isolation

- Include Organization scope in every relevant query and mutation. Apply Store scope only when the owning concept is Store-scoped, and verify that Store belongs to the Organization.
- Keep trusted tenant values separate from caller-supplied filter/update objects so payload data cannot override them.
- Preserve soft-delete behavior, unique constraints, and restore semantics.
- Identify whether writes must commit together. If so, use the existing session/transaction path and propagate the same session through every participating operation.
- Add idempotency only when retries or duplicate delivery can create incorrect effects; define the key scope and duplicate-input behavior.
- Bound pagination, search, aggregation, uploads, bulk work, and other user-controlled resource use.
- Do not return raw persistence records or log secrets, tenant payloads, or uploaded file contents by default.

## 5. Verify behavior

- Add or update tests around the public behavior, domain invariant, tenant scope, authorization, and error outcomes that the change affects.
- Include negative tenant/security cases when an endpoint or use case accesses protected data.
- Test optional-module enabled and disabled behavior when the feature crosses that seam.
- Use deterministic synthetic data. Do not make tests depend on a developer's real `.data/` or `.upload/` contents.
- Run the narrowest useful check first, then broader checks as practical. Report actual results, including pre-existing or environment-specific failures.
- Review the final diff for accidental source/data changes and whitespace problems.

If the task is documentation-only, follow the user's request about whether checks should run; do not run tests merely because this workflow mentions them.

## 6. Update documentation and decisions

- Update the owning architecture/convention guide when the change alters a rule future contributors should follow.
- Update [Open Questions](../open-questions.md) when the feature exposes a new unresolved policy; do not write an ADR for an undecided question.
- Write or update an ADR only after a durable decision is made and there were meaningful alternatives or migration consequences.
- Update the roadmap only when high-level product direction or dependencies change, not for every implementation task.
- Keep current behavior, agreed target direction, and legacy exceptions labeled separately.

## Completion checklist

- [ ] Scope and current behavior are understood.
- [ ] The owning module and tenant scope are explicit.
- [ ] Authorization and optional-module behavior are enforced server-side.
- [ ] Business rules are not duplicated between route, UI, importer, and module.
- [ ] Persistence, lifecycle, retries, and bounds preserve data integrity.
- [ ] Relevant behavior and failure paths were verified as requested.
- [ ] The appropriate guide, open question, or ADR was updated if needed.
- [ ] The final change contains no unrelated files or generated/private data.
