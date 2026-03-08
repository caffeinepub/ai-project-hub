# AI Project Hub

## Current State
The app has a full project management system with Internet Identity login, a Motoko backend with authorization using role-based access control, and a React frontend. The `useActor` hook calls `_initializeAccessControlWithSecret` to register new users when they log in. If this call throws, the actor query fails and the user is left in an unauthenticated state where all backend calls fail with "Not authenticated".

## Requested Changes (Diff)

### Add
- Error handling in `useActor.ts` around the `_initializeAccessControlWithSecret` call so that even if the initialization throws, the actor is still returned and the user can proceed

### Modify
- `useActor.ts`: Wrap `_initializeAccessControlWithSecret` in a try/catch so initialization errors are swallowed gracefully -- the actor is still returned even if registration fails
- `CreateProjectPage.tsx`: Show a more descriptive error toast when creation fails (to help debug auth issues in future)

### Remove
- Nothing

## Implementation Plan
1. In `useActor.ts`, wrap `_initializeAccessControlWithSecret` in try/catch so an initialization failure does not prevent the actor from being returned
2. Validate the frontend builds successfully
