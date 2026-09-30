# Developer Documentation

This is the canonical index for repository guidance. Start with the repository-root [`AGENTS.md`](../../AGENTS.md), then open the guide that matches the work. Source code, tests, and configuration define what is implemented; these documents explain verified behavior, agreed direction, and unresolved decisions.

For current feature workflows, use the separate [Feature Documentation index](../features/README.md). This directory remains the home for cross-cutting architecture, conventions, workflows, roadmap, and open questions.

## Read by task

| If you are… | Read |
| --- | --- |
| Learning the application structure or request flow | [Architecture overview](architecture/overview.md) |
| Adding or moving a domain capability | [Module boundaries](architecture/module-boundaries.md), then [Feature changes](workflows/feature-changes.md) |
| Changing business rules or orchestration | [Business logic](conventions/business-logic.md) |
| Changing authentication, tenant context, or access policy | [Identity and access control](architecture/identity-and-access-control.md), [Domain and tenancy](architecture/domain-and-tenancy.md), [API and data access](conventions/api-and-data-access.md), and [Authentication and Organization Access workflows](../features/authentication-and-access/README.md) |
| Changing organization modules or rollout flags | [Optional modules and feature flags](architecture/optional-modules-and-flags.md) |
| Changing Orders, stock, or sales-channel behavior | [Inventory and sales channels](architecture/inventory-and-channels.md), [Module boundaries](architecture/module-boundaries.md), and [Open questions](open-questions.md) |
| Changing MongoDB documents, indexes, or field names | [MongoDB and schema](conventions/mongodb-and-schema.md) |
| Writing TypeScript or naming files and symbols | [TypeScript](conventions/typescript.md) and [Naming](conventions/naming.md) |
| Building or changing a React screen | [React and UI](conventions/react-and-ui.md) |
| Changing tests or reliability behavior | [Testing and reliability](conventions/testing-and-reliability.md) |
| Refactoring or removing legacy/unused code | [Refactoring and legacy cleanup](workflows/refactoring-and-legacy-cleanup.md) |
| Updating guidance or recording a durable decision | [Documentation and ADR workflow](workflows/documentation-and-adr.md), then the [ADR index](../ADR/README.md) |

## Architecture

- [Overview](architecture/overview.md) — current application shape and request/data flow.
- [Domain and tenancy](architecture/domain-and-tenancy.md) — User, Organization, Store, and sales-channel relationships.
- [Identity and access control](architecture/identity-and-access-control.md) — authentication, tenant membership, and future authorization policy.
- [Module boundaries](architecture/module-boundaries.md) — ownership, dependency direction, and cross-module seams.
- [Optional modules and flags](architecture/optional-modules-and-flags.md) — Organization-level module availability versus entitlements, authorization, and rollout flags.
- [Inventory and sales channels](architecture/inventory-and-channels.md) — current Finance inventory behavior and the accepted target stock concepts.

## Conventions

- [Business logic](conventions/business-logic.md)
- [Naming](conventions/naming.md)
- [API and data access](conventions/api-and-data-access.md)
- [MongoDB and schema](conventions/mongodb-and-schema.md)
- [TypeScript](conventions/typescript.md)
- [React and UI](conventions/react-and-ui.md)
- [Testing and reliability](conventions/testing-and-reliability.md)

## Workflows and planning

- [Feature changes](workflows/feature-changes.md)
- [Refactoring and legacy cleanup](workflows/refactoring-and-legacy-cleanup.md)
- [Documentation and ADRs](workflows/documentation-and-adr.md)
- [Roadmap](roadmap.md) — future themes and dependencies, without delivery promises.
- [Open questions](open-questions.md) — canonical record of undecided product and architecture choices.

## Reading status and decisions

Guides label claims as `[CURRENT]`, `[TARGET]`, `[OPEN]`, `[LEGACY]`, or `[DEPRECATED]`. An accepted ADR records a decision, but does not mean the decision is implemented. Check both the ADR and its linked guide for implementation status.

General, durable decisions live in [`.agents/ADR/`](../ADR/README.md). Current feature behavior is documented under `.agents/features/`, including Finance capability guides. Finance-specific implementation plans and feature ADRs may also be grouped under `.agents/features/finance/`; keep those separate planning/decision records unchanged unless revision is in scope.

The short files `conventions/coding.md`, `database.md`, `error-handling.md`, `nextjs.md`, `react.md`, `styling.md`, `testing.md`, and `validation.md` are temporary compatibility pointers to canonical guides. They contain no independent convention; remove them once no repository references depend on them.
