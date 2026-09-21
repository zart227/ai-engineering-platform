import type { DecisionCard as DecisionCardType } from "@course/types";

export function DecisionCardView({ card }: { card: DecisionCardType }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">Инженерное решение</p>
      <h3 className="mt-2 font-heading text-2xl tracking-tight">{card.title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted/70 p-4">
          <p className="text-sm font-medium">Use {card.optionA} when</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            {card.useA.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-muted/70 p-4">
          <p className="text-sm font-medium">Use {card.optionB} when</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            {card.useB.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6">
        <span className="font-medium">Trade-offs. </span>
        {card.tradeoffs}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Typical mistake. </span>
        {card.mistake}
      </p>
    </section>
  );
}
