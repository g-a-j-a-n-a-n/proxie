---
name: Proxie product scope
description: User decisions and priorities for Proxie that future work should preserve.
---
Proxie requires private student accounts, not a shared single-user demo.

**Why:** The user explicitly chose “Private student accounts” when asked about first-version access.

**How to apply:** Keep students' uploaded materials, notebooks, and learning progress separated by authenticated identity.

The attached product plan treats course setup, quizzes/levels, and the skill tree as core. If scope must be reduced, cut decorative notebook styling and badges before these capabilities. Proxie only uses materials students already have permission to access and does not record live lectures.

**Why:** These priorities and consent limits are explicit in the user's supplied build plan.

**How to apply:** Preserve these boundaries in future simplifications and feature additions.

Do not replace private App Storage with persistent local PDF files or database blobs to work around transient provisioning failures.

**Why:** Initial managed storage provisioning returned internal errors twice, then succeeded when retried after independent implementation work.

**How to apply:** Continue independent transcript work while the managed service is unavailable, show upload errors explicitly, and retry provisioning before considering a different storage architecture.
