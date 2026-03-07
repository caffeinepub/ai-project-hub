# AI Project Hub

## Current State
The app is a full-stack ICP app (Motoko backend + React frontend) that lets users log in via Internet Identity, manage AI projects, and edit code files in a split editor with live preview. The code editor has an AI chat panel that currently calls OpenAI's API directly from the frontend using an API key the user must supply manually. Without a key it falls back to basic client-side pattern matching.

## Requested Changes (Diff)

### Add
- Backend `aiEditCode(language: Text, currentContent: Text, instruction: Text)` function that uses HTTP outcalls to call the Cloudflare Workers AI REST API (free, no user key needed) with the `@cf/meta/llama-3.1-8b-instruct` model to apply natural language code editing instructions
- Backend transformation function for the HTTP outcall response

### Modify
- Frontend `CodeEditorPage.tsx`: remove the OpenAI API key requirement, API key modal, and localStorage key storage; replace the `callOpenAI` function with a call to the new backend `aiEditCode` endpoint; update the AI chat panel UI to remove all "add your API key" messaging, show the AI as always connected and ready

### Remove
- `OPENAI_KEY_STORAGE` constant and all localStorage key management
- `ApiKeyModal` component and its open/close state
- `callOpenAI` function
- "No API key" banner and "Offline" badge in the chat panel header
- Settings gear icon button that opened the API key modal

## Implementation Plan
1. Add `aiEditCode` Motoko function to `main.mo` using the http-outcalls module to POST to Cloudflare Workers AI API
2. Regenerate backend bindings (backend.d.ts will include the new method)
3. Update `CodeEditorPage.tsx`: remove OpenAI/key logic, add a `useAiEditCode` hook call that calls the backend, simplify the chat panel to always show connected state
