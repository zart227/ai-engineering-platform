import type { FunnelSnapshot } from "@/server/funnel";

export function LearningFunnel({ snapshot }: { snapshot: FunnelSnapshot }) {
  return (
    <section className="mt-10" aria-labelledby="learning-funnel-title">
      <h2 id="learning-funnel-title" className="font-heading text-2xl">
        Воронка
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Считаю только ваши события.</p>
      {snapshot.eventCount === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Событий пока нет.</p>
      ) : (
        <ol className="mt-4 grid gap-3 sm:grid-cols-5" aria-label="Шаги воронки">
          {snapshot.steps.map((step, index) => (
            <li key={step.id} className="rounded-3xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {index + 1}. {step.label}
              </p>
              <p className="mt-2 font-heading text-3xl">{step.count}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
