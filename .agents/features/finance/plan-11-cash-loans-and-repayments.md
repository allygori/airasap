# Finance Plan 11 — Cash Loans and Repayments

Status: [CURRENT / PHASE 11.1 IMPLEMENTED; PHASE 11.2 TARGET; PHASE 11.3 FUTURE]

## Goal

Provide a simple Finance workflow named **Pinjaman Tunai** for recording
repayable cash funding received by the business and its repayments. The first
release should support a small seller/UMKM without requiring loan schedules or
amortization calculations, while keeping the transaction model extensible for
those capabilities later.

## Boundary

- Finance remains optional. The page and APIs are available only to an
  organization with Finance active and remain organization-scoped.
- This plan covers cash loan proceeds deposited into an existing business
  bank account. It does not cover a lender paying a supplier directly, credit
  purchases, PayLater, credit-card purchases, owner capital contributions, or
  owner withdrawals.
- Orders, Products, and Reports are not replaced or changed by this plan.
- Do not create a lender master collection for the initial workflow. Store a
  lender identity/type on each loan source record so users can see balances by
  lender without creating a separate CoA account for every lender.
- Posted journals remain immutable. Corrections use Finance's reversal and
  replacement-entry behavior; they do not edit or delete posted journal lines.
- Development data is disposable. Phase 11.1 replaces the former
  owner-specific source schema and collection directly; no one-time data
  migration or compatibility layer is required.

## Confirmed product direction

- The menu/page label is **Pinjaman Tunai**.
- Loan proceeds are received in an operational bank account created during
  Finance onboarding. Posting must target the actual active, postable bank
  child account selected by the user, not the non-postable “Bank Operasional”
  grouping account.
- Lenders can include an owner, a bank, a digital bank/loan provider, or
  another lender. The lender name is recorded on the loan; each lender does
  not receive a separate CoA account.
- A loan from an owner remains a liability, not owner capital. The existing
  `2500 Utang kepada Pemilik` account remains separate from external cash
  loans.
- `2400 Utang PayLater/Kartu Kredit` remains for credit used to pay purchases.
  It is not the cash-loan payable account.
- The user can start with fresh development data. No migration from the
  current owner-loan collection is part of this plan.
- Loan amortization is a future capability and must be the final phase. The
  initial phases must not require an interest rate, repayment calendar, or
  automatically calculated installment schedule.

## Current baseline [CURRENT]

- The current CoA seed has `2500 Utang kepada Pemilik` and
  `2400 Utang PayLater/Kartu Kredit`.
- The Finance CoA seed now also includes system/postable account
  `2600 Utang Pinjaman Tunai` for external cash loans, and system/postable
  account `7100 Beban Bunga Pinjaman` for interest. These are initialized with
  the Finance CoA; they do not create lender-specific accounts.
- `/dashboard/finance/cash-loans` is the current user-facing Pinjaman Tunai
  workflow. Its source records are stored in `finance_cash_loans`; the former
  owner-specific route/collection is no longer the active workflow.
- Phase 11.1 supports owners, banks, digital lenders, and other lenders;
  repayments select an existing lender balance and allow an active postable
  Cash or Bank account.
- Phase 11.1 records principal only. It preserves immutable posted journals,
  Finance access checks, tenant scoping, closed-period rules, and
  standalone-MongoDB-safe idempotency/retry behavior.
- `/dashboard/finance/accounts-payable` also surfaces outstanding cash-loan
  principal by lender in a separate section. It is not mixed into supplier or
  vendor settlements; repayments continue through `/dashboard/finance/cash-loans`.

## Accounting behavior

When an external cash loan of Rp10,000,000 is received in the selected
operational bank account:

| Account | Debit | Credit |
| --- | ---: | ---: |
| Selected operational bank child account | Rp10,000,000 | — |
| `2600 Utang Pinjaman Tunai` | — | Rp10,000,000 |

For an owner loan, use `2500 Utang kepada Pemilik` instead of the external
cash-loan account. The source record retains the lender identity so balances
can be reviewed per lender even where the CoA liability account is shared.

A principal-only repayment debits the applicable loan payable and credits the
selected Cash/Bank account. When interest support is added in Phase 11.2, a
payment of Rp1,000,000 principal plus Rp100,000 interest is recorded as a
Rp1,000,000 debit to loan payable, a Rp100,000 debit to `7100 Beban Bunga
Pinjaman`, and a Rp1,100,000 credit to the selected Cash/Bank account.

## Phases

### Phase 11.1 — General cash-loan workflow [CURRENT / IMPLEMENTED]

Adapt the current owner-only loan flow into the user-facing Pinjaman Tunai
workflow. Keep the first release limited to cash actually received by the
business and principal-only repayment; do not add interest schedules yet.

Target behavior:

- Replace the owner-only menu/page/API/domain wording and contract with
  Pinjaman Tunai. Use a Finance-owned source collection such as
  `finance_cash_loans`; because this is development, no legacy collection
  migration is needed.
- Capture loan direction (funds received or principal repaid), transaction
  date, lender type and name, amount, selected business bank account as
  applicable, and optional reference/description. For receipt, offer actual
  active/postable bank child accounts created during onboarding, not the
  parent grouping account. For repayment, allow an eligible Cash/Bank account.
- Route owner loans to `2500 Utang kepada Pemilik`; route cash loans from
  non-owner lenders to `2600 Utang Pinjaman Tunai`. Do not use
  `2400 Utang PayLater/Kartu Kredit` for cash proceeds.
- Keep lender identity on the source transaction and present the outstanding
  principal by lender. Do not add per-lender CoA accounts or a lender master
  collection in this phase.
- For receipt, post Debit selected Bank / Credit applicable loan payable. For
  principal repayment, post Debit applicable loan payable / Credit selected
  Cash/Bank. Outstanding principal must not become negative.
- Preserve Finance access checks, tenant isolation, date/closed-period rules,
  draft/post/reversal conventions, journal trace links, immutable posted
  entries, and idempotent retry/recovery on standalone MongoDB.
- Do not calculate interest or imply that a loan is interest-free. Explain
  that this initial workflow records principal only; interest payments are
  added in Phase 11.2.

Acceptance criteria:

- A user can record a loan received from an owner or an external lender into
  an operational bank child account, and the journal uses the correct
  liability account.
- A user can record principal repayment against the correct lender and the
  applicable loan balance decreases exactly once.
- Repeated posting/retries do not duplicate the source effect or journal.
- Finance-inactive organizations cannot use the page or APIs; the basic
  Orders, Products, and Reports features remain unaffected.
- Existing owner-specific behavior is not left as a second competing
  Pinjaman Tunai workflow after this phase is completed.

Implementation note: the page and API are under
`/dashboard/finance/cash-loans` and
`/api/v1/dashboard/finance/cash-loans`; source records use the new
`finance_cash_loans` collection. Browser review remains pending. Interest is
explicitly out of this phase and has no schedule or automatic calculation.

### Phase 11.2 — Manual interest on repayments [TARGET]

Allow the user to record actual interest paid without computing an
amortization schedule.

Target behavior:

- A repayment can contain principal, interest, or both. Show the total cash
  payment as their sum and validate that principal does not exceed outstanding
  principal.
- Post principal to the applicable loan payable and interest to
  `7100 Beban Bunga Pinjaman`; credit the selected Cash/Bank account for the
  total paid.
- Require the user to enter the actual interest amount shown by their lender
  or payment record. Do not infer interest from the loan amount or an entered
  rate.
- Preserve lender-level balances based on principal only. Interest must not
  reduce the outstanding principal.
- Keep fees, penalties, automatic interest accrual, and tax treatment out of
  scope unless separately clarified.

Acceptance criteria:

- Principal-only, interest-only, and combined payments post balanced journals
  with correct accounts and amounts.
- Payment totals and remaining principal remain correct after retries and
  reversals.
- Interest appears as an expense and does not reduce the loan payable or
  change the recorded principal outstanding.

### Phase 11.3 — Loan terms and amortization [FUTURE / LAST PHASE]

Add structured loan terms and an installment schedule only after Phases 11.1
and 11.2 are reviewed in use. This is intentionally the last phase; no
amortization behavior is implied by the initial Pinjaman Tunai workflow.

Before implementation, clarify and document:

- supported interest calculation methods and whether rates are flat,
  effective, or lender-provided per installment;
- installment cadence, first due date, rounding, and final-payment adjustment;
- whether the schedule is informational or can create/post repayment drafts;
- how early repayment, rate changes, overdue amounts, fees, and schedule
  changes are corrected without editing posted journals;
- whether current/long-term liability presentation is needed and how its
  classification changes as due dates approach.

Any implemented schedule must preserve immutable journal history and must
never post an installment automatically until the user-approved posting and
scheduler behavior is explicitly specified.

## Phase 11.1 decisions reflected in the current implementation

- The initial lender choices are owner, bank, digital lender, and other.
- Principal repayment may use any active, postable Cash or Bank account.
- External lenders are identified by lender type and normalized lender name;
  owner lenders are identified by a Finance CoA owner-capital account. No
  separate lender master collection is used.
- The current summary shows received principal, repaid principal, and
  outstanding principal per lender. Additional schedule-oriented summaries
  belong to Phase 11.3 discovery.

## Not in scope

- PayLater, credit-card purchases, or supplier-direct financing; these remain
  in their respective Purchase/payable workflows.
- Owner capital contributions, owner withdrawals, or deciding whether a
  payment is legally equity, salary, or a loan.
- A lender master collection or one CoA account for every lender.
- Automatic interest calculation, amortization, payment reminders, or
  scheduler-driven journal posting before Phase 11.3 is approved.
- Bank mutation import, statement matching, or reconciliation.
- Editing/deleting posted journals or migrating development data.
