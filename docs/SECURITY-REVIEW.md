# Security and verification record

Date: **2026-11-12**. Scope: the current workspace source, dependency lockfile, reachable local Git history, and development API checks. No production data was queried, no site was published, and no billing setting was changed.

## Automated scans

| Scanner | Initial result | After remediation |
| --- | --- | --- |
| Dependency audit | 0 critical, 7 high, 8 moderate, 2 low | 0 critical/high/moderate/low |
| Static-code analysis | 1 high | 0 findings |
| Privacy/dataflow analysis | 0 findings | 0 findings |

All three scanners completed successfully. These numbers describe their coverage, not a security guarantee.

### Remediation

- Updated vulnerable `body-parser`, `fast-uri`, `postcss-selector-parser`, `qs`, and `undici` transitive versions. Compatible overrides are retained because current direct parents still resolved vulnerable versions.
- Upgraded the shared Zod catalog to 4.6.7. Rebuilt shared declarations and passed the full typecheck after the major-version change.
- The SAST alert concerned `Object.assign(new Error(message), { status })`. It did not dynamically merge user-supplied properties; the status property was server-controlled. Replaced it with an explicit property assignment to remove ambiguity.
- Removed reflected credentialed CORS on the product API, added same-origin browser-write validation, disabled Express's identifying header, and added API response security/cache headers.
- Disabled compressed request-body inflation and tightened form-body size/parameter parsing.
- Added a database-persisted 20-generation-operation allowance per account/day for notebook builds, course builds and section regeneration.
- Added explicit project Git/deployment ignore rules for environment files, keys and backups. Global ignore rules are not relied upon.

## Credentials and repository data

The initial history check examined **16 reachable local commits** across local refs using redacted, high-signal patterns for private keys, common provider tokens and credential assignments. It reported no matches. Gitleaks 8.26.0 subsequently scanned the full reachable history and a snapshot of **282 export-candidate files**, also with no findings. No tracked `.env`, private-key, database-export or uploaded-document filenames were found. A final exact-export check must still be performed after the destination is confirmed.

Gitleaks also scanned the backend build output with no findings. In the frontend build it reported one generic-key match: `VITE_CLERK_PUBLISHABLE_KEY`. This was classified as the intentionally public Clerk publishable key, not a server credential. No server-only configuration markers were found in the frontend output. The match was reviewed rather than suppressed with a blanket allowlist.

Neither the custom pattern audit nor Gitleaks is complete or provider-validated proof that no secret exists. This review does not cover unavailable remote refs, GitHub forks/caches, external logs, database content, managed secret values, or all possible credential formats. No secret environment values were read or printed.

The isolation fixtures and judge seed are fictional. Runtime student workspaces and private uploaded PDFs are not stored in the repository. Do not add attachments, logs, backups, screenshots containing private content, or populated config files during export.

## Functional verification

- Full workspace typecheck: passed after dependency migration.
- Security middleware/budget tests: **4 passed**.
- Account-isolation suite: **6 reported passes**, covering signed-out protection and cross-student notebook, run, source, quiz, flag/fix, answer, delete and private-file denial.
- PDF layout tests: **5 passed**.
- Pseudocode/cache tests: **8 passed**.
- Configured full build (`PORT=5000 BASE_PATH=/ pnpm run build`): passed, including typechecks, API bundle, student frontend and design sandbox. The frontend has a non-blocking bundle-size warning.
- Workflows restarted successfully. Live development checks: health **200**, signed-out workspace **401**, cross-origin mutation **403**, same-origin signed-out mutation **401**, compressed body **415**.
- Public homepage screenshot loaded successfully after the dependency changes. Logs showed normal development-key/SDK deprecation notices, not startup failures.

Isolation tests use a development database with randomized fictional identities and cleanup. They do not test Clerk's actual browser authentication protocol. No billed model call, live PDF upload or destructive real-user journey was performed by this review.

## Remaining risks and launch constraints

1. **Storage abuse/retention:** signed PUT links expire but do not impose the app's declared PDF size at ingress. Processing rejects oversized files afterward. Per-user storage quotas, grant quotas, orphan cleanup and complete account erasure are not implemented.
2. **Cost abuse:** per-account operation limits do not impose a global token/dollar limit or limit account creation. Configure provider spending/shutdown limits and consider restricting registration before broad public access.
3. **Job reliability:** builds run in process. Use one active API instance; startup recovery is not safe for simultaneous independent workers/replicas. Restarts or sleeping hosts interrupt builds.
4. **Authentication/browser evidence:** real two-session switching/refresh tests and in-flight cache-race coverage are separate existing work.
5. **AI accuracy/privacy:** source quotation checks do not prove interpretations. Source text is sent to the configured model service. Review provider terms and your data permissions; do not submit sensitive materials without an appropriate policy.
6. **Untrusted PDFs:** limits and parser updates reduce risk, but there is no malware scan, isolated parsing worker, or hard CPU timeout for PDF processing.
7. **Lifecycle/privacy:** deleting a notebook is not a full purge of its uploaded bytes or every related history item; no automated retention policy or restore drill is in place.
8. **Production verification:** only development checks were performed. TLS, auth domains, private bucket permissions, live spend limits and production configuration need operator verification.

These limits should be resolved or explicitly accepted for the intended audience before calling the service ready for unrestricted public student use. Exporting reviewed code to GitHub is not the same as approving a production launch.
