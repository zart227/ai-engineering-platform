import { compactWeek, type CompactWeek } from "./compact";

function w(spec: CompactWeek) {
  return spec;
}

export const weekSpecs11to21: CompactWeek[] = [
  w({
    id: 11,
    slug: "tool-calling",
    moduleId: "m04",
    title: "Tool calling",
    short: "Tools",
    track: "engineering",
    hours: 12,
    goal: "Модель выбирает инструмент, ваш код исполняет, схема и права ваши.",
    technologies: ["tool schema", "JSON Schema", "Zod", "audit log"],
    why: "Без инструментов LLM только говорит. С инструментами она трогает мир. Граница исполнения критична.",
    prerequisites: ["structured output", "секреты недели 1"],
    productionUse: ["ассистенты", "внутренние боты", "агенты"],
    previousKnowledge: ["Zod", "недоверенный выход"],
    lessons: [
      {
        title: "Схема инструмента",
        minutes: 16,
        objectives: ["Описать tool", "Валидировать аргументы до side effect"],
        paragraphs: [
          "Модель возвращает имя функции и JSON аргументов. Это предложение, не приказ. Вы парсите аргументы Zod-схемой. Если поле amount отрицательное, инструмент не вызывается.",
          "Описание tool читает модель. Пользователь может попытаться отравить описание, если вы подмешиваете чужой текст в schema. Пишите описания сами.",
        ],
        codeSample: {
          language: "ts",
          text: `export const SearchArgs = z.object({ query: z.string().min(1).max(200) });\nexport async function search(args: unknown) {\n  const { query } = SearchArgs.parse(args);\n  return { hits: [] as { id: string; title: string }[], query };\n}\n`,
        },
      },
      {
        title: "Исполнение, ошибки, параллель",
        minutes: 16,
        objectives: ["Вернуть tool result", "Не запускать опасное параллельно вслепую"],
        paragraphs: [
          "Результат инструмента уходит обратно моделью как роль tool. Ошибки тоже: «not found», не stack trace. Параллельные вызовы ускоряют чтение. Параллельная запись без идемпотентности создаёт гонки.",
          "Retry инструмента: только если он идемпотентен. «createPayment» без ключа не ретраить.",
        ],
      },
      {
        title: "Права",
        minutes: 14,
        objectives: ["Least privilege"],
        paragraphs: [
          "Не давайте чат-агенту delete_all. Разделяйте READ и WRITE. Финансовые tools требуют HITL (неделя 23). Логируйте каждый вызов: кто, какой tool, какие аргументы без секретов, результат ok/error.",
        ],
        callout: { title: "Least privilege", text: "Инструмент это API с правами модели. Модель не пользователь. Не копируйте роль admin.", tone: "security" },
      },
    ],
    lab: {
      title: "Три инструмента",
      goal: "search, calculator, notes. Каждый вызов в логе.",
      setup: ["клиент с tool calling провайдера или эмуляция JSON"],
      steps: [
        { title: "Schemas", body: "Три Zod-схемы, три функции.", expected: "Валидация ломает плохой JSON до функции." },
        { title: "Audit", body: "Пишите JSONL лог вызовов.", expected: "Одна строка на вызов." },
      ],
      reflection: ["Какой tool нельзя делать параллельным?"],
    },
    practice: {
      title: "Отказ в опасном tool",
      time: "2 часа",
      context: "Модель просит delete. Политика запрещает.",
      requirements: ["политика allowlist", "отказ с объяснением модели", "тест на запрет"],
      constraints: ["Нельзя «просто не документировать» delete и надеяться"],
      acceptance: ["Даже если модель просит, функция не зовётся"],
      tests: ["unit: policy denies"],
      hints: [
        { title: "Подсказка 1", text: "Allowlist, не denylist." },
        { title: "Подсказка 2", text: "Возвращайте модели текст ошибки политики." },
        { title: "Подсказка 3", text: "Лог denied тоже пишите." },
      ],
      solution: "executeTool проверяет policy до switch(name).",
    },
    prompt: {
      title: "Выбор tool",
      purpose: "System для tool-calling",
      when: "Один шаг, не полный агент",
      placeholders: ["{{tools}}", "{{goal}}"],
      text: `Цель: {{goal}}\nДоступные tools:\n{{tools}}\nВерни либо tool call по схеме, либо финальный JSON {"done":true,"text":string}. Не выдумывай tools.`,
      explanation: "Закрытый список.",
      limitations: "Без цикла это один шаг. Цикл на следующей неделе.",
    },
    quiz: [
      { prompt: "Аргументы tool исполнять до Zod?", options: ["Да, быстрее", "Нет", "Только если search", "Только в n8n"], answer: 1, kind: "debugging", explanation: "Сначала контракт." },
      { prompt: "Параллельный createPayment дважды:", options: ["Отлично", "Риск двойного списания", "Дешевле", "Требует embeddings"], answer: 1, kind: "scenario", explanation: "Побочные эффекты сериализуйте или ключуйте." },
      { prompt: "Кто исполняет tool?", options: ["Модель сама в GPU", "Ваш код", "Провайдер всегда", "Cron"], answer: 1, kind: "conceptual", explanation: "Модель предлагает, код делает." },
      { prompt: "Описание tool из RAG-документа пользователя:", options: ["Удобно", "Риск tool poisoning", "Обязательно по MCP", "Ускоряет HNSW"], answer: 1, kind: "scenario", explanation: "Описания пишет инженер." },
    ],
    artifactResult: "Tool runtime с allowlist, Zod и audit log.",
    checklist: ["три tools", "валидация", "audit", "deny тест"],
    recall: [{ fromWeek: "ai-automation", question: "Почему enum маршрутов закрытый?", answer: "Ввод не должен расширять систему." }],
  }),
  w({
    id: 12,
    slug: "agent-loop",
    moduleId: "m04",
    title: "Цикл агента с нуля",
    short: "Agent loop",
    track: "engineering",
    hours: 12,
    goal: "Написать Goal → LLM → Decision → Tool → Observation → State → Next без фреймворка.",
    technologies: ["TypeScript", "tool runtime", "trace"],
    why: "Фреймворк спрячет цикл. Сначала вы должны увидеть бесконечный loop, бюджет и trace своими глазами.",
    prerequisites: ["неделя 11"],
    productionUse: ["персональные агенты", "ops-ассистенты"],
    previousKnowledge: ["tools", "токены", "таймауты"],
    lessons: [
      {
        title: "Цикл",
        minutes: 18,
        objectives: ["Реализовать шаги", "Условие остановки"],
        paragraphs: [
          "Псевдокод: пока шаг < N и нет done и бюджет токенов жив: спросить модель, если tool, исполнить, добавить observation, повторить. Если текст-финал, выйти. Если модель снова зовёт tool, это норма. Если зовёт 20 раз одно и то же, это цикл.",
          "Stopping: done flag, max steps, max tokens, timeout, пользователь отменил. Без этого агент жжёт кассу.",
        ],
      },
      {
        title: "State и trace",
        minutes: 16,
        objectives: ["Хранить состояние", "Писать trace"],
        paragraphs: [
          "State: цель, scratchpad, результаты tools, счётчики. Trace: каждый шаг как span (пока текстом). Позже неделя 26 превратит это в нормальную наблюдаемость.",
          "Tool failure: вернуть ошибку в observation, не ронять процесс, если политика позволяет. После k ошибок одного tool остановиться.",
        ],
      },
      {
        title: "Когда не агент",
        minutes: 12,
        objectives: ["Связать с decision card"],
        paragraphs: [
          "Если цель «извлеки поля из письма», цикл агента лишний: один structured вызов. Агент оправдан, когда набор шагов всплывает по дороге. Personal AI Agent этой недели: заметки/файлы/поиск у вас локально, max 8 шагов.",
        ],
      },
    ],
    lab: {
      title: "Personal AI Agent v0",
      goal: "Цикл с бюджетом 8 шагов и тремя tools.",
      setup: ["runtime недели 11"],
      steps: [
        { title: "Loop", body: "for/while с break по done/max.", expected: "Нельзя превысить 8." },
        { title: "Trace", body: "Печать шагов.", expected: "По trace видно, почему остановились." },
      ],
      reflection: ["Как вы обнаружили бы бесконечный loop в проде?"],
    },
    practice: {
      title: "Сломать и починить циклом",
      time: "2 часа",
      context: "Заставьте агента крутиться, затем поставьте защиту.",
      requirements: ["воспроизведение цикла", "защита (повтор tool, max steps)", "тест"],
      constraints: ["Без LangChain и аналогов"],
      acceptance: ["Тест: на провокационном промпте выходит по бюджету"],
      tests: ["max steps", "повтор одного tool"],
      hints: [
        { title: "Подсказка 1", text: "Считайте одинаковые tool+args подряд." },
        { title: "Подсказка 2", text: "Храните spent tokens." },
        { title: "Подсказка 3", text: "Не увеличивайте max «пока не получится»." },
      ],
      solution: "stopReasons: max_steps, repeat_tool, tokens, done, abort.",
    },
    prompt: {
      title: "Шаг агента",
      purpose: "Один ход цикла",
      when: "Внутри loop",
      placeholders: ["{{goal}}", "{{state}}", "{{tools}}"],
      text: `Цель: {{goal}}\nСостояние: {{state}}\nTools: {{tools}}\nВерни action: tool|final. Если tool, имя и args по схеме. Если застрял, final с объяснением, не выдумывай успех.`,
      explanation: "Каждый ход должен уметь сдаться.",
      limitations: "Без бюджета в коде промпт не спасёт.",
    },
    quiz: [
      { prompt: "Главная защита от бесконечного агента?", options: ["Вежливый system prompt", "Бюджет шагов/токенов в коде", "Больше моделей", "Выключить Zod"], answer: 1, kind: "architecture", explanation: "Лимит в вашем runtime." },
      { prompt: "Фреймворк на этой неделе?", options: ["Обязателен", "Запрещён в начале: сначала свой цикл", "Только n8n", "Только MCP"], answer: 1, kind: "conceptual", explanation: "Сначала механизм, потом сахар." },
      { prompt: "Observation это:", options: ["Догадка модели", "Результат tool, который вы положили в state", "CSS", "Эмбеддинг"], answer: 1, kind: "conceptual", explanation: "Наблюдение приходит из мира через ваш код." },
      { prompt: "Агент для извлечения JSON из формы:", options: ["Идеально", "Скорее overkill: один structured вызов", "Единственный способ", "Требует 12 агентов"], answer: 1, kind: "scenario", explanation: "Не агент, если хватает функции." },
    ],
    artifactResult: "Personal AI Agent: цикл, бюджет, trace, tools.",
    checklist: ["свой loop", "max steps", "trace", "нет фреймворка"],
    decisionCard: {
      title: "Workflow vs agent",
      optionA: "Один вызов / workflow",
      optionB: "Agent loop",
      useA: ["фиксированные шаги", "нужна дешевизна", "жёсткий JSON"],
      useB: ["цель открытая", "набор tools всплывает по ходу", "редкие задачи"],
      tradeoffs: "Цикл дороже и сложнее в evals.",
      mistake: "Агент на каждый HTTP-запрос формы.",
    },
    recall: [{ fromWeek: "tool-calling", question: "Кто исполняет tool?", answer: "Ваш код после валидации." }],
  }),
];

export const weeks11to12 = weekSpecs11to21.map(compactWeek);
