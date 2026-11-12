---
name: Proxie product scope
description: User decisions and priorities for Proxie that future work should preserve.
---
The student product requires private per-student accounts; the user also approved one shared, editable judge demo in development only.

**Why:** The user chose private student accounts for normal use, then explicitly chose a shared workspace so judges can quickly try features.

**How to apply:** Keep normal student materials and progress separated by authenticated identity. Keep judge access dev-only, label it as shared, seed fictional content, and never put real student materials there.

The attached product plan treats course setup, quizzes/levels, and the skill tree as core. If scope must be reduced, cut decorative notebook styling and badges before these capabilities. Proxie only uses materials students already have permission to access and does not record live lectures.

**Why:** These priorities and consent limits are explicit in the user's supplied build plan.

**How to apply:** Preserve these boundaries in future simplifications and feature additions.

Do not replace private App Storage with persistent local PDF files or database blobs to work around transient provisioning failures.

**Why:** Initial managed storage provisioning returned internal errors twice, then succeeded when retried after independent implementation work.

**How to apply:** Continue independent transcript work while the managed service is unavailable, show upload errors explicitly, and retry provisioning before considering a different storage architecture.
