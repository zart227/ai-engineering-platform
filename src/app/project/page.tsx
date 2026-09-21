import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { ProjectForm } from "./project-form";
import { weeks } from "@course";

export default async function ProjectPage() {
  const user = await requireUser();
  const project = await prisma.capstoneProject.findUnique({ where: { userId: user.id } });
  const artifacts = await prisma.artifactProgress.findMany({ where: { userId: user.id } });
  const projectFields = project
    ? {
        name: project.name,
        oneLiner: project.oneLiner,
        targetUser: project.targetUser,
        problem: project.problem,
        hypothesis: project.hypothesis,
        valueProposition: project.valueProposition,
        assumptions: project.assumptions,
        competitors: project.competitors,
        prd: project.prd,
        architecture: project.architecture,
        stack: project.stack,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        analytics: project.analytics,
        notes: project.notes,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm text-muted-foreground">Журнал на все 32 недели и capstone</p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">Мой проект</h1>
      <p className="mt-3 text-base leading-7 text-foreground/80">
        Это engineering journal. Сюда складываются проблема, PRD, архитектура и ссылки.
      </p>
      <ProjectForm
        project={projectFields}
        artifacts={artifacts}
        weeks={weeks.map((w) => ({
          slug: w.slug,
          id: w.id,
          short: w.short,
          artifact: w.artifact.result,
        }))}
      />
    </div>
  );
}
