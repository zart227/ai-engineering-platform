import Link from "next/link";
import { modules, weekHref, weekModule, weeks } from "@course";
import type { WeekClientPayload } from "@/server/week-client-payload";
import { weekLabel } from "@/lib/week-label";
import { cn } from "@/lib/utils";

const weekBySlug = new Map(weeks.map((item) => [item.slug, item]));

export function WeekNav({ week }: { week: WeekClientPayload }) {
  const currentModule = weekModule(week);

  return (
    <div>
      <aside className="hidden lg:block">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Программа</p>
        <nav aria-label="Программа" className="mt-3 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <ModuleWeekLinks currentSlug={week.slug} />
        </nav>
      </aside>
      <details className="rounded-xl border border-border bg-card lg:hidden">
        <summary className="cursor-pointer px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">{currentModule.title}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="font-medium">{weekLabel(week)}</span>
        </summary>
        <nav aria-label="Программа" className="max-h-72 space-y-4 overflow-y-auto border-t border-border p-2">
          <ModuleWeekLinks currentSlug={week.slug} />
        </nav>
      </details>
    </div>
  );
}

function ModuleWeekLinks({ currentSlug }: { currentSlug: string }) {
  return modules.map((mod) => {
    const items = mod.weekSlugs.flatMap((slug) => {
      const item = weekBySlug.get(slug);
      return item ? [item] : [];
    });
    if (items.length === 0) return null;
    return (
      <div key={mod.id}>
        <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{mod.title}</p>
        <div className="space-y-1">
          {items.map((item) => {
            const active = item.slug === currentSlug;
            return (
              <Link
                key={item.slug}
                href={weekHref(item)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="block text-xs opacity-80">{weekLabel(item)}</span>
                <span className="block font-medium">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  });
}
