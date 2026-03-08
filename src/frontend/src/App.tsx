import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useSeedData } from "./hooks/useSeedData";
import CodeEditorPage from "./pages/CodeEditorPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import PublicArtifactPage from "./pages/PublicArtifactPage";

type Page = "dashboard" | "projects" | "new" | "detail" | "editor";

interface NavState {
  page: Page;
  projectId?: bigint;
  artifactId?: bigint;
}

// Check if we're on a public /p/:slug route
function getPublicSlug(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/p\/([^/]+)$/);
  return match ? match[1] : null;
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [publicSlug] = useState<string | null>(() => getPublicSlug());
  const queryClient = useQueryClient();
  const { actor, isFetching: actorLoading } = useActor();

  // Track whether the actor query has had a chance to settle (avoid flash on mount)
  const actorSettledRef = useRef(false);
  if (actorLoading) actorSettledRef.current = true; // once it starts fetching, mark settled
  if (actor) actorSettledRef.current = true; // or once actor is available
  const actorQueryHasSettled = actorSettledRef.current;

  // Seed sample data on first login
  useSeedData(isAuthenticated);

  const navigate = (page: Page, id?: bigint, artifactId?: bigint) => {
    setNav({ page, projectId: id, artifactId });
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update document title based on page
  useEffect(() => {
    if (nav.page === "dashboard") document.title = "AI Project Hub";
    else if (nav.page === "projects")
      document.title = "My Projects — AI Project Hub";
    else if (nav.page === "new")
      document.title = "New Project — AI Project Hub";
    else if (nav.page === "editor")
      document.title = "Code Editor — AI Project Hub";
  }, [nav.page]);

  // ── Public artifact route (no auth required) ─────────────────
  if (publicSlug) {
    return (
      <>
        <PublicArtifactPage slug={publicSlug} />
        <Toaster richColors />
      </>
    );
  }

  // Loading state while restoring identity
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // Backend connection failed — show full-page error
  // Guard against mount flash: only show error after the query has started fetching at least once
  if (isAuthenticated && !actorLoading && !actor && actorQueryHasSettled) {
    return (
      <>
        <div
          className="min-h-screen bg-background flex items-center justify-center p-6"
          data-ocid="app.connection.error_state"
        >
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <WifiOff className="w-7 h-7 text-destructive" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-bold text-foreground">
                Connection unavailable
              </h2>
              <p className="text-sm text-muted-foreground">
                Could not connect to the backend network. This may be a
                temporary issue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                actorSettledRef.current = false;
                // Use predicate to match ["actor", *] regardless of principal suffix
                queryClient.refetchQueries({
                  predicate: (q) => q.queryKey[0] === "actor",
                });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
              data-ocid="app.connection.retry.button"
            >
              <Loader2 className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
        <Toaster richColors />
      </>
    );
  }

  // Not authenticated — show landing/login page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster richColors />
      </>
    );
  }

  // ── Editor page (full-screen, no sidebar footer) ─────────────
  if (
    nav.page === "editor" &&
    nav.projectId !== undefined &&
    nav.artifactId !== undefined
  ) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CodeEditorPage
            projectId={nav.projectId}
            artifactId={nav.artifactId}
            onNavigate={navigate}
          />
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  // Authenticated — show dashboard layout
  return (
    <div className="flex min-h-screen bg-mesh">
      {/* Sidebar */}
      <Sidebar currentPage={nav.page} onNavigate={navigate} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 overflow-hidden">
        {/* Page content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {nav.page === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {nav.page === "projects" && <ProjectsPage onNavigate={navigate} />}
          {nav.page === "new" && <CreateProjectPage onNavigate={navigate} />}
          {nav.page === "detail" && nav.projectId !== undefined && (
            <ProjectDetailPage
              projectId={nav.projectId}
              onNavigate={navigate}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="hover:text-muted-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
