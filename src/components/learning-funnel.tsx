import type { FunnelSnapshot } from "@/server/funnel";

function percent(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function LearningFunnel({ snapshot }: { snapshot: FunnelSnapshot }) {
  const empty = snapshot.steps.every((step) => step.count === 0);
  return (
    <section className="mt-10" aria-labelledby="learning-funnel-title">
      <h2 id="learning-funnel-title" className="font-heading text-2xl">
        Воронка
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Единица — ваша неделя. Шаг считается, только если предыдущие шаги этой недели тоже есть.
      </p>
      {empty ? (
        <p className="mt-4 text-sm text-muted-foreground">
          В воронке пока нет недели, где шаги идут по порядку.
        </p>
      ) : (
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Шаги воронки">
          {snapshot.steps.map((step, index) => (
            <li key={step.id} className="rounded-3xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {index + 1}. {step.label}
              </p>
              <p className="mt-2 font-heading text-3xl">{step.count}</p>
              {index > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Конверсия {percent(step.conversion)}, отсев {step.dropout}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
