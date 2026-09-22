# ADR 0003 — Posted Journals Are Immutable

Status: Accepted

## Context

Financial history must remain auditable. Directly editing a posted journal
would hide the original event and make balances difficult to explain.

## Decision

Posted journal entries and lines cannot be edited in place.

Corrections use one of:

- reversal of the original entry;
- a new correcting transaction;
- a new replacement entry only through an explicitly controlled workflow.

Transfers, refunds, inventory adjustments, and manual corrections all follow
this rule.

## Consequences

- Every correction needs a source reference and actor.
- UI must not expose generic editing for posted entries.
- Period closing can safely reject new postings without rewriting history.

