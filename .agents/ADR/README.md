# Architecture Decision Records

Architecture Decision Records (ADRs) preserve durable choices and why they were made. They complement, rather than replace, the living guides in [`.agents/docs/`](../docs/README.md).

## Status

- **`proposed`** — under review; not an approved direction.
- **`accepted`** — the decision has been agreed. It may still be `[TARGET]` and not implemented.
- **`rejected`** — considered and declined; retained to explain the choice.
- **`superseded`** — replaced by a later ADR, which must be linked from the old and new records.

## Records

| ADR | Status | Decision |
| --- | --- | --- |
| [0001 — Organization-level physical inventory and Store allocation](0001-organization-inventory-allocation.md) | Accepted | Keep physical stock at Organization scope; distinguish Store allocation from Order reservation and physical movement. |
| [0002 — Organization-scoped optional module activation](0002-organization-scoped-module-activation.md) | Accepted | Optional capabilities are enabled or disabled per Organization at runtime in the deployed application. |
| [0003 — Finance-owned Organization state](0003-finance-owned-organization-state.md) | Accepted | Store Finance lifecycle and settings state in Finance-owned, Organization-scoped persistence with separate lifecycle and settings paths. |
| [0004 — Shopee marketplace sales, settlement, and withdrawal](0004-shopee-marketplace-settlement-and-withdrawal.md) | Accepted | Separate Order sales recognition, released funds in Shopee's marketplace balance, and manual withdrawal to Bank/E-wallet; preserve fee detail under one marketplace-admin expense account. |

## Authoring rules

1. Use the next available four-digit sequence; never renumber existing ADRs.
2. Copy [`TEMPLATE.md`](TEMPLATE.md) and use a descriptive kebab-case filename.
3. Record a decision only after it is agreed. Keep unresolved choices in [Open Questions](../docs/open-questions.md).
4. State whether the decision describes `[CURRENT]` implementation or `[TARGET]` direction.
5. Include context, important alternatives, the decision, consequences, unresolved boundaries, and links to affected guides/questions.
6. Update the owning guide and this index when an ADR is accepted or superseded.

See the [Documentation and ADR workflow](../docs/workflows/documentation-and-adr.md) for when and how to write records.
