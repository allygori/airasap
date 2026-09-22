# Finance Plan 03 — Onboarding

Status: [TARGET]

## Goal

Provide a guided but practical setup flow for activating Finance for one
organization.

## Reuse direction

The old accounting onboarding UI components and relevant validation or
preview logic may be reused after review. The Finance onboarding service,
contracts, and activation behavior must be explicit and must not inherit
unneeded legacy complexity automatically.

## Implementation progress

### Phase 3.1 — [CURRENT] Readiness and setup state

Finance now exposes a server-computed readiness contract alongside the
organization-owned lifecycle state. It reports the effective state for the
current actor, owner access, whether start or resume is allowed, and stable
blocker codes. Starting an already in-progress onboarding remains idempotent,
and the onboarding page can reload the saved state without losing progress.

The persisted Finance state supports `blocked` and an optional
`blocked_reason`; final activation and the configuration steps remain in the
later onboarding phases.

## Phases

### Phase 3.1 — Readiness and setup state

Show whether Finance is not started, in progress, blocked, or active.

Acceptance criteria:

- basic Orders, Products, and Reports remain usable in every non-active state;
- onboarding can resume safely;
- activation is idempotent;
- blockers come from the server, not hardcoded UI assumptions.

### Phase 3.2 — Required and optional setup

Define the smallest required setup:

- currency;
- accounting timezone;
- accounting start date;
- Chart of Accounts template or existing COA selection;
- confirmation that Finance should be activated.

Optional setup may include:

- opening cash and bank balances;
- opening inventory;
- opening receivables and payables;
- tax preferences;
- account mapping overrides.

The exact required/optional list remains a product decision.

### Phase 3.3 — Finalization and post-activation behavior

Finalize Finance atomically and make future Finance routes available.

Acceptance criteria:

- incomplete setup cannot activate Finance;
- optional opening balances may be skipped safely;
- activation does not mass-post old orders implicitly;
- Finance posting can begin only after activation;
- refresh and retry do not duplicate opening entries.

## Open questions

- Should onboarding be one-time, resumable, or restartable before activation?
- Is opening balance entered during onboarding or through a later menu?
- Should the old wizard's preview behavior be retained?
- What is the default accounting start date?

## Not in scope

- historical reconstruction;
- bank statement import;
- advanced tax setup;
- replacing existing organization/store setup.
