type ClerkUserState = { user?: { id?: string | null } | null };
type ClerkUserListener = (state: ClerkUserState) => void;

export function clearQueryCacheOnUserChange(
  addListener: (listener: ClerkUserListener) => () => void,
  clearCache: () => void,
): () => void {
  let previousUserId: string | null | undefined;

  return addListener(({ user }) => {
    const userId = user?.id ?? null;
    if (previousUserId !== undefined && previousUserId !== userId) {
      clearCache();
    }
    previousUserId = userId;
  });
}
