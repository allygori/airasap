# ADR 0007 — Finance Period and Reversal Lifecycle

Status: Accepted

## Context

Posted journal lines must remain immutable, but Finance still needs a safe way
to correct an already-posted transaction and prevent new postings after a
period is closed. The old accounting lifecycle cannot be imported because its
period collection and service belong to the legacy module.

## Decision

- Finance owns `finance_accounting_periods` with `open` and `closed` states.
- A period is implicitly open until an explicit close materializes its record.
- Closing a period is an owner-only Finance action.
- Reversal creates a new balanced journal with debit and credit swapped,
  references the original through `reversal_of`, and then changes only the
  original status from `posted` to `reversed`.
- No Finance operation updates the lines of a posted journal in place.
- Draft, blocked, and voided states are deferred to the workflows that need
  them; operational posting only creates `posted` entries.

## Consequences

- Existing Finance posting continues to work before period setup is shown in
  onboarding.
- A closed period is enforced by the posting service, not only by the UI.
- Reversals are traceable as separate journal entries.
- Finance posting and reversal workflows do not require MongoDB transactions,
  so they run on standalone MongoDB. Multi-document effects are sequenced with
  stable idempotency keys; a retry resumes finalization after a partial write.
- Because standalone MongoDB cannot atomically commit those documents, a
  journal may be visible before its source or inventory movement reaches its
  final status. The source remains retryable, and the posted journal itself is
  never edited or deleted.
