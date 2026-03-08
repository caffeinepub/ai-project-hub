import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Brain,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Page = "dashboard" | "projects" | "new" | "detail" | "editor";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, id?: bigint) => void;
}

const NAV_ITEMS = [
  {
    id: "dashboard" as Page,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "sidebar.dashboard.link",
  },
  {
    id: "projects" as Page,
    label: "My Projects",
    icon: FolderOpen,
    ocid: "sidebar.projects.link",
  },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { clear, identity } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 12)}…`
    : "Anonymous";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Brain
            className="w-4.5 h-4.5 text-primary"
            style={{ width: 18, height: 18 }}
          />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-sidebar-foreground leading-tight">
            AI Project Hub
          </p>
          <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
            Command Center
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon, ocid }) => {
          const active =
            currentPage === id || (id === "detail" && currentPage === "detail");
          return (
            <button
              type="button"
              key={id}
              data-ocid={ocid}
              onClick={() => {
                onNavigate(id);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "nav-active"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}

        {/* New Project action button */}
        <div className="pt-3">
          <button
            type="button"
            data-ocid="sidebar.new_project.button"
            onClick={() => {
              onNavigate("new");
              setMobileOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150",
              currentPage === "new"
                ? "nav-active"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
            )}
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            New Project
          </button>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {principalShort}
            </p>
            <p className="text-[10px] text-muted-foreground">Authenticated</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="sidebar.logout.button"
          onClick={clear}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-8"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-sm">AI Project Hub</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-8 h-8"
        >
          {mobileOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="md:hidden fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
