# Setup and configuration

## Supported starting point

The current application is integrated with Replit-managed Clerk, PostgreSQL, App Storage, and Replit AI Integrations. Node.js 24 and pnpm 10.26.1 are the documented toolchain. Existing optional-binary overrides target Linux x64; macOS, Windows, and ARM installation have **not** been verified.

Clone the repository, install with `pnpm install --frozen-lockfile`, and read `.env.example`. It contains placeholders only. The application does not automatically load a root `.env` file when started through every pnpm command.

## Replit setup

1. Open/import the complete repository, not only the frontend directory.
2. Use the existing artifact services and managed workflows. Their service configuration supplies separate `PORT` values and the web artifact's `BASE_PATH`.
3. Provision a **development** PostgreSQL database. `DATABASE_URL` is server-only. For an empty development database, review the schema before running `pnpm --filter @workspace/db run push`.
4. Configure Clerk through the Replit Auth facilities. Replit-managed Development and Production have separate accounts and keys; development users do not automatically become production users.
5. Provision private App Storage. Keep its private path server-side and do not make student PDFs public.
6. Enable/configure the OpenAI AI integration through Replit if your plan supports it. Review billing first. Keys and base URL are supplied as server-only secrets.
7. Start the existing API and frontend workflows, then check the public home, signed-out API protection, and an authorized fictional test notebook.

Do not reset the shared judge workspace merely to test setup. It is shared and editable. Legacy judge-account initialization/reset routes remain development-only. Normal student work requires personal accounts; the public [Example workspace](EXAMPLE-WORKSPACE.md) instead gives each anonymous visitor an isolated temporary copy of fictional materials, with no paid generation or uploads.

## Configuration reference

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API/database tools | PostgreSQL connection; secret |
| `CLERK_SECRET_KEY` | API | Server authentication and managed proxy; secret |
| `CLERK_PUBLISHABLE_KEY` | API | Environment-specific publishable-key fallback |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend build/dev | Public Clerk publishable key |
| `VITE_CLERK_PROXY_URL` | Frontend build/dev | Public Clerk proxy URL; managed per environment |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | API | AI credential; secret |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | API | Configured provider endpoint |
| `PRIVATE_OBJECT_DIR` | API | Private Replit storage location |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Storage utility | Optional public-asset paths; not permission to expose PDFs |
| `PORT` | Each service | Required service-specific port |
| `BASE_PATH` | Vite configuration | Required public path; `/` for the student frontend |
| `NODE_ENV` | API/build | `production` for a live API; never development in production |
| `LOG_LEVEL` | API | Optional logging level; defaults to `info` |

Do not invent or copy credential values from another project. Do not put server secrets into frontend configuration. Replit also supplies its own runtime/service variables; the example is not a replacement for provisioning managed services.

## Outside Replit

Exporting source does **not** transfer hosted services, student data, user accounts, or secret values.

- The frontend can be built as static files in `artifacts/proxie/dist/public`.
- The API builds to `artifacts/api-server/dist/index.mjs`; inject server configuration and start it with Node.js. For a locally created `.env`, `node --env-file=.env artifacts/api-server/dist/index.mjs` explicitly loads that file.
- The frontend requires only the public `VITE_*` configuration at build time. Vite's project root is `artifacts/proxie`; a local frontend `.env.local` belongs there and must contain **public configuration only**.
- Use a TLS reverse proxy/static host to serve the frontend and forward `/api` unchanged to the API on the **same origin**. For local development use a local reverse proxy in front of the frontend and API, rather than changing browser calls to hardcoded ports or remote development domains.
- Any reverse proxy must overwrite untrusted forwarded-host headers and preserve the real public host. The request-origin guard and Clerk proxy depend on the effective public host.
- PostgreSQL must have the reviewed workspace schema. Use a separate database and least-privilege credentials for the app.
- **App Storage currently uses a Replit-local credential/signing sidecar. PDF storage will not work unchanged on an arbitrary host.** A separately approved storage adapter/migration is required.
- Managed Clerk tenant administration/credentials and the managed AI endpoint are not guaranteed portable. A migration requires an explicit provider/account decision, correct production domains, and new credentials through a secret store.
- The current AI client requires a configured key and base URL at startup. Removing them is **not** an offline mode. Direct OpenAI use requires valid provider credentials, model access, and its own billing.

For these reasons this is not yet a one-click, provider-independent deployment. Do not claim that a GitHub Pages frontend alone is the complete functional app.

## Verification

```sh
pnpm run typecheck
pnpm run test:unit
PORT=5000 BASE_PATH=/ pnpm run build
```

If a major shared type dependency was changed and old declarations appear inconsistent, rebuild shared declarations with `pnpm exec tsc --build --force`, then typecheck again.

The database isolation suite needs a configured **development** database and API dependencies. It writes two randomized fictional student fixtures and cleans up those fixtures:

```sh
pnpm run test:isolation
```

It deliberately injects student identities at the router boundary. It is not proof of real Clerk browser sign-in. Do not point tests or development schema tools at production.
