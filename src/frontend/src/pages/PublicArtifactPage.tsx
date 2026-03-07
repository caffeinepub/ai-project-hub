import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Artifact } from "../backend.d";
import { Language } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface PublicArtifactPageProps {
  slug: string;
}

// ── Simple Markdown parser ─────────────────────────────────────────
function parseMarkdown(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^---$/gm, "<hr />")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .trim();
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  return `<p>${html}</p>`;
}

// ── Markdown renderer without dangerouslySetInnerHTML ─────────────
function MarkdownContent({ html }: { html: string }) {
  const ref = (el: HTMLElement | null) => {
    if (el) el.innerHTML = html;
  };
  return <article ref={ref} className="prose prose-invert max-w-3xl mx-auto" />;
}

export default function PublicArtifactPage({ slug }: PublicArtifactPageProps) {
  const { actor } = useActor();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Public endpoint — we can fetch without actor being ready for auth,
    // but the actor is still needed to make the call. Poll until actor is ready.
    let cancelled = false;
    let attempts = 0;

    const fetchPublic = async () => {
      if (!actor) {
        attempts += 1;
        if (attempts < 30) {
          setTimeout(fetchPublic, 500);
        } else {
          if (!cancelled) setNotFound(true);
          if (!cancelled) setLoading(false);
        }
        return;
      }
      try {
        const result = await actor.getPublicArtifact(slug);
        if (!cancelled) {
          if (result?.isPublished) {
            setArtifact(result);
            document.title = result.filename;
          } else {
            setNotFound(true);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };

    fetchPublic();
    return () => {
      cancelled = true;
    };
  }, [actor, slug]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-ocid="public.loading_state"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (notFound || !artifact) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-ocid="public.error_state"
      >
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            This page is not available
          </h1>
          <p className="text-sm text-muted-foreground">
            This artifact may have been unpublished or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // ── Render based on language ────────────────────────────────────
  if (artifact.language === Language.HTML) {
    return (
      <iframe
        srcDoc={artifact.content}
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
          display: "block",
        }}
        title={artifact.filename}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    );
  }

  if (artifact.language === Language.Markdown) {
    const html = parseMarkdown(artifact.content);
    return (
      <div className="min-h-screen bg-background" style={{ padding: "2rem" }}>
        <MarkdownContent html={html} />
      </div>
    );
  }

  // CSS, JS, PlainText — styled code block
  const langColors: Record<string, string> = {
    CSS: "#60a5fa",
    JavaScript: "#fbbf24",
    PlainText: "#94a3b8",
  };
  const accent = langColors[artifact.language] ?? "#94a3b8";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div
          className="flex items-center gap-3 mb-4"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "12px",
          }}
        >
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              background: `${accent}22`,
              color: accent,
              border: `1px solid ${accent}44`,
            }}
          >
            {artifact.language}
          </span>
          <span className="text-sm text-muted-foreground font-mono">
            {artifact.filename}
          </span>
        </div>
        <pre
          className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            padding: "24px",
            color: "#e2e8f0",
          }}
        >
          {artifact.content}
        </pre>
      </div>
    </div>
  );
}
