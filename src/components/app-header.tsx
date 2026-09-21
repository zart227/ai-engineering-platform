"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { logoutAction } from "@/app/actions/auth";
import { courseMeta } from "@course";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Курс" },
  { href: "/map", label: "Карта" },
  { href: "/project", label: "Мой проект" },
  { href: "/projects", label: "Проекты" },
  { href: "/notes", label: "Заметки" },
  { href: "/glossary", label: "Справочник" },
  { href: "/bookmarks", label: "Закладки" },
  { href: "/search", label: "Поиск" },
  { href: "/settings", label: "Настройки" },
];

export function AppHeader({
  percent,
  email,
}: {
  percent: number;
  email?: string;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-lg tracking-tight sm:text-xl">{courseMeta.title}</span>
          <span className="hidden text-xs text-muted-foreground lg:inline">32 недели</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
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
                  "shrink-0 rounded-full px-2.5 py-1.5 text-xs transition-colors sm:text-sm",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
          </div>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            Тема
          </button>
          {email ? (
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" type="submit">
                Выйти
              </Button>
            </form>
          ) : (
            <Button size="sm" render={<Link href="/login" />}>
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
