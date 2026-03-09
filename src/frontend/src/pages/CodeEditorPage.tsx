import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Language } from "../backend.d";
import {
  useAddRevision,
  useDeleteArtifact,
  useGetArtifact,
  useGetRevisions,
  usePublishArtifact,
  useUnpublishArtifact,
  useUpdateArtifact,
} from "../hooks/useQueries";

type Page = "dashboard" | "projects" | "new" | "detail" | "editor";

interface CodeEditorPageProps {
  projectId: bigint;
  artifactId: bigint;
  onNavigate: (page: Page, id?: bigint) => void;
}

// ── Chat Message Types ─────────────────────────────────────────
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error" | "system";
  text: string;
  isLoading?: boolean;
  timestamp: Date;
};

// ── Simple Markdown parser ─────────────────────────────────────
function parseMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^---$/gm, "<hr />")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .trim();

  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  return `<p>${html}</p>`;
}

// ── Client-side instruction applicator (fallback) ──────────────
function applyInstruction(
  originalContent: string,
  instruction: string,
): string {
  const lower = instruction.toLowerCase();
  let result = originalContent;

  if (
    lower.includes("dark background") ||
    lower.includes("background to dark") ||
    lower.includes("dark mode")
  ) {
    result = result
      .replace(
        /background(?:-color)?:\s*#?(?:white|fff|ffffff|f5f5f5|eeeeee|e0e0e0)/gi,
        "background-color: #0f0f0f",
      )
      .replace(
        /background(?:-color)?:\s*oklch\([^)]+\)/gi,
        "background-color: #0f0f0f",
      );
    if (!result.includes("background")) {
      result = result.replace(
        /<body/i,
        '<body style="background:#0f0f0f;color:#e0e0e0"',
      );
    }
  }

  if (
    lower.includes("light background") ||
    lower.includes("background to light") ||
    lower.includes("light mode")
  ) {
    result = result.replace(
      /background(?:-color)?:\s*#?(?:000|0f0f0f|111|1a1a2e|222|333)/gi,
      "background-color: #ffffff",
    );
  }

  if (lower.includes("text white") || lower.includes("white text")) {
    result = result.replace(
      /color:\s*#?(?:000|333|444|555|black)/gi,
      "color: #ffffff",
    );
  }
  if (lower.includes("text black") || lower.includes("black text")) {
    result = result.replace(
      /color:\s*#?(?:fff|ffffff|eee|eeeeee|white)/gi,
      "color: #000000",
    );
  }

  if (
    lower.includes("bigger font") ||
    lower.includes("larger font") ||
    lower.includes("increase font") ||
    lower.includes("font size bigger")
  ) {
    result = result.replace(/font-size:\s*(\d+)(px|rem|em)/gi, (_, n, unit) => {
      const bigger =
        unit === "px"
          ? Math.round(Number(n) * 1.2)
          : (Number(n) * 1.2).toFixed(1);
      return `font-size: ${bigger}${unit}`;
    });
  }
  if (
    lower.includes("smaller font") ||
    lower.includes("decrease font") ||
    lower.includes("font size smaller")
  ) {
    result = result.replace(/font-size:\s*(\d+)(px|rem|em)/gi, (_, n, unit) => {
      const smaller =
        unit === "px"
          ? Math.round(Number(n) * 0.85)
          : (Number(n) * 0.85).toFixed(1);
      return `font-size: ${smaller}${unit}`;
    });
  }

  if (lower.includes("add a button") || lower.includes("add button")) {
    const btnLabel =
      lower.match(
        /button(?:\s+(?:that|with|labeled?|saying?|called?|for)\s+["']?(.+?)["']?)?$/,
      )?.[1] ?? "Click Me";
    const btn = `\n  <button style="padding:8px 16px;border-radius:6px;background:#3b82f6;color:#fff;border:none;cursor:pointer;font-size:14px;">${btnLabel.trim()}</button>`;
    if (result.includes("</body>")) {
      result = result.replace(/<\/body>/i, `${btn}\n</body>`);
    } else {
      result = `${result}${btn}`;
    }
  }

  const headingMatch = lower.match(
    /add (?:a )?(?:h[1-3]|heading|title)\s+(?:saying?|with text|that says?|["'])?(.+?)["']?$/,
  );
  if (headingMatch) {
    const headingText = headingMatch[1].trim();
    const h = `<h2 style="font-size:2rem;font-weight:700;margin-bottom:1rem;">${headingText}</h2>`;
    if (result.includes("</body>")) {
      result = result.replace(/<body[^>]*>/i, (m) => `${m}\n  ${h}`);
    } else {
      result = `${h}\n${result}`;
    }
  }

  if (
    lower.includes("center") &&
    (lower.includes("text") ||
      lower.includes("content") ||
      lower.includes("everything"))
  ) {
    result = result.replace(/<body([^>]*)>/i, (_, attrs) => {
      if (attrs.includes("text-align")) return `<body${attrs}>`;
      return `<body${attrs} style="${attrs.includes("style=") ? "" : ""}text-align:center;">`;
    });
  }

  const paraMatch = instruction.match(
    /add (?:a )?(?:paragraph|text|p)\s+(?:saying?|with|that says?|["'])?(.+?)["']?$/i,
  );
  if (paraMatch && !lower.includes("heading") && !lower.includes("button")) {
    const paraText = paraMatch[1].trim();
    const p = `\n  <p>${paraText}</p>`;
    if (result.includes("</body>")) {
      result = result.replace(/<\/body>/i, `${p}\n</body>`);
    } else {
      result = `${result}${p}`;
    }
  }

  const colorMatch = lower.match(
    /(?:change|set|make)(?:\s+the?)?\s+(?:primary|accent|main|button|link)\s+(?:color\s+)?(?:to\s+)?(\w+)/,
  );
  if (colorMatch) {
    const colorName = colorMatch[1];
    const colorMap: Record<string, string> = {
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#22c55e",
      yellow: "#eab308",
      orange: "#f97316",
      purple: "#a855f7",
      pink: "#ec4899",
      teal: "#14b8a6",
      cyan: "#06b6d4",
      indigo: "#6366f1",
      violet: "#8b5cf6",
      white: "#ffffff",
      black: "#000000",
      gray: "#6b7280",
    };
    const hex = colorMap[colorName];
    if (hex) {
      result = result.replace(
        /(background(?:-color)?:\s*)(#[0-9a-fA-F]{3,6}|blue|red|green|purple)/g,
        `$1${hex}`,
      );
    }
  }

  return result;
}

// ── Pollinations AI API call — clarification mode ─────────────
async function callFreeAIForClarification(
  currentContent: string,
  language: string,
  instruction: string,
  trainingContext?: string,
): Promise<{ interpretation: string; question: string | null }> {
  const systemPrompt = [
    "You are a code editor assistant. Your job is to interpret what the user wants and ask one short clarifying question if needed before making any changes.",
    trainingContext ? `\nProject context:\n${trainingContext}` : "",
    "\nRules:",
    "- DO NOT output any code.",
    "- First, state in plain language what you think the user wants (1-2 sentences).",
    "- If the request is ambiguous or could go multiple ways, ask ONE clarifying question.",
    "- If the request is clear enough, say you are ready and ask the user to confirm.",
    '- Format your response as JSON with two fields: "interpretation" (string) and "question" (string or null). If no question is needed, set question to null.',
    '- Example: {"interpretation": "You want to add a fixed top navigation bar with Home and About links.", "question": null}',
    '- Example: {"interpretation": "You want to change the header.", "question": "Do you want to change the text content, the styling (size/color), or both?"}',
  ].join("\n");

  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Language: ${language}\n\nCurrent code (first 800 chars):\n${currentContent.slice(0, 800)}\n\nUser instruction: ${instruction}`,
        },
      ],
      seed: 42,
      private: true,
    }),
  });

  if (!response.ok) throw new Error(`AI service error ${response.status}`);

  const raw = await response.text();
  // Extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: treat entire response as interpretation, no question
    return { interpretation: raw.trim(), question: null };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      interpretation: parsed.interpretation ?? raw.trim(),
      question: parsed.question ?? null,
    };
  } catch {
    return { interpretation: raw.trim(), question: null };
  }
}

// ── Pollinations AI API call — apply confirmed instruction ─────
async function callFreeAIApply(
  currentContent: string,
  language: string,
  instruction: string,
  trainingContext?: string,
): Promise<string> {
  const systemPrompt = trainingContext
    ? `You are a code editor assistant. The user has provided the following project training context:\n\n${trainingContext}\n\n---\n\nUse this context to inform all code changes. Return ONLY the complete modified code with no explanation, no markdown code fences, no commentary. Just output the raw code.`
    : "You are a code editor assistant. The user will provide code and an instruction. Return ONLY the complete modified code with no explanation, no markdown code fences, no commentary. Just output the raw code.";

  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Language: ${language}\n\nCurrent code:\n${currentContent}\n\nInstruction: ${instruction}`,
        },
      ],
      seed: 42,
      private: true,
    }),
  });

  if (!response.ok) throw new Error(`AI service error ${response.status}`);

  const raw = await response.text();
  const stripped = raw
    .split("\n")
    .filter((line) => !line.startsWith("```"))
    .join("\n")
    .trim();

  if (!stripped) throw new Error("Empty response from AI");
  return stripped;
}

// ── Markdown preview component ─────────────────────────────────
function MarkdownPreview({ html }: { html: string }) {
  const ref = (el: HTMLDivElement | null) => {
    if (el) el.innerHTML = html;
  };
  return (
    <div
      ref={ref}
      className="w-full h-full overflow-auto p-6 prose prose-invert prose-sm max-w-none"
    />
  );
}

// ── Language badge color ───────────────────────────────────────
function getLangColor(lang: Language) {
  switch (lang) {
    case Language.HTML:
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case Language.CSS:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case Language.JavaScript:
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case Language.Markdown:
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case Language.PlainText:
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString();
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Chat Message Bubble ────────────────────────────────────────
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const isError = msg.role === "error";

  return (
    <div
      className={cn(
        "flex gap-2 items-start",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={cn(
            "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5",
            isError
              ? "bg-destructive/20 text-destructive"
              : "bg-primary/20 text-primary",
          )}
        >
          {msg.isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isError ? (
            <X className="w-3 h-3" />
          ) : (
            <Bot className="w-3 h-3" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : isError
              ? "bg-destructive/15 text-destructive border border-destructive/20 rounded-tl-sm"
              : msg.role === "system"
                ? "bg-muted/60 text-muted-foreground rounded-tl-sm border border-border/40 italic"
                : "bg-card border border-border/60 text-foreground rounded-tl-sm",
        )}
      >
        {msg.isLoading ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            AI is thinking…
          </span>
        ) : (
          msg.text
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function CodeEditorPage({
  projectId,
  artifactId,
  onNavigate,
}: CodeEditorPageProps) {
  const { data: artifact, isLoading } = useGetArtifact(artifactId);
  const { data: revisions = [] } = useGetRevisions(artifactId);
  const updateArtifact = useUpdateArtifact();
  const deleteArtifact = useDeleteArtifact();
  const publishArtifact = usePublishArtifact();
  const unpublishArtifact = useUnpublishArtifact();
  const addRevision = useAddRevision();
  const queryClient = useQueryClient();

  // Editor state
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [language, setLanguage] = useState<Language>(Language.HTML);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">(
    "saved",
  );

  // Preview state
  const [previewContent, setPreviewContent] = useState("");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Revision history panel
  const [revisionPanelOpen, setRevisionPanelOpen] = useState(false);

  // Reference images panel
  type RefImage = { id: string; name: string; dataUrl: string };
  const [refImages, setRefImages] = useState<RefImage[]>([]);
  const [refsPanelOpen, setRefsPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        `editor-refs-${artifactId.toString()}`,
      );
      if (stored) setRefImages(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [artifactId]);

  const saveRefImages = (imgs: RefImage[]) => {
    setRefImages(imgs);
    try {
      localStorage.setItem(
        `editor-refs-${artifactId.toString()}`,
        JSON.stringify(imgs),
      );
    } catch {
      // ignore
    }
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const readers = files.map(
      (file) =>
        new Promise<RefImage>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: file.name,
              dataUrl: reader.result as string,
            });
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((newImgs) => {
      saveRefImages([...refImages, ...newImgs]);
      setRefsPanelOpen(true);
    });
    e.target.value = "";
  };

  const handleDeleteRefImage = (id: string) => {
    saveRefImages(refImages.filter((img) => img.id !== id));
  };

  // AI training context (loaded from localStorage)
  const [trainingContext, setTrainingContext] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`ai-training-${projectId.toString()}`);
    if (stored) setTrainingContext(stored);
  }, [projectId]);

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: genId(),
      role: "system",
      text: "Hello! Tell me what you want to change and I'll explain what I plan to do before touching any code.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiWorking, setIsAiWorking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Pending confirmation state: holds the instruction + clarified interpretation
  // ready to apply once the user confirms
  type PendingAction = {
    instruction: string;
    summary: string; // human-readable plan
  };
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  // Copy link state
  const [copied, setCopied] = useState(false);

  // Initialize from artifact
  useEffect(() => {
    if (artifact) {
      setContent(artifact.content);
      setFilename(artifact.filename);
      setLanguage(artifact.language);
      setPreviewContent(artifact.content);
      setIsDirty(false);
      setSaveStatus("saved");
    }
  }, [artifact]);

  // Debounced preview update
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewContent(content);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content]);

  // Auto-scroll chat to bottom — triggered by adding messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger on message changes
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleContentChange = (val: string) => {
    setContent(val);
    setIsDirty(true);
    setSaveStatus("unsaved");
  };

  const handleSave = async () => {
    if (!artifact) return;
    setSaveStatus("saving");
    try {
      await updateArtifact.mutateAsync({
        id: artifact.id,
        filename,
        language,
        content,
      });
      setIsDirty(false);
      setSaveStatus("saved");
      toast.success("Saved");
    } catch {
      setSaveStatus("unsaved");
    }
  };

  const handleDelete = async () => {
    if (!artifact) return;
    await deleteArtifact.mutateAsync({ id: artifact.id, projectId });
    onNavigate("detail", projectId);
  };

  const handlePublish = async () => {
    if (!artifact) return;
    if (isDirty) await handleSave();
    await publishArtifact.mutateAsync(artifact.id);
  };

  const handleUnpublish = async () => {
    if (!artifact) return;
    await unpublishArtifact.mutateAsync(artifact.id);
  };

  const handleCopyLink = () => {
    if (!artifact?.publishedSlug) return;
    const url = `${window.location.origin}/p/${artifact.publishedSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRevertToRevision = (previousContent: string) => {
    const currentContent = content;
    setContent(previousContent);
    setSaveStatus("unsaved");
    setIsDirty(true);
    toast.success("Reverted — don't forget to save", {
      action: {
        label: "Undo",
        onClick: () => {
          setContent(currentContent);
          setSaveStatus("unsaved");
          setIsDirty(true);
        },
      },
    });
  };

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = `${content.substring(0, start)}  ${content.substring(end)}`;
      setContent(newVal);
      setSaveStatus("unsaved");
      setIsDirty(true);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  // ── Phase 1: Interpret the instruction, ask/confirm ────────────
  const handleChatSubmit = useCallback(async () => {
    const instruction = chatInput.trim();
    if (!instruction || isAiWorking || !artifact) return;

    setChatInput("");
    setIsAiWorking(true);
    setPendingAction(null);

    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      text: instruction,
      timestamp: new Date(),
    };

    const loadingId = genId();
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: "assistant",
      text: "",
      isLoading: true,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg, loadingMsg]);

    let responseText: string;
    let newPending: PendingAction | null = null;

    try {
      const { interpretation, question } = await callFreeAIForClarification(
        content,
        language,
        instruction,
        trainingContext || undefined,
      );

      if (question) {
        // Ambiguous — surface the clarifying question
        responseText = `${interpretation}\n\n${question}`;
        // No pending action yet; user needs to reply
      } else {
        // Clear enough — set up a pending action and ask to confirm
        responseText = `${interpretation}\n\nShall I go ahead and apply this?`;
        newPending = { instruction, summary: interpretation };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      responseText = `I had trouble interpreting that (${errMsg}). Could you rephrase or give more detail?`;
    }

    setPendingAction(newPending);

    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === loadingId
          ? {
              ...m,
              role: "assistant" as const,
              text: responseText,
              isLoading: false,
            }
          : m,
      ),
    );

    setIsAiWorking(false);
  }, [artifact, chatInput, content, isAiWorking, language, trainingContext]);

  // ── Phase 2: Apply the confirmed change ────────────────────────
  const handleConfirmApply = useCallback(async () => {
    if (!pendingAction || !artifact) return;

    setIsAiWorking(true);
    setPendingAction(null);

    const applyingId = genId();
    setChatMessages((prev) => [
      ...prev,
      {
        id: applyingId,
        role: "assistant",
        text: "",
        isLoading: true,
        timestamp: new Date(),
      },
    ]);

    const previousContent = content;
    let newContent: string;
    let resultText: string;

    try {
      newContent = await callFreeAIApply(
        content,
        language,
        pendingAction.instruction,
        trainingContext || undefined,
      );
      resultText = "Done! Changes applied. Don't forget to save.";
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown AI error";
      newContent = applyInstruction(content, pendingAction.instruction);
      resultText = `AI service unavailable (${errMsg}), so I used basic pattern matching instead. Check the result and let me know if you want adjustments.`;
    }

    setContent(newContent);
    setSaveStatus("unsaved");
    setIsDirty(true);

    try {
      await addRevision.mutateAsync({
        artifactId: artifact.id,
        instruction: pendingAction.instruction,
        previousContent,
      });
    } catch {
      // non-critical
    }

    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === applyingId
          ? {
              ...m,
              role: "assistant" as const,
              text: resultText,
              isLoading: false,
            }
          : m,
      ),
    );

    setIsAiWorking(false);
  }, [
    artifact,
    content,
    language,
    pendingAction,
    trainingContext,
    addRevision,
  ]);

  const handleCancelPending = useCallback(() => {
    setPendingAction(null);
    setChatMessages((prev) => [
      ...prev,
      {
        id: genId(),
        role: "system",
        text: "Cancelled. Let me know if you want to try a different approach.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  // ── Render Preview ─────────────────────────────────────────
  const renderPreview = () => {
    switch (language) {
      case Language.HTML:
        return (
          <iframe
            srcDoc={previewContent}
            className="w-full h-full border-none"
            title="HTML Preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        );
      case Language.Markdown: {
        const html = parseMarkdown(previewContent);
        return <MarkdownPreview html={html} />;
      }
      case Language.CSS: {
        const cssDoc = `<!DOCTYPE html><html><head><style>
  body { background: #fff; color: #111; padding: 24px; font-family: sans-serif; }
  ${previewContent}
</style></head><body>
  <div class="preview-container">
    <h1 class="preview-heading">Preview Heading</h1>
    <p class="preview-text">This is preview paragraph text to show your CSS styles applied to real elements.</p>
    <button class="preview-button">Button Example</button>
    <a href="#" class="preview-link">Link Example</a>
    <div class="preview-box" style="margin-top:16px;padding:16px;border:1px solid #ccc;">Box Element</div>
  </div>
</body></html>`;
        return (
          <iframe
            srcDoc={cssDoc}
            className="w-full h-full border-none"
            title="CSS Preview"
            sandbox="allow-scripts"
          />
        );
      }
      case Language.JavaScript: {
        const jsDoc = `<!DOCTYPE html><html><head><style>
  body { background: #1a1a2e; color: #e2e8f0; padding: 24px; font-family: monospace; }
  #output { white-space: pre; }
</style></head><body>
  <div id="output"></div>
  <script>
    const origLog = console.log;
    const origErr = console.error;
    const out = document.getElementById('output');
    console.log = (...a) => { out.textContent += a.join(' ') + '\\n'; origLog(...a); };
    console.error = (...a) => { out.textContent += '❌ ' + a.join(' ') + '\\n'; origErr(...a); };
    try {
      ${previewContent}
    } catch(e) {
      out.textContent += '❌ Error: ' + e.message;
    }
  </script>
</body></html>`;
        return (
          <iframe
            srcDoc={jsDoc}
            className="w-full h-full border-none"
            title="JS Preview"
            sandbox="allow-scripts"
          />
        );
      }
      default:
        return (
          <pre className="w-full h-full overflow-auto p-6 text-sm text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
            {previewContent || (
              <span className="text-muted-foreground">
                Nothing to preview yet…
              </span>
            )}
          </pre>
        );
    }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex-1 flex flex-col p-6 gap-4"
        data-ocid="editor.loading_state"
      >
        <Skeleton className="h-10 w-64 bg-card" />
        <div className="flex-1 flex gap-4">
          <Skeleton className="flex-1 bg-card rounded-xl" />
          <Skeleton className="flex-1 bg-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-6"
        data-ocid="editor.error_state"
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-4">File not found.</p>
          <Button
            onClick={() => onNavigate("detail", projectId)}
            variant="outline"
          >
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  const publicUrl = artifact.isPublished
    ? `${window.location.origin}/p/${artifact.publishedSlug}`
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Top toolbar ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0 flex-wrap gap-y-2">
        <button
          type="button"
          onClick={() => onNavigate("detail", projectId)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-1"
          data-ocid="editor.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Filename */}
        <input
          type="text"
          value={filename}
          onChange={(e) => {
            setFilename(e.target.value);
            setIsDirty(true);
            setSaveStatus("unsaved");
          }}
          className="bg-transparent border-none text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded px-1.5 py-0.5 w-40 truncate"
          aria-label="Filename"
          data-ocid="editor.input"
        />

        {/* Language */}
        <Select
          value={language}
          onValueChange={(v) => {
            setLanguage(v as Language);
            setIsDirty(true);
            setSaveStatus("unsaved");
          }}
        >
          <SelectTrigger
            className="h-7 text-xs border-border bg-card w-28 flex-shrink-0"
            data-ocid="editor.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {Object.values(Language).map((lang) => (
              <SelectItem key={lang} value={lang} className="text-xs">
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Save status indicator */}
        <span
          className={cn(
            "text-xs font-mono hidden sm:inline transition-colors",
            saveStatus === "saved"
              ? "text-emerald-400"
              : saveStatus === "saving"
                ? "text-yellow-400"
                : "text-orange-400",
          )}
        >
          {saveStatus === "saved"
            ? "● Saved"
            : saveStatus === "saving"
              ? "● Saving…"
              : "● Unsaved"}
        </span>

        <div className="flex-1" />

        {/* Publish controls */}
        {artifact.isPublished ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline truncate max-w-[160px]">
                  {publicUrl}
                </span>
              </a>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="h-7 text-xs gap-1 flex-shrink-0 whitespace-nowrap"
              data-ocid="editor.copy_link_button"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {copied ? "Copied!" : "Copy"}
              </span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnpublish}
              disabled={unpublishArtifact.isPending}
              className="h-7 text-xs border-border gap-1 flex-shrink-0 whitespace-nowrap"
              data-ocid="editor.unpublish_button"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unpublish</span>
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishArtifact.isPending}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 flex-shrink-0 whitespace-nowrap"
            data-ocid="editor.publish_button"
          >
            {publishArtifact.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Publish</span>
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || updateArtifact.isPending}
          className={cn(
            "h-7 text-xs gap-1 flex-shrink-0 whitespace-nowrap",
            isDirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-card border border-border text-muted-foreground",
          )}
          data-ocid="editor.save_button"
        >
          {updateArtifact.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Save</span>
        </Button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:bg-destructive/10 flex-shrink-0"
              data-ocid="editor.delete_button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="bg-card border-border"
            data-ocid="delete_artifact.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{filename}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the file and all its revision
                history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="delete_artifact.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="delete_artifact.confirm_button"
              >
                Delete File
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* ── Published badge ──────────────────────────────────── */}
      {artifact.isPublished && (
        <div className="px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 flex-shrink-0">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300">
            Live at{" "}
            <a
              href={publicUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-200 font-mono"
            >
              {publicUrl}
            </a>
          </span>
        </div>
      )}

      {/* ── Editor + Preview split ───────────────────────────── */}
      <div
        className={cn(
          "flex min-h-0",
          previewFullscreen ? "flex-col flex-1" : "flex-row flex-1",
        )}
        style={previewFullscreen ? undefined : { minHeight: 0 }}
      >
        {/* Left: Code Editor */}
        {!previewFullscreen && (
          <div className="flex-1 flex flex-col min-w-0 border-r border-border min-h-0">
            {/* Editor header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/40 flex-shrink-0">
              <Badge
                className={cn(
                  "text-xs border font-mono",
                  getLangColor(language),
                )}
              >
                {language}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono truncate flex-1">
                {filename}
              </span>
              <button
                type="button"
                onClick={() => {
                  const opening = !revisionPanelOpen;
                  setRevisionPanelOpen(opening);
                  if (opening) {
                    queryClient.invalidateQueries({
                      queryKey: ["revisions", artifactId.toString()],
                    });
                  }
                }}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  revisionPanelOpen
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-ocid="editor.revision_panel"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                {revisions.length > 0 && (
                  <span className="bg-primary/20 text-primary rounded-full px-1 py-0 text-xs font-mono">
                    {revisions.length}
                  </span>
                )}
                {revisionPanelOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setRefsPanelOpen(!refsPanelOpen)}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  refsPanelOpen
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-ocid="editor.refs.toggle"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refs</span>
                {refImages.length > 0 && (
                  <span className="bg-primary/20 text-primary rounded-full px-1 py-0 text-xs font-mono">
                    {refImages.length}
                  </span>
                )}
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleTabKey}
              className="flex-1 w-full p-4 bg-background text-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none scrollbar-thin"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder={`Enter your ${language} code here…`}
              data-ocid="editor.textarea"
            />
          </div>
        )}

        {/* Right: Live Preview */}
        <div
          className={cn(
            "flex flex-col min-w-0 bg-white dark:bg-background min-h-0",
            previewFullscreen ? "flex-1" : "flex-1",
          )}
          data-ocid="editor.preview_panel"
        >
          {/* Preview header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/40 flex-shrink-0">
            <span className="text-xs text-muted-foreground font-medium">
              Preview
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setPreviewFullscreen(!previewFullscreen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={
                previewFullscreen ? "Exit fullscreen" : "Fullscreen preview"
              }
            >
              {previewFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Preview content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {renderPreview()}
          </div>
        </div>
      </div>

      {/* ── Revision History Panel (collapsible) ─────────────── */}
      {revisionPanelOpen && (
        <div
          className="border-t border-border bg-card/60 backdrop-blur-sm flex-shrink-0"
          style={{ height: "260px" }}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Clock className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-foreground leading-none">
                Revision History
              </h3>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Each AI edit is saved as a version you can revert to.
              </p>
            </div>
            <Badge className="text-xs bg-muted text-muted-foreground border-border ml-1 self-start mt-0.5">
              {revisions.length}
            </Badge>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setRevisionPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>

          <ScrollArea className="h-[calc(260px-53px)]">
            <div className="p-3 space-y-2">
              {revisions.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-6 text-center"
                  data-ocid="editor.revision.empty_state"
                >
                  <Clock className="w-6 h-6 text-muted-foreground/30 mb-1.5" />
                  <p className="text-xs text-muted-foreground/60">
                    No revisions yet. Use the AI chat below to start editing.
                  </p>
                </div>
              ) : (
                [...revisions].reverse().map((rev, idx) => (
                  <div
                    key={rev.id.toString()}
                    className="flex items-start gap-2 p-2.5 bg-background/60 rounded-lg border border-border/60 group"
                    data-ocid={`editor.revision.item.${idx + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium truncate">
                        {rev.instruction}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimestamp(rev.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleRevertToRevision(rev.previousContent)
                      }
                      className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      data-ocid={`editor.revision.${idx + 1}.button`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Revert
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ── Reference Images Panel (collapsible) ─────────────── */}
      {refsPanelOpen && (
        <div
          className="border-t border-border bg-card/60 backdrop-blur-sm flex-shrink-0"
          style={{ height: "200px" }}
          data-ocid="editor.refs.panel"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Reference Images
            </h3>
            <span className="text-xs bg-muted text-muted-foreground border border-border rounded-full px-1.5 py-0 font-mono ml-1">
              {refImages.length}
            </span>
            <div className="flex-1" />
            <label
              htmlFor="editor-refs-upload"
              className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="editor.refs.upload_button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Image</span>
              <input
                id="editor-refs-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleRefImageUpload}
              />
            </label>
            <button
              type="button"
              onClick={() => setRefsPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1 ml-2"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>

          <div className="h-[calc(200px-41px)] overflow-x-auto overflow-y-hidden">
            {refImages.length === 0 ? (
              <label
                htmlFor="editor-refs-upload-empty"
                className="cursor-pointer flex flex-col items-center justify-center h-full gap-2 text-center px-4"
              >
                <Upload className="w-6 h-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/60">
                  Add reference images for coding context
                </p>
                <p className="text-xs text-muted-foreground/40">
                  PNG, JPG, GIF up to 5MB each
                </p>
                <input
                  id="editor-refs-upload-empty"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleRefImageUpload}
                />
              </label>
            ) : (
              <div className="flex gap-2 p-2 h-full items-center">
                {refImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative flex-shrink-0 h-full group"
                    style={{ width: "140px" }}
                  >
                    <button
                      type="button"
                      onClick={() => window.open(img.dataUrl, "_blank")}
                      className="block w-full h-full rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                      title={`Open ${img.name}`}
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRefImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive z-10"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                      <p className="text-xs text-white truncate">{img.name}</p>
                    </div>
                  </div>
                ))}
                <label
                  htmlFor="editor-refs-upload-add"
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer"
                  style={{ width: "80px", height: "100%" }}
                >
                  <Plus className="w-5 h-5 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/60 mt-1">
                    Add
                  </span>
                  <input
                    id="editor-refs-upload-add"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleRefImageUpload}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Chat Panel (always visible) ───────────────────── */}
      <div
        className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-sm"
        style={{ height: "280px" }}
        data-ocid="editor.ai_chat.panel"
      >
        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/70 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/20 text-primary">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              AI Chat
            </span>
          </div>

          {trainingContext.trim().length > 0 ? (
            <Badge
              className="text-xs border ml-0.5 font-mono bg-emerald-500/15 text-emerald-400 border-emerald-500/25 gap-1"
              data-ocid="editor.ai_trained.badge"
            >
              <Brain className="w-3 h-3" />
              Trained
            </Badge>
          ) : (
            <Badge className="text-xs border ml-0.5 font-mono bg-primary/10 text-primary border-primary/20">
              AI Ready
            </Badge>
          )}

          <div className="flex-1" />

          {/* Clear chat */}
          <button
            type="button"
            onClick={() => {
              setPendingAction(null);
              setChatMessages([
                {
                  id: genId(),
                  role: "system",
                  text: "Chat cleared. Tell me what you want to change and I'll explain my plan before touching any code.",
                  timestamp: new Date(),
                },
              ]);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="editor.ai_chat.delete_button"
          >
            Clear
          </button>
        </div>

        {/* Chat body */}
        <div className="flex min-h-0" style={{ height: "calc(280px - 41px)" }}>
          {/* Left: Message thread */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin border-r border-border/50 min-w-0"
            data-ocid="editor.ai_chat.panel"
          >
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}
          </div>

          {/* Right: Input area */}
          <div className="w-64 flex flex-col p-3 gap-2 flex-shrink-0">
            {/* Pending confirmation banner */}
            {pendingAction && !isAiWorking && (
              <div
                className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-2 flex flex-col gap-1.5"
                data-ocid="editor.ai_chat.confirm_panel"
              >
                <p className="text-xs text-primary font-medium leading-tight">
                  Ready to apply — confirm?
                </p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleConfirmApply}
                    className="flex-1 h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                    data-ocid="editor.ai_chat.confirm_button"
                  >
                    <Check className="w-3 h-3" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelPending}
                    className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground border border-border"
                    data-ocid="editor.ai_chat.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder={
                pendingAction
                  ? "Answer the question above, or confirm/cancel…"
                  : "Describe what you want to change…"
              }
              rows={pendingAction ? 2 : 4}
              disabled={isAiWorking}
              className="flex-1 w-full p-2.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none scrollbar-thin disabled:opacity-60"
              data-ocid="editor.ai_chat.textarea"
            />

            <Button
              onClick={handleChatSubmit}
              disabled={!chatInput.trim() || isAiWorking}
              className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 flex-shrink-0"
              data-ocid="editor.ai_chat.submit_button"
            >
              {isAiWorking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isAiWorking ? "Working…" : "Send"}
            </Button>

            <p className="text-xs text-muted-foreground/50 text-center leading-tight">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
