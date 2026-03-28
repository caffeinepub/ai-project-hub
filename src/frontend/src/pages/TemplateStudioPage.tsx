import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { callAIWithImages } from "@/utils/aiService";
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Eye,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteTemplate,
  listTemplates,
  saveTemplate,
} from "../lib/customTemplates";
import type { CustomTemplate } from "../lib/customTemplates";
import { CATEGORY_OPTIONS } from "../lib/projectUtils";
import type { CategoryKind } from "../lib/projectUtils";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageDataUrl?: string;
  isError?: boolean;
}

interface ReferenceImage {
  dataUrl: string;
  name: string;
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  text: "Welcome to Template Studio! I'll help you build a custom starter template through conversation.\n\nWhat kind of project do you want to create a template for? (e.g. a landing page, a dashboard, a game, a form — anything goes!)\n\nTip: You can also attach a reference image to help me match a specific look or layout!",
};

function extractCodeBlock(text: string): string | null {
  const match = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function extractTemplateName(text: string): string {
  const nameMatch = text.match(
    /(?:name[d]?|call(?:ed)?|title[d]?)\s+["']([^"']+)["']/i,
  );
  if (nameMatch) return nameMatch[1];
  return "";
}

async function callTemplateAI(
  messages: Message[],
  existingCode?: string | null,
): Promise<string> {
  const backtick = "`";

  let systemPrompt: string;
  let contextMessages: Array<{ role: "user" | "assistant"; content: string }> =
    [];

  if (existingCode) {
    systemPrompt = [
      "You are a code editor AI. The user has an existing HTML template that they want to modify. Your job is to apply their requested changes to the code.",
      "",
      "RULES:",
      "- Always output the COMPLETE updated HTML file (never partial snippets)",
      `- Put the full updated HTML code inside triple backticks with html language tag: ${backtick}${backtick}${backtick}html ... ${backtick}${backtick}${backtick}`,
      "- Only output updated code when the user asks for a change — if they just ask a question, answer conversationally without a code block",
      "- Make only the changes requested; preserve everything else",
      "- Never output explanatory text inside the code block",
    ].join("\n");

    contextMessages = [
      {
        role: "user" as const,
        content: `Here is the current template code:\n${backtick}${backtick}${backtick}html\n${existingCode}\n${backtick}${backtick}${backtick}`,
      },
      {
        role: "assistant" as const,
        content:
          "Got it, I can see your template. What would you like to change?",
      },
    ];
  } else {
    systemPrompt = [
      "You are a Template Studio AI assistant. Your job is to help users create custom starter HTML templates through conversation.",
      "",
      "Conversation flow:",
      "1. Ask clarifying questions about: purpose, layout, color scheme, features, tech (vanilla JS only), content sections, and visual style.",
      "2. If the user provides a reference image, study it carefully and replicate its layout, color palette, typography style, and key visual elements in the generated template.",
      "3. Be thorough — ask 3-5 clarifying questions across the conversation before generating code.",
      "4. When you have enough information, generate a COMPLETE, self-contained HTML file with:",
      "   - Inline CSS (style tag in head)",
      "   - Vanilla JavaScript only (no external libs unless CDN is essential)",
      "   - Realistic placeholder content",
      "   - Professional, polished design",
      "   - Mobile responsive",
      `   - Put the full HTML code inside triple backticks with html language tag: ${backtick}${backtick}${backtick}html ... ${backtick}${backtick}${backtick}`,
      '5. Before the code block, briefly describe what you built and suggest a short template name like: Template name: "My Template Name"',
      "",
      "Keep responses conversational and focused. Only generate code when you have enough details.",
    ].join("\n");
  }

  // Extract reference image from last message if any
  const lastMsg = messages[messages.length - 1];
  const refImages = lastMsg?.imageDataUrl
    ? [{ dataUrl: lastMsg.imageDataUrl }]
    : undefined;

  const baseMessages = [
    { role: "system" as const, content: systemPrompt },
    ...contextMessages,
    ...messages
      .filter((m) => !m.isError)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.text || "Here is my reference image.",
      })),
  ];

  return callAIWithImages(baseMessages, refImages);
}

export default function TemplateStudioPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview");
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<CategoryKind | "">(
    "",
  );
  const [templateDescription, setTemplateDescription] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplate[]>(() =>
    listTemplates(),
  );
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(
    null,
  );
  const [lastUserMessage, setLastUserMessage] = useState<Message | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    userScrolledUp.current = !nearBottom;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: smart scroll — only auto-scroll when user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setReferenceImage({ dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
    // reset so the same file can be reselected
    e.target.value = "";
  };

  const handleSend = async (overrideMsg?: Message) => {
    // If called with an override message (retry), use it; otherwise build from current input
    let userMsg: Message;
    let updated: Message[];

    if (overrideMsg) {
      // Remove the previous error message from the end before retrying
      userMsg = { ...overrideMsg, id: `u-${Date.now()}` };
      setMessages((prev) => {
        const withoutError = prev.filter((m) => !m.isError);
        updated = [...withoutError, userMsg];
        return updated;
      });
      // Give state a tick to update before reading
      updated = messages.filter((m) => !m.isError).concat(userMsg);
    } else {
      const text = input.trim();
      if ((!text && !referenceImage) || isLoading) return;

      userMsg = {
        id: `u-${Date.now()}`,
        role: "user",
        text: text || (referenceImage ? "Here is my reference image." : ""),
        imageDataUrl: referenceImage?.dataUrl,
      };
      updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setReferenceImage(null);
    }

    // Track the last user message for retry
    setLastUserMessage(userMsg);

    // Reset scroll flag so the user's message and AI thinking indicator are visible
    userScrolledUp.current = false;
    setIsLoading(true);

    try {
      const reply = await callTemplateAI(updated, generatedCode);
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: reply,
      };
      setMessages((prev) => [...prev.filter((m) => !m.isError), aiMsg]);

      const code = extractCodeBlock(reply);
      if (code) {
        setGeneratedCode(code);
        const suggestedName = extractTemplateName(reply);
        if (suggestedName && !templateName) setTemplateName(suggestedName);
      }
    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: "assistant",
        text: "I had trouble connecting to the AI service. Check your internet connection and try again.",
        isError: true,
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

  const handleSaveTemplate = () => {
    if (!generatedCode) return;
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!templateCategory) {
      toast.error("Please select a category");
      return;
    }
    const saved = saveTemplate({
      name: templateName.trim(),
      category: templateCategory,
      description: templateDescription.trim(),
      code: generatedCode,
    });
    setSavedTemplates(listTemplates());
    toast.success(`Template "${saved.name}" saved!`);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setSavedTemplates(listTemplates());
    if (loadedId === id) setLoadedId(null);
    toast.success("Template deleted");
  };

  const handleLoadTemplate = (tpl: CustomTemplate) => {
    setGeneratedCode(tpl.code);
    setTemplateName(tpl.name);
    setTemplateCategory(tpl.category as CategoryKind);
    setTemplateDescription(tpl.description);
    setLoadedId(tpl.id);
    setPreviewMode("preview");
    toast.success(`Loaded "${tpl.name}"`);
  };

  const categoryIcon = (kind: string) =>
    CATEGORY_OPTIONS.find((o) => o.value === kind)?.icon ?? "✨";

  const canSend = !!(input.trim() || referenceImage) && !isLoading;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <LayoutTemplate
              style={{ width: 18, height: 18 }}
              className="text-primary"
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground text-lg leading-tight">
              Template Studio
            </h1>
            <p className="text-xs text-muted-foreground">
              Chat with AI to design and save custom starter templates
            </p>
          </div>
        </div>

        {/* Saved templates toggle */}
        <button
          type="button"
          data-ocid="template_studio.saved.toggle"
          onClick={() => setSavedPanelOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/50 hover:border-border bg-card"
        >
          {savedPanelOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          My Templates
          {savedTemplates.length > 0 && (
            <span className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
              {savedTemplates.length}
            </span>
          )}
        </button>
      </div>

      {/* Saved templates panel */}
      <AnimatePresence>
        {savedPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border/30 bg-muted/20 flex-shrink-0"
          >
            <div className="px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Saved Custom Templates
              </h2>
              {savedTemplates.length === 0 ? (
                <div
                  data-ocid="template_studio.templates.empty_state"
                  className="text-sm text-muted-foreground py-4 text-center"
                >
                  No templates saved yet — generate one below!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savedTemplates.map((tpl, idx) => (
                    <motion.div
                      key={tpl.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      data-ocid={`template_studio.template.item.${idx + 1}`}
                      className={cn(
                        "flex flex-col gap-2 p-3 rounded-xl border bg-card transition-all",
                        loadedId === tpl.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-border/80",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none mt-0.5">
                          {categoryIcon(tpl.category)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {tpl.name}
                          </p>
                          {tpl.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {tpl.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          data-ocid={`template_studio.template.load_button.${idx + 1}`}
                          onClick={() => handleLoadTemplate(tpl)}
                          className="flex-1 h-7 text-xs gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`template_studio.template.delete_button.${idx + 1}`}
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left — Chat */}
        <div className="flex flex-col lg:w-1/2 border-r border-border/40 min-h-0 h-[50vh] lg:h-auto">
          <div className="px-4 py-2.5 border-b border-border/30 bg-card/40 flex-shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {generatedCode ? "AI Chat — Edit Mode" : "AI Chat"}
            </p>
          </div>

          {/* Chat messages — plain scrollable div so we can attach onScroll */}
          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            className="flex-1 overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-4 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                        <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : msg.isError
                            ? "bg-destructive/10 border border-destructive/30 text-foreground rounded-bl-sm"
                            : "bg-card border border-border text-foreground rounded-bl-sm",
                      )}
                    >
                      {msg.imageDataUrl && (
                        <img
                          src={msg.imageDataUrl}
                          alt="Reference"
                          className="rounded-lg mb-2 max-h-[120px] w-auto object-contain"
                        />
                      )}
                      {msg.text && <span>{msg.text}</span>}
                      {msg.isError && lastUserMessage && (
                        <div className="mt-3 pt-2 border-t border-destructive/20">
                          <Button
                            data-ocid="template_studio.retry.button"
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleSend(lastUserMessage)}
                            className="h-7 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                  data-ocid="template_studio.loading_state"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Thinking…
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border/40 bg-card/30 flex-shrink-0 relative z-10">
            {/* Edit mode hint */}
            <AnimatePresence>
              {generatedCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-2 overflow-hidden"
                >
                  <p className="text-[11px] text-primary/70 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                    ✏️ Edit mode — describe changes to your template and the AI
                    will update the code
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reference image preview */}
            <AnimatePresence>
              {referenceImage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                    <img
                      src={referenceImage.dataUrl}
                      alt="Reference preview"
                      className="h-12 w-auto rounded-md object-contain flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {referenceImage.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Reference image attached
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="template_studio.image.remove_button"
                      onClick={() => setReferenceImage(null)}
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 items-end">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {/* Image upload button */}
              <button
                type="button"
                data-ocid="template_studio.image.upload_button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach reference image"
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors",
                  referenceImage
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/60 bg-background text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30",
                  isLoading && "opacity-50 cursor-not-allowed",
                )}
                aria-label="Attach reference image"
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              <Textarea
                ref={textareaRef}
                data-ocid="template_studio.chat.input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  generatedCode
                    ? "Describe what to change… (Enter to send)"
                    : "Describe your template idea… (Enter to send)"
                }
                rows={2}
                disabled={isLoading}
                autoFocus
                className="resize-none flex-1 bg-background border-border/60 focus:border-primary/60 text-sm"
              />
              <Button
                data-ocid="template_studio.send.button"
                onClick={() => handleSend()}
                disabled={!canSend}
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
            <p className="text-[11px] text-muted-foreground/50 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line · 📎 Attach image for
              visual reference
            </p>
          </div>
        </div>

        {/* Right — Preview + Save */}
        <div className="flex flex-col lg:w-1/2 min-h-0 h-[50vh] lg:h-auto">
          {generatedCode ? (
            <>
              {/* Preview toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-card/40 flex-shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Preview & Save
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("preview")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      previewMode === "preview"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("code")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      previewMode === "code"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Code2 className="w-3 h-3" />
                    Code
                  </button>
                </div>
              </div>

              {/* Preview area */}
              <div className="flex-1 overflow-hidden">
                {previewMode === "preview" ? (
                  <iframe
                    srcDoc={generatedCode}
                    sandbox="allow-scripts"
                    className="w-full h-full border-0"
                    title="Template Preview"
                  />
                ) : (
                  <ScrollArea className="h-full">
                    <pre className="p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                      {generatedCode}
                    </pre>
                  </ScrollArea>
                )}
              </div>

              {/* Save form */}
              <div className="border-t border-border/40 px-4 py-4 bg-card/40 flex-shrink-0 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs font-semibold text-foreground">
                    Save this template
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Template Name
                  </Label>
                  <Input
                    data-ocid="template_studio.name.input"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Portfolio Landing Page"
                    className="h-8 text-sm bg-background border-border/60"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Category
                  </Label>
                  <div
                    data-ocid="template_studio.category.select"
                    className="flex flex-wrap gap-1.5"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTemplateCategory(opt.value)}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all",
                          templateCategory === opt.value
                            ? "border-primary/60 bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80",
                        )}
                      >
                        <span>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Description (optional)
                  </Label>
                  <Textarea
                    data-ocid="template_studio.description.textarea"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="What does this template do?"
                    rows={2}
                    className="resize-none text-sm bg-background border-border/60"
                  />
                </div>

                <Button
                  data-ocid="template_studio.save.button"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || !templateCategory}
                  className="w-full h-9 gap-2 font-semibold"
                >
                  <Upload className="w-4 h-4" />
                  Save Template
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
                <LayoutTemplate className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Your template preview will appear here
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Chat with the AI on the left to generate a template
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
