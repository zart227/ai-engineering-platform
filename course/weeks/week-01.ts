import {
  artifact,
  callout,
  check,
  code,
  compare,
  decision,
  diagram,
  exercise,
  h,
  lab,
  lesson,
  p,
  promptT,
  q,
  quiz,
  reading,
  ul,
  week,
} from "../blocks";

export const week01 = week({
  id: 1,
  slug: "environment-llm-api",
  moduleId: "m01",
  title: "Окружение AI-разработчика и первый LLM API",
  short: "LLM API",
  track: "engineering",
  status: "ready",
  hours: 10,
  goal:
    "Собрать рабочее окружение, спрятать секреты, отправить первый устойчивый запрос к модели и понять, сколько это стоит.",
  technologies: ["TypeScript", "Node.js", "fetch", "dotenv", "OpenAI-compatible API"],
  overview: {
    why:
      "Без клиента, учёта токенов и обработки ошибок все следующие темы будут разговором. AI-приложение начинается с границы: ваш код, сеть, провайдер, счёт.",
    prerequisites: [
      "Node.js 20+",
      "базовый TypeScript",
      "Git",
      "понимание HTTP JSON",
    ],
    productionUse: [
      "любой backend, который вызывает LLM",
      "CLI-утилиты для команды",
      "внутренние инструменты поддержки",
    ],
    previousKnowledge: [
      "веб-разработка",
      "переменные окружения как идея",
    ],
    asOf: "2026-09-21",
  },
  lessons: [
    lesson(
      "environment-llm-api-l1",
      "Архитектура AI-приложения",
      18,
      [
        "Назвать слои AI-приложения без маркетинговых слов",
        "Отличить провайдера, модель и ваш код",
        "Понять, где появляется стоимость и риск",
      ],
      [
        p(
          "AI-приложение это не чат. Это обычная программа, которая на одном из шагов вызывает вероятностный сервис. Если вы это не разделяете, вы начнёте пихать модель туда, где хватит if."
        ),
        diagram(
          `Пользователь
  → ваш API / CLI / UI
    → валидация входа
      → сбор контекста (код, БД, файлы)
        → провайдер LLM
          → модель
        ← токены, логи, ошибка или текст
      → проверка выхода
    → действие в системе
  → ответ человеку`,
          "Минимальный контур"
        ),
        h("Что здесь детерминировано"),
        ul([
          "Аутентификация пользователя.",
          "Чтение своих данных из БД.",
          "Схема ответа, который вы готовы принять.",
          "Лимит денег и шагов.",
          "Запись аудита.",
        ]),
        h("Что вероятностно"),
        ul([
          "Формулировка, которую вернёт модель.",
          "Выбор tool, если вы это разрешили.",
          "Качество извлечения фактов.",
        ]),
        p(
          "Главная ошибка недели: вызвать модель раньше, чем вы знаете, какой JSON вам нужен на выходе. Сначала контракт, потом провайдер."
        ),
        compare(
          "Граница системы",
          "Страница сразу fetch('https://api.openai.com') из браузера с ключом в NEXT_PUBLIC_.",
          "Ключ живёт на сервере. Браузер бьёт в ваш /api. Сервер проверяет пользователя, считает токены, пишет лог без секретов."
        ),
        callout(
          "Секреты с первой недели",
          "API key это пароль от чужого счёта. Он не в Git, не в скриншоте, не в клиентском бандле, не в логе. Файл .env в .gitignore. В репозитории только .env.example.",
          "security"
        ),
        check(
          "Почему ключ нельзя класть в фронтенд даже «для демо»?",
          "Любой посетитель вытащит его из Network/JS и сожжёт ваш лимит или прочитает ваши данные у провайдера."
        ),
        reading([
          {
            title: "OpenAI API reference",
            url: "https://platform.openai.com/docs/api-reference",
            note: "Сверяйте поля ответа, не копируйте устаревшие SDK-примеры из блогов.",
          },
        ]),
      ]
    ),
    lesson(
      "environment-llm-api-l2",
      "Providers, модели, ключи, environment",
      16,
      [
        "Выбрать модель под задачу, а не под бренд",
        "Собрать .env без утечки",
        "Понять совместимый API",
      ],
      [
        p(
          "Провайдер продаёт inference. Модель это конкретные веса и tokenizer. SDK это удобная обёртка. Если вы умеете сделать fetch, вы не заложники одного SDK."
        ),
        h("Как думать о выборе"),
        ul([
          "Маленькая модель: классификация, короткие JSON, дешёвые черновики.",
          "Большая модель: сложная спецификация, ревью, неоднозначный текст.",
          "Локальная модель: приватные данные, оффлайн, предсказуемая цена железа.",
        ]),
        p(
          "Многие провайдеры принимают OpenAI-совместимый POST /v1/chat/completions или /v1/responses. Имеет смысл держать тонкий клиент с baseURL и model в конфиге, а не размазать fetch по проекту."
        ),
        code(
          "bash",
          `# .env.example
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-replace-me
LLM_MODEL=gpt-4.1-mini
`,
          ".env.example"
        ),
        code(
          "ts",
          `import { z } from "zod";

const envSchema = z.object({
  LLM_BASE_URL: z.string().url(),
  LLM_API_KEY: z.string().min(8),
  LLM_MODEL: z.string().min(1),
});

export function loadLlmEnv(source: NodeJS.ProcessEnv) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("LLM env invalid");
  }
  return parsed.data;
}
`,
          "Валидация env"
        ),
        callout(
          "Не логируйте env",
          "Даже JSON.stringify(process.env) в отладке может утащить ключ в файл логов или в чат поддержки.",
          "security"
        ),
        compare(
          "Конфиг",
          "const MODEL = 'gpt-4o'; размазан по десяти файлам.",
          "Один конфиг: baseURL, model, timeoutMs, maxRetries, maxOutputTokens. Тесты подменяют source."
        ),
      ]
    ),
    lesson(
      "environment-llm-api-l3",
      "Messages, streaming, retries",
      20,
      [
        "Собрать messages как контракт",
        "Прочитать streaming без потери ошибки",
        "Повторить запрос только когда это безопасно",
      ],
      [
        p(
          "Сообщение модели это не «текст в чат». Это массив ролей. System держит правила. User держит задачу и данные. Assistant держит прошлый ответ. Tool держит результат инструмента, когда дойдёте до недели 11."
        ),
        code(
          "ts",
          `type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function complete(args: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  timeoutMs: number;
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);
  try {
    const response = await fetch(\`\${args.baseUrl}/chat/completions\`, {
      method: "POST",
      headers: {
        authorization: \`Bearer \${args.apiKey}\`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = new Error(\`llm_http_\${response.status}\`);
      throw err;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
`,
          "Минимальный клиент"
        ),
        h("Streaming"),
        p(
          "Поток удобен человеку. Для сервера это куски, которые надо склеить, не потеряв финальный usage. Если вы пишете JSON-схему, стрим усложняет валидацию: вы не можете проверить объект, пока он не дописан. Для CLI стрим уместен. Для structured extraction часто проще дождаться полного ответа."
        ),
        h("Retries"),
        ul([
          "Повторяйте 429 и 5xx с backoff и jitter.",
          "Не повторяйте 400 и 401: вы чините запрос или ключ, а не сеть.",
          "Если запрос имел побочный эффект, нужен idempotency key. Чистый complete обычно безопасен, tool «создать платёж» нет.",
        ]),
        callout(
          "Стоимость ретраев",
          "Каждый повтор это новые токены. Лимит попыток это и защита кассы, и защита от бесконечного цикла.",
          "cost"
        ),
      ]
    ),
    lesson(
      "environment-llm-api-l4",
      "Tokens, latency, cost",
      16,
      [
        "Оценить стоимость до вызова",
        "Прочитать usage из ответа",
        "Связать latency с UX",
      ],
      [
        p(
          "Токен это кусок текста по правилам tokenizer модели, не слово и не символ. «Привет» может быть одним токеном, UUID четырьмя. Поэтому длина строки в JS врёт, если вы оцениваете бюджет."
        ),
        p(
          "Провайдер обычно возвращает usage.prompt_tokens и usage.completion_tokens. Это источник истины после вызова. До вызова вы оцениваете грубо: символы / 4 для английского, для русского чаще символы / 2.5. Это оценка, не счётчик."
        ),
        code(
          "ts",
          `export function estimateCostUsd(input: {
  promptTokens: number;
  completionTokens: number;
  inputPerMTok: number;
  outputPerMTok: number;
}) {
  return (
    (input.promptTokens / 1_000_000) * input.inputPerMTok +
    (input.completionTokens / 1_000_000) * input.outputPerMTok
  );
}
`,
          "Грубая стоимость"
        ),
        ul([
          "Latency TTFT (time to first token) важна для чата.",
          "Total latency важна для batch и автоматизации.",
          "Длинный контекст бьёт и по деньгам, и по задержке.",
        ]),
        callout(
          "Можно ли дешевле?",
          "Перед большой моделью спросите: хватит ли классификатора, regex, маленькой модели, кэша одинаковых промптов.",
          "cost"
        ),
        check(
          "Почему кэш промпта экономит деньги?",
          "Системная инструкция и схема не меняются между вызовами. Если провайдер умеет prefix cache, вы платите меньше за одинаковый префикс. Даже без кэша провайдера вы можете не слать роман в каждом запросе."
        ),
      ]
    ),
    lesson(
      "environment-llm-api-l5",
      "Ошибки, наблюдаемость, что нельзя писать в лог",
      14,
      [
        "Классифицировать ошибки провайдера",
        "Собрать безопасный лог",
        "Не потерять вход пользователя при сбое",
      ],
      [
        p(
          "Пользовательский ввод нельзя терять из-за 502 провайдера. Сохраните черновик у себя, покажите «провайдер не ответил», дайте повторить. Не показывайте stack trace и тело ключа."
        ),
        ul([
          "401/403: ключ, права, орг. Чинится человеком, не ретраем.",
          "400: ваша схема, слишком длинный контекст, неверная роль.",
          "429: rate limit, backoff, очередь.",
          "5xx/сеть: backoff, fallback модель, деградация.",
        ]),
        code(
          "ts",
          `export function publicLlmError(status: number) {
  if (status === 401 || status === 403) return "auth";
  if (status === 400) return "bad_request";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_down";
  return "unknown";
}
`,
          "Карта для UI"
        ),
        callout(
          "Structured log",
          "Пишите JSON: requestId, model, latencyMs, promptTokens, completionTokens, errorCode. Не пишите apiKey, cookie, пароль, полный PII, если это не нужно расследованию и не усечено.",
          "security"
        ),
      ]
    ),
  ],
  lab: lab({
    id: "environment-llm-api-lab",
    title: "CLI-клиент с usage",
    goal: "Сделать TypeScript CLI, который читает prompt, вызывает модель, печатает текст и usage.",
    setup: [
      "Node 20+ и tsx или ts-node.",
      "Файл .env с LLM_BASE_URL, LLM_API_KEY, LLM_MODEL.",
      "Ключ с маленьким лимитом, не прод-ключ компании.",
    ],
    steps: [
      {
        title: "Каркас",
        body: "Создайте пакет llm-client. package.json, tsconfig strict, src/env.ts, src/client.ts, src/cli.ts.",
        expected: "npx tsx src/cli.ts --help печатает usage.",
      },
      {
        title: "Запрос",
        body: "cli читает stdin или --prompt. Один system: «отвечай кратко». User = prompt. timeout 30s.",
        expected: "На «ping» приходит короткий ответ, не пустой.",
      },
      {
        title: "Usage",
        body: "После ответа напечатайте prompt_tokens, completion_tokens и оценку стоимости. Если usage нет, напишите unknown, не выдумывайте.",
        expected: "В конце три понятных числа или unknown.",
      },
      {
        title: "Ошибка",
        body: "Отзовите ключ и проверьте, что процесс завершается кодом 1 и без ключа в stderr.",
        expected: "stderr без sk- и без dump env.",
      },
    ],
    troubleshooting: [
      {
        problem: "401",
        fix: "Ключ, пробел в .env, не тот base URL.",
      },
      {
        problem: "fetch failed",
        fix: "Сеть, прокси, неверный URL, IPv6. Проверьте curl тем же URL.",
      },
    ],
    reflection: [
      "Где в коде граница «ваши данные / чужой API»?",
      "Что вы залогируете в проде, а что нет?",
    ],
  }),
  practice: exercise({
    id: "environment-llm-api-practice",
    title: "HTTP complete с контрактом ошибок",
    time: "2-3 часа",
    context:
      "Коллега должен вызвать ваш сервис, а не провайдера напрямую. Сделайте маленький HTTP API.",
    requirements: [
      "POST /complete { prompt: string }",
      "Валидация: prompt 1..4000 символов",
      "Timeout и маппинг ошибок в JSON { error: string }",
      "Заголовок x-request-id",
      "README с примером curl и таблицей стоимости одного запроса",
    ],
    constraints: [
      "Без UI.",
      "Ключ только на сервере.",
      "Не больше 3 зависимостей кроме runtime.",
    ],
    acceptance: [
      "Пустой prompt даёт 400.",
      "Неверный ключ даёт 502/401 вашего контракта, не сырой dump провайдера.",
      "Успех возвращает { text, usage }.",
    ],
    tests: [
      "Интеграционный тест на 400 без сети к провайдеру (мокайте fetch).",
      "Тест, что логгер не получает apiKey.",
    ],
    hints: [
      {
        title: "Подсказка 1",
        text: "Сначала напишите тип ответа и ошибки, потом fetch.",
      },
      {
        title: "Подсказка 2",
        text: "Мок fetch в тесте: не бейте в реальный API в CI.",
      },
      {
        title: "Подсказка 3",
        text: "request id: crypto.randomUUID(), прокиньте в лог и в заголовок.",
      },
    ],
    solution:
      "Сервер на стандартном node http или Next route. Zod для body. complete() из лабы. На ошибке fetch не пробрасывайте response.text провайдера клиенту. Тесты с mock fetch проверяют 400 и отсутствие ключа в массиве логов.",
  }),
  prompts: [
    promptT({
      id: "environment-llm-api-p1",
      title: "Ревью клиента",
      purpose: "Проверить свой LLM-клиент чужим взглядом",
      when: "После лабы, перед практикой",
      placeholders: ["{{repo_tree}}", "{{client_ts}}"],
      text: `Ты ревьюер бэкенда. Оцени LLM-клиент.

Критерии: секреты, timeout, retries, обработка 429, логи, типизация, тестопригодность.

Репозиторий:
{{repo_tree}}

Файл клиента:
{{client_ts}}

Формат: список дефектов по убыванию риска. Не предлагай фреймворк, если хватает fetch.`,
      explanation: "Заставляет модель искать дыры, а не переписывать стиль.",
      limitations: "Модель не видит реальные логи и сеть. Финальную проверку ключей делаете вы.",
    }),
    promptT({
      id: "environment-llm-api-p2",
      title: "Оценка стоимости сценария",
      purpose: "Прикинуть кассу до продакшена",
      when: "Когда появляется идея фичи с LLM",
      placeholders: ["{{feature}}", "{{calls_per_day}}", "{{prompt_tokens}}", "{{completion_tokens}}", "{{price}}"],
      text: `Оцени месячную стоимость LLM для фичи.

Фича: {{feature}}
Вызовов в день: {{calls_per_day}}
Средний prompt tokens: {{prompt_tokens}}
Средний completion tokens: {{completion_tokens}}
Цена: {{price}}

Покажи формулу, месяц, что будет если трафик x10, и один способ срезать стоимость без потери смысла.`,
      explanation: "Привычка считать деньги до архитектуры агента.",
      limitations: "Цены меняются. Сверяйте с прайсом провайдера.",
    }),
  ],
  quiz: quiz("environment-llm-api-quiz", [
    q(
      "w1-q1",
      "conceptual",
      "Где должен жить API-ключ LLM в веб-приложении?",
      [
        "В NEXT_PUBLIC_ переменной, чтобы удобно отлаживать",
        "Только на сервере, в env, без попадания в бандл",
        "В localStorage пользователя",
        "В комментарии README для команды",
      ],
      1,
      "Ключ со счёта компании нельзя отдавать браузеру."
    ),
    q(
      "w1-q2",
      "debugging",
      "Клиент ловит HTTP 429. Что делать первым?",
      [
        "Сразу повторить 50 раз в цикле",
        "Backoff с jitter и уважать Retry-After, если он есть",
        "Сменить модель на более дорогую",
        "Проглотить ошибку и вернуть пустую строку",
      ],
      1,
      "429 это лимит. Молотить его дороже и хуже."
    ),
    q(
      "w1-q3",
      "architecture",
      "Почему браузер не должен ходить к провайдеру напрямую?",
      [
        "Провайдеры блокируют CORS всегда",
        "Нельзя учесть пользователя, бюджет, аудит и секреты в одном месте",
        "fetch в браузере не умеет JSON",
        "Модели отвечают только серверам",
      ],
      1,
      "Ваш слой это контроль, не каприз."
    ),
    q(
      "w1-q4",
      "scenario",
      "Провайдер вернул 502. Черновик пользователя пропал. Что сломано в продукте?",
      [
        "Tokenizer",
        "Сохранение входа до внешнего вызова и деградация UI",
        "Цвет кнопки",
        "Отсутствие агента",
      ],
      1,
      "Внешний сбой не имеет права уничтожать работу человека."
    ),
    q(
      "w1-q5",
      "conceptual",
      "Что из этого безопаснее писать в лог?",
      [
        "Полный Authorization header",
        "model, latencyMs, promptTokens, requestId",
        "process.env целиком",
        "Пароль пользователя «на всякий случай»",
      ],
      1,
      "Метаданные вызова полезны. Секреты нет."
    ),
  ]),
  artifact: artifact({
    result: "Репозиторий с CLI и/или HTTP LLM-клиентом на TypeScript.",
    repository: "Публичный или приватный Git URL.",
    demo: "Запись терминала или curl пример в README.",
    readme: [
      "Как задать env",
      "Как запустить CLI",
      "Таблица: модель, токены, оценка стоимости",
      "Что не логируется",
    ],
    architecture: [
      "env → client → provider",
      "ошибки сведены к короткому контракту",
    ],
    tests: ["валидация пустого prompt", "мок ошибки провайдера"],
    checklist: [
      { id: "environment-llm-api-a1", text: "Секреты не в Git" },
      { id: "environment-llm-api-a2", text: "Timeout и обработка ошибок есть" },
      { id: "environment-llm-api-a3", text: "Usage печатается или unknown" },
      { id: "environment-llm-api-a4", text: "README с запуском и стоимостью" },
      { id: "environment-llm-api-a5", text: "Ссылка на репозиторий сохранена в артефакте недели" },
    ],
  }),
  recall: [],
  decisionCards: [
    decision({
      id: "environment-llm-api-d1",
      title: "Прямой вызов провайдера или свой API",
      optionA: "Браузер → провайдер",
      optionB: "Браузер → ваш сервер → провайдер",
      useA: ["локальный скрипт у вас на машине", "одноразовый эксперимент без ключа в репо"],
      useB: ["любой продукт", "несколько пользователей", "нужен бюджет и аудит"],
      tradeoffs: "Свой слой это больше кода. Прямой вызов это почти всегда утечка ключа.",
      mistake: "Демо на Vercel с ключом в клиенте «на час». Час превращается в прод.",
    }),
  ],
});
