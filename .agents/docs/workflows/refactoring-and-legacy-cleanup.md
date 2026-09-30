# Refactoring and Legacy Cleanup Workflow

> Refactoring changes the code's internal shape while preserving its external behavior. Separate that work from feature changes whenever practical so regressions and ownership changes remain reviewable.

## 1. Establish a safe change boundary

1. Record the requested outcome and what behavior must remain unchanged.
2. Check the working tree and preserve unrelated or user-owned changes. Do not stage, reset, or overwrite changes that are not part of the request.
3. Inspect active source, routes/imports, tests, configuration, and runtime callers before deciding that code is unused or duplicated.
4. Classify the target as `[CURRENT]`, `[LEGACY]`, or `[DEPRECATED]`. Historical notes, prototypes, and trash are not evidence that code is active or a pattern to copy.
5. Read the relevant module-boundary and convention guides. Do not infer architecture from folder names alone.

## 2. Describe the problem before moving code

- Identify the concrete friction: unclear ownership, duplicated business rule, direct cross-module write, dependency cycle, hard-to-test workflow, repeated query cost, or stale documentation.
- Name the module that should own the behavior and the data it changes.
- Map current callers and dependencies, including API routes, server-rendered pages, imports, scheduled/background work, exports, tests, and module registration.
- Record important contracts that must survive: tenant scope, authorization, API shape, persisted field names, index uniqueness, soft-delete/restore behavior, transaction/session guards, and retry semantics.
- Distinguish an architectural problem from style-only inconsistency. Do not reorganize code solely to make directories look symmetrical.

## 3. Choose the smallest useful refactor

- Prefer a focused move or extraction that makes ownership and change locality clearer.
- Apply the deletion test to a proposed helper, wrapper, or layer: would deleting it concentrate the real rule somewhere easier to understand, or merely move complexity elsewhere?
- Introduce an adapter, port, shared helper, or event only when a real dependency, repeated stable rule, or change seam justifies it.
- Keep module dependencies acyclic. Consumers should use a deliberate public contract rather than another module's private model or repository.
- Do not create a dynamic plugin framework or event/outbox system to prepare for hypothetical integrations without a present requirement.
- For optional Finance work, preserve core Order behavior when Finance is disabled or unavailable. Keep Inventory with Finance as already agreed.

## 4. Preserve data and runtime contracts

- Avoid changing API wire formats, persisted field names, unique indexes, tenant scope, authorization, or lifecycle behavior as incidental consequences of a file move.
- If a data shape or index must change, describe backward compatibility, migration, duplicate handling, rollback, and restore behavior before implementation.
- Preserve Mongoose sessions and lifecycle guards when moving or composing Finance operations.
- Preserve safe bounds on pagination, uploads, file parsing, regex/search inputs, aggregation, and bulk work.
- Do not treat a client feature flag, active Store, or supplied tenant ID as authorization.
- Keep routes, React components, and persistence mechanisms from becoming hidden owners of business rules.

## 5. Refactor in observable steps

1. Add or adapt a characterization test for important existing behavior before changing its structure, where tests are part of the requested code task.
2. Make one coherent structural change at a time. Keep behavior changes separately identifiable.
3. Verify the affected module contract, tenant isolation, error mapping, optional-module behavior, and persistence lifecycle.
4. Remove old code only after confirming there are no active imports, route references, dynamic references, or required compatibility paths.
5. Avoid broad formatting or unrelated naming cleanup in the same change; it obscures behavior review.
6. Review the final diff and ensure no fixtures, secrets, generated data, or unrelated user changes were included.

For documentation-only work, follow the user's instruction about running checks. Do not run tests merely because a future refactor workflow may require them.

## 6. Update guidance and record decisions

- Update the owning guide if the refactor establishes a new convention or changes the documented architecture.
- Track unresolved ownership or policy questions in [Open Questions](../open-questions.md); do not encode an answer just to complete a cleanup.
- Write an ADR only for a durable decision with meaningful alternatives or migration consequences, and only after the decision is made.
- Update the roadmap only when high-level direction or dependencies change.

## Refactoring review checklist

- [ ] The target and behavior-preservation constraints are explicit.
- [ ] Active callers, imports, tests, and runtime registration were checked.
- [ ] The new ownership and module dependencies are clearer than before.
- [ ] Tenant scope, authorization, optional-module rules, and lifecycle guards are preserved.
- [ ] Data/API compatibility and migration consequences were considered.
- [ ] Removed code is proven unused or safely replaced.
- [ ] Verification matches the requested scope and actual results are reported.
- [ ] The diff contains no unrelated source, generated, or private data.
