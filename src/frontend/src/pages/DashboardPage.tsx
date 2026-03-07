import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Archive,
  ArrowRight,
  Folder,
  PlusCircle,
  Rocket,
  Timer,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { Status } from "../backend.d";
import { useGetProjects } from "../hooks/useQueries";
import {
  formatRelativeDate,
  getCategoryIcon,
  getCategoryLabel,
  getStatusColor,
  getStatusLabel,
} from "../lib/projectUtils";

type Page = "dashboard" | "projects" | "new" | "detail";

interface DashboardPageProps {
  onNavigate: (page: Page, id?: bigint) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: projects = [], isLoading } = useGetProjects();

  const stats = {
    total: projects.length,
    planning: projects.filter((p) => p.status === Status.Planning).length,
    inProgress: projects.filter((p) => p.status === Status.InProgress).length,
    deployed: projects.filter((p) => p.status === Status.Deployed).length,
    onHold: projects.filter((p) => p.status === Status.OnHold).length,
    archived: projects.filter((p) => p.status === Status.Archived).length,
  };

  const recentProjects = [...projects]
    .sort((a, b) => Number(b.updatedAt - a.updatedAt))
    .slice(0, 5);

  const STAT_CARDS = [
    {
      label: "Total Projects",
      value: stats.total,
      icon: Folder,
      color: "text-sky-400",
      bg: "bg-sky-400/10",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Deployed",
      value: stats.deployed,
      icon: Rocket,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "On Hold",
      value: stats.onHold + stats.planning,
      icon: Timer,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      label: "Archived",
      value: stats.archived,
      icon: Archive,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
    },
  ];

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            Welcome back <span className="text-gradient-cyan">Commander</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's what's happening with your AI projects today.
          </p>
        </motion.div>

        {/* Stats grid */}
        {isLoading ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
            data-ocid="dashboard.loading_state"
          >
            {["s1", "s2", "s3", "s4", "s5"].map((sk) => (
              <Skeleton key={sk} className="h-24 rounded-xl bg-card" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card className="bg-card border-border card-glow cursor-default">
                  <CardContent className="p-4">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                        bg,
                      )}
                    >
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div
                      className={cn("text-2xl font-display font-bold", color)}
                    >
                      {value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create new + Recent Projects */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick create CTA */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px] gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <PlusCircle className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-foreground mb-1">
                    Start a New AI Project
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Build anything from web apps and games to therapy bots and
                    AI assistants.
                  </p>
                </div>
                <Button
                  data-ocid="dashboard.create_project.button"
                  onClick={() => onNavigate("new")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  Create New AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Projects */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-foreground">
                Recent Projects
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onNavigate("projects")}
              >
                View all
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {["r1", "r2", "r3"].map((sk) => (
                  <Skeleton key={sk} className="h-16 rounded-lg bg-card" />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No projects yet. Create your first AI project above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project, i) => (
                  <motion.div
                    key={project.id.toString()}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    data-ocid={`dashboard.project.card.${i + 1}`}
                  >
                    <Card
                      className="bg-card border-border card-glow cursor-pointer"
                      onClick={() => onNavigate("detail", project.id)}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xl flex-shrink-0">
                            {getCategoryIcon(project.category)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-foreground truncate">
                                {project.name}
                              </h4>
                              <Badge
                                className={cn(
                                  "text-xs border font-medium flex-shrink-0",
                                  getStatusColor(project.status),
                                )}
                              >
                                {getStatusLabel(project.status)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {getCategoryLabel(project.category)} ·{" "}
                              {formatRelativeDate(project.updatedAt)}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
