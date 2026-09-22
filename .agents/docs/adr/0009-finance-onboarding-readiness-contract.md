# ADR 0009: Finance Onboarding Readiness Contract

- Status: [CURRENT]
- Date: 2026-09-22
- Scope: Finance onboarding status and access readiness

## Decision

Finance keeps its lifecycle state under `organization.finance`, but exposes a
computed readiness object for the current authenticated actor. The readiness
object contains:

- the effective status: `not_started`, `in_progress`, `blocked`, or `active`;
- whether the actor has owner access;
- whether start or resume is currently allowed; and
- server-generated blocker codes and safe user-facing messages.

The start operation is idempotent for an already `in_progress` organization.
It does not reset the onboarding version or create a duplicate setup record.

## Rationale

Finance is optional and must not introduce a generic feature-flag or
permission engine for this workflow. The server must remain the source of
truth for owner access and onboarding readiness; the UI only renders the
returned state and improves the interaction while a request is pending.

An effective `blocked` status can represent either a persisted Finance block
or an actor who cannot perform the next owner-only action. This keeps the UI
honest without changing the organization lifecycle merely because a viewer
does not have permission to continue.

## Consequences

- `/api/v1/dashboard/finance/status` and the onboarding start response share
  the same readiness shape.
- Existing consumers can still read the `finance` state from the response.
- Blocker reasons are explicit and testable instead of inferred from button
  visibility or localized UI text.
- Configuration validation and final activation remain separate onboarding
  work and are not implied by `in_progress`.
