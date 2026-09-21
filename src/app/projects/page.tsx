import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { weeks } from "@course";
import { PortfolioForm } from "./portfolio-form";

export default async function ProjectsPage() {
  const user = await requireUser();
  const items = await prisma.portfolioProject.findMany({ where: { userId: user.id } });
  const catalog = [
    { slug: "llm-playground", title: "LLM Playground", week: 4 },
    { slug: "office-automation", title: "AI Office Automation", week: 10 },
    { slug: "personal-agent", title: "Personal AI Agent", week: 12 },
    { slug: "knowledge-platform", title: "AI Knowledge Platform", week: 16 },
    { slug: "mcp-server", title: "MCP Server", week: 18 },
    { slug: "deep-research", title: "Multi-Agent Deep Research", week: 21 },
    { slug: "automation-platform", title: "AI Automation Platform", week: 28 },
    { slug: "analytics-agent", title: "Analytics Agent", week: 31 },
    { slug: "ai-dev-team", title: "AI Software Development Team", week: 6 },
    { slug: "capstone", title: "Capstone AI SaaS", week: 33 },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl tracking-tight">Проекты</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Портфолио курса. Статус и ссылки ваши, шаблон названий общий.
      </p>
      <PortfolioForm items={items} catalog={catalog} weekCount={weeks.length} />
    </div>
  );
}
