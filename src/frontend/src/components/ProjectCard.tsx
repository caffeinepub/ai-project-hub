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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, Eye, Flag, Loader2, Pencil, Target, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { Project } from "../backend.d";
import { useCloneProject, useDeleteProject } from "../hooks/useQueries";
import {
  formatRelativeDate,
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  getStatusColor,
  getStatusLabel,
} from "../lib/projectUtils";

interface ProjectCardProps {
  project: Project;
  index: number;
  viewMode: "grid" | "list";
  onOpen: (id: bigint) => void;
  onEdit: (id: bigint) => void;
}

export default function ProjectCard({
  project,
  index,
  viewMode,
  onOpen,
  onEdit,
}: ProjectCardProps) {
  const deleteProject = useDeleteProject();
  const cloneProject = useCloneProject();

  const catIcon = getCategoryIcon(project.category);
  const catLabel = getCategoryLabel(project.category);
  const catColor = getCategoryColor(project.category);
  const statusLabel = getStatusLabel(project.status);
  const statusColor = getStatusColor(project.status);
  const goalsCompleted = project.goals.filter((g) => g.completed).length;
  const milestonesCompleted = project.milestones.filter(
    (m) => m.completed,
  ).length;

  const ocidSuffix = `.${index + 1}`;

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 }}
        data-ocid={`projects.project.card${ocidSuffix}`}
      >
        <Card className="card-glow bg-card border-border hover:border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="text-2xl flex-shrink-0 hidden sm:block">
                {catIcon}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-base text-foreground truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      className={cn("text-xs border font-medium", statusColor)}
                    >
                      {statusLabel}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-xs border font-medium hidden sm:inline-flex",
                        catColor,
                      )}
                    >
                      {catLabel}
                    </Badge>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{formatRelativeDate(project.createdAt)}</span>
                  {project.goals.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {goalsCompleted}/{project.goals.length}
                    </span>
                  )}
                  {project.milestones.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {milestonesCompleted}/{project.milestones.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  data-ocid={`projects.project.open.button${ocidSuffix}`}
                  onClick={() => onOpen(project.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  data-ocid={`projects.project.edit.button${ocidSuffix}`}
                  onClick={() => onEdit(project.id)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  data-ocid={`projects.project.clone_button${ocidSuffix}`}
                  onClick={() => cloneProject.mutate(project)}
                  disabled={cloneProject.isPending}
                  title="Clone project"
                >
                  {cloneProject.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      data-ocid={`projects.project.delete_button${ocidSuffix}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                        This action cannot be undone. The project and all its
                        goals, milestones, and notes will be permanently
                        deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="delete_project.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-ocid="delete_project.confirm_button"
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteProject.mutate(project.id)}
                      >
                        Delete Project
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`projects.project.card${ocidSuffix}`}
    >
      <Card className="card-glow bg-card border-border h-full flex flex-col">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{catIcon}</span>
              <Badge className={cn("text-xs border font-medium", catColor)}>
                {catLabel}
              </Badge>
            </div>
            <Badge className={cn("text-xs border font-medium", statusColor)}>
              {statusLabel}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-base text-foreground mb-1.5 leading-snug line-clamp-2">
            {project.name}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
              {project.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 mt-auto">
            <span>{formatRelativeDate(project.createdAt)}</span>
            {project.goals.length > 0 && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {goalsCompleted}/{project.goals.length} goals
              </span>
            )}
            {project.milestones.length > 0 && (
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3" />
                {milestonesCompleted}/{project.milestones.length}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
              data-ocid={`projects.project.open.button${ocidSuffix}`}
              onClick={() => onOpen(project.id)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              data-ocid={`projects.project.edit.button${ocidSuffix}`}
              onClick={() => onEdit(project.id)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              data-ocid={`projects.project.clone_button${ocidSuffix}`}
              onClick={() => cloneProject.mutate(project)}
              disabled={cloneProject.isPending}
              title="Clone project"
            >
              {cloneProject.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  data-ocid={`projects.project.delete_button${ocidSuffix}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                data-ocid="delete_project.dialog"
                className="bg-card border-border"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The project and all its goals,
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
                    onClick={() => deleteProject.mutate(project.id)}
                  >
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
