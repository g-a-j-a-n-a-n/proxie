import assert from "node:assert/strict";
import { test } from "node:test";
import { clearQueryCacheOnUserChange } from "./auth-cache";

test("clears user-scoped query data when the signed-in account changes", () => {
  const listeners: Array<(state: { user?: { id?: string | null } | null }) => void> = [];
  let clearCount = 0;
  const unsubscribe = clearQueryCacheOnUserChange((listener) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }, () => { clearCount += 1; });
  const emit = (userId: string | null) => {
    for (const listener of listeners) listener({ user: userId ? { id: userId } : null });
  };

  emit("student-a");
  assert.equal(clearCount, 0, "initial account load has no previous user's cached data");
  emit("student-a");
  assert.equal(clearCount, 0, "unchanged account keeps its cache");
  emit("student-b");
  assert.equal(clearCount, 1, "switching directly between students clears the cache");
  emit(null);
  assert.equal(clearCount, 2, "signing out clears the previous student's cache");
  emit("student-a");
  assert.equal(clearCount, 3, "signing back in after sign-out clears any intervening cache");

  unsubscribe();
  emit("student-b");
  assert.equal(clearCount, 3, "the Clerk listener is removed on cleanup");
});
