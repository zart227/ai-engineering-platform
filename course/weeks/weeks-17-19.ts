import { compactWeek, type CompactWeek } from "./compact";

const rest: CompactWeek[] = [
  {
    id: 19, slug: "agent-frameworks", moduleId: "m08", title: "Agent SDK и фреймворки", short: "Frameworks", track: "engineering", hours: 10,
    goal: "Понять, что фреймворк делает за вас, и портировать свой цикл на один SDK.",
    technologies: ["один актуальный Agent SDK на выбор"],
    why: "После своего цикла сахар имеет смысл. До него вы не отличите магию от трёх if.",
    prerequisites: ["неделя 12", "MCP обзор"], productionUse: ["продукты, где не хотите держать свой runner"], previousKnowledge: ["loop", "tools", "HITL как идея"],
    asOf: "2026-09-21",
    lessons: [
      { title: "Карта подходов", minutes: 16, objectives: ["SDK vs graph vs workflow-with-LLM"], paragraphs: ["Класс решений: тонкий Agent SDK (раннер, tools, sessions), графы состояний, workflow-движки с LLM-нодой. Не учите «единственный правильный бренд». Сравните документацию двух актуальных на дату as-of: что с handoff, tracing, guardrails, MCP adapters, HITL.", "Вопрос недели: что фреймворк делает за нас? Если не можете ответить, не берите его в прод."] },
      { title: "Портирование", minutes: 16, objectives: ["Тот же агент на SDK"], paragraphs: ["Перенесите Personal Agent. Таблица: бюджет шагов, trace, tool errors, memory. Что исчезло в абстракции? Что стало лучше (retries, sessions)?"] },
      { title: "Когда остаться на своём цикле", minutes: 12, objectives: ["Не внедрять SDK ради резюме"], paragraphs: ["Свой цикл лучше, когда агент маленький и вы хотите прозрачности. SDK лучше, когда команда и фичи (tracing) реально нужны. Как с n8n: инструмент следует задаче."] },
    ],
    lab: { title: "Порт на SDK", goal: "Один happy path на фреймворке.", setup: ["выбранный SDK, дата docs в README"], steps: [{ title: "Map", body: "Таблица свой цикл vs SDK.", expected: "Не пустая." }, { title: "Port", body: "Один сценарий notes.search работает.", expected: "Запись запуска." }], reflection: ["Что вы больше не контролируете?"] },
    practice: { title: "Comparison note", time: "2 часа", context: "Документ для команды.", requirements: ["2 альтернативы", "критерии", "рекомендация для вашего агента", "as-of"], constraints: ["Не реклама"], acceptance: ["Можно принять решение не брать SDK"], tests: ["ссылки на официальные docs"], hints: [{ title: "Подсказка 1", text: "Критерии: HITL, MCP, tracing, license, lock-in." }, { title: "Подсказка 2", text: "Проверьте breaking changes changelog." }, { title: "Подсказка 3", text: "Не сравнивайте версии двухлетней давности." }], solution: "COMPARE.md с датой." },
    prompt: { title: "Что скрывает SDK?", purpose: "Разбор абстракции", when: "Чтение docs раннера", placeholders: ["{{docs}}"], text: `По docs перечисли механизмы, которые SDK прячет: loop, retries, sessions, memory, guardrails. Для каждого: как бы ты сделал сам.\n{{docs}}`, explanation: "Антимагия.", limitations: "Docs врут и стареют. Проверьте код SDK." },
    quiz: [
      { prompt: "Главный вопрос к фреймворку:", options: ["Какой логотип", "Что он делает за нас и чем это стоит lock-in", "Сколько эмодзи", "Есть ли градиент"], answer: 1, kind: "conceptual", explanation: "Прозрачность." },
      { prompt: "Порт своего агента нужен чтобы:", options: ["Удалить понимание цикла", "Сверить семантику 1:1", "Увеличить число зависимостей всегда", "Заменить тесты"], answer: 1, kind: "architecture", explanation: "Вы учите разницу." },
      { prompt: "SDK без бюджета шагов:", options: ["Безопасен", "Вы обязаны добавить свой лимит", "Лучше без лимита", "Так задумано MCP"], answer: 1, kind: "debugging", explanation: "Касса." },
      { prompt: "Выбор SDK по Twitter:", options: ["Достаточно", "Нужны docs, лицензия, fit задачи, дата проверки", "Всегда самый новый", "Всегда самый старый"], answer: 1, kind: "scenario", explanation: "Инженерное решение." },
    ],
    artifactResult: "Порт агента на один SDK + comparison note с as-of.",
    checklist: ["таблица отличий", "рабочий порт", "as-of docs", "осознанный выбор"],
    recall: [{ fromWeek: "agent-loop", question: "Какие stop conditions вы уже писали?", answer: "max steps, tokens, done, repeat tool." }],
  },
];

export const weeks19 = rest.map(compactWeek);
