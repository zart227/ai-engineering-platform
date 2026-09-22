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
  ol,
  p,
  promptT,
  q,
  quiz,
  reading,
  recall,
  ul,
  week,
} from "../blocks";

export const week26 = week({
  id: 26,
  slug: "observability",
  moduleId: "m14",
  title: "Наблюдаемость агентов",
  short: "Observability",
  track: "engineering",
  status: "ready",
  hours: 10,
  goal:
    "Ответить «почему агент так решил» по trace: дерево spans одного запроса, три числа success, cost и latency, запись без секретов.",
  technologies: ["trace", "span", "structured logs"],
  overview: {
    why:
      "Без trace вы спорите с моделью. С trace вы видите инструмент, токены и ошибку. Чат хранит текст ответа. Журнал хранит решение.",
    prerequisites: [
      "неделя 12: цикл и причина стопа в текстовом trace",
      "неделя 25: eval говорит о наборе, не о одном запросе",
    ],
    productionUse: [
      "разбор инцидента: какой шаг сломал ответ",
      "где агент сжигает бюджет",
    ],
    previousKnowledge: [
      "лог недели 1: requestId, модель, токены, latency, без ключа",
      "журнал инструмента недели 11: имя, статус, call id",
      "audit HITL: кто предложил действие, без секрета",
    ],
    asOf: "2026-09-21",
  },
  lessons: [
    lesson(
      "observability-l1",
      "Trace, span и виды шагов",
      16,
      ["Отличить trace от ленты логов", "Назвать span generation, tool и handoff"],
      [
        p(
          "Инцидент звучит так: «агент удалил не ту заметку». В чате виден финальный текст. Не видно, какой ход модели выбрал notes.write, какой статус вернул инструмент и какая версия промпта была в контексте. Память дежурного это плохой журнал. Trace это дерево одного пользовательского запроса."
        ),
        p(
          "Корень дерева это span всего запроса. У него parentId пустой. Дочерний span это один шаг: вызов модели, инструмент или handoff. У всех один traceId и один requestId. requestId тот же приём, что id в контексте лога Laravel: строки одного HTTP-запроса склеиваются, чужие не прилипают. Внутри агента шаги последовательные, поэтому parent у шага это корень, а не сосед."
        ),
        diagram(
          `requestId, traceId
  root          parentId пустой, stop, latency запроса
    generation  model, promptVersion, usage
    tool        имя, status, ok
    generation  stop done или код стопа
  handoff       target в name, packageHash`,
          "Один запрос"
        ),
        code(
          "ts",
          `export type SpanKind = "generation" | "tool" | "handoff";

export type Span = {
  traceId: string;
  spanId: string;
  parentId: string | null;
  requestId: string;
  kind: SpanKind;
  name: string;
  startMs: number;
  endMs: number;
  ok: boolean;
  model?: string;
  promptVersion?: string;
  promptTokens?: number;
  completionTokens?: number;
  tool?: string;
  status?: string;
  chunkIds?: string[];
  stop?: string;
  truncated?: boolean;
  argsHash?: string;
  packageHash?: string;
};
`,
          "Поля, которые потом читает разбор"
        ),
        h("Три вида"),
        ul([
          "generation: модель, версия промпта, usage. Полный текст промпта в span не кладут.",
          "tool: имя, latency шага, ok, короткий status. Аргументы заменяют хешем.",
          "handoff: имя целевого агента и хеш узкого пакета. Черновик и секреты в пакет не входят, в span тем более.",
        ]),
        p(
          "Если ход ходил в retrieval, в generation или tool span пишут chunkIds, которые реально попали в контекст. По id чанк можно открыть в своём хранилище. Сам текст чанка в журнал не копируют: он раздувает файл и часто содержит чужие персональные данные."
        ),
        compare(
          "После смены",
          "В Slack абзац «ответил странно» без id запроса.",
          "Файл spans: requestId, parentId, kind. Дежурный открывает дерево, а не пересказывает чат."
        ),
        check(
          "Чем trace отличается от файла логов за день?",
          "Trace это дерево одного запроса с общим requestId. Логи за день склеиваются в это дерево только по этому id."
        ),
      ]
    ),
    lesson(
      "observability-l2",
      "Токены, стоимость, задержка",
      16,
      ["Сложить usage всех generation", "Взять latency с корня, не с суммы детей", "Посчитать TTFT и перцентили по своим трейсам"],
      [
        p(
          "Оператору нужны три числа за период: success, cost, latency. Остальное это углубление в конкретный trace. Success здесь контракт продукта: корневой span ok и stop равен done. Стопы недели 12 (max_steps, repeated_tool, budget, timeout, cancelled, tool_failures) в success не входят, даже если пользователь увидел вежливую фразу."
        ),
        p(
          "Cost считается из токенов, которые вернул провайдер, той же формулой, что estimateCostUsd на неделе 1. Провайдер отдаёт prompt_tokens и completion_tokens, не доллары. Тариф inputPerMTok и outputPerMTok лежит у вас рядом с именем модели. Складывают все generation span запроса. Последний ответ это только последний ход. Tool span токенов модели не содержит, пока сам инструмент не сделал отдельный complete: тогда это ещё один generation."
        ),
        code(
          "ts",
          `export function readUsage(body: unknown) {
  const usage =
    typeof body === "object" && body !== null && "usage" in body
      ? (body as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage
      : undefined;
  return {
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
  };
}

export function summarize(
  spans: Span[],
  rates: { inputPerMTok: number; outputPerMTok: number }
) {
  const root = spans.find((span) => span.parentId === null);
  let promptTokens = 0;
  let completionTokens = 0;
  for (const span of spans) {
    if (span.kind !== "generation") continue;
    promptTokens += span.promptTokens ?? 0;
    completionTokens += span.completionTokens ?? 0;
  }
  const costUsd =
    (promptTokens / 1_000_000) * rates.inputPerMTok +
    (completionTokens / 1_000_000) * rates.outputPerMTok;
  const latencyMs = root === undefined ? 0 : root.endMs - root.startMs;
  return {
    success: root?.ok === true && root.stop === "done",
    costUsd,
    latencyMs,
  };
}
`,
          "Три числа из дерева"
        ),
        ul([
          "latency дашборда это стена корня. Сумма детей посчитает время модели дважды: оно уже внутри корня.",
          "Eval недели 25 говорит, просел ли набор. Три числа говорят, горит ли этот час. Один trace говорит, какой шаг сломал этот запрос.",
          "На экране Vue хватает трёх чисел и ссылки requestId. Дерево открывают, когда число уже плохое.",
        ]),
        callout(
          "Касса",
          "Восемь generation дороже одного. Если за час cost вырос, а success нет, смотрите повторы одного tool и раздутый promptTokens, не переписывайте приветствие.",
          "cost"
        ),
        compare(
          "Счёт агента",
          "В отчёт попали токены только последнего ответа.",
          "Сумма promptTokens и completionTokens по всем generation этого traceId."
        ),
        diagram(
          `Request → Queue → Retrieval → Reranking → LLM → Tools → Response
у каждой стадии свой span: startMs и endMs
узкое место это самая длинная стадия вашего трейса`,
          "Где искать узкое место"
        ),
        p(
          "TTFT это миллисекунды от старта запроса до первого токена. Замер пишете вы в свой трейс. Нет стрима: TTFT равен длительности этого generation. Нет замера: unknown."
        ),
        p(
          "Tokens per second: completionTokens делят на секунды generation span. Длительность 0 даёт unknown, не ноль."
        ),
        p(
          "Total latency это endMs корня минус startMs корня. p50, p95 и p99 считают по списку ваших total latency. Рядом пишут N и метод. Берут ранг ceil(p/100*N). Это не SLO из чужой статьи. На восьми трейсах p99 почти максимум, так и подпишите."
        ),
        code(
          "ts",
          `export const stages = [
  "request",
  "queue",
  "retrieval",
  "reranking",
  "llm",
  "tools",
  "response",
] as const;

export function percentile(samples: number[], p: number) {
  if (samples.length === 0) return { ok: false as const, reason: "no traces" };
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(sorted.length - 1, Math.max(0, rank));
  return { ok: true as const, value: sorted[index], n: sorted.length };
}

export function tokensPerSecond(completionTokens: number, durationMs: number) {
  if (durationMs <= 0) return { ok: false as const, reason: "unknown" };
  return { ok: true as const, value: completionTokens / (durationMs / 1000) };
}
`,
          "Перцентиль из своих чисел"
        ),
        p(
          "Сбой трейса: медленный span спрятан. Поиск шёл внутри вызова модели, а span retrieval не записан. Длинным выглядит LLM. Сумма детей сильно меньше корня. Стадию называют узким местом только когда у неё есть свои startMs и endMs."
        ),
        check(
          "Почему latency дашборда не равна сумме latency детей?",
          "Дети идут внутри корня. Сумма посчитает те же миллисекунды второй раз."
        ),
      ]
    ),
    lesson(
      "observability-l3",
      "Разбор по трейсу",
      16,
      ["Найти последний span с ok false", "Увидеть обрезку контекста и неверный маршрут"],
      [
        p(
          "Наивный разбор: вставить переписку в новый чат и спросить «почему ты так решил». Модель достроит правдоподобный мотив. Этого мотива не было в прогоне. Файл spans уже содержит ход, статус и версию промпта. Сначала читают его, потом открывают код."
        ),
        h("Порядок"),
        ol([
          "Корень: stop и ok. done при сломанном инструменте это уже дефект runtime.",
          "Последний span с ok false. Чаще всего это tool: upstream, denied, rejected.",
          "Generation перед ним: model, promptVersion, truncated, chunkIds, имя tool, которое модель выбрала.",
          "Handoff, если он есть: целевой агент. Неверный маршрут виден здесь, не в прилагательном ответа.",
        ]),
        diagram(
          `root stop=done ok=true
  generation promptVersion=support-v4 truncated=false
  tool search status=upstream ok=false
  generation stop=done ok=true
причина в tool search, не в последней фразе`,
          "Уверенный финал не лечит upstream"
        ),
        p(
          "Четыре частых причины из такого файла. Последний tool error: статус не ok, а цикл всё равно пошёл в финал. Обрезка контекста: truncated true и chunkIds короче, чем retrieval вернул. Бюджет: stop budget, много generation, success false. Неверный маршрут: handoff или выбранное имя tool не из того allowlist, версия промпта старая."
        ),
        compare(
          "Гипотеза",
          "Модель в новом чате объяснила мотив, файла никто не открыл.",
          "Одна фраза: span id, status, что поменять в runtime или в версии промпта."
        ),
        check(
          "Tool search с ok false, следом generation со stop done. Где причина?",
          "В tool span. Финальный текст не отменяет ошибку инструмента. Цикл должен был остановиться кодом tool_failures."
        ),
      ]
    ),
    lesson(
      "observability-l4",
      "Что нельзя класть в span",
      14,
      ["Вырезать ключ, cookie и платёжные данные до записи", "Склеить сессию хешем, не сырым id"],
      [
        p(
          "Span пишут до того, как его увидит человек, и до того, как файл уедет в бэкап. Значит режут в момент record, не в UI. В атрибуты не попадают пароль, cookie, API key, полный номер карты и строка Authorization. Туда же не попадает process.env: в нём ключ провайдера и строка базы."
        ),
        p(
          "Белый список ключей надёжнее охоты за словами. Поле вне списка не записывают, даже если оно «просто текст». Поверх списка строку, похожую на ключ, заменяют целиком. Регулярное выражение не знает новый формат секрета. Поэтому оно подстраховка, а список решает."
        ),
        code(
          "ts",
          `const SECRET = /sk-[A-Za-z0-9]|Bearer |postgres:\\/\\//i;

export function redactText(value: string) {
  if (SECRET.test(value)) return "[redacted]";
  return value;
}

const KEEP = ["model", "promptVersion", "tool", "status", "stop"] as const;

export function keepFields(input: Record<string, unknown>) {
  const out: Record<string, string | number | boolean> = {};
  for (const key of KEEP) {
    const value = input[key];
    if (typeof value === "number" || typeof value === "boolean") out[key] = value;
    if (typeof value === "string") out[key] = redactText(value);
  }
  return out;
}
`,
          "Сначала список, потом подстрока"
        ),
        ul([
          "session id для склейки заменяют коротким хешем. Сырой id открывает сессию.",
          "chunkIds оставляют. Текст чанка, тело письма и arguments целиком нет.",
          "Сообщение об ошибке базы режут. «postgres://user:password@...» в status утечёт в следующий промпт, если вы подклеите span в контекст.",
        ]),
        callout(
          "Секрет уже записан",
          "Вырезание в дашборде не лечит файл, бэкап и чужой collector. Тест кладёт в аргумент строку с ключом и проверяет, что в JSON spans её нет.",
          "security"
        ),
        compare(
          "Воспроизведение",
          "В span полный Authorization, чтобы потом повторить запрос.",
          "В span имена заголовков и хеш тела. Повтор делают фикстурой в тесте, не прод-журналом."
        ),
        check(
          "Зачем хеш session id, если сам id и так склеивает запросы?",
          "Сырой id это ключ к сессии. Хеш склеивает spans одного человека и не открывает сессию тому, у кого есть файл логов."
        ),
      ]
    ),
    lesson(
      "observability-l5",
      "Обёртка complete и execute",
      14,
      ["Замерить время вокруг await", "Записать ok false и пробросить ошибку"],
      [
        p(
          "Журнал, который пишут в конце удачного пути, молчит на throw. Обёртка стоит вокруг complete недели 1 и execute недели 11. Часы берут до await и после него. Успех и исключение оба вызывают record. Исключение пробрасывают дальше: красивый trace не заменяет стоп цикла."
        ),
        p(
          "В generation попадают модель, версия промпта и usage. messages и apiKey в record не передают. В tool попадают имя, status и хеш сырых аргументов. В execute уходит исходная строка: если вырезать её до вызова, инструмент получит [redacted] вместо запроса пользователя. Режут копию для span."
        ),
        code(
          "ts",
          `import { createHash } from "node:crypto";

type Observation = { status: "ok" | "rejected" | "denied" | "upstream" };

export function shortHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export class Tracer {
  private n = 0;
  readonly spans: Span[] = [];

  constructor(
    readonly requestId: string,
    readonly traceId: string
  ) {}

  nextId() {
    this.n += 1;
    return this.traceId + "." + String(this.n);
  }

  record(span: Span) {
    this.spans.push(span);
  }
}

export async function tracedExecute(
  tracer: Tracer,
  parentId: string | null,
  name: string,
  raw: string,
  execute: (toolName: string, toolRaw: string) => Promise<Observation>
) {
  const startMs = Date.now();
  const spanId = tracer.nextId();
  const argsHash = shortHash(raw);
  try {
    const observation = await execute(name, raw);
    tracer.record({
      traceId: tracer.traceId,
      spanId,
      parentId,
      requestId: tracer.requestId,
      kind: "tool",
      name,
      startMs,
      endMs: Date.now(),
      ok: observation.status === "ok",
      tool: name,
      status: observation.status,
      argsHash,
    });
    return observation;
  } catch (error) {
    tracer.record({
      traceId: tracer.traceId,
      spanId,
      parentId,
      requestId: tracer.requestId,
      kind: "tool",
      name,
      startMs,
      endMs: Date.now(),
      ok: false,
      tool: name,
      status: "runtime",
      argsHash,
    });
    throw error;
  }
}
`,
          "В execute уходит сырой аргумент, в span только хеш"
        ),
        p(
          "tracedComplete устроен так же вокруг complete недели 1. В span пишут model, promptVersion и числа из readUsage. Объект args в record не передают: в нём apiKey и messages."
        ),
        code(
          "ts",
          `type CompleteArgs = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  timeoutMs: number;
};

export async function tracedComplete(
  tracer: Tracer,
  parentId: string | null,
  promptVersion: string,
  args: CompleteArgs,
  complete: (input: CompleteArgs) => Promise<unknown>
) {
  const startMs = Date.now();
  const spanId = tracer.nextId();
  try {
    const body = await complete(args);
    const usage = readUsage(body);
    tracer.record({
      traceId: tracer.traceId,
      spanId,
      parentId,
      requestId: tracer.requestId,
      kind: "generation",
      name: "complete",
      startMs,
      endMs: Date.now(),
      ok: true,
      model: args.model,
      promptVersion,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });
    return body;
  } catch (error) {
    tracer.record({
      traceId: tracer.traceId,
      spanId,
      parentId,
      requestId: tracer.requestId,
      kind: "generation",
      name: "complete",
      startMs,
      endMs: Date.now(),
      ok: false,
      model: args.model,
      promptVersion,
      status: "runtime",
    });
    throw error;
  }
}
`,
          "Ключ остаётся в аргументе вызова"
        ),
        callout(
          "Место под экспорт",
          "Форма span (id, родитель, начало, конец, атрибуты, ok) потом ложится в экспортёр. В учебном MVP платформы SDK и чужой бэкенд не подключают: сначала тест, что секрет не попал в JSON.",
          "warn"
        ),
        reading([
          {
            title: "OpenTelemetry: Traces",
            url: "https://opentelemetry.io/docs/concepts/signals/traces/",
            note: "Сверено 2026-09-21. Trace там дерево spans с общим trace id, у корня нет родителя. Имена наших полей локальные. Экспортёр в этот MVP не добавляют.",
          },
        ]),
        check(
          "execute бросил исключение. Что лежит в span и что видит цикл?",
          "Span с ok false и status runtime уже записан. Исключение проброшено, цикл пишет свой стоп, а не пустой успех."
        ),
      ]
    ),
  ],
  lab: lab({
    id: "observability-lab",
    title: "Падение по файлу",
    goal: "Причина прогона называется одной фразой из JSON. Следующий trace этой ошибки не содержит.",
    setup: [
      "файл trace.json одного запроса",
      "корень со stop done и ok true",
      "tool span search со status upstream и ok false, следом generation со stop done",
      "в одном атрибуте фикстуры спрятана строка с ключом, её надо заметить",
    ],
    steps: [
      {
        title: "Читать",
        body: "Найдите причину только по файлу. Фраза называет span id инструмента и status. Финальный текст ответа в причину не входит.",
        expected: "Одна фраза: search вернул upstream, цикл всё равно записал done.",
      },
      {
        title: "Починить",
        body: "Поправьте runtime или версию промпта так, чтобы ошибка инструмента стала stop tool_failures. Вырежьте ключ до записи. Прогоните фикстуру ещё раз.",
        expected: "Новый trace: tool ok false, корень stop tool_failures, строки ключа в JSON нет.",
      },
      {
        title: "Свои перцентили",
        body: "Не меньше 8 своих трейсов. На каждом запишите TTFT, tokens per second и total latency. По списку total latency посчитайте p50, p95, p99. Напишите N. Чужой SLO не копируют.",
        expected: "Таблица из ваших чисел. У перцентилей есть N.",
      },
      {
        title: "Скрытый span",
        body: "Один трейс специально без span стадии, которая заняла время. Пройдите Request, Queue, Retrieval, Reranking, LLM, Tools, Response. Найдите дыру: корень долгий, а стадии в файле нет.",
        expected: "Фраза называет спрятанный span. После правки у этой стадии есть startMs и endMs.",
      },
    ],
    troubleshooting: [
      {
        problem: "Фраза причины цитирует уверенный финал модели",
        fix: "Ищите последний span с ok false. Generation после него показывает дефект цикла, не успех поиска.",
      },
      {
        problem: "Новый файл снова содержит ключ",
        fix: "Режут в record, не в просмотре. Тест подаёт секрет в аргумент и читает сырой JSON.",
      },
    ],
    reflection: [
      "Какого поля не хватило, чтобы назвать версию промпта?",
      "Какое из трёх чисел дашборда скрыло бы это падение, если корень остался ok true?",
      "Что не сработало и на каком requestId span был спрятан?",
      "Почему корень долгий, а сумма детей нет?",
      "Как вы проверили, какая стадия конвейера пропала?",
      "Что изменено в record, чтобы у стадии появились startMs и endMs?",
      "Стало ли лучше: p50, p95 и p99 пересчитаны по тем же трейсам?",
    ],
  }),
  practice: exercise({
    id: "observability-practice",
    title: "Tracing middleware",
    time: "3 часа",
    context:
      "Обёртка complete() недели 1 и execute() недели 11. Отдельной библиотеки с именем executeTool в курсе нет: то же самое делает tracedExecute.",
    requirements: [
      "у каждого span есть requestId и traceId",
      "spans пишутся JSON-файлом или массивом, который тест сериализует",
      "redaction до записи: белый список и замена ключа",
      "сводка success, costUsd, latencyMs",
      "исключение execute даёт span с ok false и летит дальше",
      "таблица своих TTFT, tokens per second и total latency",
      "p50, p95, p99 посчитаны по этим трейсам, рядом N",
      "узкое место названо стадией конвейера",
      "один трейс, где медленный span скрыт, и правка, которая его показывает",
    ],
    constraints: [
      "в spans нет process.env и нет apiKey",
      "в execute уходит исходный аргумент, хеш пишется только в span",
      "живой ключ провайдера для этого упражнения не нужен: complete подменяется фикстурой с usage",
    ],
    acceptance: [
      "тест redaction не находит секрет в сериализованных spans",
      "три числа считаются по фикстуре из двух generation и одного tool",
    ],
    tests: [
      "secret stripped",
      "ok false при throw",
      "cost суммирует оба generation",
      "latency берётся с корня",
    ],
    hints: [
      {
        title: "Подсказка 1",
        text: "Один класс Tracer на запрос. requestId приходит с края, не из промпта.",
      },
      {
        title: "Подсказка 2",
        text: "Время берите до await и в finally или в обеих ветках. Потеря endMs ломает latency.",
      },
      {
        title: "Подсказка 3",
        text: "Ошибки пишите как ok false. Не глотайте исключение ради зелёного дашборда.",
      },
    ],
    solution:
      "tracer.ts с record, tracedComplete, tracedExecute, keepFields и summarize. Тест на секрет, throw и сумму токенов.",
  }),
  prompts: [
    promptT({
      id: "observability-p1",
      title: "Объяснить trace",
      purpose: "Собрать гипотезу по файлу, прежде чем менять код.",
      when: "Есть JSON spans инцидента.",
      placeholders: ["{{trace}}"],
      text: `По трейсу назови одну гипотезу причины, id span, который её показывает, и какое место в коде открыть.
Систему целиком не переписывай.
{{trace}}`,
      explanation:
        "Модель здесь помощник разбора. Источник истины это файл и код, который его записал.",
      limitations:
        "Без исходников модель достроит вызов. Сверьте id span с файлом, прежде чем править промпт.",
    }),
    promptT({
      id: "observability-p2",
      title: "Какие поля оставить",
      purpose: "Проверить атрибуты нового инструмента до первой записи.",
      when: "В span хотят добавить поля, которых нет в белом списке.",
      placeholders: ["{{fields}}"],
      text: `Для каждого поля ответь: оставить, заменить хешем или выкинуть.
Секрет не заменяй правдоподобным значением.
Поля:
{{fields}}`,
      explanation:
        "Список полей решают до продакшена. Регулярное выражение не заменяет этот разбор.",
      limitations:
        "Модель не знает вашу политику персональных данных. Сомнительное поле выкидывают, пока человек не разрешил его явно.",
    }),
  ],
  quiz: quiz("observability-quiz", [
    q(
      "w26-q1",
      "conceptual",
      "Зачем корневому span и логам один requestId?",
      [
        "Чтобы ускорить видеокарту",
        "Чтобы склеить строки одного запроса в одно дерево",
        "Чтобы заменить пароль пользователя",
        "Чтобы увеличить окно контекста",
      ],
      1,
      "Без общего id spans и логи за день не собрать в один trace."
    ),
    q(
      "w26-q2",
      "debugging",
      "В span инструмента лежит полный заголовок Authorization. Что это значит для прогона?",
      [
        "Так и надо, иначе запрос не повторить",
        "Секрет уже в журнале. Его вырезают до записи, повтор делают фикстурой",
        "Заголовок нужен для подсчёта cosine",
        "Этого требует тело JSON-RPC",
      ],
      1,
      "Ключ в span это утечка. Дашборд, который его прячет, файл уже не чинит."
    ),
    q(
      "w26-q3",
      "architecture",
      "Что оператор держит на дашборде агента?",
      [
        "Только оценку красоты текста",
        "success, cost и latency. Дерево открывают, когда число плохое",
        "Эти три числа заменяют eval и согласие человека",
        "Полный process.env каждого пода",
      ],
      1,
      "Три числа показывают провал, кассу и задержку. Причину ищут в trace. Eval и HITL остаются своими слоями."
    ),
    q(
      "w26-q4",
      "scenario",
      "Пользователь спрашивает, почему агент вызвал notes.write. Куда смотреть?",
      [
        "В TTL DNS",
        "В макет экрана",
        "В generation span: модель, версия промпта, выбранное имя. И в следующий tool span",
        "В цвет кнопки во Vue",
      ],
      2,
      "Выбор имени делает ход модели. Исполнение и статус лежат в tool span."
    ),
    q(
      "w26-q5",
      "debugging",
      "Стоимость в отчёте равна usage последнего ответа, а счёт провайдера выше. Где дыра?",
      [
        "Тариф надо выкинуть",
        "В сумму не вошли предыдущие generation этого trace",
        "Tool span всегда содержит доллары",
        "requestId увеличивает токены",
      ],
      1,
      "Каждый ход модели платный. Cost складывает usage всех generation, не только финала."
    ),
    q(
      "w26-q6",
      "conceptual",
      "Откуда брать p95 в этой неделе?",
      [
        "Из чужого SLO в статье",
        "Посчитать по своим total latency и записать N. Это не цель извне",
        "p95 копируют из чужого SLO, своих трейсов нет",
        "p95 это сумма токенов за день",
      ],
      1,
      "Перцентиль описывает ваши трейсы. Без списка чисел это чужая цифра."
    ),
    q(
      "w26-q7",
      "architecture",
      "Корень долгий. Как найти узкое место?",
      [
        "Переписать приветствие в промпте",
        "Сравнить длительности spans стадий: Request, Queue, Retrieval, Reranking, LLM, Tools, Response",
        "Взять p99 из документации провайдера",
        "Сложить cost всех дней и разделить на TTFT",
      ],
      1,
      "Узкое место это самая длинная записанная стадия вашего трейса."
    ),
    q(
      "w26-q8",
      "debugging",
      "Span retrieval отсутствует. LLM span длинный, а поиск шёл внутри него. В чём сбой?",
      [
        "LLM и есть узкое место, файл полный",
        "Трейс прячет медленный span: время поиска записано внутрь LLM",
        "TTFT заменяет дерево spans",
        "p50 само дописывает пропавшую стадию",
      ],
      1,
      "Пока у retrieval нет своих startMs и endMs, называть LLM узким местом рано."
    ),
  ], 70),
  artifact: artifact({
    result: "Tracing middleware и разбор инцидента по trace.",
    repository: "Git URL.",
    demo: "Файл spans с requestId, сводка трёх чисел и короткая фраза причины по фикстуре upstream.",
    readme: [
      "какие поля span пишутся и какие вырезаются",
      "как считаются success, costUsd и latencyMs",
      "что complete и execute подменяются в тесте",
    ],
    architecture: [
      "один Tracer на запрос",
      "record до любого экспорта",
      "корень держит stop и latency",
    ],
    tests: [
      "секрет не попадает в JSON",
      "throw ставит ok false",
      "два generation складываются в cost",
    ],
    checklist: [
      { id: "observability-a1", text: "Spans с requestId, kind и parentId" },
      { id: "observability-a2", text: "Тест redaction на ключе и на process.env" },
      { id: "observability-a3", text: "Сводка success, cost, latency" },
      { id: "observability-a4", text: "Разбор падения: фраза причины ссылается на span id" },
      { id: "observability-a5", text: "Ошибка execute записана и проброшена" },
      { id: "observability-a6", text: "Свои TTFT, tokens per second, total latency, p50, p95, p99 и стадия узкого места" },
    ],
  }),
  recall: recall([
    {
      fromWeek: "Неделя 1",
      question: "Какие поля usage пишут в лог вызова модели?",
      answer: "Токены, latency, модель, requestId. Ключ API в лог не пишут.",
    },
    {
      fromWeek: "Неделя 12",
      question: "Что пишут последней строкой текстового trace цикла?",
      answer:
        "Причину выхода: done, max_steps, repeated_tool, budget, timeout, cancelled или tool_failures.",
    },
    {
      fromWeek: "Неделя 11",
      question: "Какие поля журнала инструмента оставляют?",
      answer: "Имя, статус, call id. Не process.env и не сырой секрет из arguments.",
    },
  ]),
  decisionCards: [
    decision({
      id: "observability-d1",
      title: "JSON-файл или внешний collector",
      optionA: "JSON-файл",
      optionB: "Внешний collector",
      useA: [
        "один процесс и учебный MVP",
        "инцидент читают без аккаунта вендора",
        "тест redaction ещё не покрывает экспорт",
      ],
      useB: [
        "несколько сервисов уже шлют трейсы в один collector",
        "redaction стоит до экспорта и покрыта тестом",
        "нужен общий trace id с соседним сервисом",
      ],
      tradeoffs:
        "Файл открывается в тесте и в диффе. Collector склеивает сервисы, и лишний атрибут уезжает туда же, куда spans.",
      mistake:
        "Включить экспорт в вендора до теста redaction и положить в span заголовок Authorization.",
    }),
    decision({
      id: "observability-d2",
      title: "Чужой SLO или свои перцентили",
      optionA: "Число из статьи",
      optionB: "p50, p95, p99 своих трейсов",
      useA: ["черновик, который ещё не называют замером"],
      useB: ["отчёт по своим spans", "поиск узкой стадии", "сравнение двух прогонов"],
      tradeoffs:
        "Чужая цифра появляется сразу и не про ваш процесс. Свой список дольше и честно показывает, что на малом N p99 почти максимум.",
      mistake: "Записать p95 как цель из статьи, не имея своих total latency.",
    }),
  ],
  learningObjectives: [
    "Собрать дерево spans одного requestId и найти последний span с ok false.",
    "Посчитать по своим трейсам TTFT, tokens per second, total latency, p50, p95 и p99.",
    "Пройти стадии Request, Queue, Retrieval, Reranking, LLM, Tools, Response и назвать узкое место по длительности span.",
    "Вырезать ключ и лишние данные до record. Не прятать секрет только на экране.",
  ],
  experiments: [
    {
      id: "observability-exp-spans",
      question: "Какая стадия конвейера самая долгая на ваших трейсах, и не спрятан ли её span?",
      method:
        "Не меньше 8 своих трейсов. У каждой стадии startMs и endMs. По total latency корня посчитать p50, p95, p99 и записать N. Один трейс специально без span медленной стадии.",
      metrics: ["TTFT ms", "tokens per second", "total latency ms", "p50", "p95", "p99"],
    },
  ],
  failureModes: [
    {
      id: "observability-f1",
      symptom: "В отчёте p95 как цель, списка трейсов нет.",
      cause: "Число взято из чужого SLO, а не из своих total latency.",
      check: "Рядом с p50, p95 и p99 есть N и те же миллисекунды, из которых их посчитали.",
    },
    {
      id: "observability-f2",
      symptom: "Узким местом назван LLM, хотя поиск шёл внутри этого span.",
      cause: "Трейс прячет медленный span: у retrieval нет startMs и endMs.",
      check: "После правки стадия есть в дереве. Сумма детей больше не оставляет дыру в корне.",
    },
  ],
  metrics: [
    { name: "TTFT ms", how: "От старта вашего запроса до первого токена. Нет замера значит unknown. Без стрима это длительность generation." },
    { name: "tokens per second", how: "completionTokens делите на секунды своего generation span. Длительность 0 значит unknown." },
    { name: "total latency ms", how: "endMs корня минус startMs корня на каждом вашем трейсе." },
    { name: "p50", how: "Перцентиль 50 ваших total latency. Рядом N. Не SLO." },
    { name: "p95", how: "Перцентиль 95 тех же N чисел." },
    { name: "p99", how: "Перцентиль 99 тех же N чисел. Если N мало, напишите, что это почти максимум." },
  ],
  artifactRubric: {
    criteria: [
      {
        id: "observability-r1",
        name: "Дерево",
        weight: 25,
        evidence: "Spans с requestId, parentId и kind. Причина падения ссылается на span id.",
      },
      {
        id: "observability-r2",
        name: "Свои числа",
        weight: 25,
        evidence: "Таблица TTFT, tokens per second, total latency. p50, p95, p99 посчитаны из неё, рядом N.",
      },
      {
        id: "observability-r3",
        name: "Узкое место",
        weight: 25,
        evidence: "Названа стадия конвейера. Есть трейс, где медленный span был скрыт, и правка, которая его показывает.",
      },
      {
        id: "observability-r4",
        name: "Без секрета",
        weight: 25,
        evidence: "Тест redaction: ключа и process.env в JSON spans нет.",
      },
    ],
  },
  sources: [
    {
      title: "OpenTelemetry: Traces",
      url: "https://opentelemetry.io/docs/concepts/signals/traces/",
      kind: "official-docs",
      checkedAt: "2026-09-21",
    },
  ],
  contentVersion: "2026.09",
  lastReviewedAt: "2026-09-21",
  securityNotes: ["Ключ, cookie и Authorization режут в record. process.env в span не сериализуют."],
  privacyNotes: ["В span оставляют chunkIds, не текст чанка. Сырой session id заменяют коротким хешем."],
  costNotes: ["Cost складывает usage всех generation. Tokens per second считают из своих spans, не из прайса."],
});
