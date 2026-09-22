export const THEME_STORAGE_KEY = "theme";

export function forcedThemeFor(saved: string): "light" | "dark" | undefined {
  if (saved === "light" || saved === "dark") return saved;
  return undefined;
}

/** Runs before paint when the saved theme is system. Resolves light or dark from the OS and keeps next-themes on system so a later OS change can follow. */
export function systemThemeBootScript() {
  const key = JSON.stringify(THEME_STORAGE_KEY);
  return `try{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";localStorage.setItem(${key},"system");}catch(e){}`;
}
