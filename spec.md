# AI Project Hub

## Current State
The Train AI tab is a guided Q&A interview -- the AI asks pre-written questions about the project and stores the answers as a block of text context used in the code editor.

## Requested Changes (Diff)

### Add
- A "vocabulary/shorthand" mapping system in Train AI where the user defines personal terms (e.g., "when I say 'title' I mean the `<h1>` header at the top") as input pairs: shorthand word → what it means in code/design terms
- An input row UI with two fields: "When I say..." (the shorthand) and "I mean..." (the full definition/description)
- A list of all defined mappings below the input, each showing the term and its meaning, with a delete button
- The assembled vocabulary mappings are stored in localStorage and injected into the AI code editor context so the AI interprets the user's shorthand correctly when giving instructions

### Modify
- Replace the current Q&A guided interview in the Train AI tab entirely with this vocabulary/term-mapping interface
- The "Trained" badge should appear once at least one mapping has been saved
- The collapsible "View assembled context" section should show the vocabulary list in a readable format

### Remove
- The guided Q&A question/answer flow (GUIDED_QUESTIONS array, callTrainingAI interview function, question index state)
- The loading/thinking states for generating follow-up questions

## Implementation Plan
1. Replace Train AI tab content in ProjectDetailPage.tsx with a vocabulary mapper UI
2. State: array of `{ id, shorthand, meaning }` objects stored in localStorage under `ai-training-vocab-{projectId}`
3. Input row: two text inputs side by side ("When I say..." + "I mean...") + Add button
4. List of saved entries below: chip/row per entry with shorthand bolded, meaning text, delete button
5. On save, assemble context string like "When I say 'title', I mean the <h1> header at the top of the page." per entry, joined with newlines -- store in the existing `ai-training-{projectId}` localStorage key so CodeEditorPage picks it up automatically
6. Remove all guided Q&A code (GUIDED_QUESTIONS, callTrainingAI, guidedQuestionIndex, trainMessages Q&A flow)
7. Keep Reset button to clear all mappings
8. Keep collapsible assembled context viewer
