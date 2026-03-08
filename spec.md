# AI Project Hub

## Current State
The "Train AI" tab in ProjectDetailPage.tsx is a single textarea where users paste a wall of text as training context for the AI. It has a save/clear button and a character counter. The training context is stored in localStorage and injected into AI chat prompts in the code editor.

## Requested Changes (Diff)

### Add
- A chat-style interface in the "Train AI" tab that mirrors the AI chat panel in CodeEditorPage
- AI asks the user questions to build up training context through a guided conversation (e.g. "What is this project for?", "What tech stack are you using?", "What coding style do you prefer?")
- Each user response is incorporated into a growing training context summary
- Chat thread shows AI questions and user answers as bubbles (same ChatBubble pattern as the code editor)
- A text input + send button at the bottom for the user to respond
- A "Generated Context" collapsible or side panel showing what training context has been assembled so far
- Clear chat / reset button

### Modify
- Replace the single textarea in the "Train AI" tab with the chat-based training interface
- The training context stored in localStorage should still be the final assembled text (so the code editor AI chat still works the same way)
- The "AI Trained" badge on the tab should still appear when training context exists

### Remove
- The single large textarea for manual training text entry
- The character counter UI (replace with assembled context view)
- The "What to write" tips card (replaced by the guided chat experience)

## Implementation Plan
1. In ProjectDetailPage.tsx, replace the Train AI tab content with a new component `TrainingChatPanel`
2. The panel has:
   - A scrollable chat thread showing AI questions and user answers as bubbles
   - An input area at the bottom (textarea + send button)
   - An AI that starts by asking guided questions: project purpose, tech stack, style preferences, tone/audience, constraints
   - Each answer gets appended to the assembled training context stored in localStorage
   - A small "Trained context" expandable section showing what has been saved
3. The AI interviewer uses Pollinations AI (same free API already used in CodeEditorPage) to generate follow-up questions based on prior answers
4. Fallback: if AI is unavailable, cycle through a predefined list of training questions
5. A "Reset Training" button clears the chat and localStorage context
6. The "AI Trained" badge still appears on the tab when context exists
