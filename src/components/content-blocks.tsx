"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentBlock } from "@course/types";
import { cn } from "@/lib/utils";

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
      <h3 className="font-heading text-xl tracking-tight text-foreground">{block.text}</h3>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="space-y-2 pl-1">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-7 text-foreground/90">
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
          <li key={item} className="flex gap-3 text-base leading-7 text-foreground/90">
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
    const tone = block.tone ?? "info";
    return (
      <aside
        className={cn(
          "rounded-2xl border px-4 py-3 sm:px-5",
          tone === "security" && "border-destructive/20 bg-destructive/6",
          tone === "cost" && "border-primary/20 bg-primary/6",
          tone === "warn" && "border-accent-foreground/20 bg-accent",
          tone === "info" && "border-primary/15 bg-primary/6"
        )}
      >
        <p className="text-sm font-medium">{block.title}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/85">{block.text}</p>
      </aside>
    );
  }
  if (block.type === "prompt") {
    return <PromptCard title={block.title} text={block.text} />;
  }
  if (block.type === "code") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border">
        {block.title ? (
          <p className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
            {block.title}
          </p>
        ) : null}
        <div className="relative">
          <CopyButton text={block.text} className="absolute right-2 top-2" />
          <pre className="overflow-x-auto whitespace-pre-wrap bg-foreground/[0.03] px-4 py-3 font-mono text-[13px] leading-6">
            {block.text}
          </pre>
        </div>
      </div>
    );
  }
  if (block.type === "diagram") {
    return (
      <figure className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
        {block.title ? <figcaption className="mb-2 text-sm font-medium">{block.title}</figcaption> : null}
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-6">
          {block.text}
        </pre>
      </figure>
    );
  }
  if (block.type === "check") {
    return <KnowledgeCheck question={block.question} answer={block.answer} />;
  }
  if (block.type === "reading") {
    return (
      <div>
        <p className="text-sm font-medium">Дополнительно</p>
        <ul className="mt-2 space-y-2">
          {block.items.map((item) => (
            <li key={item.url} className="text-sm leading-6">
              <a className="text-primary underline-offset-2 hover:underline" href={item.url}>
                {item.title}
              </a>
              {item.note ? <span className="text-muted-foreground">. {item.note}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/6 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-destructive">Слабо</p>
        <p className="mt-2 text-sm leading-6">{block.bad}</p>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/6 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Рабоче</p>
        <p className="mt-2 text-sm leading-6">{block.good}</p>
      </div>
    </div>
  );
}

function KnowledgeCheck({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-sm font-medium">Проверка</p>
      <p className="mt-1 text-sm leading-6">{question}</p>
      <button
        type="button"
        className="mt-3 text-sm text-primary hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Скрыть ответ" : "Показать ответ"}
      </button>
      {open ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p> : null}
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
          {when ? <p className="mt-0.5 text-sm text-muted-foreground">{when}</p> : null}
        </div>
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap bg-foreground/[0.03] px-4 py-3 font-mono text-[13px] leading-6">
        {text}
      </pre>
    </div>
  );
}

export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} className={cn("shrink-0", className)}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Скопировано" : "Копировать"}
    </Button>
  );
}
