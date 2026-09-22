# Finance Plan 02 — Core Accounting and Journal Contract

Status: [TARGET]

## Goal

Establish the minimum double-entry accounting core used by all Finance
transactions while reusing proven accounting components where safe.

## Reuse direction

The existing Chart of Accounts taxonomy and seed are a direct reuse candidate.
The existing account model, repository, resolver, and journal implementation
must be reviewed before deciding whether they can remain canonical or need a
Finance adapter.

New Finance-owned concepts must not be forced into an incompatible legacy
contract.

## Implementation progress

### Phase 2.1 — [CURRENT] Chart of Accounts adapter

Finance now exposes its own account filter, response DTO, service, repository,
model, and route under the Finance namespace. The Finance model reads the
existing `accounting_accounts` collection so existing COA data remains
available during the transition, but it does not import the legacy accounting
service, resolver, model, page, or UI. The Finance contract exposes hierarchy
depth and an explicit `is_selectable` flag, which is true only for active,
postable accounts. Role-based account mapping is intentionally not persisted
in this phase and remains part of onboarding design.

## Phases

### Phase 2.1 — Chart of Accounts contract

Verify the existing account taxonomy, account types, postable/group behavior,
account mappings, and operational metadata.

Acceptance criteria:

- account hierarchy supports the Finance menu requirements;
- account selection validates active and postable accounts;
- logical roles do not depend only on hardcoded account numbers;
- reuse or replacement of each account component is documented.

### Phase 2.2 — Journal posting contract

Define the new Finance posting input and source reference contract.

Acceptance criteria:

- posted entries are balanced;
- source type, source ID, source event, and idempotency are explicit;
- journal posting is tenant-scoped;
- duplicate retries are safe;
- manual journal is separated from operational posting.

### Phase 2.3 — Lifecycle and correction behavior

Define draft, posted, blocked, reversed, and voided behavior where applicable.

Acceptance criteria:

- posted journal lines cannot be edited in place;
- correction creates a reversal or a new correcting transaction;
- closed periods reject new postings;
- predictable domain errors have stable codes.

### Phase 2.4 — Core read APIs and accounting surface

Expose the minimum account, journal, and ledger reads required by the Finance
UI and later transaction plans.

Acceptance criteria:

- reads are tenant-scoped and paginated where needed;
- account and journal details can be traced back to the source transaction;
- no old accounting explorer route is required by Finance.

## Open questions

- Reuse the old journal collection or create a new Finance journal collection?
- Are accounting periods shared with the old module or Finance-owned?
- Is manual journal available in the first release or only after operational
  posting is stable?

## Not in scope

- tax calculations;
- bank statement matching;
- full historical reconstruction;
- automatic closing entries.
