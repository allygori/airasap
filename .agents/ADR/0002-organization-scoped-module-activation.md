# ADR-0002: Organization-Scoped Optional Module Activation

- **Status:** accepted
- **Date:** 2026-09-30
- **Decision scope:** [TARGET] direction
- **Supersedes:** None
- **Superseded by:** None

## Context

The application is currently a single deployed modular monolith. The product direction allows an Organization to enable or disable optional business capabilities at runtime. Finance is optional, and Inventory is included within Finance. This is a tenant-level product capability choice, distinct from a user's permission to perform an action and distinct from a temporary rollout flag.

The user selected Organization-level runtime activation as the intended meaning of modules being installable/removable. This does not imply downloading packages, loading third-party plugins, or dynamically changing the deployed code.

## Decision drivers

- A capability can be unavailable to one Organization while available to another.
- A disabled module must not be treated as authorized merely because a user can see its UI.
- Optional module boundaries should not create hidden runtime dependencies from core modules.
- The approach should fit the current modular monolith without introducing an unnecessary plugin framework.
- Entitlement, persistence access after disabling, and in-progress workflow handling require separate explicit decisions.

## Options considered

### Install or remove code packages per Organization

This makes the metaphor of installing a module literal, but introduces deployment/runtime complexity, security concerns, and per-tenant code variation that the product does not need.

### Enable or disable deployed capabilities per Organization at runtime

The application remains deployed as one codebase, while server-side policy determines whether an Organization may use each optional capability. This matches the selected product intent and current application shape.

### Use only release feature flags

Release flags can control gradual rollout, but do not represent a durable Organization choice or subscription entitlement. Treating them as the module system would conflate separate policies.

## Decision

1. **[TARGET]** Optional business modules are enabled or disabled per Organization at runtime within the deployed application.
2. **[TARGET]** Optionality governs capability availability; it does not dynamically install/uninstall code or delete module data.
3. **[TARGET]** Finance is optional, and Inventory is a Finance capability. An Organization without Finance access does not have Inventory capability available.
4. **[TARGET]** Server-side application paths enforce module availability. Hiding navigation or disabling a client UI is not an access-control boundary.
5. **[TARGET]** Module activation, subscription/product entitlement, user authorization, workflow readiness, and rollout flags remain distinct concepts.
6. **[TARGET]** Do not introduce a generic plugin loader, module marketplace, or universal feature-flag framework solely to express this decision.

This ADR does not decide who may activate a module, how subscription entitlement is granted, what data access is allowed after disablement, or how pending workflows are completed/recovered.

## Consequences

### Positive

- Organizations can adopt optional capabilities independently.
- The deployed codebase remains a modular monolith and can keep one implementation per capability.
- Authorization and release rollout policy remain explicit instead of being hidden inside a UI toggle.
- The product can begin with simple module checks and introduce a shared policy surface when multiple modules justify it.

### Costs and constraints

- Server routes and use cases must enforce Organization-scoped module availability consistently.
- Module dependencies must be explicit, and core workflows must continue when Finance is unavailable.
- Disablement must preserve data unless an explicit retention or deletion policy is separately decided.
- UI behavior, read/export access, and in-progress data handling need product policy before implementation is complete.

## Implementation status

- **[CURRENT]** Finance has specific entitlement, lifecycle, and active-module checks. The entitlement behavior is currently development-oriented; no general module registry or feature-flag service was verified.
- **[TARGET]** General Organization-scoped optional module activation and its policy separation are not yet implemented as a shared capability system.
- **[TARGET]** The ADR records product direction, not an instruction to build a generic framework immediately.

## Open questions and related records

- [Q-005 — Finance entitlement, activation, and disable behavior](../docs/open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior)
- [Q-006 — Feature-flag scope and ownership](../docs/open-questions.md#q-006--feature-flag-scope-and-ownership)
- [Q-007 — Orders-to-Finance failure and recovery contract](../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract)
- [Optional Modules and Feature Flags](../docs/architecture/optional-modules-and-flags.md)
- [Module Boundaries](../docs/architecture/module-boundaries.md)
- [ADR-0001 — Organization-Level Physical Inventory and Store Allocation](0001-organization-inventory-allocation.md)
