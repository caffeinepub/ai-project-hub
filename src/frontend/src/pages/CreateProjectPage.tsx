import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useCreateProject } from "../hooks/useQueries";
import { CATEGORY_OPTIONS, makeCategoryFromKind } from "../lib/projectUtils";
import type { CategoryKind } from "../lib/projectUtils";

type Page = "dashboard" | "projects" | "new" | "detail";

interface CreateProjectPageProps {
  onNavigate: (page: Page, id?: bigint) => void;
}

export default function CreateProjectPage({
  onNavigate,
}: CreateProjectPageProps) {
  const [name, setName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind | "">("");
  const [otherLabel, setOtherLabel] = useState("");
  const [description, setDescription] = useState("");
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const createProject = useCreateProject();
  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // isReady: actor is available and not still fetching. connectionTimedOut only
  // blocks if actor is still absent — once actor is present we're always ready.
  const isReady = !!actor && !actorLoading;

  // Start a 30s timeout while the backend is loading
  useEffect(() => {
    if (actorLoading && !actor) {
      // Clear any existing timeout before starting a new one
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setConnectionTimedOut(true);
      }, 30000);
    } else {
      // Backend resolved (or actor appeared) — clear timeout and reset timed-out flag
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (actor) {
        setConnectionTimedOut(false);
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [actorLoading, actor]);

  const handleRetryConnection = () => {
    setConnectionTimedOut(false);
    // Use predicate to match ["actor", *] regardless of principal suffix,
    // since staleTime is Infinity the exact key won't match a prefix query
    queryClient.refetchQueries({
      predicate: (q) => q.queryKey[0] === "actor",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryKind) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isReady) {
      toast.error(
        "Still connecting to the backend — please wait a moment and try again.",
      );
      return;
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
      onNavigate("detail", project.id);
    } catch (err) {
      // onError in the mutation already shows a toast, but we catch here to
      // prevent an unhandled rejection from breaking the form state
      const message = err instanceof Error ? err.message : String(err);
      console.error("Create project error:", err);
      // Show the actual error so the user knows what went wrong
      if (message && !message.includes("Not authenticated")) {
        toast.error(`Could not create project: ${message}`);
      }
    }
  };

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

            {/* Other category label */}
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

          {/* Actor not ready banner */}
          {!actor && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              key={connectionTimedOut ? "timed-out" : "loading"}
            >
              {connectionTimedOut ? (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                  data-ocid="new_project.error_state"
                >
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span className="flex-1">
                    Connection timed out. The network may be slow.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRetryConnection}
                    className="ml-auto shrink-0 h-7 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                    data-ocid="new_project.retry.button"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              ) : actorLoading ? (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm"
                  data-ocid="new_project.loading_state"
                >
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    Connecting to backend… you can fill the form while this
                    loads.
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                  data-ocid="new_project.error_state"
                >
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span className="flex-1">
                    Backend connection unavailable.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRetryConnection}
                    className="ml-auto shrink-0 h-7 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                    data-ocid="new_project.retry.button"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </motion.div>
          )}

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
              ) : actorLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-4 h-4" />
                  Create Project
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
