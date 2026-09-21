"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentBlock } from "@course/types";

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => (
        <Block key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  if (block.type === "p") {
    return <p className="text-base leading-7 text-foreground/90">{block.text}</p>;
  }
  if (block.type === "h") {
    return (
      <h3 className="font-heading text-xl tracking-tight text-foreground">
        {block.text}
      </h3>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="space-y-2 pl-1">
        {block.items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-base leading-7 text-foreground/90"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "ol") {
    return (
      <ol className="space-y-2">
        {block.items.map((item, index) => (
          <li
            key={item}
            className="flex gap-3 text-base leading-7 text-foreground/90"
          >
            <span className="mt-0.5 w-5 shrink-0 font-heading text-sm text-primary">
              {index + 1}.
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.type === "callout") {
    return (
      <aside className="rounded-2xl border border-primary/15 bg-primary/6 px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-primary">{block.title}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/85">{block.text}</p>
      </aside>
    );
  }
  if (block.type === "prompt") {
    return <PromptCard title={block.title} text={block.text} />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/6 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-destructive">
          Слабо
        </p>
        <p className="mt-2 text-sm leading-6">{block.bad}</p>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/6 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Рабоче
        </p>
        <p className="mt-2 text-sm leading-6">{block.good}</p>
      </div>
    </div>
  );
}

export function PromptCard({
  title,
  text,
  when,
}: {
  title: string;
  text: string;
  when?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="font-medium">{title}</p>
          {when ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{when}</p>
          ) : null}
        </div>
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap bg-foreground/[0.03] px-4 py-3 font-mono text-[13px] leading-6 text-foreground/90">
        {text}
      </pre>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
      {copied ? <Check /> : <Copy />}
      {copied ? "Скопировано" : "Копировать"}
    </Button>
  );
}
