import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LoginPage from "./components/LoginPage";
import PasswordGate from "./components/PasswordGate";
import Sidebar from "./components/Sidebar";
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

  // Track whether the auth client has ever finished initializing (even once).
  // This prevents the infinite re-initializing loop in useInternetIdentity from
  // permanently blocking the app on the loading spinner.
  const hasEverInitialized = useRef(false);
  if (!isInitializing) {
    hasEverInitialized.current = true;
  }

  // Local credential gate — stored in sessionStorage so it clears on tab close
  const [localAuth, setLocalAuth] = useState<boolean>(
    () => sessionStorage.getItem("localAuth") === "true",
  );

  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [publicSlug] = useState<string | null>(() => getPublicSlug());

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

  // ── Password gate — must pass before anything else is shown ──
  if (!localAuth) {
    return (
      <>
        <PasswordGate
          onSuccess={() => {
            sessionStorage.setItem("localAuth", "true");
            setLocalAuth(true);
          }}
        />
        <Toaster richColors />
      </>
    );
  }

  // Loading state while restoring identity — only block on FIRST init.
  // If the authClient re-initializes due to the known dep-array loop,
  // hasEverInitialized stays true and we skip the spinner entirely.
  if (isInitializing && !hasEverInitialized.current) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
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
