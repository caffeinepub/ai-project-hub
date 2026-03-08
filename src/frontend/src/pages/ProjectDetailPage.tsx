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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Code2,
  ExternalLink,
  FilePlus2,
  Flag,
  Globe,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Language, Status } from "../backend.d";
import {
  useAddGoal,
  useAddMilestone,
  useCreateArtifact,
  useDeleteArtifact,
  useDeleteGoal,
  useDeleteMilestone,
  useDeleteProject,
  useGetArtifacts,
  useGetProject,
  useToggleGoal,
  useToggleMilestone,
  useUpdateProject,
} from "../hooks/useQueries";
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  formatDate,
  formatRelativeDate,
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  getStatusColor,
  getStatusLabel,
  makeCategoryFromKind,
} from "../lib/projectUtils";
import type { CategoryKind } from "../lib/projectUtils";

type Page = "dashboard" | "projects" | "new" | "detail" | "editor";

// ── Vocab Mapping Types ────────────────────────────────────────
type VocabMapping = {
  id: string;
  shorthand: string;
  meaning: string;
};

interface ProjectDetailPageProps {
  projectId: bigint;
  onNavigate: (page: Page, id?: bigint, artifactId?: bigint) => void;
}

export default function ProjectDetailPage({
  projectId,
  onNavigate,
}: ProjectDetailPageProps) {
  const { data: project, isLoading } = useGetProject(projectId);
  const { data: artifacts = [], isLoading: artifactsLoading } =
    useGetArtifacts(projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createArtifact = useCreateArtifact();
  const deleteArtifact = useDeleteArtifact();
  const addGoal = useAddGoal();
  const toggleGoal = useToggleGoal();
  const deleteGoal = useDeleteGoal();
  const addMilestone = useAddMilestone();
  const toggleMilestone = useToggleMilestone();
  const deleteMilestone = useDeleteMilestone();

  // Editable fields
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>(Status.Planning);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryKind, setCategoryKind] =
    useState<CategoryKind>("CustomAIAssistant");

  // Goal / milestone inputs
  const [newGoal, setNewGoal] = useState("");
  const [newMilestone, setNewMilestone] = useState("");

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Vocabulary mappings — the new training approach
  const [vocabMappings, setVocabMappings] = useState<VocabMapping[]>(() => {
    try {
      const stored = localStorage.getItem(
        `ai-training-vocab-${projectId.toString()}`,
      );
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [vocabShorthand, setVocabShorthand] = useState("");
  const [vocabMeaning, setVocabMeaning] = useState("");
  const [contextExpanded, setContextExpanded] = useState(false);

  // AI Training context — derived from vocab mappings
  const [trainingContext, setTrainingContext] = useState(() => {
    return localStorage.getItem(`ai-training-${projectId.toString()}`) ?? "";
  });

  // Assemble the human-readable context string from vocab mappings
  const assembleVocabContext = useCallback((mappings: VocabMapping[]) => {
    if (mappings.length === 0) return "";
    return mappings
      .map((m) => `When I say "${m.shorthand}", I mean ${m.meaning}.`)
      .join("\n");
  }, []);

  // Re-read training vocab from localStorage when projectId changes
  useEffect(() => {
    if (!projectId) return;
    try {
      const stored = localStorage.getItem(
        `ai-training-vocab-${projectId.toString()}`,
      );
      const mappings: VocabMapping[] = stored ? JSON.parse(stored) : [];
      setVocabMappings(mappings);
      const ctx = assembleVocabContext(mappings);
      setTrainingContext(ctx);
    } catch {
      // ignore
    }
  }, [projectId, assembleVocabContext]);

  // Save mappings to localStorage and update training context
  const saveVocabMappings = useCallback(
    (mappings: VocabMapping[]) => {
      setVocabMappings(mappings);
      try {
        localStorage.setItem(
          `ai-training-vocab-${projectId.toString()}`,
          JSON.stringify(mappings),
        );
      } catch {
        // ignore
      }
      const ctx = assembleVocabContext(mappings);
      localStorage.setItem(`ai-training-${projectId.toString()}`, ctx);
      setTrainingContext(ctx);
    },
    [projectId, assembleVocabContext],
  );

  const handleAddVocabMapping = useCallback(() => {
    const shorthand = vocabShorthand.trim();
    const meaning = vocabMeaning.trim();
    if (!shorthand || !meaning) return;
    const newMapping: VocabMapping = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      shorthand,
      meaning,
    };
    saveVocabMappings([...vocabMappings, newMapping]);
    setVocabShorthand("");
    setVocabMeaning("");
    toast.success(`"${shorthand}" defined`);
  }, [vocabShorthand, vocabMeaning, vocabMappings, saveVocabMappings]);

  const handleDeleteVocabMapping = useCallback(
    (id: string) => {
      saveVocabMappings(vocabMappings.filter((m) => m.id !== id));
    },
    [vocabMappings, saveVocabMappings],
  );

  const handleVocabKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddVocabMapping();
    }
  };

  const handleResetTraining = () => {
    localStorage.removeItem(`ai-training-${projectId.toString()}`);
    localStorage.removeItem(`ai-training-vocab-${projectId.toString()}`);
    setVocabMappings([]);
    setTrainingContext("");
    setVocabShorthand("");
    setVocabMeaning("");
    toast.success("Training vocabulary cleared");
  };

  // New file dialog
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState<Language>(
    Language.HTML,
  );

  // Project images (localStorage)
  type ProjectImage = { id: string; name: string; dataUrl: string };
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);

  useEffect(() => {
    if (!projectId) return;
    try {
      const stored = localStorage.getItem(
        `project-images-${projectId.toString()}`,
      );
      if (stored) setProjectImages(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [projectId]);

  const saveProjectImages = (imgs: ProjectImage[]) => {
    setProjectImages(imgs);
    try {
      localStorage.setItem(
        `project-images-${projectId.toString()}`,
        JSON.stringify(imgs),
      );
    } catch {
      // ignore
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const readers = files.map(
      (file) =>
        new Promise<ProjectImage>((resolve) => {
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
      saveProjectImages([...projectImages, ...newImgs]);
    });
    e.target.value = "";
  };

  const handleDeleteImage = (id: string) => {
    saveProjectImages(projectImages.filter((img) => img.id !== id));
  };

  useEffect(() => {
    if (project) {
      setName(project.name);
      setStatus(project.status);
      setDescription(project.description ?? "");
      setNotes(project.notes ?? "");
      setCategoryKind(project.category.__kind__ as CategoryKind);
      setIsDirty(false);
    }
  }, [project]);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    if (!project) return;
    const category = makeCategoryFromKind(categoryKind);
    await updateProject.mutateAsync({
      id: project.id,
      name,
      category,
      status,
      description: description || null,
      notes: notes || null,
    });
    setIsDirty(false);
    toast.success("Project saved");
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !project) return;
    await addGoal.mutateAsync({ projectId: project.id, text: newGoal.trim() });
    setNewGoal("");
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.trim() || !project) return;
    await addMilestone.mutateAsync({
      projectId: project.id,
      title: newMilestone.trim(),
    });
    setNewMilestone("");
  };

  const handleDelete = async () => {
    if (!project) return;
    await deleteProject.mutateAsync(project.id);
    onNavigate("projects");
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newFilename.trim()) return;
    const artifact = await createArtifact.mutateAsync({
      projectId: project.id,
      filename: newFilename.trim(),
      language: newFileLanguage,
      content: getDefaultContent(newFileLanguage, newFilename.trim()),
    });
    setNewFileDialogOpen(false);
    setNewFilename("");
    setNewFileLanguage(Language.HTML);
    onNavigate("editor", project.id, artifact.id);
  };

  const getDefaultContent = (lang: Language, fname: string): string => {
    switch (lang) {
      case Language.HTML:
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fname.replace(/\.html?$/, "")}</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #0f0f0f;
      color: #e2e8f0;
    }
    h1 { color: #60efff; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start editing this file to build your project.</p>
</body>
</html>`;
      case Language.CSS:
        return `/* ${fname} */
body {
  font-family: system-ui, sans-serif;
  background: #ffffff;
  color: #111111;
  margin: 0;
  padding: 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
}`;
      case Language.JavaScript:
        return `// ${fname}
console.log("Hello from ${fname}!");

// Your JavaScript here
function main() {
  console.log("Running...");
}

main();`;
      case Language.Markdown:
        return `# ${fname.replace(/\.md$/, "")}

Start writing your document here.

## Section 1

Some text goes here.

## Section 2

More content here.`;
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex-1 overflow-auto scrollbar-thin p-6"
        data-ocid="projects.loading_state"
      >
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64 bg-card" />
          <Skeleton className="h-6 w-40 bg-card" />
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-64 bg-card rounded-xl" />
            <Skeleton className="h-64 bg-card rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found.</p>
          <Button onClick={() => onNavigate("projects")} variant="outline">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const goalsCompleted = project.goals.filter((g) => g.completed).length;
  const milestonesCompleted = project.milestones.filter(
    (m) => m.completed,
  ).length;

  return (
    <>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            className="mb-6"
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

            <div className="flex flex-wrap items-start gap-4">
              {/* Editable title + category icon */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-3xl flex-shrink-0">
                  {getCategoryIcon(project.category)}
                </span>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                  }}
                  className="font-display font-bold text-xl bg-transparent border-transparent hover:border-border focus:border-border px-2 h-auto py-1 text-foreground"
                  aria-label="Project name"
                />
              </div>

              {/* Status + badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  className={cn(
                    "text-xs border font-medium",
                    getCategoryColor(project.category),
                  )}
                >
                  {getCategoryLabel(project.category)}
                </Badge>

                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v as Status);
                    markDirty();
                  }}
                >
                  <SelectTrigger
                    className="h-7 text-xs border-border bg-card w-32"
                    data-ocid="project_detail.status.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem
                        key={s.value}
                        value={s.value}
                        className="text-xs"
                      >
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-xs border font-medium",
                            getStatusColor(s.value),
                          )}
                        >
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isDirty && (
                  <Button
                    onClick={handleSave}
                    disabled={updateProject.isPending}
                    size="sm"
                    className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    data-ocid="project_detail.save.button"
                  >
                    {updateProject.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground ml-12">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Created {formatDate(project.createdAt)}
              </span>
              <span>Updated {formatRelativeDate(project.updatedAt)}</span>
              {project.goals.length > 0 && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {goalsCompleted}/{project.goals.length} goals
                </span>
              )}
              {project.milestones.length > 0 && (
                <span className="flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  {milestonesCompleted}/{project.milestones.length} milestones
                </span>
              )}
            </div>
          </motion.div>

          {/* Main tabs */}
          <Tabs defaultValue="project" className="w-full">
            <TabsList className="bg-card border border-border mb-6 h-9">
              <TabsTrigger
                value="project"
                className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                data-ocid="project_detail.project.tab"
              >
                Project
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-1.5"
                data-ocid="project_detail.images.tab"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Images
                {projectImages.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0">
                    {projectImages.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-1.5"
                data-ocid="project_detail.files.tab"
              >
                <Code2 className="w-3.5 h-3.5" />
                Code Files
                {artifacts.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0">
                    {artifacts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="train"
                className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-1.5"
                data-ocid="project_detail.train_ai.tab"
              >
                <Brain className="w-3.5 h-3.5" />
                Train AI
                {trainingContext.trim().length > 0 && (
                  <span className="ml-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-1.5 py-0 font-medium">
                    ✓
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project">
              {/* Two-column layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: Description + Notes */}
                <motion.div
                  className="space-y-5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {/* Description */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <Label className="text-sm font-semibold text-foreground mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Describe your project…"
                      rows={4}
                      className="bg-background border-border text-sm resize-none"
                      data-ocid="project_detail.description.textarea"
                    />
                  </div>

                  {/* Notes */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <Label className="text-sm font-semibold text-foreground mb-2 block">
                      Notes
                    </Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        markDirty();
                      }}
                      placeholder="Add notes, ideas, links, or context…"
                      rows={5}
                      className="bg-background border-border text-sm resize-none"
                      data-ocid="project_detail.notes.textarea"
                    />
                  </div>

                  {/* Save button (always visible at bottom of left col) */}
                  <Button
                    onClick={handleSave}
                    disabled={updateProject.isPending || !isDirty}
                    className={cn(
                      "w-full h-10 font-semibold transition-all",
                      isDirty
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        : "bg-card border border-border text-muted-foreground cursor-default",
                    )}
                    data-ocid="project_detail.save.button"
                  >
                    {updateProject.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : isDirty ? (
                      <>
                        <Save className="mr-2 w-4 h-4" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 w-4 h-4 text-emerald-400" />
                        All changes saved
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Right: Goals + Milestones */}
                <motion.div
                  className="space-y-5"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Goals */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Goals
                      </h3>
                      {project.goals.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground font-mono">
                          {goalsCompleted}/{project.goals.length}
                        </span>
                      )}
                    </div>

                    {/* Goal list */}
                    <div className="space-y-2 mb-3">
                      {project.goals.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 text-center py-3">
                          No goals yet. Add one below.
                        </p>
                      ) : (
                        project.goals.map((goal, idx) => (
                          <div
                            key={goal.id.toString()}
                            className="flex items-center gap-2 group"
                            data-ocid={
                              idx === 0
                                ? "project_detail.goal.checkbox.1"
                                : undefined
                            }
                          >
                            <Checkbox
                              id={`goal-${goal.id}`}
                              checked={goal.completed}
                              onCheckedChange={() =>
                                toggleGoal.mutate({
                                  projectId: project.id,
                                  goalId: goal.id,
                                })
                              }
                              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              data-ocid={
                                idx === 0
                                  ? "project_detail.goal.checkbox.1"
                                  : undefined
                              }
                            />
                            <label
                              htmlFor={`goal-${goal.id}`}
                              className={cn(
                                "flex-1 text-sm cursor-pointer leading-snug",
                                goal.completed
                                  ? "line-through text-muted-foreground/50"
                                  : "text-foreground",
                              )}
                            >
                              {goal.text}
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                deleteGoal.mutate({
                                  projectId: project.id,
                                  goalId: goal.id,
                                })
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
                              data-ocid={
                                idx === 0
                                  ? "project_detail.goal.delete_button.1"
                                  : undefined
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add goal */}
                    <form onSubmit={handleAddGoal} className="flex gap-2">
                      <Input
                        placeholder="New goal…"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="bg-background border-border text-sm h-8 text-xs"
                        data-ocid="project_detail.goal.input"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newGoal.trim() || addGoal.isPending}
                        className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                        data-ocid="project_detail.goal.add_button"
                      >
                        {addGoal.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Milestones */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Flag className="w-4 h-4 text-violet-400" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Milestones
                      </h3>
                      {project.milestones.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground font-mono">
                          {milestonesCompleted}/{project.milestones.length}
                        </span>
                      )}
                    </div>

                    {/* Milestone list */}
                    <div className="space-y-2 mb-3">
                      {project.milestones.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 text-center py-3">
                          No milestones yet. Add one below.
                        </p>
                      ) : (
                        project.milestones.map((ms, idx) => (
                          <div
                            key={ms.id.toString()}
                            className="flex items-center gap-2 group"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleMilestone.mutate({
                                  projectId: project.id,
                                  milestoneId: ms.id,
                                })
                              }
                              className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                              data-ocid={
                                idx === 0
                                  ? "project_detail.milestone.checkbox.1"
                                  : undefined
                              }
                            >
                              {ms.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span
                              className={cn(
                                "flex-1 text-sm leading-snug",
                                ms.completed
                                  ? "line-through text-muted-foreground/50"
                                  : "text-foreground",
                              )}
                            >
                              {ms.title}
                            </span>
                            <span className="text-xs text-muted-foreground/40 hidden sm:block">
                              {formatDate(ms.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                deleteMilestone.mutate({
                                  projectId: project.id,
                                  milestoneId: ms.id,
                                })
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
                              data-ocid={
                                idx === 0
                                  ? "project_detail.milestone.delete_button.1"
                                  : undefined
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add milestone */}
                    <form onSubmit={handleAddMilestone} className="flex gap-2">
                      <Input
                        placeholder="New milestone…"
                        value={newMilestone}
                        onChange={(e) => setNewMilestone(e.target.value)}
                        className="bg-background border-border text-sm h-8 text-xs"
                        data-ocid="project_detail.milestone.input"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={
                          !newMilestone.trim() || addMilestone.isPending
                        }
                        className="h-8 px-3 bg-violet-500 text-white hover:bg-violet-600"
                        data-ocid="project_detail.milestone.add_button"
                      >
                        {addMilestone.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Images tab */}
            <TabsContent value="images">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Project Images
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload screenshots, mockups, or reference images for this
                      project.
                    </p>
                  </div>
                  <label
                    htmlFor="project-image-upload"
                    className="cursor-pointer"
                    data-ocid="project_detail.images.upload_button"
                  >
                    <div className="flex items-center gap-1.5 h-8 px-3 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Images
                    </div>
                    <input
                      id="project-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                {projectImages.length === 0 ? (
                  <label
                    htmlFor="project-image-upload-empty"
                    className="cursor-pointer block"
                    data-ocid="project_detail.images.empty_state"
                  >
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        No images yet
                      </p>
                      <p className="text-xs text-muted-foreground/60 mb-3">
                        Drop images here or click to upload
                      </p>
                      <span className="text-xs text-muted-foreground/50">
                        PNG, JPG, GIF up to 5MB each
                      </span>
                    </div>
                    <input
                      id="project-image-upload-empty"
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                  </label>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {projectImages.map((img) => (
                      <div
                        key={img.id}
                        className="group relative rounded-xl overflow-hidden border border-border bg-card aspect-square"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate font-medium">
                            {img.name}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Add more button */}
                    <label
                      htmlFor="project-image-upload-add"
                      className="cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-colors aspect-square"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground/50 mb-1" />
                      <span className="text-xs text-muted-foreground/60">
                        Add more
                      </span>
                      <input
                        id="project-image-upload-add"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Train AI tab */}
            <TabsContent value="train">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">
                      Teach the AI Your Language
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define what your words mean so the AI understands you when
                      you give it instructions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {vocabMappings.length > 0 && (
                      <Badge className="text-xs border bg-emerald-500/15 text-emerald-400 border-emerald-500/25 gap-1">
                        <Brain className="w-3 h-3" />
                        Trained
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetTraining}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
                      data-ocid="train_ai.reset.button"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Add mapping form */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Add a new definition
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={vocabShorthand}
                      onChange={(e) => setVocabShorthand(e.target.value)}
                      onKeyDown={handleVocabKeyDown}
                      placeholder="When I say…"
                      className="bg-background border-border text-sm h-9 flex-1"
                      data-ocid="train_ai.shorthand.input"
                    />
                    <div className="hidden sm:flex items-center text-muted-foreground flex-shrink-0 px-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <Input
                      value={vocabMeaning}
                      onChange={(e) => setVocabMeaning(e.target.value)}
                      onKeyDown={handleVocabKeyDown}
                      placeholder="I mean…"
                      className="bg-background border-border text-sm h-9 flex-1"
                      data-ocid="train_ai.meaning.input"
                    />
                    <Button
                      onClick={handleAddVocabMapping}
                      disabled={!vocabShorthand.trim() || !vocabMeaning.trim()}
                      size="sm"
                      className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-shrink-0"
                      data-ocid="train_ai.add.button"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Vocabulary list */}
                <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
                  {vocabMappings.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-10 text-center px-4"
                      data-ocid="train_ai.mappings.empty_state"
                    >
                      <Brain className="w-8 h-8 text-muted-foreground/25 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium mb-0.5">
                        No terms defined yet
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Add your first definition above.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {vocabMappings.map((mapping, idx) => (
                        <motion.div
                          key={mapping.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: idx * 0.04 }}
                          className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors"
                          data-ocid={`train_ai.mapping.item.${idx + 1}`}
                        >
                          <span className="font-semibold text-sm text-foreground font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-2 py-0.5 flex-shrink-0">
                            {mapping.shorthand}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                          <span className="text-sm text-foreground/80 flex-1 leading-snug">
                            {mapping.meaning}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteVocabMapping(mapping.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded flex-shrink-0"
                            title="Remove definition"
                            data-ocid={
                              idx === 0
                                ? "train_ai.mapping.delete_button.1"
                                : undefined
                            }
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assembled context (collapsible) */}
                <div className="bg-card/50 border border-border/60 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setContextExpanded((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid="train_ai.context_toggle"
                  >
                    <span className="font-medium flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      View assembled context
                      {vocabMappings.length > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-1.5 font-mono">
                          {vocabMappings.length}{" "}
                          {vocabMappings.length === 1 ? "term" : "terms"}
                        </span>
                      )}
                    </span>
                    {contextExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {contextExpanded && (
                    <div className="border-t border-border/60 px-4 pb-4 pt-3">
                      {vocabMappings.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 italic">
                          No terms defined yet. Add definitions above to build
                          up your AI context.
                        </p>
                      ) : (
                        <pre className="text-xs text-foreground/80 font-mono whitespace-pre-wrap leading-relaxed bg-background rounded-lg p-3 border border-border/60 overflow-y-auto max-h-48 scrollbar-thin">
                          {assembleVocabContext(vocabMappings)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* Code Files tab */}
            <TabsContent value="files">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Code Files
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create HTML, CSS, JavaScript, and Markdown files to
                      preview and publish.
                    </p>
                  </div>
                  <Button
                    onClick={() => setNewFileDialogOpen(true)}
                    size="sm"
                    className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                    data-ocid="artifacts.new_file_button"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    New File
                  </Button>
                </div>

                {artifactsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 bg-card rounded-xl" />
                    ))}
                  </div>
                ) : artifacts.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/40"
                    data-ocid="artifacts.empty_state"
                  >
                    <Code2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      No code files yet
                    </p>
                    <p className="text-xs text-muted-foreground/60 mb-4">
                      Click "New File" to start building
                    </p>
                    <Button
                      onClick={() => setNewFileDialogOpen(true)}
                      size="sm"
                      variant="outline"
                      className="text-xs border-border gap-1.5"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      Create your first file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {artifacts.map((artifact, idx) => (
                      <div
                        key={artifact.id.toString()}
                        className="flex flex-col gap-2 p-3.5 bg-card border border-border rounded-xl group hover:border-primary/30 transition-colors overflow-hidden"
                        data-ocid={`artifacts.item.${idx + 1}`}
                      >
                        {/* Top row: icon + filename + badges */}
                        <div className="flex items-center gap-3 min-w-0">
                          <Code2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-mono font-medium text-foreground truncate">
                              {artifact.filename}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs border font-mono flex-shrink-0",
                              artifact.language === Language.HTML
                                ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                                : artifact.language === Language.CSS
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : artifact.language === Language.JavaScript
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                    : artifact.language === Language.Markdown
                                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                                      : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {artifact.language}
                          </Badge>
                          {artifact.isPublished && (
                            <div className="flex items-center gap-1">
                              <Badge className="text-xs border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                Live
                              </Badge>
                              <a
                                href={`/p/${artifact.publishedSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                title="Open live page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Bottom row: Open Editor + delete */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() =>
                              onNavigate("editor", project.id, artifact.id)
                            }
                            className="h-7 px-3 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 whitespace-nowrap shrink-0"
                            data-ocid={`artifacts.open_editor_button.${idx + 1}`}
                          >
                            Open Editor
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                data-ocid={`artifacts.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete "{artifact.filename}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the file and all
                                  revision history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() =>
                                    deleteArtifact.mutateAsync({
                                      id: artifact.id,
                                      projectId: project.id,
                                    })
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Danger zone */}
          <motion.div
            className="mt-8 pt-6 border-t border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete this project and all its data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    data-ocid="project_detail.delete_button"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  data-ocid="delete_project.dialog"
                  className="bg-card border-border"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete "{project.name}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The project, all goals,
                      milestones, and notes will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-ocid="delete_project.cancel_button">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="delete_project.confirm_button"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        </div>
      </div>

      {/* New File Dialog */}
      <Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
        <DialogContent
          className="bg-card border-border"
          data-ocid="artifacts.new_file_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">New Code File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFile} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Filename</Label>
              <Input
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="e.g. index.html"
                className="bg-background border-border font-mono text-sm"
                autoFocus
                data-ocid="artifacts.filename_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Language</Label>
              <Select
                value={newFileLanguage}
                onValueChange={(v) => setNewFileLanguage(v as Language)}
              >
                <SelectTrigger
                  className="bg-background border-border"
                  data-ocid="artifacts.language_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.values(Language).map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewFileDialogOpen(false)}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newFilename.trim() || createArtifact.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createArtifact.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Create & Open
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
