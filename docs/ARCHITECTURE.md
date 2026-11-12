# Architecture and data boundaries

## Services

- **Student frontend:** React, Vite, Wouter, and TanStack Query in `artifacts/proxie`.
- **API:** Express in `artifacts/api-server`, exposed on `/api`.
- **Contract:** OpenAPI in `lib/api-spec`; generated React client and validators in `lib/api-client-react` and `lib/api-zod`.
- **Database:** PostgreSQL with Drizzle in `lib/db`.
- **Authentication:** Replit-managed Clerk. The browser uses Clerk's session handling; routes derive the user from verified server authentication, not a client-provided owner ID.
- **Files:** Private Replit App Storage. PostgreSQL stores paths/metadata and extracted text, not PDF bytes.
- **Generation:** Server-only OpenAI-compatible client through Replit AI Integrations; current note model is `gpt-5.4-mini`.
- **Design tooling:** `artifacts/mockup-sandbox` is not the student product.

## Private data

Each authenticated Clerk user owns one PostgreSQL workspace document. It contains the logical notebook, course, topic, quiz, flag/fix, upload, progress, and run-event entities. This differs physically from the original plan's proposed normalized tables while representing the same main product concepts.

Workspace updates use database transactions and row locking. Resource IDs are resolved inside the authenticated user's workspace. Public workspace responses are schema-filtered and do not return quiz answer keys, internal upload lists, or generation-budget metadata. Quiz answer feedback is returned only after a submitted answer.

Private API responses use `no-store`. API writes with a mismatched browser Origin or cross-site fetch metadata are rejected. The product API does not grant credentialed cross-origin browser access. Production Clerk's own proxy runs before these product-request controls so its protocol remains separate.

Private PDF requests check the authenticated user's upload ownership before streaming. Uploaded content is untrusted; text extraction validates metadata size, PDF signature, page count, and total extracted text. These processing checks do **not** impose storage-level limits on a signed upload.

## Notebook build

1. Validate the authenticated request and consent, then reserve a daily generation allowance.
2. Save a run and its events.
3. Extract source text while retaining source locators and PDF layout information.
4. Group bounded source segments and call the model with source text treated as data, not instructions.
5. Retry each failed model request once. If it still fails, keep labeled source excerpts.
6. Validate generated structures and exact citation quotes; discard invalid items.
7. Save the notebook, course topics, eligible questions, citations, and events atomically within workspace updates.
8. Show the notebook disclaimer and make source citations inspectable.

Source matching is not semantic verification. Model prompt-injection resistance is best effort, and the model cannot invoke application tools. New quizzes may be absent when generation falls back to excerpts.

## Progress

Progress comes from saved quiz evidence, not clicking hexagons or answer speed. Three qualifying correct sessions can reach Mastered; qualifying sessions are separated by at least 20 hours. Prerequisites unlock once predecessors are Practicing or Mastered. Repeated same-question answers in the window do not repeatedly award XP.

The displayed workspace can show a Mastered topic as Practicing after a gap longer than 30 days, unless review is paused. This is a display-time simplification, not a complete adaptive learning model or an official grade. See the compliance report for limits.

## Operational boundaries

Builds run inside the API process, not in a durable distributed queue. Startup recovery marks interrupted runs failed. Use one active API instance: starting another instance can otherwise invalidate a run being processed elsewhere.

The 20-operation per-account daily allowance is persisted in the workspace transaction and resets at 00:00 UTC. It limits initiation, not tokens, total accounts, storage, or dollars. It is not a substitute for provider spending controls.
