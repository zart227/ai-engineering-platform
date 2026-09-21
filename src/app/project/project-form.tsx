"use client";

import { SaveField } from "@/components/save-field";
import { saveProjectAction } from "@/app/actions/learn";
import { Input } from "@/components/ui/input";

const fields = [
  ["name", "Название"],
  ["oneLiner", "Одной фразой"],
  ["targetUser", "Для кого"],
  ["githubUrl", "GitHub"],
  ["demoUrl", "Demo"],
  ["stack", "Стек"],
] as const;

const areas = [
  ["problem", "Проблема"],
  ["hypothesis", "Гипотеза"],
  ["valueProposition", "Ценность"],
  ["assumptions", "Допущения"],
  ["competitors", "Конкуренты"],
  ["prd", "PRD"],
  ["architecture", "Архитектура"],
  ["analytics", "Аналитика"],
  ["notes", "Заметки"],
] as const;

type Project = Record<string, string | null | undefined> | null;

export function ProjectForm({
  project,
  artifacts,
  weeks,
}: {
  project: Project;
  artifacts: { weekSlug: string; notes: string; githubUrl: string; demoUrl: string }[];
  weeks: { slug: string; id: number; short: string; artifact: string }[];
}) {
  const value = (key: string) => String(project?.[key] ?? "");

  return (
    <div className="mt-8 space-y-6">
      {fields.map(([key, label]) => (
        <label key={key} className="block text-sm">
          {label}
          <Input
            className="mt-1"
            defaultValue={value(key)}
            onBlur={(event) => {
              void saveProjectAction({ [key]: event.target.value });
            }}
          />
        </label>
      ))}
      {areas.map(([key, label]) => (
        <div key={key}>
          <p className="text-sm font-medium">{label}</p>
          <SaveField
            value={value(key)}
            placeholder={label}
            cacheKey={`project-${key}`}
            onSave={(body) => saveProjectAction({ [key]: body })}
          />
        </div>
      ))}
      <section className="pt-6">
        <h2 className="font-heading text-2xl">Артефакты недель</h2>
        <div className="mt-4 space-y-3">
          {weeks.map((week) => {
            const artifact = artifacts.find((item) => item.weekSlug === week.slug);
            return (
              <div key={week.slug} className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Неделя {week.id}</p>
                <p className="font-medium">{week.short}</p>
                <p className="text-sm text-muted-foreground">{week.artifact}</p>
                {artifact?.githubUrl ? (
                  <p className="mt-2 text-sm">{artifact.githubUrl}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
