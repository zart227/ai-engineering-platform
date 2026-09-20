"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { courseCompletion, useProgress } from "@/components/progress-provider";
import { courseMeta } from "@course";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Курс" },
  { href: "/project", label: "Мой проект" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { state, ready } = useProgress();
  const percent = ready ? courseCompletion(state.done) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-xl tracking-tight">{courseMeta.title}</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            6 недель
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/" || pathname.startsWith("/week")
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="ml-1 hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {percent}%
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
