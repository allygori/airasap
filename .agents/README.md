# Agent and Contributor Documentation

This directory is the navigation point for repository guidance. Read the repository-root `AGENTS.md` first for implementation rules, then use this index to find the relevant detailed guide. Source code and configuration remain authoritative for what is implemented.

## Source of truth

When information conflicts, use this order:

1. Current source code, tests, `package.json`, `pnpm-lock.yaml`, and configuration.
2. Repository-root `AGENTS.md` for repository-wide implementation rules.
3. Active, non-empty guidance under `.agents/docs/`.
4. Roadmaps, open-question records, feature plans, and historical notes.

Do not treat a future plan as an implemented capability. Do not use `.trash` as a source of architecture or implementation guidance.

## Status labels

- **`[CURRENT]`** — verified as implemented and used by the application.
- **`[TARGET]`** — an agreed direction or recommendation that may not be implemented yet.
- **`[OPEN]`** — unresolved; document the question and its implications without presenting an answer as decided.
- **`[LEGACY]`** — existing code kept for compatibility or possible migration; do not copy for new work.
- **`[DEPRECATED]`** — should not be used for new work.

Use these labels on substantive claims where readers could otherwise confuse current behavior with future intent. ADR status (`proposed`, `accepted`, `rejected`, or `superseded`) is separate from implementation status.

## Start here

- [Developer documentation index](docs/README.md) — canonical guide map by contributor task.
- [Feature documentation index](features/README.md) — current product workflows by feature, including authentication and Organization access, Orders, Products, Reports, Files, Stores, and Finance.
- [Architecture overview](docs/architecture/overview.md) — current application shape, request flow, persistence, and agreed target direction.

The canonical guides live under `docs/`. Follow the root `AGENTS.md`, inspect current source, and avoid inferring rules from a short compatibility pointer or an empty placeholder.

## Documentation map

The detailed guide map is maintained in the [developer documentation index](docs/README.md) and [feature documentation index](features/README.md). Its main areas are:

- **Architecture** — domain and tenancy, identity and access control, module boundaries, optional modules and feature flags, and inventory/channel concepts.
- **Conventions** — business logic, naming, API and data access, MongoDB schemas, TypeScript, React/UI, testing, and reliability.
- **Workflows** — feature changes, refactoring and legacy cleanup, and documentation/ADR updates.
- **Roadmap and open questions** — future capability direction and unresolved decisions. These are planning references, not current product contracts.
- **Feature guides** — current capability behavior and its boundaries, organized by domain under `.agents/features/`.

Use the indexes to find active guides. Use the roadmap and open-question register for future direction and unresolved decisions; neither is an implementation contract.

## ADRs and feature plans

- Durable cross-cutting architecture decisions belong in `.agents/ADR/`, separate from the living guides in `.agents/docs/`. Start at the [ADR index](ADR/README.md) and use its template and workflow.
- Current Finance capability guides, plus any Finance-specific implementation plans or feature ADRs, are grouped under `.agents/features/finance/`. The capability guides added in this pass document verified behavior; separate plan/ADR documents remain unchanged unless deliberately reviewed.
- A guide explains the currently applicable rule. An ADR explains why a durable decision was selected. A roadmap describes possible direction and sequencing. An open-question record preserves what has not been decided.
- Feature guides under `.agents/features/` document user-facing/business workflows and cross-module seams. Shared conventions and architecture rules stay under `.agents/docs/`.

## Compatibility pointer

`.agents/AGENTS.md` is retained only for tools that look for a repository instruction file in this directory. The repository-root `AGENTS.md` is the canonical instruction contract.
