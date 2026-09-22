import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Source_Serif_4 } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { systemThemeBootScript } from "@/components/theme-boot";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { coursePercent, loadLearningState, summarizeWeeks } from "@/server/progress";
import { courseMeta } from "@course";
import "./globals.css";

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const heading = Source_Serif_4({
  variable: "--font-source",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: courseMeta.title,
    template: `%s · ${courseMeta.title}`,
  },
  description: courseMeta.tagline,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  let percent = 0;
  let theme = "system";
  try {
    session = await getSession();
    if (session) {
      const [state, settings] = await Promise.all([
        loadLearningState(session.user.id),
        prisma.userSettings.findUnique({ where: { userId: session.user.id }, select: { theme: true } }),
      ]);
      percent = coursePercent(summarizeWeeks(state));
      theme = settings?.theme ?? "system";
    }
  } catch {
    session = null;
  }

  return (
    <html
      lang="ru"
      className={`${sans.variable} ${heading.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {theme === "system" ? (
          <script dangerouslySetInnerHTML={{ __html: systemThemeBootScript() }} />
        ) : null}
        <ThemeProvider theme={theme}>
          <AppHeader percent={percent} email={session?.user.email} />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
