# Proxie

A private study companion that turns authorized lecture PDFs and transcripts into cited notebooks, review quizzes, and editable course skill trees.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — backend command, started through its managed workflow
- Frontend workflow: `artifacts/proxie: web`
- Shared backend workflow: `artifacts/api-server: API Server`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/proxie/src/` — public landing, Clerk auth, student dashboard, notebooks, courses, progress.
- `artifacts/api-server/src/lib/study-generation.ts` — PDF/text extraction, AI retry/fallback, citation filtering.
- `artifacts/api-server/src/lib/study-store.ts` — transactional private student workspaces.
- `artifacts/api-server/src/routes/study.ts` — authenticated product routes and private PDF serving.
- `lib/db/src/schema/student-workspaces.ts` — student workspace storage.
- `lib/api-spec/openapi.yaml` — API contract; regenerate client and validators after changes.
- `attached_assets/PLAN_1794458462798.md` — original product brief.

## Documentation

- `README.md` — product overview, checks and documentation index.
- `docs/SETUP.md` — configuration and portability limits.
- `docs/OPERATIONS.md` — maintenance, backup/restore and incidents.
- `docs/COSTS.md` — dated provider pricing and free-use limits.
- `docs/PLAN-COMPLIANCE.md` — original-plan evidence and gaps.
- `docs/SECURITY-REVIEW.md` and `SECURITY.md` — review results and reporting policy.

## Gotchas

- Clerk browser auth uses same-origin cookies, not manual bearer tokens.
- PDF file bytes go directly to private App Storage, not PostgreSQL or local disk.
- Limits: 15 MB and 100 PDF pages; 120,000 characters of combined source text.
- Quote matching verifies a citation's source text, not semantic entailment; the notebook disclaimer makes that limitation explicit.
- Do not record live lectures or show student mastery as an official grade.
- Use one active API instance: background builds and startup recovery are not a distributed job queue.
- Builds/regenerations are limited to 20 operations per account per UTC day; this is not a global spending cap.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
