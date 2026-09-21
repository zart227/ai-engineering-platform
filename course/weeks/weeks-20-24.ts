import { compactWeek, type CompactWeek } from "./compact";

const rest: CompactWeek[] = [
  {
    id: 22, slug: "planning", moduleId: "m10", title: "Planning и replanning", short: "Planning", track: "engineering", hours: 10,
    goal: "Декомпозиция цели в DAG, checkpoint, перепланирование при срыве.",
    technologies: ["DAG", "state machine", "checkpoints"],
    why: "Реактивный цикл тупит на многошаговых целях. План даёт проверяемые узлы.",
    prerequisites: ["agent loop"], productionUse: ["долгие задачи", "codegen пайплайны"], previousKnowledge: ["spec decomposition недели 5"],
    lessons: [
      { title: "Goal vs task graph", minutes: 16, objectives: ["Зависимости"], paragraphs: ["Цель «сделать отчёт» не исполняется. Задачи: собрать источники, проверить, написать, прогнать critic. DAG: нельзя писать до источников. Циклы в графе задач почти всегда ошибка дизайна."] },
      { title: "Execute, verify, replan", minutes: 16, objectives: ["Checkpoint"], paragraphs: ["После узла verify. Fail → replan хвоста, не всего с нуля, если checkpoint есть. State machine честнее свободного агента, когда состояния конечны."] },
      { title: "Стоп", minutes: 12, objectives: ["Не перепланировать вечно"], paragraphs: ["Лимит replan. Человек после k срывов. Иначе планировщик это тот же бесконечный loop в галстуке."] },
    ],
    lab: { title: "План из 6 шагов", goal: "Шаг 3 падает, replan хвоста.", setup: ["фикстура fail на шаге 3"], steps: [{ title: "DAG", body: "Опишите зависимости.", expected: "Картинка/список." }, { title: "Replan", body: "Хвост новый, голова не пересчитывается.", expected: "Лог checkpoint." }], reflection: ["Что нельзя чекпоинтить (деньги уже ушли)?"] },
    practice: { title: "Planner module", time: "3 часа", context: "Код: plan, execute node, verify, replan.", requirements: ["лимит replan", "тест срыва шага", "trace"], constraints: ["Не нужен LLM на каждый микрошаг, часть узлов детерминированы"], acceptance: ["вечный replan невозможен"], tests: ["fail node 3"], hints: [{ title: "Подсказка 1", text: "Узлы с типом llm|code." }, { title: "Подсказка 2", text: "id узла стабильный." }, { title: "Подсказка 3", text: "Сериализуйте план в JSON." }], solution: "planner.ts + graph.json." },
    prompt: { title: "Декомпозитор", purpose: "Черновик DAG", when: "Новая цель", placeholders: ["{{goal}}"], text: `Разбей цель на 5-9 задач. JSON {id, dependsOn[], type: "code"|"llm"|"human"}. Не делай циклов. Отметь verify узлы.\nЦель: {{goal}}`, explanation: "Черновик, человек правит.", limitations: "Модель плохо знает ваши реальные зависимости кода." },
    quiz: [
      { prompt: "Цикл в DAG задач:", options: ["Нормально", "Скорее ошибка дизайна", "Требование агента", "Нужен для HMAC"], answer: 1, kind: "architecture", explanation: "Ацикличность." },
      { prompt: "Verify после узла:", options: ["Лишняя бюрократия всегда", "Ловит срыв до финала", "Заменяет тесты продукта", "Пишет CSS"], answer: 1, kind: "conceptual", explanation: "Клапан." },
      { prompt: "Бесконечный replan:", options: ["Настойчивость", "Нужен лимит и HITL", "Лучшая стратегия", "Дешевле"], answer: 1, kind: "scenario", explanation: "Бюджет." },
      { prompt: "Все узлы через LLM:", options: ["Обязательно", "Нет, код дешевле и стабильнее где можно", "Запрещено иметь код", "Только Python"], answer: 1, kind: "cost" as "architecture", explanation: "Принцип курса." },
    ],
    artifactResult: "Planner/replanner с checkpoint и лимитом.",
    checklist: ["DAG", "fail step 3", "replan cap", "trace"],
    recall: [{ fromWeek: "professional-ai-coding", question: "Чем spec отличается от плана?", answer: "Spec это что и зачем. План это граф как." }],
  },
  {
    id: 23, slug: "human-in-the-loop", moduleId: "m11", title: "Human-in-the-loop", short: "HITL", track: "engineering", hours: 10,
    goal: "Approve, pause/resume, permissions, audit для опасных действий.",
    technologies: ["permission model", "audit log"],
    why: "Автономия без клапана это инцидент. Человек нужен не «для души», а на WRITE/FINANCIAL/ADMIN.",
    prerequisites: ["tools", "agent"], productionUse: ["отправка писем", "платежи", "удаления"], previousKnowledge: ["allowlist tools"],
    lessons: [
      { title: "Pause и approve", minutes: 16, objectives: ["Состояние ожидания"], paragraphs: ["Агент ставит proposed_action. Система паузит. Человек approve/deny. Resume с observation «denied» или исполняет код. Нельзя обойти, переформулировав цель в prompt: проверка в runtime."] },
      { title: "Модель прав", minutes: 16, objectives: ["READ WRITE DELETE FINANCIAL ADMIN"], paragraphs: ["READ свободен в рамках tenant. WRITE в чувствительные системы требует роли. DELETE и FINANCIAL всегда HITL в учебном агенте. ADMIN не выдаётся модели."] },
      { title: "Audit", minutes: 12, objectives: ["Кто нажал"], paragraphs: ["Лог: actor (agent|user), action, args redacted, decision, timestamp. Без audit вы не расследуете."] },
    ],
    lab: { title: "Письмо с approve", goal: "send_email не уходит без кнопки.", setup: ["заглушка SMTP"], steps: [{ title: "Propose", body: "Агент предлагает.", expected: "pending в БД." }, { title: "Approve", body: "Человек жмёт, заглушка «sent».", expected: "audit строки две: propose, approve." }], reflection: ["Как запретить tool send_email целиком для роли intern?"] },
    practice: { title: "Permission module", time: "3 часа", context: "Политика + тесты обхода через перефраз цели.", requirements: ["enum прав", "HITL на FINANCIAL", "тест: prompt injection не шлёт"], constraints: ["Проверка в коде, не в промпте"], acceptance: ["перефраз не обходит"], tests: ["policy tests"], hints: [{ title: "Подсказка 1", text: "Классификация действия по имени tool, не по тексту цели." }, { title: "Подсказка 2", text: "UI паузы может быть CLI y/n." }, { title: "Подсказка 3", text: "TTL на pending action." }], solution: "permissions.ts + pending_actions table." },
    prompt: { title: "Объяснить человеку паузу", purpose: "UX approve", when: "Перед опасным действием", placeholders: ["{{action}}", "{{args}}"], text: `Объясни человеку, что агент хочет сделать, риски, как проверить args. Без давления «одобри быстро».\nДействие: {{action}}\nАргументы: {{args}}`, explanation: "Человек должен понять.", limitations: "Не подменяет отображение сырых args." },
    quiz: [
      { prompt: "Права проверяют:", options: ["Только system prompt", "Runtime по имени tool и роли", "CSS", "Tokenizer"], answer: 1, kind: "architecture", explanation: "Код, не поэзия." },
      { prompt: "FINANCIAL без HITL в учебном агенте:", options: ["Ок если temperature 0", "Нарушение политики недели", "Быстрее значит лучше", "Нужно для RAG"], answer: 1, kind: "scenario", explanation: "Клапан." },
      { prompt: "Audit без user id на approve:", options: ["Нормально", "Не расследуете кто нажал", "Дешевле хранить", "Требование HTTP/2"], answer: 1, kind: "debugging", explanation: "Кто." },
      { prompt: "Pause/resume state хранить:", options: ["Только в чате модели", "В вашей БД как pending", "В CSS variables", "Никак"], answer: 1, kind: "conceptual", explanation: "Состояние ваше." },
    ],
    artifactResult: "Permission + audit + pending approval.",
    checklist: ["enum прав", "HITL demo", "обход через prompt не работает", "audit"],
    recall: [{ fromWeek: "tool-calling", question: "Что такое allowlist tools?", answer: "Исполняется только явённый набор, остальное deny." }],
  },
  {
    id: 24, slug: "ai-security", moduleId: "m12", title: "AI security: атаковать и защитить", short: "Security", track: "engineering", hours: 12,
    goal: "Пять атак на своего агента в локальной песочнице, затем защиты и регресс-тесты.",
    technologies: ["injection", "guardrails", "sandbox"],
    why: "К неделе 24 у вас достаточно движущихся частей, чтобы сломать их системно.",
    prerequisites: ["tools", "RAG", "HITL", "секреты недели 1"], productionUse: ["любой прод с LLM"], previousKnowledge: ["untrusted input"],
    lessons: [
      { title: "Injection", minutes: 18, objectives: ["прямая и косвенная"], paragraphs: ["Прямая: пользователь пишет «игнорируй правила». Косвенная: документ в RAG, картинка, email. Модель следует тексту с более высокой «полезностью». Защита: разделители, не класть retrieved в system, allowlist tools, выходная валидация, HITL на опасном."] },
      { title: "Tool poisoning и exfiltration", minutes: 16, objectives: ["Не доверять описаниям", "не вынести секреты"], paragraphs: ["Враждебный MCP/tool description просит вычитать .env. Data exfiltration: модель просит «для отладки» отправить историю на URL. Excessive agency: агент сам расширяет права. Sandbox: нет сети, кроме allowlist."] },
      { title: "Guardrails", minutes: 14, objectives: ["Слоями"], paragraphs: ["Вход: длина, язык, детекторы. Процесс: policy tools. Выход: схема, redaction секретов, запрет URL вне списка. Ни один слой не достаточен один."] },
    ],
    lab: { title: "Attack then defend", goal: "5 атак, 5 защит, тесты.", setup: ["локальный агент, фейковые секреты"], steps: [{ title: "Атака", body: "injection, indirect, tool poison, exfil, privilege.", expected: "До защиты часть проходит (учебно)." }, { title: "Защита", body: "Тесты, что больше не проходит.", expected: "CI красный если регресс." }], reflection: ["Какая атака жива, потому что вы поверили промпту?"] },
    practice: { title: "Threat model", time: "3 часа", context: "Документ STRIDE-lite для вашего агента.", requirements: ["активы", "атакующие", "миры входа", "контроли", "остаточный риск"], constraints: ["Локально, без атаки чужих систем"], acceptance: ["секреты в логах = провал"], tests: ["secret not in logs"], hints: [{ title: "Подсказка 1", text: "Список всех входов текста." }, { title: "Подсказка 2", text: "Список tools с правами." }, { title: "Подсказка 3", text: "Что если retrieved врёт." }], solution: "THREAT_MODEL.md + tests/security." },
    prompt: { title: "Красная команда промпта", purpose: "Найти injection", when: "Перед продом", placeholders: ["{{system}}"], text: `Предложи 8 payload для обхода. Для каждого: ожидаемый вред и какой слой защиты должен сработать, если не промпт.\n{{system}}`, explanation: "Промпт не единственная стена.", limitations: "Не использовать вне песочницы." },
    quiz: [
      { prompt: "Indirect injection приходит из:", options: ["Только клавиатуры", "Документов, URL, RAG, файлов", "Только DNS", "Только CSS"], answer: 1, kind: "conceptual", explanation: "Любой недоверенный текст." },
      { prompt: "Секрет в логе агента:", options: ["Удобно для debug навсегда", "Инцидент", "Требование OpenTelemetry", "Нужно для cosine"], answer: 1, kind: "debugging", explanation: "Redaction." },
      { prompt: "Guardrail только в system prompt:", options: ["Достаточно военного уровня", "Слабый слой, нужен runtime", "Заменяет HMAC", "Заменяет auth пользователей"], answer: 1, kind: "architecture", explanation: "Слои." },
      { prompt: "Учебная атака чужого продакшена:", options: ["Поощряется", "Запрещена, только свой локальный агент", "Обязательна для зачёта", "Нужна для Docker"], answer: 1, kind: "scenario", explanation: "Этика и закон." },
    ],
    artifactResult: "Threat model + hardened agent + security tests.",
    checklist: ["5 атак задокументированы", "5 защит", "тест секретов", "sandbox"],
    recall: [{ fromWeek: "environment-llm-api", question: "Где живёт API key?", answer: "На сервере в env, не в логах и не в клиенте." }],
  },
];

export const weeks22to24 = rest.map(compactWeek);
