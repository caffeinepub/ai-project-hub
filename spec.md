# AI Project Hub

## Current State
- Train AI tab exists per-project: vocabulary mapper (shorthand → meaning), stored in localStorage per projectId
- Training context applies only within the current project's code editor
- Reference images (RefImage[]) can be uploaded in the code editor Refs panel but are NOT passed to the AI -- the AI never sees them
- No global training mode exists

## Requested Changes (Diff)

### Add
- **Global AI Training page** (sidebar nav item "Train AI"): a conversational interface where the user chats with the AI to define global preferences, vocabulary, coding style, and behavior rules. Each conversation turn is stored and assembled into a global training context saved to localStorage key `ai-global-training`. This context is automatically injected into EVERY project's AI prompt.
- **Conversational training flow**: the AI asks questions and the user answers; each exchange refines the global context. Supports "reset" to clear global training.
- **Ref images passed to AI**: when calling the Pollinations AI, encode uploaded ref images as base64 data URIs and include them in the messages array so the AI vision model can actually see and use them.

### Modify
- `CodeEditorPage.tsx`: merge global training context (`ai-global-training`) with per-project training context when building AI prompts
- `CodeEditorPage.tsx`: pass ref images as image content blocks to Pollinations AI calls (using multimodal message format)
- `Sidebar.tsx`: add "Train AI" global nav item
- `App.tsx`: add `/train` route

### Remove
- Nothing removed

## Implementation Plan
1. Create `GlobalTrainingPage.tsx` -- conversational AI training interface, saves to `ai-global-training` localStorage
2. Update `CodeEditorPage.tsx` -- load global training context and merge with project context; pass ref images as vision content to Pollinations
3. Update `Sidebar.tsx` -- add Train AI nav item pointing to `/train`
4. Update `App.tsx` -- add `/train` route
