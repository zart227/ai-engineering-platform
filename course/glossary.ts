import type { GlossaryTerm } from "./types";

export const glossary: GlossaryTerm[] = [
  { id: "llm", term: "LLM", definition: "Большая языковая модель: вероятностный генератор токенов по контексту. Не база знаний и не исполнитель сама по себе.", weekSlug: "how-llms-work", related: ["token", "inference"] },
  { id: "token", term: "Token", definition: "Единица текста для модели и тарифа. Не равно слову. Usage считается в токенах.", weekSlug: "environment-llm-api", related: ["context-window"] },
  { id: "context-window", term: "Context window", definition: "Максимальный объём токенов, который модель видит за один вызов. Всё остальное для неё не существует.", weekSlug: "how-llms-work", related: ["context-engineering"] },
  { id: "context-engineering", term: "Context engineering", definition: "Сборка и усечение контекста по приоритету и бюджету, а не «закинуть всё».", weekSlug: "context-structured-output", related: ["context-pollution"] },
  { id: "context-pollution", term: "Context pollution", definition: "В окне лежит противоречивое, устаревшее или враждебное, и модель это смешивает.", weekSlug: "context-structured-output", related: ["prompt-injection"] },
  { id: "structured-output", term: "Structured output", definition: "Ответ модели, который проходит вашу схему (JSON Schema, Zod). Без схемы это проза.", weekSlug: "context-structured-output", related: ["zod"] },
  { id: "zod", term: "Zod", definition: "Библиотека схем TypeScript. На границе LLM это ворота, не украшение.", weekSlug: "context-structured-output", related: ["structured-output"] },
  { id: "prompt-injection", term: "Prompt injection", definition: "Вход заставляет модель нарушить ваши правила. Бывает прямой и косвенный (документ, RAG).", weekSlug: "ai-security", related: ["untrusted-input"] },
  { id: "untrusted-input", term: "Untrusted input", definition: "Любой текст не из вашего git: пользователь, PDF, веб, retrieved чанк.", weekSlug: "prompt-engineering", related: ["prompt-injection"] },
  { id: "tool-calling", term: "Tool calling", definition: "Модель предлагает имя и аргументы функции. Исполняет ваш код после валидации.", weekSlug: "tool-calling", related: ["agent-loop"] },
  { id: "agent-loop", term: "Agent loop", definition: "Цикл цель → модель → tool → observation → состояние → следующий шаг до стопа.", weekSlug: "agent-loop", related: ["workflow", "working-memory"] },
  { id: "working-memory", term: "Working memory", definition: "Состояние текущего цикла: цель и наблюдения. Живёт в процессе, пока вы не скопировали его в журнал.", weekSlug: "agent-memory", related: ["agent-loop", "episodic-memory"] },
  { id: "episodic-memory", term: "Episodic memory", definition: "Журнал событий сессии со временем. Хранит деталь, которую сжатие может выкинуть.", weekSlug: "agent-memory", related: ["semantic-memory"] },
  { id: "semantic-memory", term: "Semantic memory", definition: "Короткий факт с типом, пользователем и сроком. В контекст попадает после фильтра, не весь архив.", weekSlug: "agent-memory", related: ["episodic-memory", "rag"] },
  { id: "workflow", term: "Workflow", definition: "Заранее описанный граф шагов. Может содержать LLM-шаг, но ветки ваши.", weekSlug: "automation-fundamentals", related: ["agent-loop", "n8n"] },
  { id: "dag", term: "DAG", definition: "Направленный граф без цикла. Узел стартует, когда все dependsOn уже сделаны. Цикл в таком графе это ошибка плана, план не запускают.", weekSlug: "planning", related: ["workflow", "agent-loop"] },
  { id: "n8n", term: "n8n", definition: "Движок workflow: граф узлов, отдельный execution, credentials отдельно от экспорта. Error workflow начинается с Error Trigger.", weekSlug: "n8n", related: ["workflow", "webhook"] },
  { id: "script", term: "Script", definition: "Одноразовый или по cron прогон без графа состояний GUI.", weekSlug: "automation-fundamentals", related: ["workflow"] },
  { id: "idempotency", term: "Idempotency", definition: "Повтор того же события не создаёт второй side effect.", weekSlug: "automation-fundamentals", related: ["webhook"] },
  { id: "webhook", term: "Webhook", definition: "Чужой сервер вызывает ваш URL. Нужны подпись, быстрый ack, идемпотентность.", weekSlug: "apis-webhooks", related: ["hmac"] },
  { id: "hmac", term: "HMAC", definition: "Подпись тела секретом. Проверяется до бизнес-логики, через timing-safe compare.", weekSlug: "apis-webhooks", related: ["webhook"] },
  { id: "embedding", term: "Embedding", definition: "Вектор текста в пространстве модели эмбеддингов. Близость ≈ семантическая похожесть для этой модели.", weekSlug: "embeddings", related: ["cosine"] },
  { id: "cosine", term: "Cosine similarity", definition: "Мера направления двух векторов. 1 сонаправлены, 0 ортогональны (для неотрицательных эмбеддингов иначе).", weekSlug: "embeddings", related: ["embedding"] },
  { id: "rag", term: "RAG", definition: "Retrieval-Augmented Generation: найти чанки, положить в контекст, ответить с цитатами или отказаться.", weekSlug: "rag", related: ["citation", "abstain"] },
  { id: "citation", term: "Citation", definition: "Ссылка на id чанка или URL, который реально был во входе retrieval. Иначе галлюцинация.", weekSlug: "rag", related: ["rag"] },
  { id: "abstain", term: "Abstain", definition: "Отказ отвечать, когда нет опоры. Лучше, чем правдоподобная ложь.", weekSlug: "rag", related: ["hallucination"] },
  { id: "hallucination", term: "Hallucination", definition: "Правдоподобное продолжение без факта. Свойство декодера, не «баг характера».", weekSlug: "how-llms-work", related: ["abstain"] },
  { id: "pgvector", term: "pgvector", definition: "Расширение PostgreSQL: тип vector(n) и расстояния. <=> это косинусное расстояние, меньшее ближе.", weekSlug: "pgvector", related: ["embedding", "hnsw"] },
  { id: "hnsw", term: "HNSW", definition: "Приближённый графовый индекс. Быстрее точного перебора и может пропустить истинного соседа.", weekSlug: "pgvector", related: ["pgvector"] },
  { id: "hit-rate", term: "Hit-rate@k", definition: "Доля вопросов, у которых нужный чанк попал в первые k. Метрика выборки, не текста ответа.", weekSlug: "advanced-rag", related: ["golden-set", "rag"] },
  { id: "mcp", term: "MCP", definition: "Протокол JSON-RPC между host и server: tools, resources, prompts. Ревизия 2026-07-28 без initialize, с server/discover.", weekSlug: "mcp", related: ["tool-calling"] },
  { id: "agent-sdk", term: "Agent SDK", definition: "Чужой раннер цикла: инструменты, лимит шагов, иногда сессии и trace. Лимит из документации по умолчанию сверяют со своим потолком.", weekSlug: "agent-frameworks", related: ["agent-loop"] },
  { id: "handoff", term: "Handoff", definition: "Следующий ход ведёт другой агент. Ему передают узкий пакет, не весь черновик и не секреты.", weekSlug: "multi-agent-fundamentals", related: ["agent-loop"] },
  { id: "hitl", term: "Human-in-the-loop", definition: "Опасное действие ждёт человека. Проверка в runtime, не только в промпте.", weekSlug: "human-in-the-loop", related: ["audit-log"] },
  { id: "audit-log", term: "Audit log", definition: "Кто что предложил и кто одобрил, с временем, без секретов в открытую.", weekSlug: "human-in-the-loop", related: ["hitl"] },
  { id: "eval", term: "Eval", definition: "Прогон фиксированного набора с метриками и порогом регресса. Тест для вероятностного кода.", weekSlug: "evals", related: ["golden-set"] },
  { id: "golden-set", term: "Golden set", definition: "Версионированные пары вход → ожидание. Часть held-out не трогают при подгонке.", weekSlug: "evals", related: ["eval"] },
  { id: "trace", term: "Trace", definition: "Дерево spans одного запроса: generation, tool, handoff, ошибки, usage.", weekSlug: "observability", related: ["span"] },
  { id: "span", term: "Span", definition: "Отрезок работы внутри trace с временем и атрибутами.", weekSlug: "observability", related: ["trace"] },
  { id: "dlq", term: "Dead-letter queue", definition: "Место для сообщений, которые исчерпали retry. Их смотрит человек.", weekSlug: "event-driven-automation", related: ["idempotency"] },
  { id: "guardrail", term: "Guardrail", definition: "Слой ограничения: вход, policy tools, выход, sandbox. Один промпт не guardrail.", weekSlug: "ai-security", related: ["prompt-injection"] },
  { id: "least-privilege", term: "Least privilege", definition: "Модель и tools получают минимум прав. ADMIN модели не выдаём.", weekSlug: "tool-calling", related: ["hitl"] },
  { id: "spec-driven", term: "Specification-driven development", definition: "Сначала контракт поведения и тесты, потом патч агента.", weekSlug: "professional-ai-coding", related: ["agents-md"] },
  { id: "agents-md", term: "AGENTS.md", definition: "Файл инструкций репозитория для coding agents. Короткий, в git, с командами и запретами. Продукты читают его по-разному и обрезают длинный текст.", weekSlug: "professional-ai-coding", related: ["spec-driven"] },
  { id: "inference", term: "Inference", definition: "Прогон уже обученной модели. В курсе вы почти всегда здесь, не в обучении весов.", weekSlug: "how-llms-work", related: ["llm"] },
  { id: "checkpoint", term: "Checkpoint", definition: "Сделанные узлы плана, которые при срыве не исполняют заново. Хвост пересобирают отдельно.", weekSlug: "planning", related: ["workflow"] },
  { id: "held-out", term: "Held-out", definition: "Часть набора оценки, которую не используют, чтобы подгонять промпт. По ней считают порог.", weekSlug: "evals", related: ["golden-set"] },
  { id: "runbook", term: "Runbook", definition: "Страница дежурства: секреты, копия данных, лимит, что сказать человеку при 429 и как откатить выкладку.", weekSlug: "production-ai", related: ["trace"] },
  { id: "agent-budget", term: "Agent budget", definition: "Потолок цикла: maxSteps и по желанию maxTokens, maxCost, timeoutMs, toolBudget. Останавливает первое заданное поле.", weekSlug: "agent-loop", related: ["agent-loop"] },
  { id: "recall-at-k", term: "Recall@K", definition: "Доля вопросов, где ожидаемый id есть в top-k. Это поиск, не правильность ответа.", weekSlug: "advanced-rag", related: ["hit-rate", "rag"] },
  { id: "tool-shadowing", term: "Tool shadowing", definition: "Чужой сервер объявил то же имя инструмента. Host вызывает сервер из своего списка.", weekSlug: "mcp", related: ["mcp", "tool-calling"] },
  { id: "at-most-once", term: "At-most-once", definition: "Доставка без повтора. Если процесс умер до записи, событие потеряно.", weekSlug: "event-driven-automation", related: ["idempotency", "dlq"] },
  { id: "at-least-once", term: "At-least-once", definition: "Брокер может доставить событие снова. Повтор безопасен только с ключом идемпотентности.", weekSlug: "event-driven-automation", related: ["idempotency", "exactly-once"] },
  { id: "exactly-once", term: "Exactly-once", definition: "Иллюзия одной доставки от брокера. Её приближают at-least-once и сохранённый ключ.", weekSlug: "event-driven-automation", related: ["idempotency", "at-least-once"] },
  { id: "pii", term: "PII", definition: "Данные, по которым узнают человека: почта, имя, телефон. В лог и портфолио их не кладут.", weekSlug: "ai-security", related: ["audit-log"] },
  { id: "percentile", term: "Percentile", definition: "p50, p95 и p99 по своим замерам задержки. Среднее прячет хвост.", weekSlug: "observability", related: ["trace"] },
  { id: "llama-cpp", term: "llama.cpp", definition: "Движок инференса: читает GGUF и считает токены на CPU или на GPU-бэкенде. Это не демон и не каталог моделей.", weekSlug: "how-llms-work", related: ["gguf", "ollama", "inference"] },
  { id: "ollama", term: "Ollama", definition: "Демон, библиотека моделей и локальный HTTP. Считает ответ движок вроде llama.cpp, не сам каталог.", weekSlug: "how-llms-work", related: ["llama-cpp", "gguf", "inference"] },
  { id: "gguf", term: "GGUF", definition: "Один файл квантованных весов, который llama.cpp отображает в RAM или VRAM. Ollama читает тот же файл.", weekSlug: "how-llms-work", related: ["llama-cpp", "ollama", "quantization"] },
  { id: "quantization", term: "Quantization", definition: "Меньшая точность чисел в весах. Модель занимает меньше RAM и VRAM и иначе ошибается.", weekSlug: "how-llms-work", related: ["gguf"] },
  { id: "sft", term: "SFT", definition: "Supervised fine-tuning: пары инструкция и ответ. Имеет смысл после устойчивого разрыва held-out, который контекст не закрыл.", weekSlug: "evals", related: ["lora", "held-out"] },
  { id: "lora", term: "LoRA", definition: "Маленькие обучаемые добавки к замороженным весам. Не полное обучение сети.", weekSlug: "evals", related: ["sft", "qlora"] },
  { id: "qlora", term: "QLoRA", definition: "LoRA поверх квантованной базы. Меньше памяти, то же правило held-out.", weekSlug: "evals", related: ["lora", "quantization"] },
  { id: "instruction-tuning", term: "Instruction tuning", definition: "Обучение на корпусе инструкций. Родственник SFT, не замена retrieval.", weekSlug: "evals", related: ["sft"] },
  { id: "preference-optimization", term: "Preference optimization", definition: "Обучение на парах «этот ответ лучше того». Не начинают, пока контекст закрывает разрыв held-out.", weekSlug: "evals", related: ["sft", "held-out"] },
  { id: "vllm", term: "vLLM", definition: "Inference server: держит модель в GPU memory и ведёт несколько генераций сразу.", weekSlug: "production-ai", related: ["kv-cache", "scheduler", "inference"] },
  { id: "scheduler", term: "Scheduler", definition: "Часть inference server: ставит пришедший запрос в batch. Model затем считает следующий токен. Это не пять вызовов подряд из клиента.", weekSlug: "production-ai", related: ["vllm", "continuous-batching", "kv-cache"] },
  { id: "kv-cache", term: "KV cache", definition: "Ключи и значения attention уже посчитанных токенов. Повтор префикса дешевле, пока кэш помещается в GPU memory.", weekSlug: "production-ai", related: ["vllm"] },
  { id: "continuous-batching", term: "Continuous batching", definition: "Новый запрос садится в уже идущую пачку генераций. Это работа inference server, не пять вызовов подряд из цикла.", weekSlug: "production-ai", related: ["vllm"] },
  { id: "provider-routing", term: "Provider routing", definition: "Код выбирает провайдера. Timeout, 429 и 5xx идут в fallback один раз. 401 fallback не вызывает.", weekSlug: "ai-automation", related: ["inference"] },
];

export function getGlossaryTerm(id: string) {
  return glossary.find((item) => item.id === id);
}

export function searchGlossary(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return glossary;
  return glossary.filter(
    (item) =>
      item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q)
  );
}
