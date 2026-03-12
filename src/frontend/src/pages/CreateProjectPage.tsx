import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Code2,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useActorStatus } from "../hooks/useActorStatus";
import { useCreateProject } from "../hooks/useQueries";
import { listTemplates } from "../lib/customTemplates";
import type { CustomTemplate } from "../lib/customTemplates";
import { PRESET_TEMPLATES } from "../lib/presetTemplates";
import type { PresetTemplate } from "../lib/presetTemplates";
import { CATEGORY_OPTIONS, makeCategoryFromKind } from "../lib/projectUtils";
import type { CategoryKind } from "../lib/projectUtils";
import { getSecretParameter } from "../utils/urlParams";

type Page = "dashboard" | "projects" | "new" | "detail" | "templates";

interface CreateProjectPageProps {
  onNavigate: (page: Page, id?: bigint) => void;
}

type AnyTemplate = {
  id: string;
  name: string;
  code: string;
  icon?: string;
  description?: string;
};

const SLOW_CONNECTION_TIMEOUT_MS = 30_000;

export default function CreateProjectPage({
  onNavigate,
}: CreateProjectPageProps) {
  const [name, setName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind | "">("");
  const [otherLabel, setOtherLabel] = useState("");
  const [description, setDescription] = useState("");
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AnyTemplate | null>(
    null,
  );
  const [savedTemplates] = useState<CustomTemplate[]>(() => listTemplates());

  const createProject = useCreateProject();
  const { actor, isFetching: actorLoading } = useActor();
  const { isError: actorError, retry: retryActor } = useActorStatus();

  const isReady = !!actor && !actorLoading;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isReady || actorError) {
      setShowSlowWarning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(() => {
      if (!isReady) setShowSlowWarning(true);
    }, SLOW_CONNECTION_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isReady, actorError]);

  const handleRetry = () => {
    setShowSlowWarning(false);
    retryActor();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryKind) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!actor) {
      toast.error(
        "Still connecting to the backend — please wait a moment and try again.",
      );
      return;
    }

    try {
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any)._initializeAccessControlWithSecret(adminToken);
    } catch {
      // May already be initialised — continue
    }

    try {
      const category = makeCategoryFromKind(
        categoryKind,
        otherLabel || "Other",
      );
      const project = await createProject.mutateAsync({
        name: name.trim(),
        category,
        description: description.trim(),
      });
      if (!project || project.id === undefined) {
        toast.error("Project creation failed. Please try again.");
        return;
      }
      toast.success("Project created!");
      if (selectedTemplate) {
        sessionStorage.setItem(
          "pendingTemplate",
          JSON.stringify({
            code: selectedTemplate.code,
            name: selectedTemplate.name,
          }),
        );
      }
      onNavigate("detail", project.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Create project error:", err);
      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("not registered")
      ) {
        toast.error(
          "Registration in progress — please wait a moment and try again.",
        );
      } else if (message && !message.includes("Not authenticated")) {
        toast.error(`Could not create project: ${message}`);
      }
    }
  };

  const categoryIcon = (kind: string) =>
    CATEGORY_OPTIONS.find((o) => o.value === kind)?.icon ?? "✨";

  const showConnectionBanner = actorError || showSlowWarning;

  const selectTemplate = (tpl: AnyTemplate) => {
    setSelectedTemplate(selectedTemplate?.id === tpl.id ? null : tpl);
  };

  // All templates: presets first, then user-saved custom ones
  const allTemplates: AnyTemplate[] = [
    ...PRESET_TEMPLATES,
    ...savedTemplates.map((t) => ({ ...t, icon: categoryIcon(t.category) })),
  ];

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-ocid="new_project.cancel.link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Create New AI Project
              </h1>
              <p className="text-muted-foreground text-sm">
                Define what you want to build
              </p>
            </div>
          </div>
        </motion.div>

        {/* Connection warning banner */}
        <AnimatePresence>
          {showConnectionBanner && (
            <motion.div
              key="connection-warning"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
              data-ocid="new_project.error_state"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/40 bg-warning/10 text-sm">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {actorError
                      ? "Backend connection failed"
                      : "Slow connection detected"}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {actorError
                      ? "Could not reach the network. Try again or check your connection."
                      : "Connection is taking longer than usual. The backend may need a moment to initialize — please try the Retry button."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="shrink-0 border-warning/40 hover:bg-warning/10 gap-1.5"
                  data-ocid="new_project.retry.button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Project name */}
          <div className="space-y-2">
            <Label
              htmlFor="project-name"
              className="text-sm font-medium text-foreground"
            >
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="e.g. NexusChat, PixelForge, CalmCompanion…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card border-border h-11 text-sm"
              required
              data-ocid="new_project.name.input"
            />
          </div>

          {/* Category selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Category <span className="text-destructive">*</span>
            </Label>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              data-ocid="new_project.category.select"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategoryKind(opt.value)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150",
                    categoryKind === opt.value
                      ? "border-primary/60 bg-primary/10 shadow-sm shadow-primary/10"
                      : "border-border bg-card hover:border-border/80 hover:bg-accent/50",
                  )}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      categoryKind === opt.value
                        ? "text-primary"
                        : "text-foreground",
                    )}
                  >
                    {opt.label}
                  </span>
                  {categoryKind === opt.value && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            {categoryKind === "Other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
              >
                <Input
                  placeholder="Describe your project type…"
                  value={otherLabel}
                  onChange={(e) => setOtherLabel(e.target.value)}
                  className="bg-card border-border h-10 text-sm mt-2"
                />
              </motion.div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this AI project does, its goals, and who it's for…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-card border-border text-sm resize-none"
              data-ocid="new_project.description.textarea"
            />
          </div>

          {/* Template Picker (presets + custom) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Start from a Template
              </Label>
              <span className="text-xs text-muted-foreground">optional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allTemplates.map((tpl, idx) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                const isCustom = savedTemplates.some((s) => s.id === tpl.id);
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-ocid={`new_project.template.item.${idx + 1}`}
                    onClick={() => selectTemplate(tpl)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-card hover:border-border/80 hover:bg-accent/50",
                    )}
                  >
                    <span className="text-2xl leading-none mt-0.5">
                      {tpl.icon ?? "✨"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className={cn(
                            "text-sm font-semibold truncate",
                            isSelected ? "text-primary" : "text-foreground",
                          )}
                        >
                          {tpl.name}
                        </p>
                        {isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent border border-border text-muted-foreground font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {tpl.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Code preview panel */}
            <AnimatePresence>
              {selectedTemplate && (
                <motion.div
                  key={selectedTemplate.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                  data-ocid="new_project.template.panel"
                >
                  <div className="mt-2 rounded-xl border border-primary/30 overflow-hidden">
                    {/* Label bar */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900 border-b border-primary/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-primary truncate">
                          {selectedTemplate.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          starter code
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        data-ocid="new_project.template.close_button"
                      >
                        <X className="w-3 h-3" />
                        Hide
                      </button>
                    </div>
                    {/* Code block */}
                    <pre className="overflow-auto max-h-64 bg-zinc-950 p-4 text-xs leading-relaxed font-mono text-zinc-300 scrollbar-thin">
                      <code>{selectedTemplate.code}</code>
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedTemplate && (
              <p className="text-xs text-muted-foreground/60 text-center pt-1">
                Starter code will be loaded into the new project
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={
                createProject.isPending ||
                !name.trim() ||
                !categoryKind ||
                !isReady
              }
              className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold"
              data-ocid="new_project.submit.button"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  {actorLoading && !actor ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 w-4 h-4" />
                  )}
                  {actorLoading && !actor ? "Connecting…" : "Create Project"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate("projects")}
              className="h-11 border-border text-muted-foreground hover:text-foreground"
              data-ocid="new_project.cancel.button"
            >
              Cancel
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
