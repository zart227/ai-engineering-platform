import type { CourseModule } from "./types";

export const modules: CourseModule[] = [
  {
    id: "m01",
    number: 1,
    title: "AI Fundamentals",
    short: "Фундамент LLM",
    description:
      "Окружение, API, устройство моделей, промпты, контекст и structured output. Первый проект: LLM Playground.",
    weekSlugs: [
      "environment-llm-api",
      "how-llms-work",
      "prompt-engineering",
      "context-structured-output",
    ],
  },
  {
    id: "m02",
    number: 2,
    title: "AI-Assisted Software Engineering",
    short: "AI в разработке",
    description:
      "Профессиональная работа с coding agents: спецификация, план, ревью, тесты, безопасность.",
    weekSlugs: ["professional-ai-coding", "ai-debug-test-review"],
  },
  {
    id: "m03",
    number: 3,
    title: "Automation Engineering",
    short: "Автоматизация",
    description:
      "Скрипты, n8n, API, webhooks и AI внутри детерминированных пайплайнов. Проект: AI Office Automation.",
    weekSlugs: ["automation-fundamentals", "n8n", "apis-webhooks", "ai-automation"],
  },
  {
    id: "m04",
    number: 4,
    title: "Tools & Agents",
    short: "Инструменты и агенты",
    description:
      "Tool calling и цикл агента с нуля, без фреймворка. Проект: Personal AI Agent.",
    weekSlugs: ["tool-calling", "agent-loop"],
  },
  {
    id: "m05",
    number: 5,
    title: "Embeddings & RAG",
    short: "RAG",
    description:
      "Векторы, pgvector, RAG и advanced retrieval. Проект: AI Knowledge Platform.",
    weekSlugs: ["embeddings", "pgvector", "rag", "advanced-rag"],
  },
  {
    id: "m06",
    number: 6,
    title: "Memory",
    short: "Память",
    description: "Рабочая, эпизодическая и семантическая память агента, забвение и приватность.",
    weekSlugs: ["agent-memory"],
  },
  {
    id: "m07",
    number: 7,
    title: "MCP",
    short: "MCP",
    description: "Model Context Protocol: свой сервер на TypeScript по актуальной спецификации.",
    weekSlugs: ["mcp"],
  },
  {
    id: "m08",
    number: 8,
    title: "Agent Frameworks",
    short: "Фреймворки",
    description: "Что SDK делает за вас. Портирование своего цикла на один актуальный runtime.",
    weekSlugs: ["agent-frameworks"],
  },
  {
    id: "m09",
    number: 9,
    title: "Multi-Agent Systems",
    short: "Multi-agent",
    description: "Паттерны координации и Deep Research System с фактчеком.",
    weekSlugs: ["multi-agent-fundamentals", "multi-agent-architecture"],
  },
  {
    id: "m10",
    number: 10,
    title: "Planning",
    short: "Планирование",
    description: "Декомпозиция цели, DAG, checkpoints и перепланирование.",
    weekSlugs: ["planning"],
  },
  {
    id: "m11",
    number: 11,
    title: "Human-in-the-loop",
    short: "HITL",
    description: "Approve, pause, permissions, audit. Опасные действия не проходят без человека.",
    weekSlugs: ["human-in-the-loop"],
  },
  {
    id: "m12",
    number: 12,
    title: "AI Security",
    short: "Безопасность",
    description: "Injection, tool poisoning, exfiltration. Атаковать своего агента, затем защитить.",
    weekSlugs: ["ai-security"],
  },
  {
    id: "m13",
    number: 13,
    title: "Evals",
    short: "Оценка",
    description: "Golden dataset, метрики, регресс в CI.",
    weekSlugs: ["evals"],
  },
  {
    id: "m14",
    number: 14,
    title: "Observability",
    short: "Наблюдаемость",
    description: "Trace, cost, latency. Почему агент принял это решение.",
    weekSlugs: ["observability"],
  },
  {
    id: "m15",
    number: 15,
    title: "Advanced AI Automation",
    short: "Agentic automation",
    description: "Очереди, идемпотентность, HITL. Проект: AI Automation Platform.",
    weekSlugs: ["event-driven-automation", "agentic-automation"],
  },
  {
    id: "m16",
    number: 16,
    title: "AI Product Engineering",
    short: "Продукт",
    description: "Discovery, PRD, UX, прототип своего AI-продукта.",
    weekSlugs: ["discovery-research", "ux-ui-ai"],
  },
  {
    id: "m17",
    number: 17,
    title: "Product Analytics",
    short: "Аналитика",
    description: "События, воронки, эксперименты и Analytics Agent.",
    weekSlugs: ["product-analytics"],
  },
  {
    id: "m18",
    number: 18,
    title: "Production AI",
    short: "Production",
    description: "Архитектура, деплой, лимиты, мониторинг, стоимость.",
    weekSlugs: ["production-ai"],
  },
  {
    id: "capstone",
    number: 19,
    title: "Capstone",
    short: "Capstone",
    description: "Полноценный AI-продукт в портфолио по цепочке idea → production → iteration.",
    weekSlugs: ["capstone"],
  },
];

export function getModule(id: string) {
  return modules.find((item) => item.id === id);
}

export function moduleByWeekSlug(slug: string) {
  return modules.find((item) => item.weekSlugs.includes(slug));
}
