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

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

const TEMPLATE_VARIANTS: Partial<Record<string, TemplateOption[]>> = {
  LiveWebApp: [
    {
      id: "landing",
      name: "Landing Page",
      description: "Nav, hero, features grid, footer",
      icon: "🌐",
    },
    {
      id: "dashboard",
      name: "Admin Dashboard",
      description: "Sidebar, stats cards, table",
      icon: "📊",
    },
    {
      id: "portfolio",
      name: "Portfolio",
      description: "Grid gallery with project cards",
      icon: "🎨",
    },
  ],
  OfflineDesktopApp: [
    {
      id: "sidebar",
      name: "Sidebar App",
      description: "Title bar, sidebar nav, toolbar",
      icon: "🖥️",
    },
    {
      id: "notes",
      name: "Notes App",
      description: "Split panel: list + editor",
      icon: "📝",
    },
  ],
  AndroidMobileApp: [
    {
      id: "home",
      name: "Home Screen",
      description: "Status bar, cards, FAB, bottom nav",
      icon: "📱",
    },
    {
      id: "chat",
      name: "Chat App",
      description: "Message bubbles, input bar",
      icon: "💬",
    },
  ],
  VideoGame: [
    {
      id: "platformer",
      name: "Canvas Game",
      description: "Playable: WASD, stars, enemies",
      icon: "🎮",
    },
    {
      id: "quiz",
      name: "Quiz Game",
      description: "Multiple choice quiz with score",
      icon: "❓",
    },
  ],
  TherapyCompanionBot: [
    {
      id: "chat",
      name: "Calming Chat",
      description: "Purple chat UI with bot replies",
      icon: "🧠",
    },
    {
      id: "breathing",
      name: "Breathing Exercise",
      description: "Animated breathing guide",
      icon: "🌿",
    },
  ],
  CustomAIAssistant: [
    {
      id: "chat",
      name: "Chat UI",
      description: "Sidebar history, message thread",
      icon: "🤖",
    },
    {
      id: "command",
      name: "Command Palette",
      description: "Spotlight-style input with results",
      icon: "⌨️",
    },
  ],
  SubliminalMaker: [
    {
      id: "player",
      name: "Audio Player",
      description: "Track list, affirmation overlay, freq slider",
      icon: "🎧",
    },
    {
      id: "affirmations",
      name: "Affirmation Loop",
      description: "Full-screen cycling text animations",
      icon: "✨",
    },
  ],
  SongMaker: [
    {
      id: "sequencer",
      name: "Step Sequencer",
      description: "16-step grid that actually plays audio",
      icon: "🎵",
    },
    {
      id: "piano",
      name: "Piano Roll",
      description: "Click keys to play musical notes",
      icon: "🎹",
    },
  ],
  VideoAnimationMaker: [
    {
      id: "timeline",
      name: "Timeline Editor",
      description: "Layers panel, canvas, frame ruler",
      icon: "🎬",
    },
    {
      id: "lottie",
      name: "CSS Animator",
      description: "Animated elements with CSS keyframes",
      icon: "✨",
    },
  ],
  ImageGenerator: [
    {
      id: "gallery",
      name: "Generator UI",
      description: "Prompt input, style chips, gallery",
      icon: "🖼️",
    },
    {
      id: "collage",
      name: "Collage Maker",
      description: "Drag & drop image layout builder",
      icon: "🧩",
    },
  ],
};

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
  const [newFileStep, setNewFileStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");

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

  const handleCreateFile = async (templateId?: string) => {
    if (!project || !newFilename.trim()) return;
    const effectiveTemplateId = templateId ?? selectedTemplateId;
    const content =
      effectiveTemplateId === "blank"
        ? ""
        : getDefaultContent(
            newFileLanguage,
            newFilename.trim(),
            categoryKind,
            effectiveTemplateId,
          );
    const artifact = await createArtifact.mutateAsync({
      projectId: project.id,
      filename: newFilename.trim(),
      language: newFileLanguage,
      content,
    });
    setNewFileDialogOpen(false);
    setNewFilename("");
    setNewFileLanguage(Language.HTML);
    setNewFileStep(1);
    setSelectedTemplateId("blank");
    onNavigate("editor", project.id, artifact.id);
  };

  const currentTemplateVariants: TemplateOption[] =
    TEMPLATE_VARIANTS[categoryKind] ?? [];
  const isHTMLWithVariants =
    newFileLanguage === Language.HTML && currentTemplateVariants.length > 0;

  const getDefaultContent = (
    lang: Language,
    fname: string,
    catKind?: CategoryKind,
    templateId?: string,
  ): string => {
    switch (lang) {
      case Language.HTML: {
        if (!templateId || templateId === "blank") return "";
        const title = fname.replace(/\.html?$/, "");
        // Template-specific overrides
        if (catKind === "LiveWebApp" && templateId === "dashboard") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0d0d14; color: #e2e8f0; height: 100vh; display: flex; overflow: hidden; }
    .sidebar { width: 220px; background: #09090f; border-right: 1px solid #1a1a2e; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar-brand { padding: 1.25rem 1rem; font-size: 1rem; font-weight: 700; color: #7c3aed; border-bottom: 1px solid #1a1a2e; display: flex; align-items: center; gap: .5rem; }
    .nav-item { display: flex; align-items: center; gap: .625rem; padding: .625rem 1rem; font-size: .85rem; color: #6b7280; cursor: pointer; border-left: 2px solid transparent; }
    .nav-item:hover { background: #13131e; color: #e2e8f0; }
    .nav-item.active { color: #a78bfa; border-left-color: #7c3aed; background: #1a1030; }
    .sidebar-footer { margin-top: auto; padding: 1rem; border-top: 1px solid #1a1a2e; display: flex; align-items: center; gap: .625rem; font-size: .8rem; color: #6b7280; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; background: #3b1f6e; display: flex; align-items: center; justify-content: center; font-size: .75rem; flex-shrink: 0; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { padding: .875rem 1.5rem; border-bottom: 1px solid #1a1a2e; display: flex; align-items: center; justify-content: space-between; background: #0d0d14; }
    .topbar h1 { font-size: 1.1rem; font-weight: 700; }
    .topbar-actions { display: flex; align-items: center; gap: .75rem; }
    .btn { padding: .45rem 1rem; border-radius: 8px; font-size: .8rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: #7c3aed; color: #fff; }
    .btn-outline { background: transparent; border: 1px solid #2a2a3e; color: #94a3b8; }
    .content { flex: 1; overflow-y: auto; padding: 1.5rem; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #13131e; border: 1px solid #1a1a2e; border-radius: 12px; padding: 1.25rem; }
    .stat-label { font-size: .75rem; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .5rem; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #e2e8f0; }
    .stat-delta { font-size: .75rem; margin-top: .35rem; }
    .stat-delta.up { color: #4ade80; }
    .stat-delta.down { color: #f87171; }
    .section-title { font-size: .875rem; font-weight: 700; margin-bottom: .75rem; color: #94a3b8; }
    table { width: 100%; border-collapse: collapse; background: #13131e; border: 1px solid #1a1a2e; border-radius: 12px; overflow: hidden; }
    thead { background: #0d0d14; }
    th { padding: .75rem 1rem; text-align: left; font-size: .75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid #1a1a2e; }
    td { padding: .75rem 1rem; font-size: .85rem; border-bottom: 1px solid #1a1a28; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-flex; align-items: center; padding: .2rem .6rem; border-radius: 20px; font-size: .7rem; font-weight: 600; }
    .badge-green { background: rgba(74,222,128,.15); color: #4ade80; border: 1px solid rgba(74,222,128,.25); }
    .badge-yellow { background: rgba(251,191,36,.15); color: #fbbf24; border: 1px solid rgba(251,191,36,.25); }
    .badge-red { background: rgba(248,113,113,.15); color: #f87171; border: 1px solid rgba(248,113,113,.25); }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-brand">📊 ${title}</div>
    <div class="nav-item active">🏠 Overview</div>
    <div class="nav-item">📈 Analytics</div>
    <div class="nav-item">👥 Users</div>
    <div class="nav-item">🛒 Orders</div>
    <div class="nav-item">📦 Products</div>
    <div class="nav-item">⚙️ Settings</div>
    <div class="sidebar-footer"><div class="avatar">A</div><span>Admin User</span></div>
  </aside>
  <div class="main">
    <div class="topbar"><h1>Overview</h1><div class="topbar-actions"><button class="btn btn-outline">Export</button><button class="btn btn-primary">+ New Report</button></div></div>
    <div class="content">
      <div class="stats">
        <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">$84.2K</div><div class="stat-delta up">▲ 12.4% from last month</div></div>
        <div class="stat-card"><div class="stat-label">Active Users</div><div class="stat-value">3,291</div><div class="stat-delta up">▲ 8.1% from last month</div></div>
        <div class="stat-card"><div class="stat-label">New Orders</div><div class="stat-value">148</div><div class="stat-delta down">▼ 2.3% from last month</div></div>
        <div class="stat-card"><div class="stat-label">Conversion</div><div class="stat-value">4.7%</div><div class="stat-delta up">▲ 0.5% from last month</div></div>
      </div>
      <div class="section-title">Recent Orders</div>
      <table>
        <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>#ORD-4821</td><td>Alice Johnson</td><td>Premium Plan</td><td>$299</td><td><span class="badge badge-green">Completed</span></td></tr>
          <tr><td>#ORD-4820</td><td>Bob Martinez</td><td>Starter Plan</td><td>$49</td><td><span class="badge badge-yellow">Pending</span></td></tr>
          <tr><td>#ORD-4819</td><td>Carol White</td><td>Enterprise Plan</td><td>$999</td><td><span class="badge badge-green">Completed</span></td></tr>
          <tr><td>#ORD-4818</td><td>Dan Kim</td><td>Premium Plan</td><td>$299</td><td><span class="badge badge-red">Refunded</span></td></tr>
          <tr><td>#ORD-4817</td><td>Eva Chen</td><td>Starter Plan</td><td>$49</td><td><span class="badge badge-green">Completed</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
        }
        if (catKind === "LiveWebApp" && templateId === "portfolio") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f8f5f0; color: #1a1a1a; min-height: 100vh; }
    nav { padding: 1.25rem 3rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e0d8; }
    .logo { font-size: 1.1rem; font-weight: 800; letter-spacing: -.02em; }
    .nav-links { display: flex; gap: 2rem; list-style: none; }
    .nav-links a { font-size: .9rem; color: #6b6b6b; text-decoration: none; }
    .nav-links a:hover { color: #1a1a1a; }
    .hero { padding: 5rem 3rem 3rem; max-width: 900px; }
    .hero-tag { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #d97706; margin-bottom: 1rem; }
    .hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; line-height: 1.05; letter-spacing: -.03em; margin-bottom: 1.25rem; }
    .hero p { font-size: 1.1rem; color: #5a5a5a; max-width: 540px; line-height: 1.7; margin-bottom: 2rem; }
    .hero-btns { display: flex; gap: .875rem; }
    .btn { display: inline-flex; align-items: center; padding: .75rem 1.75rem; border-radius: 4px; font-size: .9rem; font-weight: 700; text-decoration: none; cursor: pointer; border: 2px solid transparent; transition: all .2s; }
    .btn-dark { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .btn-dark:hover { background: #333; }
    .btn-outline { background: transparent; color: #1a1a1a; border-color: #1a1a1a; }
    .btn-outline:hover { background: #1a1a1a; color: #fff; }
    .grid-section { padding: 2rem 3rem 4rem; }
    .grid-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.5rem; }
    .grid-header h2 { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; }
    .filter-tabs { display: flex; gap: .25rem; }
    .filter-tab { padding: .35rem .875rem; border-radius: 20px; font-size: .8rem; cursor: pointer; border: 1px solid #d5d0c8; background: transparent; color: #6b6b6b; transition: all .15s; }
    .filter-tab.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .project-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e0d8; transition: transform .2s, box-shadow .2s; }
    .project-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.1); }
    .card-thumb { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
    .card-body { padding: 1.25rem; }
    .card-tag { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #d97706; margin-bottom: .5rem; }
    .card-title { font-size: 1rem; font-weight: 800; margin-bottom: .4rem; letter-spacing: -.01em; }
    .card-desc { font-size: .85rem; color: #6b6b6b; line-height: 1.5; margin-bottom: 1rem; }
    .card-link { font-size: .8rem; font-weight: 700; color: #1a1a1a; text-decoration: none; display: inline-flex; align-items: center; gap: .3rem; }
    .card-link:hover { text-decoration: underline; }
    footer { padding: 2rem 3rem; border-top: 1px solid #e5e0d8; display: flex; align-items: center; justify-content: space-between; font-size: .8rem; color: #9a9a9a; }
  </style>
</head>
<body>
  <nav>
    <span class="logo">${title}</span>
    <ul class="nav-links"><li><a href="#">Work</a></li><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Contact</a></li></ul>
  </nav>
  <div class="hero">
    <div class="hero-tag">Portfolio</div>
    <h1>Design &amp;<br>Development</h1>
    <p>I craft thoughtful digital experiences — from brand identity to complex web applications — with a focus on clarity and craft.</p>
    <div class="hero-btns"><a href="#" class="btn btn-dark">View Work</a><a href="#" class="btn btn-outline">Get in Touch</a></div>
  </div>
  <div class="grid-section">
    <div class="grid-header">
      <h2>Selected Work</h2>
      <div class="filter-tabs"><span class="filter-tab active">All</span><span class="filter-tab">Web</span><span class="filter-tab">Mobile</span><span class="filter-tab">Brand</span></div>
    </div>
    <div class="project-grid">
      <div class="project-card"><div class="card-thumb" style="background:#fef3c7">☀️</div><div class="card-body"><div class="card-tag">Web App</div><div class="card-title">Sunrise Dashboard</div><div class="card-desc">A productivity tool for remote teams with real-time collaboration and analytics.</div><a href="#" class="card-link">View Project →</a></div></div>
      <div class="project-card"><div class="card-thumb" style="background:#ede9fe">🧩</div><div class="card-body"><div class="card-tag">Mobile</div><div class="card-title">Puzzle Companion</div><div class="card-desc">Cross-platform puzzle game with 200+ levels and a custom physics engine.</div><a href="#" class="card-link">View Project →</a></div></div>
      <div class="project-card"><div class="card-thumb" style="background:#d1fae5">🌿</div><div class="card-body"><div class="card-tag">Brand</div><div class="card-title">Verdant Identity</div><div class="card-desc">Complete brand identity for a sustainable lifestyle brand launching in 2024.</div><a href="#" class="card-link">View Project →</a></div></div>
      <div class="project-card"><div class="card-thumb" style="background:#fce7f3">💌</div><div class="card-body"><div class="card-tag">Web App</div><div class="card-title">Loveletters</div><div class="card-desc">Email newsletter platform with beautiful editor and audience segmentation tools.</div><a href="#" class="card-link">View Project →</a></div></div>
      <div class="project-card"><div class="card-thumb" style="background:#e0f2fe">🌊</div><div class="card-body"><div class="card-tag">Mobile</div><div class="card-title">Wave Tracker</div><div class="card-desc">Surf forecast app with AI-powered swell analysis and community spot ratings.</div><a href="#" class="card-link">View Project →</a></div></div>
      <div class="project-card"><div class="card-thumb" style="background:#fef9c3">⚡</div><div class="card-body"><div class="card-tag">Web App</div><div class="card-title">Bolt CMS</div><div class="card-desc">Headless content management system with blazing-fast GraphQL API.</div><a href="#" class="card-link">View Project →</a></div></div>
    </div>
  </div>
  <footer><span>© ${new Date().getFullYear()} ${title}</span><span>Available for freelance work</span></footer>
  <script>
    document.querySelectorAll('.filter-tab').forEach(t => t.addEventListener('click', function() { document.querySelectorAll('.filter-tab').forEach(x => x.classList.remove('active')); this.classList.add('active'); }));
  </script>
</body>
</html>`;
        }
        if (catKind === "AndroidMobileApp" && templateId === "chat") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f0f0f5; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 1rem; }
    .phone { width: 100%; max-width: 390px; min-height: 844px; background: #fff; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.2); display: flex; flex-direction: column; position: relative; }
    .status-bar { background: #128c7e; color: #fff; padding: .5rem 1.5rem; display: flex; justify-content: space-between; font-size: .7rem; }
    .chat-header { background: #128c7e; color: #fff; padding: .75rem 1rem 1rem; display: flex; align-items: center; gap: .75rem; }
    .chat-avatar { width: 40px; height: 40px; border-radius: 50%; background: #25d366; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
    .chat-info h2 { font-size: .9rem; font-weight: 700; }
    .chat-info p { font-size: .7rem; opacity: .85; }
    .messages { flex: 1; overflow-y: auto; padding: 1rem; background: #e5ddd5; display: flex; flex-direction: column; gap: .625rem; padding-bottom: 5rem; }
    .msg { max-width: 75%; display: flex; flex-direction: column; }
    .msg.sent { align-self: flex-end; }
    .msg.recv { align-self: flex-start; }
    .bubble { padding: .625rem .875rem; border-radius: 12px; font-size: .875rem; line-height: 1.5; position: relative; }
    .msg.recv .bubble { background: #fff; border-top-left-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,.1); }
    .msg.sent .bubble { background: #dcf8c6; border-top-right-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,.1); color: #1a1a1a; }
    .msg-time { font-size: .6rem; color: #9a9a9a; margin-top: .2rem; }
    .msg.sent .msg-time { text-align: right; }
    .input-bar { position: absolute; bottom: 0; left: 0; right: 0; background: #f0f0f0; padding: .625rem .75rem; display: flex; align-items: center; gap: .5rem; border-top: 1px solid #ddd; }
    .input-bar input { flex: 1; background: #fff; border: none; border-radius: 20px; padding: .625rem 1rem; font-size: .875rem; outline: none; }
    .send-btn { width: 40px; height: 40px; border-radius: 50%; background: #128c7e; border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="phone">
    <div class="status-bar"><span>9:41 AM</span><span>● ● ▋</span></div>
    <div class="chat-header"><div class="chat-avatar">👤</div><div class="chat-info"><h2>${title}</h2><p>online</p></div></div>
    <div class="messages" id="messages">
      <div class="msg recv"><div class="bubble">Hey! How's the project going? 👋</div><div class="msg-time">10:23 AM</div></div>
      <div class="msg sent"><div class="bubble">Making great progress! Just finished the UI design.</div><div class="msg-time">10:24 AM</div></div>
      <div class="msg recv"><div class="bubble">That's awesome! Can you share some screenshots? 📸</div><div class="msg-time">10:24 AM</div></div>
      <div class="msg sent"><div class="bubble">Sure, I'll send them over in a bit. Almost done polishing.</div><div class="msg-time">10:26 AM</div></div>
      <div class="msg recv"><div class="bubble">Can't wait to see it! 🚀</div><div class="msg-time">10:27 AM</div></div>
    </div>
    <div class="input-bar">
      <input id="msgIn" placeholder="Message" />
      <button class="send-btn" id="sendBtn">➤</button>
    </div>
  </div>
  <script>
    const msgs = document.getElementById('messages');
    const input = document.getElementById('msgIn');
    const replies = ["Got it! 👍","That's great news!","Sounds amazing! 🎉","I'll check it out.","Let me know when it's ready.","Perfect, thanks! ✅"];
    let ri = 0;
    function addMsg(text, type) {
      const d = document.createElement('div'); d.className = 'msg ' + type;
      const now = new Date(); const t = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0') + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');
      d.innerHTML = '<div class="bubble">' + text + '</div><div class="msg-time">' + t + '</div>';
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    }
    document.getElementById('sendBtn').addEventListener('click', () => {
      if (!input.value.trim()) return;
      addMsg(input.value, 'sent'); input.value = '';
      setTimeout(() => addMsg(replies[ri++ % replies.length], 'recv'), 800);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('sendBtn').click(); });
  </script>
</body>
</html>`;
        }
        if (catKind === "TherapyCompanionBot" && templateId === "breathing") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #070d14; color: #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 2rem; }
    h1 { font-size: 1.4rem; font-weight: 300; letter-spacing: .15em; color: #94a3b8; text-transform: uppercase; }
    .circle-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
    .circle { width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #1e3a5f, #0d1a2e); border: 2px solid rgba(56,189,248,.3); box-shadow: 0 0 40px rgba(56,189,248,.15), inset 0 0 30px rgba(56,189,248,.05); animation: breathe 8s ease-in-out infinite; display: flex; align-items: center; justify-content: center; }
    @keyframes breathe {
      0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(56,189,248,.15), inset 0 0 30px rgba(56,189,248,.05); }
      50% { transform: scale(1.45); box-shadow: 0 0 80px rgba(56,189,248,.35), inset 0 0 50px rgba(56,189,248,.1); }
    }
    .ring { position: absolute; width: 220px; height: 220px; border-radius: 50%; border: 1px solid rgba(56,189,248,.1); animation: ring-pulse 8s ease-in-out infinite; }
    .ring2 { position: absolute; width: 260px; height: 260px; border-radius: 50%; border: 1px solid rgba(56,189,248,.05); animation: ring-pulse 8s ease-in-out infinite .5s; }
    @keyframes ring-pulse { 0%, 100% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.3); opacity: .1; } }
    .instruction { font-size: 1.5rem; font-weight: 300; letter-spacing: .2em; color: #38bdf8; text-transform: uppercase; animation: fade-text 8s ease-in-out infinite; min-width: 160px; text-align: center; }
    @keyframes fade-text { 0% { opacity: .4; content: 'Inhale'; } 40% { opacity: 1; } 50% { opacity: 1; } 90% { opacity: .4; } 100% { opacity: .4; } }
    .timer { font-size: 2.5rem; font-weight: 200; color: rgba(56,189,248,.6); font-variant-numeric: tabular-nums; letter-spacing: .1em; }
    .guide { font-size: .8rem; color: #475569; max-width: 280px; text-align: center; line-height: 1.7; }
    .controls { display: flex; gap: 1rem; }
    .ctrl-btn { padding: .6rem 1.75rem; border-radius: 30px; font-size: .85rem; cursor: pointer; border: 1px solid rgba(56,189,248,.3); background: rgba(56,189,248,.08); color: #38bdf8; letter-spacing: .05em; transition: all .2s; }
    .ctrl-btn:hover { background: rgba(56,189,248,.15); }
    .ctrl-btn.active { background: rgba(56,189,248,.2); border-color: #38bdf8; }
  </style>
</head>
<body>
  <h1>Breathing Exercise</h1>
  <div class="circle-wrap">
    <div class="ring2"></div>
    <div class="ring"></div>
    <div class="circle"></div>
  </div>
  <div class="instruction" id="instruction">Inhale</div>
  <div class="timer" id="timer">0:00</div>
  <div class="guide">Breathe in for 4 seconds, hold for 4, breathe out for 4. Follow the circle.</div>
  <div class="controls">
    <button class="ctrl-btn active" id="startBtn">Begin</button>
    <button class="ctrl-btn" id="resetBtn">Reset</button>
  </div>
  <script>
    const phases = [{ label: 'Inhale', dur: 4 }, { label: 'Hold', dur: 4 }, { label: 'Exhale', dur: 4 }, { label: 'Hold', dur: 4 }];
    let running = false, phase = 0, elapsed = 0, total = 0, interval = null;
    const inst = document.getElementById('instruction');
    const timer = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    function fmt(s) { return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
    function tick() { elapsed++; total++; timer.textContent = fmt(total); if (elapsed >= phases[phase].dur) { elapsed = 0; phase = (phase+1)%phases.length; inst.textContent = phases[phase].label; } }
    startBtn.addEventListener('click', function() {
      running = !running; this.textContent = running ? 'Pause' : 'Resume'; this.classList.toggle('active', running);
      if (running) { inst.textContent = phases[phase].label; interval = setInterval(tick, 1000); }
      else clearInterval(interval);
    });
    document.getElementById('resetBtn').addEventListener('click', () => { clearInterval(interval); running=false; phase=0; elapsed=0; total=0; inst.textContent='Inhale'; timer.textContent='0:00'; startBtn.textContent='Begin'; startBtn.classList.add('active'); });
  </script>
</body>
</html>`;
        }
        if (catKind === "CustomAIAssistant" && templateId === "command") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #e2e8f0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 8vh; }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -.03em; margin-bottom: .5rem; }
    .header p { font-size: .9rem; color: #6b7280; }
    .palette-wrap { width: 100%; max-width: 600px; padding: 0 1rem; }
    .search-box { width: 100%; background: #141420; border: 1px solid #2a2a3e; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(99,102,241,.1); }
    .search-input-wrap { display: flex; align-items: center; padding: .875rem 1rem; gap: .75rem; border-bottom: 1px solid #1e1e2e; }
    .search-icon { color: #6366f1; font-size: 1rem; flex-shrink: 0; }
    .search-input-wrap input { flex: 1; background: transparent; border: none; outline: none; color: #e2e8f0; font-size: .95rem; }
    .search-input-wrap input::placeholder { color: #4b5563; }
    .kbd { background: #1e1e2e; border: 1px solid #2a2a3e; border-radius: 4px; padding: .15rem .4rem; font-size: .7rem; color: #6b7280; }
    .results { max-height: 360px; overflow-y: auto; }
    .result-group { padding: .5rem 0; }
    .result-group-label { padding: .35rem 1rem; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #4b5563; }
    .result-item { display: flex; align-items: center; gap: .75rem; padding: .625rem 1rem; cursor: pointer; transition: background .1s; }
    .result-item:hover, .result-item.selected { background: #1e1a2e; }
    .result-item.selected .item-icon { color: #818cf8; }
    .item-icon { width: 28px; height: 28px; border-radius: 6px; background: #1e1e2e; display: flex; align-items: center; justify-content: center; font-size: .85rem; flex-shrink: 0; }
    .item-text { flex: 1; }
    .item-name { font-size: .875rem; color: #e2e8f0; }
    .item-sub { font-size: .75rem; color: #4b5563; margin-top: .1rem; }
    .item-kbd { font-size: .7rem; color: #4b5563; }
    .footer-bar { display: flex; align-items: center; gap: 1.25rem; padding: .625rem 1rem; border-top: 1px solid #1e1e2e; }
    .footer-hint { display: flex; align-items: center; gap: .35rem; font-size: .7rem; color: #4b5563; }
    .tip { margin-top: 1.25rem; text-align: center; font-size: .75rem; color: #374151; }
  </style>
</head>
<body>
  <div class="header"><h1>⌨️ ${title}</h1><p>Command palette — type to search anything</p></div>
  <div class="palette-wrap">
    <div class="search-box">
      <div class="search-input-wrap">
        <span class="search-icon">⌘</span>
        <input id="searchInput" placeholder="Search commands, files, actions…" autofocus />
        <span class="kbd">ESC</span>
      </div>
      <div class="results" id="results"></div>
      <div class="footer-bar">
        <div class="footer-hint"><span class="kbd">↑↓</span> Navigate</div>
        <div class="footer-hint"><span class="kbd">↵</span> Select</div>
        <div class="footer-hint"><span class="kbd">ESC</span> Close</div>
      </div>
    </div>
  </div>
  <p class="tip">Click any result or use keyboard arrows to navigate</p>
  <script>
    const allItems = [
      { group: 'Actions', icon: '✦', name: 'New Document', sub: 'Create a blank document', kbd: '⌘N' },
      { group: 'Actions', icon: '📂', name: 'Open File', sub: 'Browse your files', kbd: '⌘O' },
      { group: 'Actions', icon: '💾', name: 'Save All', sub: 'Save all open files', kbd: '⌘S' },
      { group: 'Actions', icon: '⚙️', name: 'Preferences', sub: 'Manage settings', kbd: '⌘,' },
      { group: 'Recent Files', icon: '📄', name: 'index.html', sub: 'Modified 2 min ago', kbd: '' },
      { group: 'Recent Files', icon: '📝', name: 'styles.css', sub: 'Modified 10 min ago', kbd: '' },
      { group: 'Recent Files', icon: '⚡', name: 'app.js', sub: 'Modified 1 hour ago', kbd: '' },
      { group: 'Navigation', icon: '🏠', name: 'Go to Dashboard', sub: 'Main overview', kbd: '' },
      { group: 'Navigation', icon: '📊', name: 'Go to Analytics', sub: 'Charts and reports', kbd: '' },
    ];
    let selected = 0;
    function render(query) {
      const q = query.toLowerCase();
      const filtered = q ? allItems.filter(i => i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)) : allItems;
      const groups = {};
      filtered.forEach(i => { if (!groups[i.group]) groups[i.group] = []; groups[i.group].push(i); });
      const results = document.getElementById('results');
      results.innerHTML = '';
      let idx = 0;
      Object.entries(groups).forEach(([g, items]) => {
        const div = document.createElement('div'); div.className = 'result-group';
        div.innerHTML = '<div class="result-group-label">' + g + '</div>';
        items.forEach(item => {
          const el = document.createElement('div'); el.className = 'result-item' + (idx === selected ? ' selected' : '');
          el.innerHTML = '<div class="item-icon">' + item.icon + '</div><div class="item-text"><div class="item-name">' + item.name + '</div><div class="item-sub">' + item.sub + '</div></div>' + (item.kbd ? '<span class="item-kbd">' + item.kbd + '</span>' : '');
          el.addEventListener('click', () => { selected = idx; render(query); });
          div.appendChild(el); idx++;
        });
        results.appendChild(div);
      });
    }
    document.getElementById('searchInput').addEventListener('input', e => { selected = 0; render(e.target.value); });
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { selected++; render(document.getElementById('searchInput').value); }
      if (e.key === 'ArrowUp') { selected = Math.max(0, selected - 1); render(document.getElementById('searchInput').value); }
    });
    render('');
  </script>
</body>
</html>`;
        }
        if (catKind === "SubliminalMaker" && templateId === "affirmations") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #02020a; color: #e2e8f0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; position: relative; }
    .bg-stars { position: fixed; inset: 0; pointer-events: none; }
    .star { position: absolute; border-radius: 50%; background: #fff; animation: twinkle var(--d) ease-in-out infinite var(--delay); }
    @keyframes twinkle { 0%,100% { opacity: .1; transform: scale(1); } 50% { opacity: .8; transform: scale(1.5); } }
    .affirmation { font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 200; letter-spacing: .12em; text-align: center; max-width: 700px; padding: 0 2rem; color: rgba(199,210,254,.85); animation: fade-cycle 6s ease-in-out infinite; line-height: 1.4; font-style: italic; }
    @keyframes fade-cycle { 0% { opacity: 0; transform: translateY(10px); } 15%,85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }
    .glow-ring { position: fixed; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%); pointer-events: none; animation: pulse-glow 6s ease-in-out infinite; }
    @keyframes pulse-glow { 0%,100% { transform: scale(1); opacity: .5; } 50% { transform: scale(1.3); opacity: 1; } }
    .controls { position: fixed; bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
    .ctrl-btn { padding: .5rem 1.5rem; border-radius: 30px; border: 1px solid rgba(99,102,241,.3); background: rgba(99,102,241,.1); color: rgba(199,210,254,.8); font-size: .8rem; cursor: pointer; letter-spacing: .06em; transition: all .2s; }
    .ctrl-btn:hover { background: rgba(99,102,241,.2); }
    .speed-label { font-size: .75rem; color: #4b5563; }
    .speed-label input[type=range] { accent-color: #6366f1; width: 80px; }
  </style>
</head>
<body>
  <div class="bg-stars" id="stars"></div>
  <div class="glow-ring"></div>
  <div class="affirmation" id="aff">I am worthy of love, abundance, and all good things.</div>
  <div class="controls">
    <button class="ctrl-btn" id="prevBtn">←</button>
    <button class="ctrl-btn" id="pauseBtn">Pause</button>
    <button class="ctrl-btn" id="nextBtn">→</button>
    <div class="speed-label">Speed <input type="range" min="2" max="12" value="6" id="speed" /></div>
  </div>
  <script>
    const stars = document.getElementById('stars');
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div'); s.className = 'star';
      const sz = Math.random() * 2 + 1;
      s.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;top:' + Math.random()*100 + '%;left:' + Math.random()*100 + '%;--d:' + (Math.random()*3+2) + 's;--delay:-' + Math.random()*5 + 's;';
      stars.appendChild(s);
    }
    const affirmations = [
      "I am worthy of love, abundance, and all good things.",
      "My mind is clear, focused, and full of creative power.",
      "I attract success naturally and effortlessly.",
      "I am at peace with who I am and where I am going.",
      "Every day I grow stronger, wiser, and more confident.",
      "I release all fear and step boldly into my potential.",
      "I am surrounded by love and positive energy.",
      "Abundance flows to me from expected and unexpected sources.",
      "I trust the process of life completely.",
      "I am a powerful creator of my own reality.",
    ];
    let idx = 0, paused = false, timer = null;
    const el = document.getElementById('aff');
    function show(i) { el.style.animation = 'none'; el.offsetHeight; el.style.animation = ''; el.textContent = affirmations[i]; }
    function next() { idx = (idx + 1) % affirmations.length; show(idx); }
    function prev() { idx = (idx - 1 + affirmations.length) % affirmations.length; show(idx); }
    function startTimer() { if (timer) clearInterval(timer); const dur = parseInt(document.getElementById('speed').value) * 1000; timer = setInterval(() => { if (!paused) next(); }, dur); }
    document.getElementById('nextBtn').addEventListener('click', next);
    document.getElementById('prevBtn').addEventListener('click', prev);
    document.getElementById('pauseBtn').addEventListener('click', function() { paused = !paused; this.textContent = paused ? 'Resume' : 'Pause'; });
    document.getElementById('speed').addEventListener('input', startTimer);
    startTimer();
  </script>
</body>
</html>`;
        }
        if (catKind === "SongMaker" && templateId === "piano") {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f14; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; }
    h1 { font-size: 1.3rem; font-weight: 700; color: #a78bfa; letter-spacing: -.01em; display: flex; align-items: center; gap: .5rem; }
    .subtitle { font-size: .8rem; color: #4b5563; margin-top: -.75rem; }
    .piano { position: relative; display: flex; user-select: none; border-radius: 0 0 10px 10px; overflow: visible; }
    .white-key { width: 48px; height: 160px; background: #f8f8f4; border: 1px solid #ccc; border-radius: 0 0 6px 6px; cursor: pointer; transition: background .05s; position: relative; z-index: 1; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px; font-size: .65rem; color: #94a3b8; }
    .white-key:active, .white-key.pressed { background: #ddd8ff; border-color: #7c3aed; }
    .black-key { width: 30px; height: 100px; background: #1a1a1a; border: 1px solid #000; border-radius: 0 0 5px 5px; cursor: pointer; transition: background .05s; position: absolute; top: 0; z-index: 2; }
    .black-key:active, .black-key.pressed { background: #3b1f6e; border-color: #7c3aed; }
    .display { background: #13131e; border: 1px solid #1f1f2e; border-radius: 8px; padding: .75rem 1.5rem; font-size: .875rem; color: #94a3b8; min-width: 220px; text-align: center; }
    .note-name { font-size: 1.5rem; font-weight: 700; color: #a78bfa; display: block; line-height: 1.2; }
    .octave { font-size: .75rem; color: #4b5563; }
  </style>
</head>
<body>
  <h1>🎹 ${title}</h1>
  <p class="subtitle">Click keys to play · Keyboard shortcuts shown below</p>
  <div class="display" id="display"><span class="note-name" id="noteName">—</span><span class="octave">Click a key to play</span></div>
  <div class="piano" id="piano"></div>
  <script>
    const notes = [
      { note: 'C4',  freq: 261.63, type: 'white', label: 'C', key: 'a' },
      { note: 'C#4', freq: 277.18, type: 'black', label: 'C#', key: 'w' },
      { note: 'D4',  freq: 293.66, type: 'white', label: 'D', key: 's' },
      { note: 'D#4', freq: 311.13, type: 'black', label: 'D#', key: 'e' },
      { note: 'E4',  freq: 329.63, type: 'white', label: 'E', key: 'd' },
      { note: 'F4',  freq: 349.23, type: 'white', label: 'F', key: 'f' },
      { note: 'F#4', freq: 369.99, type: 'black', label: 'F#', key: 't' },
      { note: 'G4',  freq: 392.00, type: 'white', label: 'G', key: 'g' },
      { note: 'G#4', freq: 415.30, type: 'black', label: 'G#', key: 'y' },
      { note: 'A4',  freq: 440.00, type: 'white', label: 'A', key: 'h' },
      { note: 'A#4', freq: 466.16, type: 'black', label: 'A#', key: 'u' },
      { note: 'B4',  freq: 493.88, type: 'white', label: 'B', key: 'j' },
      { note: 'C5',  freq: 523.25, type: 'white', label: 'C5', key: 'k' },
    ];
    const piano = document.getElementById('piano');
    const ctx_audio = new (window.AudioContext || window.webkitAudioContext)();
    function playNote(freq, noteName) {
      const osc = ctx_audio.createOscillator();
      const gain = ctx_audio.createGain();
      osc.connect(gain); gain.connect(ctx_audio.destination);
      osc.type = 'triangle'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.5, ctx_audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx_audio.currentTime + 1.2);
      osc.start(); osc.stop(ctx_audio.currentTime + 1.2);
      document.getElementById('noteName').textContent = noteName;
    }
    const whites = notes.filter(n => n.type === 'white');
    const keyMap = {};
    whites.forEach((n, i) => {
      const el = document.createElement('div');
      el.className = 'white-key'; el.textContent = n.key.toUpperCase();
      el.style.marginLeft = i === 0 ? '0' : '2px';
      el.addEventListener('mousedown', () => { playNote(n.freq, n.note); el.classList.add('pressed'); });
      el.addEventListener('mouseup', () => el.classList.remove('pressed'));
      el.addEventListener('mouseleave', () => el.classList.remove('pressed'));
      piano.appendChild(el); keyMap[n.key] = { el, freq: n.freq, note: n.note };
    });
    const blackOffsets = { 'C#4': 34, 'D#4': 84, 'F#4': 184, 'G#4': 234, 'A#4': 284 };
    notes.filter(n => n.type === 'black').forEach(n => {
      if (!blackOffsets[n.note]) return;
      const el = document.createElement('div');
      el.className = 'black-key'; el.style.left = blackOffsets[n.note] + 'px';
      el.addEventListener('mousedown', e => { e.stopPropagation(); playNote(n.freq, n.note); el.classList.add('pressed'); });
      el.addEventListener('mouseup', () => el.classList.remove('pressed'));
      el.addEventListener('mouseleave', () => el.classList.remove('pressed'));
      piano.appendChild(el); keyMap[n.key] = { el, freq: n.freq, note: n.note };
    });
    document.addEventListener('keydown', e => { const k = keyMap[e.key.toLowerCase()]; if (k && !e.repeat) { playNote(k.freq, k.note); k.el.classList.add('pressed'); } });
    document.addEventListener('keyup', e => { const k = keyMap[e.key.toLowerCase()]; if (k) k.el.classList.remove('pressed'); });
  </script>
</body>
</html>`;
        }
        switch (catKind) {
          case "LiveWebApp":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --accent: #4f8cff; --bg: #0a0f1e; --surface: #111827; --text: #e2e8f0; --muted: #94a3b8; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }
    nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: rgba(10,15,30,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid #1e2a40; }
    .logo { font-size: 1.25rem; font-weight: 700; color: var(--accent); }
    .nav-links { display: flex; gap: 1.5rem; list-style: none; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; transition: color .2s; }
    .nav-links a:hover { color: var(--text); }
    .hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6rem 2rem; gap: 1.5rem; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.1; }
    .hero h1 span { color: var(--accent); }
    .hero p { font-size: 1.1rem; color: var(--muted); max-width: 560px; }
    .cta { display: inline-flex; align-items: center; gap: .5rem; background: var(--accent); color: #fff; padding: .75rem 2rem; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 1rem; transition: opacity .2s; }
    .cta:hover { opacity: .85; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; padding: 4rem 2rem; max-width: 900px; margin: 0 auto; }
    .feature-card { background: var(--surface); border: 1px solid #1e2a40; border-radius: 12px; padding: 1.5rem; }
    .feature-card .icon { font-size: 2rem; margin-bottom: .75rem; }
    .feature-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: .5rem; }
    .feature-card p { font-size: .875rem; color: var(--muted); }
    footer { text-align: center; padding: 2rem; color: var(--muted); font-size: .8rem; border-top: 1px solid #1e2a40; }
  </style>
</head>
<body>
  <nav>
    <span class="logo">🌐 ${title}</span>
    <ul class="nav-links">
      <li><a href="#">Home</a></li>
      <li><a href="#">Features</a></li>
      <li><a href="#">Pricing</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
    <a href="#" class="cta" style="padding:.5rem 1.25rem;font-size:.875rem;">Get Started</a>
  </nav>
  <section class="hero">
    <h1>Build Something <span>Extraordinary</span></h1>
    <p>The modern platform that helps you ship faster, scale smarter, and delight your users every step of the way.</p>
    <a href="#" class="cta">Start for Free →</a>
  </section>
  <section class="features">
    <div class="feature-card"><div class="icon">⚡</div><h3>Lightning Fast</h3><p>Optimized for performance so your users never have to wait.</p></div>
    <div class="feature-card"><div class="icon">🔒</div><h3>Secure by Default</h3><p>Enterprise-grade security built in from the ground up.</p></div>
    <div class="feature-card"><div class="icon">📈</div><h3>Scales Effortlessly</h3><p>From 10 users to 10 million — we grow with you.</p></div>
  </section>
  <footer>© ${new Date().getFullYear()} ${title}. All rights reserved.</footer>
</body>
</html>`;

          case "OfflineDesktopApp":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #e2e8f0; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .titlebar { height: 36px; background: #0f0f23; display: flex; align-items: center; padding: 0 1rem; gap: .5rem; border-bottom: 1px solid #2a2a4a; user-select: none; }
    .titlebar-dot { width: 12px; height: 12px; border-radius: 50%; }
    .titlebar-title { margin-left: auto; margin-right: auto; font-size: .8rem; color: #6b7280; }
    .app { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 220px; background: #0f0f23; border-right: 1px solid #2a2a4a; display: flex; flex-direction: column; padding: .5rem; }
    .sidebar-logo { padding: 1rem .75rem .75rem; font-weight: 700; font-size: 1rem; color: #7c3aed; border-bottom: 1px solid #2a2a4a; margin-bottom: .5rem; }
    .nav-item { display: flex; align-items: center; gap: .625rem; padding: .6rem .75rem; border-radius: 8px; cursor: pointer; font-size: .875rem; color: #94a3b8; transition: all .15s; }
    .nav-item:hover { background: #1e1e3f; color: #e2e8f0; }
    .nav-item.active { background: #3b0764; color: #c084fc; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .toolbar { height: 44px; background: #141428; border-bottom: 1px solid #2a2a4a; display: flex; align-items: center; padding: 0 1rem; gap: .5rem; }
    .toolbar button { padding: .35rem .75rem; border-radius: 6px; border: 1px solid #2a2a4a; background: #1e1e3f; color: #94a3b8; cursor: pointer; font-size: .8rem; }
    .toolbar button:hover { background: #2a2a4a; color: #e2e8f0; }
    .content { flex: 1; padding: 1.5rem; overflow-y: auto; }
    .content h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #c084fc; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .card { background: #141428; border: 1px solid #2a2a4a; border-radius: 10px; padding: 1.25rem; }
    .card-title { font-weight: 600; font-size: .9rem; margin-bottom: .35rem; }
    .card-sub { font-size: .8rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="titlebar">
    <div class="titlebar-dot" style="background:#ef4444"></div>
    <div class="titlebar-dot" style="background:#f59e0b"></div>
    <div class="titlebar-dot" style="background:#22c55e"></div>
    <span class="titlebar-title">${title}</span>
  </div>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-logo">🖥️ ${title}</div>
      <div class="nav-item active">🏠 Dashboard</div>
      <div class="nav-item">📁 Files</div>
      <div class="nav-item">🔍 Search</div>
      <div class="nav-item">📊 Analytics</div>
      <div class="nav-item" style="margin-top:auto">⚙️ Settings</div>
    </aside>
    <div class="main">
      <div class="toolbar">
        <button>+ New</button>
        <button>📂 Open</button>
        <button>💾 Save</button>
      </div>
      <div class="content">
        <h2>Dashboard</h2>
        <div class="card-grid">
          <div class="card"><div class="card-title">Total Files</div><div class="card-sub">24 items</div></div>
          <div class="card"><div class="card-title">Recent</div><div class="card-sub">Modified 2h ago</div></div>
          <div class="card"><div class="card-title">Storage</div><div class="card-sub">1.2 GB used</div></div>
          <div class="card"><div class="card-title">Synced</div><div class="card-sub">✓ Up to date</div></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

          case "AndroidMobileApp":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 1rem; }
    .phone { width: 100%; max-width: 390px; min-height: 844px; background: #fff; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.2); display: flex; flex-direction: column; position: relative; }
    .status-bar { background: #6366f1; color: #fff; padding: .5rem 1.5rem; display: flex; justify-content: space-between; font-size: .75rem; }
    .app-bar { background: #6366f1; color: #fff; padding: 1rem 1.5rem 1.25rem; }
    .app-bar h1 { font-size: 1.25rem; font-weight: 700; }
    .app-bar p { font-size: .8rem; opacity: .8; margin-top: .2rem; }
    .content { flex: 1; overflow-y: auto; padding: 1rem; padding-bottom: 5rem; }
    .section-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin: 1rem 0 .5rem; }
    .card { background: #fff; border-radius: 14px; padding: 1rem; margin-bottom: .75rem; box-shadow: 0 1px 6px rgba(0,0,0,.08); display: flex; align-items: center; gap: 1rem; }
    .card-icon { width: 44px; height: 44px; border-radius: 12px; background: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
    .card-body h3 { font-size: .9rem; font-weight: 600; }
    .card-body p { font-size: .8rem; color: #6b7280; margin-top: .15rem; }
    .fab { position: absolute; bottom: 5.5rem; right: 1.5rem; width: 56px; height: 56px; border-radius: 50%; background: #6366f1; color: #fff; font-size: 1.75rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(99,102,241,.5); cursor: pointer; border: none; }
    .bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e2e8f0; display: flex; }
    .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; padding: .6rem .5rem; font-size: .65rem; color: #94a3b8; gap: .25rem; cursor: pointer; }
    .nav-tab.active { color: #6366f1; }
    .nav-tab .tab-icon { font-size: 1.25rem; }
  </style>
</head>
<body>
  <div class="phone">
    <div class="status-bar"><span>9:41 AM</span><span>● ● ▋</span></div>
    <div class="app-bar"><h1>${title}</h1><p>Welcome back!</p></div>
    <div class="content">
      <div class="section-title">Recent</div>
      <div class="card"><div class="card-icon">📝</div><div class="card-body"><h3>My Notes</h3><p>Modified just now</p></div></div>
      <div class="card"><div class="card-icon">📊</div><div class="card-body"><h3>Analytics</h3><p>View your stats</p></div></div>
      <div class="section-title">Quick Actions</div>
      <div class="card"><div class="card-icon">⚡</div><div class="card-body"><h3>New Task</h3><p>Create a task quickly</p></div></div>
      <div class="card"><div class="card-icon">🔔</div><div class="card-body"><h3>Notifications</h3><p>3 unread alerts</p></div></div>
      <div class="card"><div class="card-icon">⚙️</div><div class="card-body"><h3>Settings</h3><p>Manage preferences</p></div></div>
    </div>
    <button class="fab">+</button>
    <nav class="bottom-nav">
      <div class="nav-tab active"><span class="tab-icon">🏠</span>Home</div>
      <div class="nav-tab"><span class="tab-icon">🔍</span>Search</div>
      <div class="nav-tab"><span class="tab-icon">❤️</span>Saved</div>
      <div class="nav-tab"><span class="tab-icon">👤</span>Profile</div>
    </nav>
  </div>
</body>
</html>`;

          case "VideoGame":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; color: #e2e8f0; }
    h1 { font-size: 1.5rem; color: #a78bfa; margin-bottom: .5rem; }
    #hud { display: flex; gap: 2rem; font-size: .85rem; color: #94a3b8; margin-bottom: .75rem; }
    #hud span { color: #a78bfa; font-weight: bold; }
    canvas { border: 2px solid #3b1f6e; border-radius: 8px; box-shadow: 0 0 40px rgba(139,92,246,.3); display: block; }
    #instructions { margin-top: .75rem; font-size: .75rem; color: #6b7280; }
  </style>
</head>
<body>
  <h1>🎮 ${title}</h1>
  <div id="hud">Score: <span id="score">0</span> &nbsp;|&nbsp; Lives: <span id="lives">3</span></div>
  <canvas id="c" width="480" height="320"></canvas>
  <p id="instructions">Arrow keys / WASD to move &nbsp;|&nbsp; Collect stars ✦ &nbsp;|&nbsp; Avoid red blocks</p>
  <script>
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    let score = 0, lives = 3, frame = 0;
    const keys = {};
    document.addEventListener('keydown', e => keys[e.key] = true);
    document.addEventListener('keyup', e => keys[e.key] = false);
    const player = { x: W/2, y: H/2, w: 24, h: 24, speed: 3.5, color: '#a78bfa' };
    const stars = Array.from({length: 6}, () => ({ x: Math.random()*W, y: Math.random()*H, r: 6 }));
    const enemies = Array.from({length: 4}, () => ({ x: Math.random()*W, y: Math.random()*H, w: 20, h: 20, vx: (Math.random()-.5)*2, vy: (Math.random()-.5)*2 }));
    function resetPlayer() { player.x = W/2; player.y = H/2; }
    function spawnStar(i) { stars[i].x = Math.random()*W; stars[i].y = Math.random()*H; }
    function update() {
      if (keys['ArrowLeft']||keys['a']||keys['A']) player.x -= player.speed;
      if (keys['ArrowRight']||keys['d']||keys['D']) player.x += player.speed;
      if (keys['ArrowUp']||keys['w']||keys['W']) player.y -= player.speed;
      if (keys['ArrowDown']||keys['s']||keys['S']) player.y += player.speed;
      player.x = Math.max(0, Math.min(W-player.w, player.x));
      player.y = Math.max(0, Math.min(H-player.h, player.y));
      stars.forEach((s, i) => {
        if (Math.abs(s.x - player.x - player.w/2) < player.w/2+s.r && Math.abs(s.y - player.y - player.h/2) < player.h/2+s.r) {
          score++; document.getElementById('score').textContent = score; spawnStar(i);
        }
      });
      enemies.forEach(en => {
        en.x += en.vx; en.y += en.vy;
        if (en.x<0||en.x>W-en.w) en.vx*=-1;
        if (en.y<0||en.y>H-en.h) en.vy*=-1;
        if (player.x < en.x+en.w && player.x+player.w > en.x && player.y < en.y+en.h && player.y+player.h > en.y) {
          lives--; document.getElementById('lives').textContent = lives; resetPlayer();
          if(lives<=0){lives=3;score=0;document.getElementById('score').textContent=0;document.getElementById('lives').textContent=3;}
        }
      });
    }
    function draw() {
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#1a1a2e'; for(let x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();} for(let y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      stars.forEach(s => { ctx.fillStyle='#fbbf24'; ctx.font='12px serif'; ctx.fillText('✦', s.x-6, s.y+5); });
      enemies.forEach(en => { ctx.fillStyle='#ef4444'; ctx.shadowColor='#ef4444'; ctx.shadowBlur=8; ctx.fillRect(en.x,en.y,en.w,en.h); ctx.shadowBlur=0; });
      ctx.fillStyle=player.color; ctx.shadowColor=player.color; ctx.shadowBlur=12; ctx.fillRect(player.x,player.y,player.w,player.h); ctx.shadowBlur=0;
    }
    function loop() { update(); draw(); frame++; requestAnimationFrame(loop); }
    loop();
  </script>
</body>
</html>`;

          case "TherapyCompanionBot":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0a1e; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .chat-container { width: 100%; max-width: 480px; height: 100vh; max-height: 720px; background: #130d24; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(139,92,246,.3); border: 1px solid #2d1f4e; }
    .chat-header { background: linear-gradient(135deg, #3b1f6e, #1e1040); padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: .875rem; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; background: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .header-info h2 { font-size: .95rem; font-weight: 700; }
    .header-info p { font-size: .75rem; color: #c4b5fd; margin-top: .1rem; }
    .online-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; margin-left: auto; box-shadow: 0 0 8px #4ade80; }
    .messages { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: .875rem; }
    .msg { max-width: 80%; }
    .msg.bot { align-self: flex-start; }
    .msg.user { align-self: flex-end; }
    .bubble { padding: .75rem 1rem; border-radius: 16px; font-size: .875rem; line-height: 1.5; }
    .msg.bot .bubble { background: #1e1040; border: 1px solid #2d1f4e; color: #ddd6fe; border-radius: 16px 16px 16px 4px; }
    .msg.user .bubble { background: #7c3aed; color: #fff; border-radius: 16px 16px 4px 16px; }
    .msg-time { font-size: .65rem; color: #6b7280; margin-top: .25rem; }
    .msg.user .msg-time { text-align: right; }
    .input-area { padding: 1rem; border-top: 1px solid #2d1f4e; display: flex; gap: .625rem; }
    .input-area input { flex: 1; background: #1a1035; border: 1px solid #3b1f6e; border-radius: 12px; padding: .75rem 1rem; color: #e2e8f0; font-size: .875rem; outline: none; }
    .input-area input::placeholder { color: #6b7280; }
    .input-area input:focus { border-color: #7c3aed; }
    .send-btn { background: #7c3aed; border: none; border-radius: 12px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; transition: opacity .2s; }
    .send-btn:hover { opacity: .85; }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <div class="avatar">🧠</div>
      <div class="header-info"><h2>${title}</h2><p>Your compassionate companion</p></div>
      <div class="online-dot"></div>
    </div>
    <div class="messages" id="messages">
      <div class="msg bot"><div class="bubble">Hello! I'm here to listen and support you. How are you feeling today? 💜</div><div class="msg-time">Just now</div></div>
      <div class="msg bot"><div class="bubble">Remember, there's no judgment here. You can share anything on your mind.</div><div class="msg-time">Just now</div></div>
      <div class="msg bot"><div class="bubble">Let's take a deep breath together. Breathe in... and out. 🌿</div><div class="msg-time">Just now</div></div>
    </div>
    <div class="input-area">
      <input id="msgInput" placeholder="Share what's on your mind…" />
      <button class="send-btn" id="sendBtn">➤</button>
    </div>
  </div>
  <script>
    const msgs = document.getElementById('messages');
    const input = document.getElementById('msgInput');
    const btn = document.getElementById('sendBtn');
    const responses = ["I hear you. That sounds really challenging. 💜","Thank you for sharing that with me.","You're doing so well just by reaching out.","It's okay to feel that way. Your feelings are valid.","Take your time. I'm right here with you. 🌿","You're stronger than you know.","Let's explore that together. What comes to mind when you think about it?"];
    let ri = 0;
    function addMsg(text, type) {
      const d = document.createElement('div'); d.className = 'msg ' + type;
      d.innerHTML = '<div class="bubble">' + text + '</div><div class="msg-time">Just now</div>';
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    }
    btn.addEventListener('click', () => {
      if (!input.value.trim()) return;
      addMsg(input.value, 'user'); input.value = '';
      setTimeout(() => addMsg(responses[ri++ % responses.length], 'bot'), 900);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  </script>
</body>
</html>`;

          case "CustomAIAssistant":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #e2e8f0; height: 100vh; display: flex; overflow: hidden; }
    .sidebar { width: 240px; background: #111116; border-right: 1px solid #1f1f2e; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar-top { padding: 1rem; border-bottom: 1px solid #1f1f2e; }
    .sidebar-top button { width: 100%; padding: .625rem; background: #1e1e2e; border: 1px solid #2a2a3e; border-radius: 8px; color: #94a3b8; cursor: pointer; font-size: .85rem; }
    .sidebar-top button:hover { background: #2a2a3e; color: #e2e8f0; }
    .chat-history { flex: 1; overflow-y: auto; padding: .5rem; }
    .history-item { padding: .5rem .75rem; border-radius: 6px; font-size: .8rem; color: #94a3b8; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .history-item:hover { background: #1e1e2e; color: #e2e8f0; }
    .history-item.active { background: #1e1e2e; color: #e2e8f0; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { padding: .75rem 1rem; border-bottom: 1px solid #1f1f2e; display: flex; align-items: center; gap: .75rem; }
    .model-badge { background: #1e1e2e; border: 1px solid #2a2a3e; padding: .3rem .75rem; border-radius: 20px; font-size: .75rem; color: #60efff; }
    .messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .msg { display: flex; gap: .875rem; }
    .msg-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: .9rem; flex-shrink: 0; }
    .msg-avatar.ai { background: #1a2a3e; }
    .msg-avatar.user { background: #1e1a2e; }
    .msg-text { padding-top: .2rem; font-size: .875rem; line-height: 1.6; color: #cbd5e1; }
    .msg-text strong { color: #e2e8f0; display: block; margin-bottom: .25rem; font-size: .8rem; }
    .input-bar { padding: 1rem; border-top: 1px solid #1f1f2e; display: flex; gap: .625rem; }
    .input-bar textarea { flex: 1; background: #111116; border: 1px solid #2a2a3e; border-radius: 10px; padding: .75rem 1rem; color: #e2e8f0; font-size: .875rem; resize: none; outline: none; height: 48px; font-family: inherit; }
    .input-bar textarea:focus { border-color: #3b82f6; }
    .send-btn { background: #3b82f6; border: none; border-radius: 10px; padding: 0 1.25rem; color: #fff; cursor: pointer; font-size: .875rem; font-weight: 600; }
    .send-btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-top"><button>+ New Chat</button></div>
    <div class="chat-history">
      <div class="history-item active">🤖 ${title} session</div>
      <div class="history-item">Previous conversation</div>
      <div class="history-item">Ideas brainstorm</div>
    </div>
  </aside>
  <div class="main">
    <div class="topbar">
      <span style="font-weight:600;font-size:.95rem;">🤖 ${title}</span>
      <span class="model-badge">AI Assistant</span>
    </div>
    <div class="messages" id="messages">
      <div class="msg"><div class="msg-avatar ai">🤖</div><div class="msg-text"><strong>Assistant</strong>Hello! I'm your custom AI assistant. How can I help you today? I can answer questions, help you brainstorm, write content, or just chat.</div></div>
    </div>
    <div class="input-bar">
      <textarea id="inp" placeholder="Message your assistant…"></textarea>
      <button class="send-btn" id="send">Send</button>
    </div>
  </div>
  <script>
    const msgs = document.getElementById('messages');
    const inp = document.getElementById('inp');
    const send = document.getElementById('send');
    const replies = ["Great question! Let me think about that…","I can definitely help with that. Here's what I know:","That's an interesting perspective. Let me expand on it:","Here are a few ideas you might consider:","I'd recommend starting with the basics and building from there.","Let me break that down step by step for you."];
    let ri = 0;
    function addMsg(text, role) {
      const d = document.createElement('div'); d.className = 'msg';
      d.innerHTML = '<div class="msg-avatar ' + role + '">' + (role==='ai'?'🤖':'👤') + '</div><div class="msg-text"><strong>' + (role==='ai'?'Assistant':'You') + '</strong>' + text + '</div>';
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    }
    send.addEventListener('click', () => {
      if (!inp.value.trim()) return;
      addMsg(inp.value, 'user'); inp.value = '';
      setTimeout(() => addMsg(replies[ri++ % replies.length], 'ai'), 700);
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send.click(); } });
  </script>
</body>
</html>`;

          case "SubliminalMaker":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #03030a; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; }
    header { padding: 1.5rem 2rem; display: flex; align-items: center; gap: .75rem; border-bottom: 1px solid #111; }
    header h1 { font-size: 1.25rem; font-weight: 700; }
    .affirmation-bg { position: relative; height: 220px; background: linear-gradient(135deg, #0d0d1a 0%, #111 100%); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .affirmation-bg::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(99,102,241,.15) 0%, transparent 70%); }
    .affirmation-text { font-size: clamp(1.25rem, 3vw, 1.75rem); font-weight: 300; letter-spacing: .15em; text-align: center; color: rgba(199,210,254,.7); z-index: 1; padding: 0 2rem; font-style: italic; }
    .freq-bar { padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; background: #080810; border-bottom: 1px solid #111; font-size: .85rem; color: #6b7280; }
    .freq-bar input[type=range] { flex: 1; accent-color: #6366f1; }
    .freq-val { color: #818cf8; font-mono: true; min-width: 80px; }
    .track-list { padding: 1.25rem 2rem; flex: 1; }
    .track-list h2 { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-bottom: 1rem; }
    .track { display: flex; align-items: center; gap: 1rem; padding: .875rem 1rem; border-radius: 10px; background: #0d0d1a; border: 1px solid #111827; margin-bottom: .625rem; cursor: pointer; transition: border-color .2s; }
    .track:hover, .track.active { border-color: #4338ca; }
    .track-icon { width: 36px; height: 36px; border-radius: 8px; background: #1e1b4b; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .track-info h3 { font-size: .875rem; font-weight: 600; }
    .track-info p { font-size: .75rem; color: #6b7280; margin-top: .1rem; }
    .track-dur { margin-left: auto; font-size: .75rem; color: #4b5563; }
    .controls { padding: 1.25rem 2rem; background: #080810; border-top: 1px solid #111; display: flex; align-items: center; justify-content: center; gap: 1.5rem; }
    .ctrl-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: #1e1b4b; color: #a5b4fc; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: background .2s; }
    .ctrl-btn.play { width: 52px; height: 52px; background: #4338ca; color: #fff; font-size: 1.3rem; }
    .ctrl-btn:hover { background: #312e81; }
    .ctrl-btn.play:hover { background: #3730a3; }
    .progress { padding: 0 2rem .5rem; display: flex; align-items: center; gap: .75rem; background: #080810; font-size: .75rem; color: #4b5563; }
    .progress input[type=range] { flex: 1; accent-color: #4338ca; }
  </style>
</head>
<body>
  <header><span style="font-size:1.5rem;">🎧</span><h1>${title}</h1></header>
  <div class="affirmation-bg">
    <p class="affirmation-text" id="aff">I am calm, confident, and capable of anything.</p>
  </div>
  <div class="freq-bar">
    <span>Frequency:</span>
    <input type="range" min="40" max="1000" value="432" id="freq" />
    <span class="freq-val" id="freqVal">432 Hz</span>
  </div>
  <div class="track-list">
    <h2>Tracks</h2>
    <div class="track active"><div class="track-icon">🌙</div><div class="track-info"><h3>Deep Confidence</h3><p>432 Hz · Delta waves</p></div><span class="track-dur">30:00</span></div>
    <div class="track"><div class="track-icon">☀️</div><div class="track-info"><h3>Abundance Flow</h3><p>528 Hz · Theta waves</p></div><span class="track-dur">25:00</span></div>
    <div class="track"><div class="track-icon">🌊</div><div class="track-info"><h3>Inner Peace</h3><p>396 Hz · Alpha waves</p></div><span class="track-dur">20:00</span></div>
  </div>
  <div class="progress"><span>0:00</span><input type="range" value="0" /><span>30:00</span></div>
  <div class="controls">
    <button class="ctrl-btn">⏮</button>
    <button class="ctrl-btn play" id="playBtn">▶</button>
    <button class="ctrl-btn">⏭</button>
  </div>
  <script>
    const affirmations = ["I am calm, confident, and capable of anything.","I attract abundance and success effortlessly.","I am worthy of love, peace, and happiness.","My mind is clear and my focus is powerful.","I release all fear and embrace my potential."];
    let ai = 0, playing = false;
    document.getElementById('freq').addEventListener('input', e => { document.getElementById('freqVal').textContent = e.target.value + ' Hz'; });
    document.getElementById('playBtn').addEventListener('click', function() {
      playing = !playing; this.textContent = playing ? '⏸' : '▶';
      if (playing) { clearInterval(window._affTimer); window._affTimer = setInterval(() => { document.getElementById('aff').textContent = affirmations[ai++ % affirmations.length]; }, 5000); }
      else clearInterval(window._affTimer);
    });
  </script>
</body>
</html>`;

          case "SongMaker":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f14; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; }
    header { padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1f1f2e; }
    header h1 { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; }
    .transport { display: flex; align-items: center; gap: .75rem; }
    .bpm-ctrl { display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: #6b7280; }
    .bpm-ctrl input { width: 60px; background: #1e1e2e; border: 1px solid #2a2a3e; border-radius: 6px; padding: .3rem .5rem; color: #e2e8f0; text-align: center; }
    .t-btn { padding: .5rem 1.25rem; border: none; border-radius: 8px; cursor: pointer; font-size: .85rem; font-weight: 600; }
    .t-btn.play { background: #22c55e; color: #fff; }
    .t-btn.stop { background: #1e1e2e; border: 1px solid #2a2a3e; color: #94a3b8; }
    .sequencer { flex: 1; padding: 1.25rem 1.5rem; }
    .track { display: flex; align-items: center; gap: .625rem; margin-bottom: .5rem; }
    .track-name { width: 80px; font-size: .8rem; font-weight: 600; color: #94a3b8; flex-shrink: 0; }
    .steps { display: flex; gap: 4px; }
    .step { width: 32px; height: 32px; border-radius: 6px; background: #1e1e2e; border: 1px solid #2a2a3e; cursor: pointer; transition: background .1s; flex-shrink: 0; }
    .step.on { background: var(--c); border-color: var(--c); box-shadow: 0 0 8px var(--c); }
    .step.playing { outline: 2px solid #fff; }
    .footer { padding: .75rem 1.5rem; background: #0a0a0f; border-top: 1px solid #1f1f2e; font-size: .75rem; color: #4b5563; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>🎵 ${title}</h1>
    <div class="transport">
      <div class="bpm-ctrl">BPM <input type="number" id="bpm" value="120" min="60" max="200" /></div>
      <button class="t-btn play" id="playBtn">▶ Play</button>
      <button class="t-btn stop" id="stopBtn">■ Stop</button>
    </div>
  </header>
  <div class="sequencer" id="seq"></div>
  <div class="footer">Click cells to toggle · Press Play to hear the beat</div>
  <script>
    const tracks = [
      { name: '🥁 Kick',   color: '#ef4444', freq: 60,  type: 'sine',   steps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
      { name: '🪘 Snare',  color: '#f59e0b', freq: 200, type: 'square', steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
      { name: '🎶 Hi-Hat', color: '#22c55e', freq: 800, type: 'square', steps: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
      { name: '🎸 Bass',   color: '#818cf8', freq: 100, type: 'sawtooth',steps: [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0] },
    ];
    const seq = document.getElementById('seq');
    tracks.forEach((t, ti) => {
      const row = document.createElement('div'); row.className = 'track';
      row.innerHTML = '<span class="track-name">' + t.name + '</span>';
      const stepsDiv = document.createElement('div'); stepsDiv.className = 'steps';
      t.steps.forEach((on, si) => {
        const s = document.createElement('div'); s.className = 'step' + (on ? ' on' : '');
        s.style.setProperty('--c', t.color);
        s.addEventListener('click', () => { t.steps[si] = t.steps[si] ? 0 : 1; s.className = 'step' + (t.steps[si] ? ' on' : ''); s.style.setProperty('--c', t.color); });
        stepsDiv.appendChild(s);
      }); row.appendChild(stepsDiv); seq.appendChild(row);
    });
    let step = 0, interval = null, ctx = null;
    function playTone(freq, type, dur) {
      if (!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    }
    function tick() {
      document.querySelectorAll('.step.playing').forEach(s => s.classList.remove('playing'));
      tracks.forEach((t, ti) => {
        const stepEl = seq.children[ti].querySelectorAll('.step')[step];
        stepEl.classList.add('playing');
        if (t.steps[step]) playTone(t.freq, t.type, .12);
      });
      step = (step + 1) % 16;
    }
    document.getElementById('playBtn').addEventListener('click', () => {
      if (interval) return;
      const bpm = parseInt(document.getElementById('bpm').value) || 120;
      interval = setInterval(tick, (60/bpm/4)*1000);
    });
    document.getElementById('stopBtn').addEventListener('click', () => {
      clearInterval(interval); interval = null; step = 0;
      document.querySelectorAll('.step.playing').forEach(s => s.classList.remove('playing'));
    });
  </script>
</body>
</html>`;

          case "VideoAnimationMaker":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #e2e8f0; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .toolbar { background: #111116; border-bottom: 1px solid #1f1f2e; padding: .625rem 1rem; display: flex; align-items: center; gap: .5rem; }
    .toolbar h1 { font-size: .9rem; font-weight: 700; margin-right: .75rem; color: #a78bfa; }
    .t-btn { padding: .4rem .875rem; border: 1px solid #2a2a3e; border-radius: 6px; background: #1e1e2e; color: #94a3b8; cursor: pointer; font-size: .8rem; }
    .t-btn:hover, .t-btn.active { background: #2a2a3e; color: #e2e8f0; }
    .t-btn.play { background: #7c3aed; color: #fff; border-color: #7c3aed; }
    .workspace { flex: 1; display: flex; overflow: hidden; }
    .layers { width: 180px; background: #0d0d14; border-right: 1px solid #1f1f2e; display: flex; flex-direction: column; }
    .layers-header { padding: .75rem 1rem; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #4b5563; border-bottom: 1px solid #1f1f2e; display: flex; align-items: center; justify-content: space-between; }
    .layers-header button { background: #1e1e2e; border: 1px solid #2a2a3e; border-radius: 4px; color: #94a3b8; cursor: pointer; padding: .1rem .4rem; font-size: .7rem; }
    .layer-item { padding: .625rem 1rem; font-size: .8rem; display: flex; align-items: center; gap: .5rem; cursor: pointer; border-bottom: 1px solid #111; }
    .layer-item:hover { background: #1a1a24; }
    .layer-item.active { background: #1e1a2e; border-left: 2px solid #7c3aed; }
    .layer-vis { width: 14px; height: 14px; border-radius: 3px; background: var(--lc); flex-shrink: 0; }
    .center { flex: 1; display: flex; align-items: center; justify-content: center; background: #0f0f14; }
    .canvas-wrap { position: relative; box-shadow: 0 0 40px rgba(0,0,0,.8); }
    canvas { display: block; border: 1px solid #1f1f2e; }
    .timeline { height: 100px; background: #0d0d14; border-top: 1px solid #1f1f2e; display: flex; flex-direction: column; }
    .timeline-header { padding: .375rem .75rem; display: flex; align-items: center; gap: .5rem; border-bottom: 1px solid #111; }
    .timeline-header span { font-size: .7rem; color: #4b5563; }
    .frame-ruler { display: flex; padding: .375rem .75rem; gap: 0; overflow-x: auto; flex: 1; align-items: center; }
    .frame { width: 28px; height: 28px; border: 1px solid #1f1f2e; border-right: none; display: flex; align-items: center; justify-content: center; font-size: .6rem; color: #4b5563; cursor: pointer; flex-shrink: 0; transition: background .1s; }
    .frame:last-child { border-right: 1px solid #1f1f2e; }
    .frame:hover { background: #1e1e2e; }
    .frame.current { background: #3b1f6e; color: #c084fc; }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>🎬 ${title}</h1>
    <button class="t-btn">✏️ Draw</button>
    <button class="t-btn active">⬜ Shape</button>
    <button class="t-btn">🖼 Import</button>
    <button class="t-btn">🔤 Text</button>
    <div style="flex:1"></div>
    <button class="t-btn play" id="playBtn">▶ Play</button>
    <button class="t-btn" id="stopBtn">■</button>
    <span style="font-size:.75rem;color:#4b5563;margin-left:.5rem;">Frame: <span id="fnum">1</span> / 20</span>
  </div>
  <div class="workspace">
    <div class="layers">
      <div class="layers-header">Layers <button>+</button></div>
      <div class="layer-item active"><div class="layer-vis" style="--lc:#a78bfa"></div>Layer 1</div>
      <div class="layer-item"><div class="layer-vis" style="--lc:#38bdf8"></div>Layer 2</div>
      <div class="layer-item"><div class="layer-vis" style="--lc:#4ade80"></div>Background</div>
    </div>
    <div class="center">
      <div class="canvas-wrap">
        <canvas id="preview" width="400" height="250"></canvas>
      </div>
    </div>
  </div>
  <div class="timeline">
    <div class="timeline-header"><span>Timeline</span></div>
    <div class="frame-ruler" id="ruler"></div>
  </div>
  <script>
    const ruler = document.getElementById('ruler');
    for (let i = 1; i <= 20; i++) {
      const f = document.createElement('div'); f.className = 'frame' + (i===1?' current':''); f.textContent = i;
      f.addEventListener('click', () => { document.querySelectorAll('.frame').forEach(x=>x.classList.remove('current')); f.classList.add('current'); currentFrame = i; drawFrame(i); document.getElementById('fnum').textContent = i; });
      ruler.appendChild(f);
    }
    const ctx = document.getElementById('preview').getContext('2d');
    let currentFrame = 1, animInterval = null;
    function drawFrame(n) {
      ctx.fillStyle = '#111'; ctx.fillRect(0,0,400,250);
      const hue = (n * 18) % 360;
      ctx.fillStyle = 'hsl(' + hue + ',70%,60%)';
      ctx.beginPath(); ctx.arc(50 + n*15, 125, 30, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '13px monospace'; ctx.fillText('Frame ' + n, 12, 20);
    }
    drawFrame(1);
    document.getElementById('playBtn').addEventListener('click', () => {
      if (animInterval) return;
      animInterval = setInterval(() => {
        currentFrame = currentFrame >= 20 ? 1 : currentFrame + 1;
        document.getElementById('fnum').textContent = currentFrame;
        document.querySelectorAll('.frame').forEach((f,i) => f.classList.toggle('current', i===currentFrame-1));
        drawFrame(currentFrame);
      }, 100);
    });
    document.getElementById('stopBtn').addEventListener('click', () => { clearInterval(animInterval); animInterval = null; });
  </script>
</body>
</html>`;

          case "ImageGenerator":
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #080810; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; }
    header { padding: 1.25rem 2rem; border-bottom: 1px solid #111; display: flex; align-items: center; gap: .75rem; }
    header h1 { font-size: 1.2rem; font-weight: 700; }
    .prompt-area { padding: 2rem; max-width: 800px; margin: 0 auto; width: 100%; }
    .prompt-area label { font-size: .8rem; color: #6b7280; display: block; margin-bottom: .5rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
    .prompt-area textarea { width: 100%; background: #111116; border: 1px solid #1f1f2e; border-radius: 12px; padding: 1rem; color: #e2e8f0; font-size: .9rem; resize: none; outline: none; height: 90px; font-family: inherit; }
    .prompt-area textarea:focus { border-color: #6366f1; }
    .style-chips { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1rem; }
    .style-chip { padding: .4rem .875rem; border-radius: 20px; background: #111116; border: 1px solid #1f1f2e; font-size: .8rem; color: #94a3b8; cursor: pointer; transition: all .15s; }
    .style-chip:hover { border-color: #6366f1; color: #e2e8f0; }
    .style-chip.active { background: #1e1b4b; border-color: #6366f1; color: #a5b4fc; }
    .generate-btn { display: block; width: 100%; margin-top: 1.25rem; padding: .875rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: #fff; font-size: .95rem; font-weight: 700; cursor: pointer; letter-spacing: .03em; transition: opacity .2s; }
    .generate-btn:hover { opacity: .9; }
    .generate-btn:disabled { opacity: .5; cursor: default; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; padding: 0 2rem 2rem; max-width: 800px; margin: 0 auto; width: 100%; }
    .img-card { aspect-ratio: 1; border-radius: 12px; background: #111116; border: 1px solid #1f1f2e; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; cursor: pointer; transition: border-color .2s; overflow: hidden; position: relative; }
    .img-card:hover { border-color: #6366f1; }
    .img-card img { width: 100%; height: 100%; object-fit: cover; }
    .img-card .placeholder { font-size: 2rem; opacity: .2; }
    .img-card .placeholder-text { font-size: .7rem; color: #4b5563; }
    .loading-ring { width: 40px; height: 40px; border: 3px solid #1e1e2e; border-top-color: #6366f1; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <header><span style="font-size:1.5rem;">🖼️</span><h1>${title}</h1></header>
  <div class="prompt-area">
    <label>Prompt</label>
    <textarea id="prompt" placeholder="A futuristic city at night, neon lights reflecting on wet streets, cinematic, detailed…"></textarea>
    <div class="style-chips" id="styles">
      <div class="style-chip active">Realistic</div>
      <div class="style-chip">Anime</div>
      <div class="style-chip">Oil Painting</div>
      <div class="style-chip">Pixel Art</div>
      <div class="style-chip">Abstract</div>
      <div class="style-chip">Watercolor</div>
    </div>
    <button class="generate-btn" id="genBtn">✦ Generate Images</button>
  </div>
  <div class="gallery" id="gallery">
    <div class="img-card"><div class="placeholder">🖼</div><div class="placeholder-text">Your images appear here</div></div>
    <div class="img-card"><div class="placeholder">🖼</div><div class="placeholder-text">Your images appear here</div></div>
    <div class="img-card"><div class="placeholder">🖼</div><div class="placeholder-text">Your images appear here</div></div>
    <div class="img-card"><div class="placeholder">🖼</div><div class="placeholder-text">Your images appear here</div></div>
  </div>
  <script>
    document.querySelectorAll('.style-chip').forEach(chip => {
      chip.addEventListener('click', () => { document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); });
    });
    document.getElementById('genBtn').addEventListener('click', () => {
      const btn = document.getElementById('genBtn'); btn.disabled = true; btn.textContent = 'Generating…';
      const gallery = document.getElementById('gallery'); gallery.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const card = document.createElement('div'); card.className = 'img-card'; card.innerHTML = '<div class="loading-ring"></div>'; gallery.appendChild(card);
      }
      setTimeout(() => {
        gallery.querySelectorAll('.img-card').forEach((card, i) => {
          card.innerHTML = '<div class="placeholder">🖼</div><div class="placeholder-text">Image ' + (i+1) + '</div>';
        });
        btn.disabled = false; btn.textContent = '✦ Generate Images';
      }, 2000);
    });
  </script>
</body>
</html>`;

          default:
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
  <h1>${title}</h1>
  <p>Start editing this file to build your project.</p>
</body>
</html>`;
        }
      }
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
      <Dialog
        open={newFileDialogOpen}
        onOpenChange={(open) => {
          setNewFileDialogOpen(open);
          if (!open) {
            setNewFileStep(1);
            setSelectedTemplateId("blank");
            setNewFilename("");
            setNewFileLanguage(Language.HTML);
          }
        }}
      >
        <DialogContent
          className="bg-card border-border sm:max-w-lg"
          data-ocid="artifacts.new_file_dialog"
        >
          {newFileStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {isHTMLWithVariants
                    ? "New Code File — Step 1 of 2"
                    : "New Code File"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isHTMLWithVariants) {
                    // Default select the first template option on entering step 2
                    setSelectedTemplateId(currentTemplateVariants[0].id);
                    setNewFileStep(2);
                  } else {
                    void handleCreateFile(undefined);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Filename
                  </Label>
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
                  <Label className="text-xs text-muted-foreground">
                    Language
                  </Label>
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
                    data-ocid="artifacts.new_file.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newFilename.trim() || createArtifact.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-ocid="artifacts.new_file.submit_button"
                  >
                    {createArtifact.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isHTMLWithVariants ? "Next →" : "Create & Open"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Choose a Template
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  For{" "}
                  <span className="font-mono text-foreground">
                    {newFilename}
                  </span>{" "}
                  · {getCategoryLabel(makeCategoryFromKind(categoryKind))}
                </p>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 mt-1 max-h-72 overflow-y-auto pr-1">
                {currentTemplateVariants.map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all",
                      selectedTemplateId === tpl.id
                        ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-background hover:border-primary/30 hover:bg-primary/5",
                    )}
                    data-ocid={`artifacts.template.item.${idx + 1}`}
                  >
                    <span className="text-2xl leading-none">{tpl.icon}</span>
                    <span className="font-semibold text-sm text-foreground">
                      {tpl.name}
                    </span>
                    <span className="text-xs text-muted-foreground leading-snug">
                      {tpl.description}
                    </span>
                  </button>
                ))}
                {/* Blank option */}
                <button
                  type="button"
                  onClick={() => setSelectedTemplateId("blank")}
                  className={cn(
                    "flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all",
                    selectedTemplateId === "blank"
                      ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-background hover:border-primary/30 hover:bg-primary/5",
                  )}
                  data-ocid={`artifacts.template.item.${currentTemplateVariants.length + 1}`}
                >
                  <span className="text-2xl leading-none">📄</span>
                  <span className="font-semibold text-sm text-foreground">
                    Blank
                  </span>
                  <span className="text-xs text-muted-foreground leading-snug">
                    Empty file, start from scratch
                  </span>
                </button>
              </div>
              <DialogFooter className="flex-wrap gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewFileStep(1)}
                  className="border-border"
                  data-ocid="artifacts.template.back_button"
                >
                  ← Back
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleCreateFile("blank")}
                    disabled={createArtifact.isPending}
                    className="text-muted-foreground hover:text-foreground"
                    data-ocid="artifacts.template.blank_button"
                  >
                    {createArtifact.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : null}
                    Start Blank
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleCreateFile(selectedTemplateId)}
                    disabled={createArtifact.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-ocid="artifacts.template.use_button"
                  >
                    {createArtifact.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Use Template →
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
