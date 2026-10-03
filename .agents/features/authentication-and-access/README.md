# Authentication and Organization Access

> This guide records the user-facing authentication and Organization access workflows currently wired into the application through Better Auth. Better Auth's plugin configuration is not, by itself, a complete user-management or authorization feature.

## Current implementation

- **[CURRENT] Sign-up:** The registration screen supports email/password sign-up and Google sign-up. Email/password registration sends the user to `/onboarding`; Google sign-up uses `/onboarding` as the new-user destination.
- **[CURRENT] Sign-in:** The login screen supports email/password and Google sign-in. The email/password path lists the user's Organizations; if none exist, it sends the user to onboarding. Otherwise, it selects the first Organization returned, calls the custom Store context endpoint with no Store ID (which resolves the first active Store), refreshes the session, and opens the dashboard.
- **[CURRENT] Google sign-in context:** The Google handler routes existing users to `/dashboard` and new users to `/onboarding`. Unlike the email/password handler, it does not itself show the explicit Organization/Store selection sequence; do not assume both sign-in paths initialize context identically.
- **[CURRENT] Organization onboarding:** The onboarding screen creates an Organization through Better Auth, sets it active, creates the initial Store through the dashboard Store API, and updates the session with the new Store ID.
- **[CURRENT] Better Auth integration:** The server configuration enables the Organization and Admin plugins and the custom Store plugin. The Organization plugin is used by current sign-up/onboarding and sign-in flows. The Admin plugin's presence does not define the application's full role or permission policy.
- **[CURRENT] Profile workflow:** Better Auth owns the User identity model, but no dashboard profile-edit workflow was found. The planned Settings Profile screen remains a target and should use Better Auth's supported operations; see [Settings](../settings/README.md).
- **[CURRENT] Session context:** The custom Store plugin writes active Organization and Store context to the Better Auth session. Server handlers resolve context through `getTenantContext()`. Active context selects a tenant scope; it does not authorize every action in that scope.
- **[CURRENT] Password recovery entry point:** A forgot-password form calls Better Auth's password-reset request with `/reset-password` as its redirect. No matching Next.js reset-password page was found in the current application tree, so the end-to-end completion flow is not verified.

## Not implemented as application workflows

- **[OPEN] Invitations and member management:** No application UI/workflow for inviting members, listing/managing members, changing membership roles, suspending/removing members, or transferring Organization ownership was found. You confirmed these are not implemented. The Better Auth Organization plugin is configured, but plugin availability must not be documented as a complete product workflow.
- **[OPEN] Roles and permissions:** The current Member schema contains `owner` and `admin` values, and the Invitation schema accepts an optional role string. These fields do not define a complete permission matrix or consistent invitation-role contract. See [Q-002](../../docs/open-questions.md#q-002--organization-and-store-rolepermission-scope).
- **[OPEN] Membership lifecycle and Organization switching:** Invitation acceptance, member changes, selecting among multiple Organizations, and session behavior after membership changes have no settled application contract. See [Q-003](../../docs/open-questions.md#q-003--membership-lifecycle-and-active-tenant-switching).

Keep these capabilities distinct:

1. Better Auth authenticates the User and supplies session/plugin integration.
2. Organization membership establishes a relationship with a tenant.
3. Server-side authorization decides whether that member may perform an action on a resource.
4. Finance availability and release flags are separate from both membership and permissions.

## Documentation ownership

- This feature guide owns the **user-visible workflows** and their implementation status.
- [Identity and Access Control](../../docs/architecture/identity-and-access-control.md) owns Better Auth integration boundaries, tenant context, authorization principles, and the open role/permission direction.
- [API and Data Access](../../docs/conventions/api-and-data-access.md) owns the request-level enforcement and tenant-scoping conventions.
- [Domain and Tenancy](../../docs/architecture/domain-and-tenancy.md) owns the Organization, Store, and membership relationships.

## Source entry points

- [Better Auth server configuration](../../../lib/auth/auth.ts), [client configuration](../../../lib/auth/auth-client.ts), and [custom Store plugin](../../../lib/auth/plugins/store/server.ts)
- [Registration flow](../../../app/%28auth%29/register/_components/register.client.tsx), [login flow](../../../app/%28auth%29/login/_components/login.client.tsx), and [password recovery form](../../../app/%28auth%29/forgot-password/_components/forgot-password-form.tsx)
- [Organization onboarding flow](../../../app/onboarding/_components/onboarding.client.tsx) and [Better Auth catch-all route](../../../app/api/auth/[...all]/route.ts)
- [Identity and Access Control](../../docs/architecture/identity-and-access-control.md), [Q-002](../../docs/open-questions.md#q-002--organization-and-store-rolepermission-scope), and [Q-003](../../docs/open-questions.md#q-003--membership-lifecycle-and-active-tenant-switching)
