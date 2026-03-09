import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ai-global-training";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  text: "Let's set up your global coding preferences. I'll ask you a few questions to understand how you work — so I can code exactly the way you like, every time.\n\nFirst: what type of projects do you mainly build?",
};

async function callTrainerAI(
  messages: Message[],
  assembledContext: string,
): Promise<{ reply: string; updatedContext: string }> {
  const systemPrompt = `You are a friendly AI training assistant. Your goal is to learn the user's coding preferences, vocabulary, and style through natural conversation.

After each user reply, you will:
1. Acknowledge their answer briefly
2. Ask one focused follow-up question to learn more (about style, tech preferences, naming conventions, patterns they like/dislike, or any shorthand they use)
3. Update the assembled context summary

Keep replies concise and conversational. Ask about things like:
- Preferred tech stacks or frameworks
- UI/design preferences (dark/light, minimal/rich)
- Custom vocabulary (e.g. "when I say 'title' I mean the h1 header")
- Coding style preferences (indentation, naming, comments)
- What to avoid
- Tone of AI responses

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "reply": "<your conversational response and next question>",
  "updatedContext": "<a concise, updated summary of everything learned so far as bullet points>"
}

Current assembled context:
${assembledContext || "(nothing learned yet)"}`;

  const historyMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.text,
  }));

  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [{ role: "system", content: systemPrompt }, ...historyMessages],
      seed: 77,
      private: true,
    }),
  });

  if (!response.ok) throw new Error(`AI error ${response.status}`);

  const raw = await response.text();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch)
    return { reply: raw.trim(), updatedContext: assembledContext };

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reply: parsed.reply ?? raw.trim(),
      updatedContext: parsed.updatedContext ?? assembledContext,
    };
  } catch {
    return { reply: raw.trim(), updatedContext: assembledContext };
  }
}

export default function GlobalTrainingPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assembledContext, setAssembledContext] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );
  const [contextExpanded, setContextExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }); // no deps - runs after every render to scroll to bottom

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { reply, updatedContext } = await callTrainerAI(
        updatedMessages,
        assembledContext,
      );

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: reply,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setAssembledContext(updatedContext);
      localStorage.setItem(STORAGE_KEY, updatedContext);
    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: "assistant",
        text: "I had trouble connecting. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setAssembledContext("");
    localStorage.removeItem(STORAGE_KEY);
    setContextExpanded(false);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Brain
              className="w-4.5 h-4.5 text-primary"
              style={{ width: 18, height: 18 }}
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground text-lg leading-tight">
              Global AI Training
            </h1>
            <p className="text-xs text-muted-foreground">
              Teach the AI your preferences — applied to all future projects
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          data-ocid="training.reset.button"
          className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      {/* Assembled context collapsible */}
      <div className="px-6 py-3 border-b border-border/30 bg-muted/20">
        <button
          type="button"
          data-ocid="training.context.toggle"
          onClick={() => setContextExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          {contextExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          <span>
            {assembledContext
              ? "View assembled context (saved to all projects)"
              : "No context assembled yet — start chatting below"}
          </span>
          {assembledContext && (
            <span className="ml-auto bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Active
            </span>
          )}
        </button>
        <AnimatePresence>
          {contextExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                data-ocid="training.context.panel"
                className="mt-3 p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed"
              >
                {assembledContext || "(nothing yet)"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
              data-ocid="training.loading_state"
            >
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Brain className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Thinking…</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="px-4 py-4 border-t border-border/50 bg-card/30">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              data-ocid="training.input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer and press Enter…"
              rows={2}
              className="resize-none flex-1 bg-background border-border/60 focus:border-primary/60 text-sm"
            />
            <Button
              data-ocid="training.send.button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[70px] w-10 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-2 text-center">
            Enter to send · Shift+Enter for new line · Responses apply to all
            future AI sessions
          </p>
        </div>
      </div>
    </div>
  );
}
