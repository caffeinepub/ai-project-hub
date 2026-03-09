# AI Project Hub

## Current State
Full-stack app with Motoko backend and React frontend. Users log in via a password gate (client-side hashed creds), then Internet Identity. The backend uses access control that requires `_initializeAccessControlWithSecret` to be called before any user action. The `getUserRole` function currently calls `Runtime.trap("User is not registered")` when a principal has no role yet -- this causes a hard canister trap when `createProject` or any other user action is called before initialization completes, breaking the connection.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend `getUserRole`: return `#guest` instead of trapping when a principal is not yet registered, so unregistered callers get a clean "Unauthorized" error instead of a canister trap that kills the connection
- All backend permission checks remain unchanged -- `#guest` principals will still be rejected for `#user`-required actions, but gracefully

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend with `getUserRole` returning `#guest` for unregistered principals instead of trapping
2. Keep all existing data models, CRUD operations, artifact management, revision management, and credential check identical
3. No frontend changes needed
