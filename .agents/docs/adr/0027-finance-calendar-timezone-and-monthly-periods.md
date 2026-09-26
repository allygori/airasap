# ADR 0027 — Finance Calendar Timezone and Monthly Periods

Status: Accepted

## Context

Finance reports and period controls use calendar months. The previous journal
service derived a journal's `period` from UTC, while onboarding presents
date-only business values using Asia/Jakarta. Near a month boundary those rules
can assign the same business event to different months. A server's local
timezone must not decide an organization's accounting period, and the legacy
Accounting timezone field is scheduled for removal with the old module.

## Decision

1. Finance stores the organization's calendar timezone at
   `organizations.finance.calendar_timezone`. Finance does not read or write
   `organizations.accounting.calendar_timezone`.
2. The opening-balance onboarding's first step is the setting point. It offers
   the supported Indonesia timezones and defaults to `Asia/Jakarta` (WIB).
   Saving the onboarding draft persists the selected value on the organization.
3. Finance journal period keys use the selected timezone to derive the local
   year and month from `transaction_date`; the key format remains `YYYY-MM`.
4. Closing a month stores inclusive UTC instants for the local month boundaries
   in that same timezone. Journal assignment and close bounds use one calendar
   contract, independent of the server timezone.
5. The timezone can be changed during onboarding only while Finance has no
   posted or reversed journal. Once a journal exists, the service rejects a
   changed value so historical period keys are not silently reassigned. The
   current UI does not provide a post-activation calendar-settings screen.
6. Existing journal period values and period records are not rewritten by a
   one-time migration. New journal entries use the Finance timezone. Historical
   development data may be reset when a clean end-to-end verification is
   needed; production migration behavior is not part of this development phase.

## Consequences

- Sellers can select WIB, WITA, or WIT during Finance setup, with WIB as the
  default.
- Monthly journal filtering and period closing share deterministic timezone
  boundaries and do not depend on UTC month boundaries or the host machine.
- A later timezone change after journals exist requires a separately designed
  calendar-change/reindex policy; it must not be added as an unguarded setting
  update.
- Historical journals retain the `period` value written when they were
  created. Report implementation must not silently rewrite or infer a different
  historical period from a changed server setting.
- This decision does not add currency conversion, financial statements, a
  post-activation settings page, or automatic period closing.

## Scope boundary

This decision applies only to the new organization-scoped Finance module. It
does not change legacy Accounting behavior, migrate existing journal records,
or alter Orders, Products, or the existing Reports module.
