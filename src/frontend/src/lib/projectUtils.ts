import type { Category } from "../backend.d";
import { Status } from "../backend.d";

// ── Category helpers ──────────────────────────────────────────

export type CategoryKind =
  | "LiveWebApp"
  | "OfflineDesktopApp"
  | "AndroidMobileApp"
  | "VideoGame"
  | "TherapyCompanionBot"
  | "CustomAIAssistant"
  | "SubliminalMaker"
  | "SongMaker"
  | "VideoAnimationMaker"
  | "ImageGenerator"
  | "Other";

export function getCategoryKind(cat: Category): CategoryKind {
  return cat.__kind__ as CategoryKind;
}

export function getCategoryLabel(cat: Category): string {
  switch (cat.__kind__) {
    case "LiveWebApp":
      return "Live Web App";
    case "OfflineDesktopApp":
      return "Desktop App";
    case "AndroidMobileApp":
      return "Android App";
    case "VideoGame":
      return "Video Game";
    case "TherapyCompanionBot":
      return "Therapy Bot";
    case "CustomAIAssistant":
      return "AI Assistant";
    case "Other": {
      const other =
        (cat as { __kind__: "Other"; Other: string }).Other || "Other";
      // Map back to friendly labels for our preset Other variants
      switch (other) {
        case "Subliminal Maker":
          return "Subliminal Maker";
        case "Song Maker":
          return "Song Maker";
        case "Video / Animation Maker":
          return "Video / Animation Maker";
        case "Image Generator":
          return "Image Generator";
        default:
          return other;
      }
    }
    default:
      return "Unknown";
  }
}

export const CATEGORY_OPTIONS: {
  value: CategoryKind;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    value: "LiveWebApp",
    label: "Live Web App",
    icon: "🌐",
    color: "text-sky-400 bg-sky-400/10",
  },
  {
    value: "OfflineDesktopApp",
    label: "Desktop App",
    icon: "🖥️",
    color: "text-indigo-400 bg-indigo-400/10",
  },
  {
    value: "AndroidMobileApp",
    label: "Android Mobile App",
    icon: "📱",
    color: "text-green-400 bg-green-400/10",
  },
  {
    value: "VideoGame",
    label: "Video Game",
    icon: "🎮",
    color: "text-purple-400 bg-purple-400/10",
  },
  {
    value: "TherapyCompanionBot",
    label: "Therapy / Companion Bot",
    icon: "🧠",
    color: "text-pink-400 bg-pink-400/10",
  },
  {
    value: "CustomAIAssistant",
    label: "Custom AI Assistant",
    icon: "🤖",
    color: "text-cyan-400 bg-cyan-400/10",
  },
  {
    value: "SubliminalMaker",
    label: "Subliminal Maker",
    icon: "🎧",
    color: "text-violet-400 bg-violet-400/10",
  },
  {
    value: "SongMaker",
    label: "Song Maker",
    icon: "🎵",
    color: "text-rose-400 bg-rose-400/10",
  },
  {
    value: "VideoAnimationMaker",
    label: "Video / Animation Maker",
    icon: "🎬",
    color: "text-orange-400 bg-orange-400/10",
  },
  {
    value: "ImageGenerator",
    label: "Image Generator",
    icon: "🖼️",
    color: "text-teal-400 bg-teal-400/10",
  },
  {
    value: "Other",
    label: "Other",
    icon: "✨",
    color: "text-amber-400 bg-amber-400/10",
  },
];

function resolveOtherKind(cat: Category): string {
  if (cat.__kind__ !== "Other") return cat.__kind__;
  const otherVal = (cat as { __kind__: "Other"; Other: string }).Other;
  switch (otherVal) {
    case "Subliminal Maker":
      return "SubliminalMaker";
    case "Song Maker":
      return "SongMaker";
    case "Video / Animation Maker":
      return "VideoAnimationMaker";
    case "Image Generator":
      return "ImageGenerator";
    default:
      return "Other";
  }
}

export function getCategoryColor(cat: Category): string {
  const key = resolveOtherKind(cat);
  const opt = CATEGORY_OPTIONS.find((o) => o.value === key);
  return opt?.color ?? "text-muted-foreground bg-muted";
}

export function getCategoryIcon(cat: Category): string {
  const key = resolveOtherKind(cat);
  const opt = CATEGORY_OPTIONS.find((o) => o.value === key);
  return opt?.icon ?? "✨";
}

export function makeCategoryFromKind(
  kind: CategoryKind,
  other?: string,
): Category {
  switch (kind) {
    case "Other":
      return { __kind__: "Other", Other: other ?? "Other" } as Category;
    case "SubliminalMaker":
      return { __kind__: "Other", Other: "Subliminal Maker" } as Category;
    case "SongMaker":
      return { __kind__: "Other", Other: "Song Maker" } as Category;
    case "VideoAnimationMaker":
      return {
        __kind__: "Other",
        Other: "Video / Animation Maker",
      } as Category;
    case "ImageGenerator":
      return { __kind__: "Other", Other: "Image Generator" } as Category;
    default:
      return { __kind__: kind, [kind]: null } as unknown as Category;
  }
}

// ── Status helpers ────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: Status.Planning, label: "Planning" },
  { value: Status.InProgress, label: "In Progress" },
  { value: Status.OnHold, label: "On Hold" },
  { value: Status.Deployed, label: "Deployed" },
  { value: Status.Archived, label: "Archived" },
];

export function getStatusLabel(status: Status): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function getStatusColor(status: Status): string {
  switch (status) {
    case Status.Planning:
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case Status.InProgress:
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case Status.OnHold:
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case Status.Deployed:
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case Status.Archived:
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    default:
      return "text-muted-foreground bg-muted";
  }
}

// ── Date helpers ──────────────────────────────────────────────

export function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  const now = Date.now();
  const diff = now - ms;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(nanoseconds);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
