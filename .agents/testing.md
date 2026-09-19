# Testing Guidelines

## Test stack and commands

The project uses Jest `30.4.2` through `next/jest` with the repository root as
the project directory. The environment is `node`, and coverage uses V8.

Run:

```bash
pnpm test --runInBand             # reliable local serial run
pnpm test --watch                 # watch mode
pnpm run typecheck                # Next route type generation + TypeScript
pnpm run lint
pnpm run build
```

Do not use `pnpm test -- --runInBand` in this Windows setup; the separator can
be forwarded as a Jest pattern. If the package wrapper cannot find Jest, use
the repository-local binary as a diagnostic fallback rather than changing the
test configuration casually.

## Test placement and naming

- Keep tests near the behavior they verify when practical.
- Use `*.test.ts` for services, repositories, parsers, and pure functions.
- Use `*.test.tsx` for React behavior.
- Do not place new tests under `.trash`, `*.trash`, generated directories, or personal archive folders.
- Test names should describe behavior and outcome, not implementation details.

## What to test first

For a new domain feature, prioritize:

1. schema/input validation;
2. tenant isolation and authorization boundaries;
3. service invariants and typed domain errors;
4. repository filters, soft deletion, pagination, and update semantics;
5. route response envelopes and status codes;
6. critical UI states and user interactions;
7. parsers and importers with deterministic fixtures.

Do not test only the happy-path page render for a data-changing feature.

## Unit and integration boundaries

- Pure calculations and mapping functions should be unit-testable without MongoDB.
- Service tests should mock repositories or external adapters where the business behavior is the subject.
- Repository tests should verify query/filter behavior with an appropriate database strategy.
- Route tests should verify validation, auth/tenant requirements, status codes, and response envelopes.
- Client tests should avoid asserting implementation details such as internal state names.
- External Blob, Better Auth, MongoDB, and marketplace file boundaries should be mocked or isolated deliberately.

## Fixtures and data safety

- Prefer small deterministic fixtures committed with the test when they are safe and stable.
- Do not rely on a developer-specific absolute path under `.data/`.
- Do not commit personal uploads, secrets, customer data, or large workbooks just to satisfy a test.
- If a parser needs a workbook, keep the fixture minimal and document the source shape.
- Normalize dates, locale-specific currency, and timezone assumptions in fixtures.

## Existing test areas

Current tests cover parts of:

- Shopee XLSX v1/v2 readers and parsers;
- product and order services;
- product matching and enrichment;
- report aggregation, product, overview, and cancellation behavior;
- accounting types and behavior.

There are multiple parser generations. Preserve the fixture and import contract
of the version being changed; do not assume v1 and v2 are interchangeable.

## Known audit failures

The last audit ran `pnpm test --runInBand` and recorded 16 passing suites, 6
failing suites, 35 passing tests, and 1 failing test. Failures included:

- a suite with no test case;
- tests under `.trash` importing missing modules;
- tests under `.trash` and active parser tests requiring a missing personal `.data` fixture;
- product/order service tests failing because Jest did not transform the ESM-only `nanoid` package.

Do not weaken assertions or delete tests to make the suite green. Fix the test
boundary, fixture, transform, or implementation deliberately and record the
reason.

## Test determinism

- Do not depend on current time, random assignment, network, local Mongo state, or developer-specific files without controlling them.
- Reset mocks and database state between tests.
- Use stable IDs and explicit tenant contexts.
- Test rollout/feature-flag assignments with a deterministic hash/input.
- Avoid tests that pass only because an archive folder is included or excluded accidentally.

## Test changes and documentation

When behavior changes, update or add the nearest test. When a test requires a
new convention, document it in this guide rather than encoding a hidden setup
assumption in one test file.
