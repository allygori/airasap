# ADR 0006 — Finance-Owned Journal Storage

Status: Accepted

## Context

The older accounting module already has a journal collection and posting
service, but Finance must remain independently removable from the legacy
implementation. Reusing that collection would also preserve the old lifecycle
assumptions and make deleting the old module unsafe.

## Decision

Finance uses a new `finance_journal_entries` collection and owns its journal
model, schema, repository, and posting service. The old journal implementation
is reference material only. Finance operational posting requires:

- a balanced set of at least two lines;
- active, postable Finance accounts;
- explicit `source_type`, `source_id`, and `source_event`;
- a required idempotency key and payload fingerprint;
- tenant scope derived from the authenticated organization context.

Manual journals, reversals, and period closing rules are separate lifecycle
work and are not silently copied into this first posting contract.

## Consequences

- Finance can be removed or evolved without depending on old journal services.
- Existing legacy journal history is not automatically visible in Finance.
- A deliberate migration or reporting bridge is required if historical legacy
  journals must later appear in Finance.

