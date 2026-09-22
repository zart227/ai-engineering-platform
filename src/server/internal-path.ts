export function safeInternalPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const next = value.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("://")) {
    return "/";
  }
  let url: URL;
  try {
    url = new URL(next, "http://127.0.0.1");
  } catch {
    return "/";
  }
  if (url.origin !== "http://127.0.0.1") return "/";
  if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return "/";
  return `${url.pathname}${url.search}`;
}
