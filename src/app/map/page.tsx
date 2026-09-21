import Link from "next/link";
import { automationPath, engineeringPath, productPath } from "@course/learning-map";
import { getWeek, weekHref } from "@course";

function Path({ title, nodes }: { title: string; nodes: typeof engineeringPath }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <h2 className="font-heading text-2xl">{title}</h2>
      <ol className="mt-4 flex flex-wrap items-center gap-2">
        {nodes.map((node, index) => {
          const week = node.weekSlug ? getWeek(node.weekSlug) : null;
          return (
            <li key={node.id} className="flex items-center gap-2">
              {week ? (
                <Link
                  href={weekHref(week)}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary"
                >
                  {node.label}
                </Link>
              ) : (
                <span className="rounded-full border px-3 py-1 text-sm">{node.label}</span>
              )}
              {index < nodes.length - 1 ? <span className="text-muted-foreground">→</span> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function MapPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <h1 className="font-heading text-4xl">Карта обучения</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Три трека. Стрелка это порядок идей, не запрет смотреть вперёд.
      </p>
      <Path title="AI Engineering" nodes={engineeringPath} />
      <Path title="Automation" nodes={automationPath} />
      <Path title="Product" nodes={productPath} />
    </div>
  );
}
