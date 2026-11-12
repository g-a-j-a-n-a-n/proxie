# Maintaining Proxie

## Before first public use

1. Read the security review and plan-compliance report. Resolve launch blockers rather than treating a clean scanner as approval.
2. Confirm production auth, database, private storage, and AI configuration. Use `NODE_ENV=production`; never expose the shared development judge account.
3. Set provider usage alerts and shutdown/spending limits you can afford. A zero-dollar overage cap can stop services when credits are exhausted.
4. Use TLS and one active API instance. Keep browser/API on the same public origin; ensure the reverse proxy overwrites incoming forwarding headers.
5. Back up database **and** private uploaded files, and test restoration using fictional data first.
6. Test sign-in, sign-out, account switching, private-page refresh, upload, generation, citation inspection, flags/fixes, and quiz progress on the actual published environment. Dev accounts and data do not automatically transfer.
7. Review access/retention and deletion policies before accepting real student content. Only use materials students are authorized to upload.

## Weekly

- Check the live homepage and API health endpoint (`/api/healthz`).
- Check error counts and failed/interrupted build events. Do not collect student text or signed URLs in monitoring.
- Check AI, database, deployment, storage, and transfer usage. Investigate sudden increases.
- Check storage growth and failed uploads; do not delete an object merely because it looks old.

## Monthly, and after a security advisory

- Review dependency/security alerts and run the three security scanners again.
- Update dependencies in a development copy/branch. Use the committed lockfile; review advisories and release notes.
- Run `pnpm run typecheck`, `pnpm run test:unit`, the development isolation suite, and a configured build.
- Verify affected critical user flows before publishing the update. Never use real student uploads as public fixtures.
- Review access to Replit and GitHub; use strong account security and remove unneeded collaborators.
- Recheck free-tier terms and the [cost ledger](COSTS.md); the dated numbers are not permanent promises.

Critical/high vulnerabilities should be triaged promptly, not left until the monthly check.

## Backup and restore

The code repository is **not** a data backup.

Back up:

- PostgreSQL workspace rows, with access limited to authorized operators.
- Private App Storage objects referenced by those workspaces, and the metadata needed to map paths.
- The deployed code version, schema/configuration version, and non-secret configuration.
- Authentication ownership/recovery information through the supported Clerk/Replit facilities. Do not export passwords or session tokens into a backup repository.

Use provider backups/exports or standard PostgreSQL tooling in a controlled operator environment. Supply database credentials through the approved secret tooling or a secure PostgreSQL credential mechanism, not literal passwords in shell history or a command pasted into chat. Store encrypted backups outside Git with a documented retention period.

Restore **first into an isolated database and private bucket**, never over live data as a test. Validate row counts, notebook/source associations, citation lookups, flags, courses, and private PDF retrieval. Restore files along with the database; a database-only restore leaves broken file references. Document the restore date, outcome, and achievable recovery time.

No automated backup schedule or restore drill has been configured by this task.

## Schema changes

The current development tool is `pnpm --filter @workspace/db run push`. It is **development-only** guidance.

Before a production schema change: back up, review the intended SQL/migration, test it against a restored development copy, check backward compatibility, and obtain approval for any destructive change. Do not run `push-force` against production. Use the hosting provider's reviewed migration/publishing process; never assume a development push updates the production database.

## Regenerating the API client

Edit the OpenAPI source, then run:

```sh
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

Commit generated contract changes with the source change. Do not hand-edit generated clients to bypass the contract.

## Secrets and incidents

If a secret may have been exposed:

1. Stop sharing it and disable/restrict the affected feature if necessary.
2. Revoke/rotate it using the supported provider/Replit secret flow. Do not paste it into chat.
3. Review access and usage for unauthorized activity; preserve minimal redacted evidence.
4. Reconfigure the app and verify recovery.
5. Coordinate removal from Git history, pull requests, logs, artifacts, and caches. **Deleting the current file is not sufficient.** Do not force-push shared history without approval.

If student isolation or private-file access fails, restrict access and investigate before reopening the feature. Never announce that no data was accessed without evidence.

## Current reliability/retention limits

- In-process builds can be interrupted by restarts or hosting suspension. Recovery records failure; it does not resume work.
- Multiple simultaneous API instances are unsupported by current run recovery.
- Notebook/course deletion is not a complete account-erasure/retention system. Uploaded objects, upload grants, and some history can remain.
- Signed uploads are checked for size during extraction, not enforced at storage ingress. Quotas, lifecycle cleanup, and full deletion need further work before broad untrusted public use.
- The per-account generation limit is not an overall site budget. Multiple new accounts can still generate costs.

## Publishing

GitHub export does not publish the app. Publish only after the checks above and a deliberate review of costs. Replit publishing and database/storage have separate runtime settings and billing; see the official sources in [Costs](COSTS.md). No production deployment, migration, paid plan, or spending-limit change is performed by this documentation.
