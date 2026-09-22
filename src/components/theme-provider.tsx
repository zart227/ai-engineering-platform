"use client";

import { ThemeProvider as NextThemes } from "next-themes";

export function ThemeProvider({
  children,
  theme = "system",
}: {
  children: React.ReactNode;
  theme?: string;
}) {
  const saved = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  return (
    <NextThemes attribute="class" defaultTheme={saved} enableSystem forcedTheme={saved}>
      {children}
    </NextThemes>
  );
}
