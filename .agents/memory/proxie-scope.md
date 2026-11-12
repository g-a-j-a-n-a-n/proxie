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

The approved visual direction for course skill trees is a game-like honeycomb map.

**Why:** The user selected the honeycomb prototype and explicitly requested its integration into the app.

**How to apply:** Keep future skill-tree work consistent with this direction while using real, source-backed learning progress rather than the prototype's simulated quiz rules.

The user likes the front page's existing overview and explanation of Proxie's purpose. Error flagging and the honeycomb skill tree are important differentiators to emphasize alongside it.

**Why:** The user explicitly praised the overview and asked to showcase these two features to emphasize the app's uniqueness.

**How to apply:** Preserve the purpose-led introduction when extending the front page; make source-checking and visual learning progress understandable without implying automatic error correction or guaranteed mastery.

Do not replace private App Storage with persistent local PDF files or database blobs to work around transient provisioning failures.

**Why:** Initial managed storage provisioning returned internal errors twice, then succeeded when retried after independent implementation work.

**How to apply:** Continue independent transcript work while the managed service is unavailable, show upload errors explicitly, and retry provisioning before considering a different storage architecture.
