---
name: Shared dependency validation
description: Avoid stale declaration errors after changing a shared type dependency's major version.
---

After a shared type library major upgrade, force-rebuild the workspace's shared TypeScript declarations before diagnosing widespread `unknown`/implicit-`any` errors.

**Why:** Incremental shared-library output remained typed against the prior Zod major version even though the source was compatible. A fresh declaration build removed the apparent application-wide failures.

**How to apply:** Check dependency-version alignment and rebuild shared declarations before adding casts, weakening types, or reverting a security update based on stale output.
