# ADR 0002 — Selective Reuse of Existing Accounting Components

Status: Accepted

## Context

The Finance module is being scoped separately from the older accounting
implementation. A full blind rewrite would discard useful behavior, while
blindly importing old services would recreate the existing coupling.

The existing Chart of Accounts taxonomy and seed are considered useful and
likely reusable.

## Decision

Finance uses a selective reuse policy:

- reuse existing components when their data contract, tenant behavior,
  lifecycle, and idempotency are compatible;
- treat the existing Chart of Accounts as the primary reuse candidate;
- reuse old UI components or normalization logic only after checking their
  dependencies;
- place new Finance business contracts behind the Finance boundary;
- do not copy old accounting side effects into new workflows without review.

The decision to reuse or replace each major accounting collection is recorded
in the relevant implementation plan before implementation.

## Consequences

- There is no requirement to duplicate a good COA model merely because Finance
  has a new route namespace.
- Old accounting code remains a reference or compatibility dependency until
  proven unused.
- Finance plans must include explicit reuse and migration checks.

