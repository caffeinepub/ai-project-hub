# AI Project Hub

## Current State
The app has a full project management system with backend actor initialization via `useActor.ts`. The actor creation calls `_initializeAccessControlWithSecret` during setup, which can throw and silently fail, leaving `actor` null and blocking project creation. The Create Project button becomes permanently disabled because `isReady` never becomes true.

## Requested Changes (Diff)

### Add
- Error boundary around `_initializeAccessControlWithSecret` so a failure doesn't prevent the actor from being returned

### Modify
- `useActor.ts`: Wrap `_initializeAccessControlWithSecret` in a try/catch so the actor is still returned even if that call fails
- `useActor.ts`: Add `retry: 2` and `retryDelay: 1000` to the query config to handle transient network issues on first load
- `CreateProjectPage.tsx`: Show a more helpful inline error if `actorLoading` is stuck after a timeout, with a manual retry button

### Remove
- Nothing

## Implementation Plan
1. Fix `useActor.ts` to not fail actor creation if `_initializeAccessControlWithSecret` throws
2. Add retry logic to the actor query
3. Add a visible connection status indicator on the Create Project page with a working retry
