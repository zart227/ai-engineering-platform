import type { Metadata } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";
import { ProgressProvider } from "@/components/progress-provider";
import { SiteHeader } from "@/components/site-header";
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
    default: "AI Engineering Platform",
    template: "%s · AI Engineering Platform",
  },
  description:
    "Самостоятельный курс на 6 недель: как встроить ИИ в работу от проблемы до аналитики. Теория, практика и промпты.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${sans.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ProgressProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </ProgressProvider>
      </body>
    </html>
  );
}
