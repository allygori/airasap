# AI Documentation Map

This directory contains active, code-oriented guidance for AI Coding
Assistants. It is not a second source tree and it is not a product roadmap.

## Source-of-truth rules

- Repository behavior is determined by current source code, tests, and config.
- `AGENTS.md` contains mandatory repository-wide instructions.
- The documents below contain detailed conventions for specific areas.
- Documents under `.agents/PRD/` are product or implementation references. Read them only when the task concerns that product decision; do not treat them as proof that a feature exists.
- `.agents/skills/` contains local tool/skill instructions. It is not the application architecture guide.

Use these status labels in future documentation:

- `[CURRENT]` — implemented and currently used.
- `[TARGET]` — desired future behavior; not necessarily implemented.
- `[LEGACY]` — existing code retained for compatibility or extraction; do not copy for new work.
- `[DEPRECATED]` — must not be used for new code.

## Guides

| Guide | Read before | Main contents |
| --- | --- | --- |
| `ARCHITECTURE.md` | changing routes, infrastructure, or domain placement | current stack, request flow, route map, folder responsibilities |
| `module-boundaries.md` | adding or moving business logic | module anatomy, dependency direction, cross-module calls |
| `react-components.md` | creating or refactoring UI | Server/Client Components, component placement, forms, states, styling |
| `TYPESCRIPT.md` | adding types, schemas, or utilities | type safety, naming, file suffixes, external data boundaries |
| `database-schema.md` | adding or changing persisted fields | snake_case convention, Better Auth exceptions, schema/index rules |
| `api-and-data-access.md` | adding API or persistence behavior | validation, auth, tenant isolation, repositories, response/error contracts |
| `feature-flags.md` | introducing dynamic behavior or rollout | target feature-flag model, evaluation, security, lifecycle, testing |
| `testing.md` | adding or fixing tests | Jest conventions, fixtures, mocks, known failures, test priorities |
| `legacy-code.md` | touching old/prototype code | archive list, compatibility rules, migration guidance |
| `workflows.md` | planning or executing a change | AI change workflow, review checklist, documentation maintenance |

## Recommended reading by task

- New dashboard feature: `ARCHITECTURE.md`, `module-boundaries.md`, `react-components.md`, `api-and-data-access.md`, `testing.md`.
- New API endpoint: `ARCHITECTURE.md`, `api-and-data-access.md`, `database-schema.md`, `module-boundaries.md`, `testing.md`.
- New React component: `react-components.md`, `TYPESCRIPT.md`.
- New feature flag: `feature-flags.md`, `api-and-data-access.md`, `testing.md`.
- Legacy migration: `legacy-code.md`, `workflows.md`, then the guide for the target area.
- Documentation-only change: `workflows.md`; verify that the document describes current code or is clearly labelled `[TARGET]`.

## What does not belong here

Do not add generic framework tutorials, speculative endpoint lists, copied
library documentation, or PRD content to these guides. Link to the relevant
official/library documentation when needed and record only the repository-
specific decision or convention.
