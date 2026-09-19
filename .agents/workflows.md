# AI Change Workflow

## Before editing

1. Restate the requested behavior in terms of current routes/modules/data.
2. Search current imports and tests with `rg`; do not rely on filenames alone.
3. Read the relevant `.agents/*.md` guide.
4. Identify whether the target code is `[CURRENT]`, `[TARGET]`, `[LEGACY]`, or `[DEPRECATED]`.
5. Check for existing response, form, table, repository, auth, tenant, and file-import patterns.
6. Determine the narrowest module and public boundary that should own the change.

If an old document and current code disagree, follow current code and mention
the stale document in the change summary. Do not implement a roadmap item by
accident.

## While editing

- Keep route handlers thin and business logic in modules.
- Preserve tenant, authorization, soft-delete, lifecycle, and transaction rules.
- Prefer an existing abstraction over a new duplicate.
- Keep Client Components free of server-only imports.
- Use explicit validation and typed errors at boundaries.
- Avoid unrelated formatting or mass-renaming changes.
- Do not add code, tests, fixtures, or examples under archive folders.
- If introducing a new convention, update the relevant guide in the same change.

## Verification

Run the narrowest useful checks first:

```bash
pnpm run typecheck
pnpm test --runInBand -- <specific-test-file-or-pattern>
pnpm run lint
pnpm exec prettier <changed-files> --check
```

Then run broader checks when practical:

```bash
pnpm run typecheck
pnpm test --runInBand
pnpm run lint
pnpm run build
```

The exact test filter syntax may vary by Jest version; verify the command
output rather than assuming a green exit means the intended tests ran.

Known repository audit state is documented in the root `AGENTS.md`. Report
pre-existing failures separately from regressions introduced by the change.

## Review checklist

Before finishing, inspect:

- `git diff --check`;
- the changed file list;
- imports and dependency direction;
- tenant scope and authorization;
- validation and error mapping;
- loading, empty, error, and not-found UI states;
- test coverage for the new behavior and failure modes;
- accidental logs, secrets, fixture data, generated files, or source changes outside scope.

## Documentation maintenance

Update documentation when a convention or current architecture changes. Keep
the root `AGENTS.md` short enough to be injected on every task. Put detailed
examples in the relevant `.agents/*.md` file. Put rationale and historical
decisions in an ADR or product document, labelled clearly as current or target.

Do not duplicate the same endpoint list, schema, or naming rules in several
documents. Prefer one canonical guide and link to it.
