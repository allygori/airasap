# ADR-0005: MongoDB Standalone Deployment and Transaction Policy

- **Status:** accepted
- **Date:** 2026-10-06
- **Decision scope:** [CURRENT] deployment constraint and [TARGET] scale-up direction
- **Supersedes:** None
- **Superseded by:** None

## Context

The current deployment uses MongoDB in standalone mode and does not support multi-document transactions. The marketplace-withdrawal workflow checks the posted balance of 1220 Saldo Marketplace before posting a transfer and its journal. That check and the writes are not atomic: two overlapping withdrawal requests can both validate against the same available balance.

Making a workflow depend on `ClientSession.withTransaction()` in this deployment would fail at runtime. Adding transaction requirements or a custom concurrency-control mechanism now would add operational and implementation complexity before the application is used in production by multiple users. This is a deliberate deployment constraint, not an accidental omission.

## Decision drivers

- Keep Finance workflows usable on the current standalone MongoDB deployment.
- Avoid recurring attempts to add multi-document transaction requirements that the deployment cannot satisfy.
- Record the accepted race condition clearly so the current balance check is not mistaken for concurrency protection.
- Define when transaction-based protection becomes appropriate.

## Options considered

### Option A — Require a transaction-capable MongoDB deployment now

Move to a replica set or mongos immediately and use multi-document transactions for balance validation and posting. This would provide atomic coordination but adds deployment work before the agreed production and multi-user trigger.

### Option B — Add custom locking or reservation infrastructure on standalone MongoDB

Build additional coordination around withdrawal requests. This would add a new persistence and recovery concern to a workflow that is currently used in a low-concurrency environment.

### Option C — Keep the current request-level guard and accept the documented race

Continue validating each marketplace withdrawal against the latest posted balance. Accept that overlapping requests may pass the same check until the deployment and usage reach the agreed scale-up trigger.

## Decision

1. **[CURRENT]** While the deployment remains standalone and the application is not being used in production by multiple users, keep marketplace-withdrawal balance validation at the request level. Do not make this workflow require a multi-document MongoDB transaction or add a separate concurrency-control subsystem preemptively.
2. **[CURRENT]** The per-request validation does not prevent two overlapping withdrawals from exceeding the available balance in aggregate. Preserve this limitation in user-facing or operational guidance where relevant; do not describe the check as atomic or concurrency-safe.
3. **[TARGET]** When the application is used in production by multiple users, migrate MongoDB to a transaction-capable replica set or mongos deployment and add a transaction-based guard that coordinates the available-balance check with withdrawal posting.
4. This decision is scoped to the marketplace-withdrawal concurrency guard. It does not remove optional session propagation from repositories or prohibit sessions for workflows whose deployed MongoDB topology supports them.

## Consequences

### Positive

- The current workflow remains compatible with the confirmed standalone deployment.
- Future agents have a durable rule against adding transaction-dependent withdrawal behavior before the agreed trigger.
- A clear migration point is recorded for stronger balance protection.

### Costs and constraints

- Concurrent marketplace withdrawals can pass validation against the same posted balance and collectively exceed it.
- The future production and multi-user deployment requires a replica set or mongos topology before transaction-based protection can be implemented.
- This ADR does not provide atomicity for other multi-document workflows; those require their own deployment-aware decisions.

## Implementation status

- **[CURRENT]** The owner has confirmed the current database is standalone. Marketplace withdrawal posting performs a server-side posted-balance check per request and does not use a multi-document transaction.
- **[CURRENT]** The accepted overlapping-request race is documented in [ADR-0004](0004-shopee-marketplace-settlement-and-withdrawal.md) and [Finance Cash Management](../features/finance/cash-management.md).
- **[TARGET]** Revisit the deployment and transaction guard when production use includes multiple users.

## Open questions and related records

- [ADR-0004 — Shopee marketplace sales, settlement, and withdrawal](0004-shopee-marketplace-settlement-and-withdrawal.md)
- [Finance Cash Management](../features/finance/cash-management.md)
- [API and Data Access](../docs/conventions/api-and-data-access.md)
