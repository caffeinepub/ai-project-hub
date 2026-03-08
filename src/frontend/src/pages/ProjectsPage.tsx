import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen,
  LayoutGrid,
  LayoutList,
  PlusCircle,
  Search,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Status } from "../backend.d";
import ProjectCard from "../components/ProjectCard";
import { useGetProjects } from "../hooks/useQueries";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "../lib/projectUtils";
import type { CategoryKind } from "../lib/projectUtils";

type Page = "dashboard" | "projects" | "new" | "detail";

interface ProjectsPageProps {
  onNavigate: (page: Page, id?: bigint) => void;
}

export default function ProjectsPage({ onNavigate }: ProjectsPageProps) {
  const { data: projects = [], isLoading } = useGetProjects();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === (statusFilter as Status);
    const matchesCategory =
      categoryFilter === "all" || p.category.__kind__ === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            My Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Filter bar */}
        <motion.div
          className="flex flex-wrap items-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              className="pl-9 bg-card border-border h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="projects.search.input"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-36 h-9 bg-card border-border text-sm"
              data-ocid="projects.status.select"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className="w-40 h-9 bg-card border-border text-sm"
              data-ocid="projects.category.select"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View mode toggles */}
          <div className="flex items-center gap-1 ml-auto bg-card border border-border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={`w-7 h-7 ${viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
              onClick={() => setViewMode("grid")}
              data-ocid="projects.grid_view.toggle"
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`w-7 h-7 ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
              onClick={() => setViewMode("list")}
              data-ocid="projects.list_view.toggle"
              title="List view"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
            data-ocid="projects.loading_state"
          >
            {["p1", "p2", "p3", "p4", "p5", "p6"].map((sk) => (
              <Skeleton
                key={sk}
                className={`bg-card rounded-xl ${viewMode === "grid" ? "h-48" : "h-20"}`}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            data-ocid="projects.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              {projects.length === 0
                ? "No projects yet"
                : "No matching projects"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              {projects.length === 0
                ? "Create your first AI project to get started."
                : "Try adjusting your filters or search query."}
            </p>
            {projects.length === 0 && (
              <Button
                onClick={() => onNavigate("new")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            )}
          </motion.div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {filtered.map((project, i) => (
              <ProjectCard
                key={project.id.toString()}
                project={project}
                index={i}
                viewMode={viewMode}
                onOpen={(id) => onNavigate("detail", id)}
                onEdit={(id) => onNavigate("detail", id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
