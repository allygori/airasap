# Documentation and ADR Workflow

> Living guides explain the current contract and unresolved direction. ADRs explain why a durable decision was selected. Keep the two linked but do not use either to disguise a proposal as an implemented fact.

## Choose the right record

| Record | Use it for | Do not use it for |
| --- | --- | --- |
| Architecture/convention guide | Current behavior, agreed target rules, and concise links to open decisions | A chronological discussion transcript or detailed implementation ticket |
| Open-question register | A specific unresolved choice, why it matters, options, affected areas, and status | An accepted decision or a list of speculative feature ideas with no consequence |
| ADR | A durable architectural/domain decision with meaningful alternatives, consequences, or migration cost | Every code change, naming rule, or undecided question |
| Roadmap | Product/architecture themes and dependencies without implied dates or delivery promises | A sprint plan or a duplicate of feature implementation steps |
| Feature plan | Detailed steps and acceptance criteria for a scoped feature | A general cross-module architecture rule |

## Writing or updating a guide

1. Inspect current source, tests, package/configuration, and relevant existing guidance before describing behavior.
2. Label claims so readers can distinguish `[CURRENT]`, `[TARGET]`, `[OPEN]`, `[LEGACY]`, and `[DEPRECATED]`.
3. Keep each page focused on one reader task or architectural topic; link to the owner page instead of copying its full policy.
4. Use the canonical Open Questions ID when referring to a known unresolved decision.
5. Prefer concrete examples from active modules. Explicitly call out current exceptions rather than presenting them as the target pattern.
6. Keep documentation in English. Use relative Markdown links within `.agents/docs/` and verify the target exists.
7. Update indexes and nearby links when adding, renaming, consolidating, or removing a guide. Preserve compatibility pointers only when they prevent real broken references.

## When to create an ADR

Create an ADR after the decision is made when one or more of these applies:

- There were credible alternatives with different business or operational consequences.
- The choice affects module ownership, dependency direction, tenancy, persistence, security, integration, or data lifecycle across several areas.
- Reversing the choice would require significant migration, compatibility support, or user retraining.
- Future contributors are likely to repeat the same debate without a durable record.

Do not create an accepted ADR while a question remains unresolved. Record it in [Open Questions](../open-questions.md), keep the relevant guide labeled `[OPEN]`, and revisit it when the user decides.

## ADR authoring steps

1. Check `.agents/ADR/README.md` and use the next available zero-padded number. Do not renumber existing records.
2. Copy `.agents/ADR/TEMPLATE.md` and use a short kebab-case filename such as `0001-organization-inventory-scope.md`.
3. Explain the context, decision drivers, options considered, decision, consequences, and any superseded ADRs.
4. Separate the decision from implementation status. An accepted ADR may describe a target that is not yet implemented; say that explicitly.
5. Use status `proposed`, `accepted`, `rejected`, or `superseded`. Keep ADR status separate from `[CURRENT]` / `[TARGET]` labels in living guides.
6. Update the relevant guide to reflect the accepted direction and link the ADR. Update or resolve related Open Questions entries.
7. If a later decision supersedes it, keep the original record, mark it `superseded`, and link the replacing ADR in both directions.

## Review checklist

- [ ] The source-of-truth order was followed and current facts were verified.
- [ ] Implemented behavior and future direction are labeled separately.
- [ ] The guide has one canonical owner for each rule and links to related guidance.
- [ ] Open decisions use stable question IDs and are not phrased as accepted policy.
- [ ] An ADR captures why the decision was selected, not only what was chosen.
- [ ] Cross-links and the docs index resolve.
- [ ] No Finance implementation plan or ADR under `.agents/features/finance/` was changed as part of general documentation work.
