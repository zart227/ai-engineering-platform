"use client";

import { useState } from "react";
import { savePortfolioAction } from "@/app/actions/learn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  githubUrl: string;
  demoUrl: string;
};

export function PortfolioForm({
  items,
  catalog,
}: {
  items: Item[];
  catalog: { slug: string; title: string; week: number }[];
  weekCount: number;
}) {
  const [status, setStatus] = useState("");

  return (
    <div className="mt-8 space-y-8">
      {catalog.map((project) => {
        const saved = items.find((item) => item.slug === project.slug);
        return (
          <form
            key={project.slug}
            className="rounded-3xl border border-border p-5 space-y-3"
            action={async (formData) => {
              await savePortfolioAction({
                id: saved?.id,
                slug: project.slug,
                title: project.title,
                description: String(formData.get("description") ?? ""),
                status: String(formData.get("status") ?? "planned"),
                githubUrl: String(formData.get("githubUrl") ?? ""),
                demoUrl: String(formData.get("demoUrl") ?? ""),
              });
              setStatus("Saved");
            }}
          >
            <p className="text-xs text-muted-foreground">Неделя {project.week}</p>
            <h2 className="font-heading text-2xl">{project.title}</h2>
            <select
              name="status"
              defaultValue={saved?.status ?? "planned"}
              className="rounded-lg border border-input bg-card px-2 py-1 text-sm"
            >
              <option value="planned">planned</option>
              <option value="in-progress">in-progress</option>
              <option value="done">done</option>
            </select>
            <textarea
              name="description"
              defaultValue={saved?.description ?? ""}
              placeholder="Описание, стек, критерии"
              className="min-h-24 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
            />
            <Input name="githubUrl" defaultValue={saved?.githubUrl ?? ""} placeholder="GitHub" />
            <Input name="demoUrl" defaultValue={saved?.demoUrl ?? ""} placeholder="Demo" />
            <Button type="submit">Сохранить</Button>
          </form>
        );
      })}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
