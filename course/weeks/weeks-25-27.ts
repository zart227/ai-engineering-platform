import { compactWeek, type CompactWeek } from "./compact";

const rest: CompactWeek[] = [
  {
    id: 25, slug: "evals", moduleId: "m13", title: "Evaluation pipelines", short: "Evals", track: "engineering", hours: 12,
    goal: "Автоматический eval pipeline с порогом регресса.",
    technologies: ["golden dataset", "CI", "metrics"],
    why: "Без цифр вы крутите промпты вечно. Eval это тест для вероятностного кода.",
    prerequisites: ["prompt eval", "RAG eval", "agent"], productionUse: ["любой прод LLM"], previousKnowledge: ["win-rate", "hit-rate"],
    lessons: [
      { title: "Датасеты", minutes: 16, objectives: ["golden, leakage, split"], paragraphs: ["Golden: вход, ожидаемое, рубрика. Split: train/prompt-tuning vs held-out. Утечка: подгонка промпта по held-out. Версионируйте датасет в git, не в чате."] },
      { title: "Типы оценки", minutes: 16, objectives: ["deterministic, model-based, human"], paragraphs: ["Детерминированные: JSON schema, tool name, exact id. Model-based дешевле человека и врёт: используйте как сигнал, не как судью денег. Human на спорных и safety."] },
      { title: "Метрики и CI", minutes: 16, objectives: ["что мерить"], paragraphs: ["task success, tool accuracy, retrieval hit-rate, hallucination rate (proxy), safety flags, latency, cost. Pipeline падает, если held-out ниже порога. Не сравнивайте разные модели без одной и той же выборки."] },
    ],
    lab: { title: "Pipeline", goal: "Скрипт eval, exit 1 при провале.", setup: ["30 кейсов хотя бы на одну систему курса"], steps: [{ title: "Run", body: "Метрики в JSON.", expected: "Файл report." }, { title: "Gate", body: "Порог accuracy.", expected: "Намеренно ломаете промпт, CI красный." }], reflection: ["Какая метрика у вас proxy, а не истина?"] },
    practice: { title: "Eval в CI", time: "3 часа", context: "GitHub Actions или локальный script в README как обязательный шаг.", requirements: ["held-out", "порог", "cost в отчёте", "без секретов в логах CI"], constraints: ["Моки сети если нет ключа в CI"], acceptance: ["деградация ломает pipeline"], tests: ["fixture fail"], hints: [{ title: "Подсказка 1", text: "Детерминированные проверки в CI без ключа, LLM-проверки опционально." }, { title: "Подсказка 2", text: "Фиксируйте model id." }, { title: "Подсказка 3", text: "Не гоняйте 10k кейсов на каждый комит." }], solution: "eval.ts + report.schema + ci job." },
    prompt: { title: "Сгенерировать граничные кейсы", purpose: "Расширить golden", when: "Набор слишком «удобный»", placeholders: ["{{task}}"], text: `Предложи 10 граничных входов для задачи {{task}}: пустые, враждебные, двуязычные, слишком длинные. Для каждого ожидаемое поведение системы, не «модель ответит как-нибудь».`, explanation: "Граничные важнее средних.", limitations: "Потом человек правит ожидания." },
    quiz: [
      { prompt: "Held-out нужен чтобы:", options: ["Увеличить CSV", "Не соврать себе про качество", "Заменить прод", "Ускорить Docker"], answer: 1, kind: "conceptual", explanation: "Утечка." },
      { prompt: "Единственная метрика «красота текста»:", options: ["Достаточно", "Не ловит tool/retrieval/safety", "Лучше latency", "Заменяет cost"], answer: 1, kind: "architecture", explanation: "Несколько метрик." },
      { prompt: "CI без ключа LLM:", options: ["Невозможен eval", "Часть проверок детерминированная обязательна", "Надо захардкодить ключ", "Надо отключить тесты"], answer: 1, kind: "scenario", explanation: "Секреты." },
      { prompt: "Hallucination rate как proxy:", options: ["Юридическая истина", "Полезная оценка, не суд", "Бесполезна всегда", "Равна cosine"], answer: 1, kind: "debugging", explanation: "Честно называть proxy." },
    ],
    artifactResult: "Automatic evaluation pipeline с порогом регресса.",
    checklist: ["golden versioned", "gate", "cost in report", "CI или скрипт-ворота"],
    recall: [{ fromWeek: "prompt-engineering", question: "Почему 10 кейсов лучше вайба?", answer: "Число можно регрессировать." }],
  },
  {
    id: 26, slug: "observability", moduleId: "m14", title: "Наблюдаемость агентов", short: "Observability", track: "engineering", hours: 10,
    goal: "Ответить «почему агент так решил» по trace, не по воспоминанию.",
    technologies: ["trace", "span", "structured logs"],
    why: "Без trace вы спорите с моделью. С trace вы видите tool, токены, ошибку.",
    prerequisites: ["agent loop", "evals"], productionUse: ["инциденты", "оптимизация кассы"], previousKnowledge: ["structured log недели 1", "audit HITL"],
    lessons: [
      { title: "Trace anatomy", minutes: 16, objectives: ["trace, span, generation, tool, handoff"], paragraphs: ["Trace на пользовательский запрос. Span на шаг. Generation: модель, промпт version, usage. Tool span: имя, latency, ok. Храните id чанков retrieval. Не храните сырой ключ и полный PII, если политика запрещает."] },
      { title: "Debug по трейсу", minutes: 16, objectives: ["Разбор падения"], paragraphs: ["Смотрите последний tool error, обрезку контекста, превышение бюджета, неверный route. Дашборд трёх чисел: success, cost, latency. Остальное углубление."] },
      { title: "Что нельзя логировать", minutes: 12, objectives: ["Redaction"], paragraphs: ["Пароли, cookie, API keys, полные платёжные данные. Хешируйте session id если нужен correlation. Готовьте место под OpenTelemetry, но не тащите vendor lock в учебный MVP платформы курса."] },
    ],
    lab: { title: "Падение по trace", goal: "Сломанный прогон чинится без повторного гадания.", setup: ["JSON trace файла"], steps: [{ title: "Read", body: "Найдите причину по файлу.", expected: "Одна фраза причины." }, { title: "Fix", body: "Патч runtime или промпта.", expected: "Новый trace без этой ошибки." }], reflection: ["Чего не хватало в трейсе?"] },
    practice: { title: "Tracing middleware", time: "3 часа", context: "Обёртка complete() и executeTool().", requirements: ["requestId", "spans JSON", "redaction", "три метрики"], constraints: ["Не логировать env"], acceptance: ["тест redaction"], tests: ["secret stripped"], hints: [{ title: "Подсказка 1", text: "Один класс Tracer." }, { title: "Подсказка 2", text: "Время вокруг await." }, { title: "Подсказка 3", text: "Ошибки в span.ok=false." }], solution: "tracer.ts + tests." },
    prompt: { title: "Объяснить trace", purpose: "Помощь в инциденте", when: "Есть JSON spans", placeholders: ["{{trace}}"], text: `По трейсу: гипотеза причины, какой span виноват, что проверить в коде, не переписывай всю систему.\n{{trace}}`, explanation: "Модель как помощник SR.", limitations: "Без кода может соврать. Откройте файл." },
    quiz: [
      { prompt: "Зачем requestId?", options: ["Красота", "Склеить логи и spans запроса", "Ускорить GPU", "Заменить auth"], answer: 1, kind: "conceptual", explanation: "Корреляция." },
      { prompt: "Полный Authorization в span:", options: ["Must", "Redact, это секрет", "Нужно для cosine", "Требование JSON-RPC"], answer: 1, kind: "security" as "debugging", explanation: "Секреты." },
      { prompt: "Success/cost/latency:", options: ["Бесполезны", "Три числа оператора", "Заменяют evals", "Заменяют HITL"], answer: 1, kind: "architecture", explanation: "Дашборд." },
      { prompt: "Почему агент выбрал tool видно в:", options: ["CSS", "generation+tool spans и ваши messages", "Только в Figma", "В DNS TTL"], answer: 1, kind: "scenario", explanation: "Trace." },
    ],
    artifactResult: "Tracing middleware и разбор инцидента по trace.",
    checklist: ["spans", "redaction test", "три метрики", "разбор падения"],
    recall: [{ fromWeek: "environment-llm-api", question: "Какие поля usage в лог?", answer: "tokens, latency, model, requestId. Не ключ." }],
  },
  {
    id: 27, slug: "event-driven-automation", moduleId: "m15", title: "Event-driven automation", short: "Events & queues", track: "automation", hours: 12,
    goal: "Очередь, worker, retry, backoff, idempotency, DLQ.",
    technologies: ["queue", "workers", "Postgres как очередь на старте"],
    why: "Webhook должен отвечать быстро. Тяжёлый LLM уходит в воркер. Иначе дубли и таймауты.",
    prerequisites: ["webhooks", "идемпотентность"], productionUse: ["письма", "ingest RAG", "уведомления"], previousKnowledge: ["429 backoff"],
    lessons: [
      { title: "Событие vs запрос", minutes: 16, objectives: ["async граница"], paragraphs: ["Запрос ждёт ответ. Событие случилось: at-least-once почти всегда. Значит идемпотентный обработчик обязателен. На старте таблица jobs в Postgres достаточна. Redis/очередь-продукт когда Postgres упрётся."] },
      { title: "Retry, DLQ, backoff", minutes: 16, objectives: ["не молотить"], paragraphs: ["Экспонента с jitter. После N: DLQ, человек. Не ретраить 4xx бизнес-ошибок. Poison message не должен блокировать очередь навсегда: timeout visibility."] },
      { title: "Scheduled jobs", minutes: 12, objectives: ["cron + lock"], paragraphs: ["Расписание создаёт события с ключом даты. Две реплики не делают два начисления: unique job key."] },
    ],
    lab: { title: "Producer-worker", goal: "Повтор события не дублирует side effect.", setup: ["таблица jobs"], steps: [{ title: "Enqueue", body: "POST кладёт job.", expected: "200 быстро." }, { title: "Worker", body: "Обрабатывает, retry, DLQ на 3-й fail.", expected: "Демо fail → dlq." }], reflection: ["Что если воркер умер после side effect до ack?"] },
    practice: { title: "Идемпотентный обработчик", time: "3 часа", context: "Ключ event id уникален.", requirements: ["unique", "retry policy", "DLQ", "тест двойной доставки"], constraints: ["Можно без Redis, Postgres jobs ок"], acceptance: ["двойная доставка = одна обработка эффекта"], tests: ["duplicate event"], hints: [{ title: "Подсказка 1", text: "INSERT job ON CONFLICT." }, { title: "Подсказка 2", text: "Статусы queued|active|done|dlq." }, { title: "Подсказка 3", text: "lease_until для воркера." }], solution: "jobs table + worker loop." },
    prompt: { title: "Разобрать at-least-once", purpose: "Дизайн обработчика", when: "Новая интеграция", placeholders: ["{{event}}"], text: `Для события {{event}} опиши ключ идемпотентности, side effects, что делать при повторе, что в DLQ.`, explanation: "Сначала ключ, потом код.", limitations: "Не знает ваш SQL." },
    quiz: [
      { prompt: "At-least-once значит:", options: ["Ровно раз всегда", "Повтор возможен, код должен быть идемпотентным", "Никогда не повторится", "Только HTTP/3"], answer: 1, kind: "conceptual", explanation: "Доставка." },
      { prompt: "LLM в запросе webhook 10s timeout вендора:", options: ["Идеально", "Вынести в worker", "Увеличить JSON", "Выключить HMAC"], answer: 1, kind: "architecture", explanation: "Быстрый ack." },
      { prompt: "DLQ это:", options: ["Удалить данные", "Изолировать ядовитые сообщения", "Кэш CSS", "Vector index"], answer: 1, kind: "debugging", explanation: "Операции." },
      { prompt: "Очередь vs прямой вызов:", options: ["Всегда очередь", "Зависит от latency UX и тяжести работы", "Всегда sync", "Только агенты"], answer: 1, kind: "architecture", explanation: "Decision." },
    ],
    artifactResult: "Jobs/worker с идемпотентностью и DLQ.",
    checklist: ["enqueue", "worker", "duplicate test", "DLQ"],
    decisionCard: { title: "Sync vs async / queue vs direct", optionA: "Прямой запрос", optionB: "Очередь", useA: ["нужен ответ сейчас", "лёгкая работа"], useB: ["тяжёлый LLM", "пики", "внешние ретраи"], tradeoffs: "Очередь сложнее в отладке, устойчивее.", mistake: "Держать вендора webhook 2 минуты пока думает GPT." },
    recall: [{ fromWeek: "apis-webhooks", question: "Почему HMAC до бизнеса?", answer: "Не доверять телу." }],
  },
];

export const weeks25to27 = rest.map(compactWeek);
