# Public example workspace

The homepage and sign-in/sign-up screens offer **Explore an example workspace** in both development and production. The old shared Clerk judge sign-in was development-only; the public example does not enable it in production or sign visitors into a shared account.

## Visitor experience

- Enter without registration at `/example/dashboard`.
- Explore fictional botany notes, source quotes, flashcards, flagging and manual corrections, course/topic editing, quizzes, XP, preferences, progress, and the honeycomb map.
- The sample's pre-recorded build diagram is explicitly illustrative; it is not represented as a live AI run.
- Practice changes are isolated from other browser sessions and from normal student accounts. Tabs in the same browser share the same practice cookie.
- Reset restores only that practice copy. Exit returns to the main site without signing out a personal Clerk session.
- Uploads, new notebooks/courses, and regeneration require a personal account. The UI explains this, and the server rejects these operations even if called directly.
- Never enter private information in the example. It is temporary practice, not durable student storage.

## Isolation and operating limits

The server assigns a cryptographically random, HttpOnly, SameSite=Strict cookie scoped to `/api/example`, with Secure enabled in production. Example routes use only a reserved in-memory identity namespace. Normal study endpoints still require Clerk authentication; example cookies never authenticate a student account.

Sessions expire after **two hours**, and all practice state disappears on a server restart. Refresh resumes an active session. Reopening an expired example creates a fresh copy; it does not recover prior changes. Expired entries are removed on lookup or new-session creation.

There are at most **100 active example sessions per process**, **60 session creations per minute per process**, **120 study requests per minute per session**, and a **512,000-byte state limit** per session. Over-capacity or oversized operations fail explicitly; failed state mutations are not committed. These are bounded-memory guards, not a distributed anti-abuse service.

The example makes no paid model calls and writes no student database rows or uploaded files. Public requests still consume ordinary hosting resources. It uses process memory, so this version requires the app's existing **single active API instance** configuration; use a TTL-backed isolated store and appropriate shared rate limits before horizontal scaling.

## Verification

Run `pnpm --filter @workspace/api-server run test:example`. It runs with `NODE_ENV=production` and covers independent sessions, source/record isolation, manual flags/edits, quizzes, reset isolation, forbidden uploads/generation, secure cookie attributes, expiry, and rollback of failed/oversized changes.

The development browser check also passed anonymous entry, citation and term interactions, an edit preserved after refresh, a three-question placement check earning 50 sample XP, honeycomb/progress updates, reset, exit, and the personal-account prompts. A second fresh browser session received separate data and got a 404 for the first session's notebook. Desktop and 390px-wide entry/dashboard views were checked without horizontal overflow. This does not substitute for a post-publish production check.

After publishing, check the entry point in a private browser window. Publishing is a separate operator action; local changes do not automatically update the live site.
