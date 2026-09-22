export type BookmarkHrefKind = "internal" | "external" | "unsafe";

export type SafeBookmarkHref =
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string }
  | { kind: "unsafe" };

const ACTIVE_SCHEME = /^(javascript|data|vbscript|file|blob):/i;

function hasDisallowedScheme(value: string): boolean {
  const trimmed = value.trim();
  if (ACTIVE_SCHEME.test(trimmed)) return true;
  const colon = trimmed.indexOf(":");
  if (colon <= 0 || colon > 12) return false;
  const scheme = trimmed.slice(0, colon).toLowerCase();
  return scheme !== "http" && scheme !== "https";
}

/** Classify a stored or imported bookmark href for safe rendering and import. */
export function classifyBookmarkHref(value: unknown): SafeBookmarkHref {
  if (typeof value !== "string") return { kind: "unsafe" };
  const next = value.trim();
  if (!next || next.startsWith("//") || next.includes("\\") || hasDisallowedScheme(next)) {
    return { kind: "unsafe" };
  }

  if (next.startsWith("/")) {
    if (next.includes("://")) return { kind: "unsafe" };
    let url: URL;
    try {
      url = new URL(next, "http://127.0.0.1");
    } catch {
      return { kind: "unsafe" };
    }
    if (url.origin !== "http://127.0.0.1") return { kind: "unsafe" };
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return { kind: "unsafe" };
    return { kind: "internal", href: `${url.pathname}${url.search}${url.hash}` };
  }

  const lower = next.toLowerCase();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return { kind: "unsafe" };

  let url: URL;
  try {
    url = new URL(next);
  } catch {
    return { kind: "unsafe" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "unsafe" };
  return { kind: "external", href: url.href };
}

/** Returns a safe href for persistence, or null when the value must be rejected. */
export function sanitizeBookmarkHrefForImport(value: unknown): string | null {
  const classified = classifyBookmarkHref(value);
  if (classified.kind === "unsafe") return null;
  return classified.href;
}
