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
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
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

// ── Pollinations AI API call (free, no key required) ──────────
async function callFreeAI(
  currentContent: string,
  language: string,
  instruction: string,
): Promise<string> {
  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai",
      messages: [
        {
          role: "system",
          content:
            "You are a code editor assistant. The user will provide code and an instruction. Return ONLY the complete modified code with no explanation, no markdown code fences, no commentary. Just output the raw code.",
        },
        {
          role: "user",
          content: `Language: ${language}\n\nCurrent code:\n${currentContent}\n\nInstruction: ${instruction}`,
        },
      ],
      seed: 42,
      private: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI service error ${response.status}`);
  }

  const raw = await response.text();
  // Strip markdown code fences if present
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

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: genId(),
      role: "system",
      text: "Hello! I can help you modify your code using natural language. Type an instruction below and I'll apply it for you.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiWorking, setIsAiWorking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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

  // ── AI Chat Submit ──────────────────────────────────────────
  const handleChatSubmit = useCallback(async () => {
    const instruction = chatInput.trim();
    if (!instruction || isAiWorking || !artifact) return;

    setChatInput("");
    setIsAiWorking(true);

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

    const previousContent = content;

    let newContent: string;
    let successText: string;
    let errorText: string | null = null;

    try {
      newContent = await callFreeAI(content, language, instruction);
      successText = "Done! Applied your changes.";
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown AI error";
      errorText = `AI error: ${errMsg}. Falling back to basic pattern matching.`;
      newContent = applyInstruction(content, instruction);
      successText = "";
    }

    // Update content
    setContent(newContent);
    setSaveStatus("unsaved");
    setIsDirty(true);

    // Log revision to backend
    try {
      await addRevision.mutateAsync({
        artifactId: artifact.id,
        instruction,
        previousContent,
      });
    } catch {
      // non-critical
    }

    // Replace loading bubble
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === loadingId
          ? errorText
            ? {
                ...m,
                role: "error" as const,
                text: errorText,
                isLoading: false,
              }
            : {
                ...m,
                role: "assistant" as const,
                text: successText,
                isLoading: false,
              }
          : m,
      ),
    );

    setIsAiWorking(false);
  }, [artifact, chatInput, content, isAiWorking, language, addRevision]);

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
          <div className="flex items-center gap-1.5">
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
              className="h-7 text-xs gap-1"
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
              className="h-7 text-xs border-border gap-1"
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
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
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
            "h-7 text-xs gap-1",
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
              className="h-7 text-xs text-destructive hover:bg-destructive/10"
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
                onClick={() => setRevisionPanelOpen(!revisionPanelOpen)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="editor.revision_panel"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                {revisionPanelOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
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
          style={{ height: "220px" }}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Revision History
            </h3>
            <Badge className="text-xs bg-muted text-muted-foreground border-border ml-1">
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

          <ScrollArea className="h-[calc(220px-41px)]">
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
                      className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-muted-foreground hover:text-foreground"
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

          <Badge className="text-xs border ml-0.5 font-mono bg-primary/10 text-primary border-primary/20">
            AI Ready
          </Badge>

          <div className="flex-1" />

          {/* Clear chat */}
          <button
            type="button"
            onClick={() =>
              setChatMessages([
                {
                  id: genId(),
                  role: "system",
                  text: "Chat cleared. What would you like to change?",
                  timestamp: new Date(),
                },
              ])
            }
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
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="e.g. Add a nav bar with Home and About links…"
              rows={4}
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
