# Feature Flag Guidelines

## Current status

`[CURRENT]` The repository does not currently contain one unified feature-flag
provider or evaluation service. Do not add scattered checks against
`process.env`, plan names, cookies, or browser state and call that a feature
flag system.

The design below is `[TARGET]`. Implement it incrementally when a real rollout
need exists.

## Why feature flags exist

Use a flag for controlled exposure of an already-designed behavior:

- gradual rollout;
- organization/store allowlist;
- internal preview;
- safe migration between implementations;
- temporary experiment or kill switch.

Do not use flags to avoid making a product decision, hide broken code forever,
or replace authorization and entitlement checks.

## Proposed abstraction

Keep evaluation behind one server-side provider:

```ts
type FeatureFlagKey =
  | 'inventory_v2'
  | 'accounting_reconciliation'
  | 'new_product_editor';

type FeatureFlagContext = {
  userId?: string;
  organizationId?: string;
  storeId?: string;
  environment: 'development' | 'staging' | 'production';
};

interface FeatureFlagProvider {
  isEnabled(
    key: FeatureFlagKey,
    context: FeatureFlagContext
  ): Promise<boolean>;
}
```

The exact directory is a future implementation decision, but it should be a
small, explicit module such as `lib/feature-flags/` or
`modules/feature-flags/`. Do not create multiple providers under unrelated
features.

## Suggested flag record

If flags are stored in MongoDB, a record should have an explicit contract such
as:

```ts
type FeatureFlagRecord = {
  key: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  scope: 'global' | 'organization' | 'store' | 'user';
  allowlist?: string[];
  rolloutPercentage?: number;
  owner: string;
  reason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

The final schema may differ, but it must define precedence when multiple rules
match. Missing flags need an explicit default; risky or incomplete behavior
should normally fail closed.

## Evaluation rules

- Evaluate on the server for authorization-sensitive or data-shaping behavior.
- Resolve flags using authenticated user and tenant context.
- Use a stable hash of a stable identifier plus the flag key for percentage rollout; never use `Math.random()` per request.
- Keep environment and scope in the evaluation input.
- Cache only with a documented invalidation/TTL strategy.
- Do not perform database reads for each repeated component render.
- Return a resolved, minimal flag snapshot to the client only when the UI needs it.
- Never expose secret rollout rules or internal allowlists to the browser.

## Where to check flags

Use flags at the application/use-case boundary and at the route boundary where
the endpoint must be unavailable. UI checks are for experience only:

```text
UI check        → hide/disable entry point
Route check     → reject unsupported request
Service check   → protect behavior and data integrity
```

Do not scatter the same flag check through every child component. Resolve it at
the feature boundary and pass the result down.

## Naming and lifecycle

- Use stable lower-case snake_case keys.
- Name the behavior, not the team or date: `inventory_v2`, not `team_a_test`.
- Register flags centrally with a default, owner, reason, and expiry when temporary.
- Record whether a flag is a release toggle, experiment, migration, or kill switch.
- Remove the flag and dead branch after the rollout is complete.
- Do not leave permanent flags for stable behavior unless there is a documented operational reason.

## Feature flags versus authorization

Authorization answers “may this actor perform this action?” Feature flags answer
“should this implementation/experience be exposed right now?” Authorization
must still be enforced when a flag is enabled, and disabling a UI flag must not
be treated as security.

## Testing

Every provider should have deterministic tests for:

- missing key/default behavior;
- globally enabled and disabled states;
- organization/store/user allowlists;
- percentage rollout boundaries and stable assignment;
- environment isolation;
- cache/invalidation behavior if caching is introduced.

Feature tests should verify both flag states at the route/service boundary, not
only whether a button is rendered.
