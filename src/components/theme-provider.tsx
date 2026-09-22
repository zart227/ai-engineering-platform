"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemes } from "next-themes";
import { forcedThemeFor } from "@/components/theme-boot";

export function ThemeProvider({
  children,
  theme = "system",
}: {
  children: React.ReactNode;
  theme?: string;
}) {
  const saved = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  const forced = forcedThemeFor(saved);

  useEffect(() => {
    if (saved !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.classList.toggle("dark", media.matches);
      document.documentElement.style.colorScheme = media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [saved]);

  return (
    <NextThemes attribute="class" defaultTheme={saved} enableSystem forcedTheme={forced}>
      {children}
    </NextThemes>
  );
}
