# Security policy

Proxie contains private student materials and connects to services that may incur charges. A clean scan does not establish that it is safe for all data or deployment environments.

## Reporting a vulnerability

Do **not** open a public issue containing keys, signed upload URLs, student content, account identifiers, database exports, or an exploit against a live account.

Use the repository's private vulnerability-reporting feature if its owner has enabled it. Otherwise contact the repository owner privately and agree on a secure reporting channel before sharing sensitive details. No reporting address or response-time guarantee has been configured.

Please provide the affected version, impact, and the smallest reproduction using fictional materials. Do not test against other students or production data.

## Supported version

Security maintenance currently targets the current default-branch code only. There is no maintained release series or security response SLA.

## Secrets

- Server credentials belong in Replit Secrets or the hosting provider's secret store, never source code, browser variables, screenshots, logs, issues, or build artifacts.
- `VITE_*` variables are embedded in the browser bundle. Only Clerk's **publishable** key and public proxy configuration belong there.
- Signed upload URLs are temporary credentials. Do not log or share them.
- Git ignore rules do not remove an already committed secret from history. If exposure is suspected, **revoke/rotate first**, assess access, then coordinate removal from history and caches.
- Use a separate development database and development authentication environment. Never seed judge/demo data in production.

## Before a public release

Review [the security record](docs/SECURITY-REVIEW.md), all remaining risks, live sign-in/account-switch behavior, storage quotas and retention, provider spending limits, database backups, and the actual production environment. Obtain permission before publishing, changing providers, or enabling paid resources.

## Routine maintenance

At least monthly, review dependency advisories, test updates, and inspect provider usage. Apply confirmed critical/high patches promptly. Back up before schema changes and verify restoration in an isolated environment. See [Operations](docs/OPERATIONS.md).
