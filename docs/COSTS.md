# Costs and free-use options

**Checked: 2026-11-12.** Prices, eligibility, included credits, and limits can change. The account's current provider dashboard and official terms take precedence. No purchase or billing-setting change was made for this review.

## Short answer

Keeping the source on GitHub can be free. Keeping **every feature of this hosted app operating indefinitely at zero cost cannot be guaranteed**.

The current full application needs a backend, PostgreSQL, private PDF storage/transfer, authentication, and AI generation. A free static frontend alone does not replace them.

## Current service ledger

| Service | What Proxie needs | Free/cost boundary |
| --- | --- | --- |
| GitHub | Source and documentation | GitHub Free supports public and private repositories. This does not run the application or back up student data. |
| GitHub Actions, if added | Optional automated checks | Standard public-repository runners are free under current terms. Private runner usage draws from included compute; storage and excess usage can cost money. No automatic CI workflow was added here. |
| Replit publishing | Frontend and API runtime | Starter currently includes one free published app for 30 days; it expires and can be republished. This is not a permanent free always-on guarantee. Standard Autoscale pricing currently lists a $1/month base plus compute/request charges; plan allowances/exceptions apply. |
| PostgreSQL | Saved private workspaces | Development databases are included/free. Production databases are billed for compute and storage; official docs currently list $0.16/compute-hour and $0.35/GiB-month storage. Actual compute time depends on usage. |
| App Storage | Private PDFs | Current docs list $0.015/GiB-month storage and $0.05/GiB outbound transfer. Ingress is free. There is no unlimited-free storage promise. |
| Replit-managed Clerk | Student authentication | Replit's Clerk documentation currently says it is free and has no MAU limit. This is the managed service, not a guarantee about standalone Clerk plans or future pricing. |
| Replit AI Integrations | Notebook generation and questions | Current Replit docs require a paid Replit plan for managed AI integrations; model usage draws on credits/usage billing. Starter builders must bring a provider key. A subscription/credit allowance is not unlimited free generation. |
| Direct AI provider, if explicitly configured later | Alternative to managed endpoint | OpenAI API use is billed by model/token usage and has separate billing from ChatGPT subscriptions. Trial/promotional credits are not permanent free service. Verify access to the configured model before migrating. |
| Domain | Optional custom address | A custom domain usually has registration/renewal fees. A provider subdomain avoids buying a custom domain but does not eliminate runtime costs. |

The configured note model is `gpt-5.4-mini`. A build can make several model calls and retry each failed group once. Cost varies with input length, groups, retries, and output; no fixed “cost per notebook” has been measured. Check the current model/provider pricing, not a guessed total.

## What happens when credits or quotas run out?

- A host may expire, suspend, or stop the site; a code repository remains available.
- Database/storage restrictions can prevent reads or saves/uploads, depending on the provider's policy. A working landing page does not prove those services are healthy.
- Configured AI requests that fail are retried once and can fall back to labeled extractive notes. That fallback can omit quiz questions/terms/diagrams, so **new-course learning features are not fully equivalent** without AI.
- The current API requires AI configuration at startup. Removing keys is **not** a supported no-AI mode.
- Production auth and data have separate environments; republishing is not a backup/restore strategy.

## Staying within a small or zero budget

1. Keep the repository on GitHub Free and avoid committing data, backups, or large generated assets.
2. Use Replit's free published-app allowance only if its current conditions fit; plan for expiry/republishing.
3. Configure usage alerts and a shutdown/spending limit that matches what you can afford. Stopping at a limit may make the app unavailable. The operator must confirm these settings; documentation does not set them.
4. Keep uploads small, reuse saved sources, avoid repeated regeneration, and monitor storage/egress.
5. The app now caps builds/regenerations at 20 per account per UTC day. This reduces abuse but does not cap total accounts, tokens, dollars, or storage.
6. Keep real backups outside Git and remove data only under a reviewed retention policy.

### Free local use versus the current hosted application

Running a frontend and PostgreSQL on your own computer has no software subscription fee, though hardware, electricity, internet, backups, and administration still exist. The computer must remain available for others to use it.

**The complete current app is not a fully offline/local application:** its storage adapter uses the Replit sidecar; Clerk and AI are external services; the API requires AI configuration. A genuinely no-paid-AI mode or local-storage/provider adapter would be a separate, explicitly approved change with functionality/security tradeoffs. No provider was silently replaced for this task.

The best long-term control is to own the code, document dependencies, back up data, and keep a migration option—not assume any vendor's free tier lasts forever.

## Official sources

- [GitHub plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Replit Starter](https://docs.replit.com/billing/plans/starter-plan)
- [Replit publishing and database billing](https://docs.replit.com/billing/about-usage-based-billing)
- [Replit August 2026 cloud pricing](https://docs.replit.com/billing/aug-cloud-billing-updates)
- [Replit App Storage billing](https://docs.replit.com/billing/object-storage-billing)
- [Replit Clerk Auth](https://docs.replit.com/features/auth-and-identity/clerk-auth)
- [Replit AI Integrations](https://docs.replit.com/features/integrations/replit-ai-integrations)
- [Replit spend controls](https://docs.replit.com/billing/managing-spend)
- [OpenAI API pricing](https://openai.com/api/pricing/)
- [OpenAI separate API/ChatGPT billing](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform)
