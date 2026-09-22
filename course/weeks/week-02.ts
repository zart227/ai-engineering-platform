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

export const week02 = week({
  id: 2,
  slug: "how-llms-work",
  moduleId: "m01",
  title: "Как работают LLM достаточно, чтобы ими управлять",
  short: "Как устроены LLM",
  track: "engineering",
  status: "ready",
  hours: 10,
  goal:
    "Понять токены, контекст, sampling и галлюцинации настолько, чтобы выбирать параметры и не одушевлять модель.",
  technologies: ["tokenizer", "sampling", "logprobs (concept)", "TypeScript experiments"],
  overview: {
    why:
      "Без модели мира вы крутите temperature как ручку радио. С ней вы понимаете, почему JSON ломается, почему модель «забыла» начало, и почему уверенный тон не равен факту.",
    prerequisites: ["неделя 1: клиент, usage, стоимость"],
    productionUse: [
      "выбор модели под latency/cost",
      "настройка генерации для JSON vs прозы",
      "объяснение стейкхолдерам, почему модель врёт",
    ],
    previousKnowledge: ["HTTP клиент недели 1", "что такое токен в usage"],
    asOf: "2026-09-21",
  },
  lessons: [
    lesson(
      "how-llms-work-l1",
      "AI, ML, DL: карта без экзамена по матстату",
      14,
      [
        "Поставить LLM на карту методов",
        "Не путать обучение и inference",
      ],
      [
        p(
          "Вам не нужно выводить backprop на доске, чтобы строить продукты. Нужно не путать три режима: обучение весов, дообучение, inference. В этом курсе вы почти всегда на inference: веса чужие, вы платите за прогон."
        ),
        ul([
          "AI: зонтик. Правило, поиск, статистика, нейросети.",
          "ML: программа, которая подгоняет параметры под данные.",
          "DL: ML на многослойных сетях.",
          "Generative: модель выдаёт новые токены, картинки, аудио, а не только метку.",
        ]),
        p(
          "Fine-tune имеет смысл, когда у вас стабильный узкий формат и много своих примеров. Для большинства продуктовых задач хватает промпта, retrieval и валидации. Fine-tune это стоимость датасета и риск «забыть» общие навыки."
        ),
        compare(
          "Инвестиция",
          "«Давайте дообучим модель, потому что она плохо отвечает про наш прайс.»",
          "Сначала положите прайс в контекст или в retrieval. Дообучение, если формат ответа стабилен и промпт упёрся в потолок."
        ),
      ]
    ),
    lesson(
      "how-llms-work-l2",
      "Transformer, attention, context window",
      18,
      [
        "Объяснить внимание своими словами",
        "Связать окно контекста с деньгами и забывчивостью",
      ],
      [
        p(
          "Transformer обрабатывает последовательность токенов. Self-attention считает, какие прошлые токены важны для текущего. Отсюда свойство: всё, что не попало в окно, для модели не существует. Нет «памяти о вчера», пока вы сами её не положили в запрос."
        ),
        diagram(
          `токены: [sys][user...][assistant...]
окно: фиксированный бюджет
новые токены вытесняют старые, если вы не суммируете и не режете историю`,
          "Контекст это массив, не душа"
        ),
        p(
          "Длинный контекст не бесплатен: больше входных токенов, выше latency, выше шанс, что модель «потеряет» инструкцию в середине (lost in the middle). Поэтому context engineering на неделе 4 важнее, чем «закинем весь монорепозиторий»."
        ),
        callout(
          "Наивная идея",
          "«У модели 1M контекста, можно не думать.» Можно. Вы заплатите, качество посередине упадёт, секреты уедут в провайдера, отладка станет невозможной.",
          "cost"
        ),
      ]
    ),
    lesson(
      "how-llms-work-l3",
      "Tokenizer и embeddings на инженерном уровне",
      20,
      [
        "Отличить токен от слова",
        "Измерить токены одного смысла в четырёх формах",
        "Понять embedding как координаты смысла, не как магию",
      ],
      [
        p(
          "Tokenizer режет текст на куски из словаря. Числа, UUID, чужие языки, код с верблюжьим регистром часто дороже, чем кажется. Если вы считаете бюджет по strlen, вы ошибаетесь особенно на русском."
        ),
        h("Один смысл, четыре формы"),
        p(
          "Возьмите один смысл: посылка приезжает завтра утром. Запишите его по-английски, по-русски, компактным JSON и коротким кодом. Посчитайте токены одной и той же моделью: usage.prompt_tokens при одинаковом system. Ожидание для большинства tokenizer: русский, JSON и код дороже английского того же смысла. В таблицу пишите измерение. Чужой коэффициент не подставляйте."
        ),
        code(
          "ts",
          `const samples = [
  { id: "en", text: "Delivery status: the package arrives tomorrow morning." },
  { id: "ru", text: "Статус доставки: посылка придёт завтра утром." },
  { id: "json", text: '{"delivery_status":"package arrives tomorrow morning"}' },
  { id: "code", text: 'const deliveryStatus = "package arrives tomorrow morning";' },
];

async function promptTokens(userText: string) {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!baseUrl || !apiKey || !model) throw new Error("LLM env invalid");
  const response = await fetch(\`\${baseUrl}/chat/completions\`, {
    method: "POST",
    headers: {
      authorization: \`Bearer \${apiKey}\`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: "Answer with one word: ok" },
        { role: "user", content: userText },
      ],
    }),
  });
  if (!response.ok) throw new Error(\`llm_http_\${response.status}\`);
  const json = (await response.json()) as { usage?: { prompt_tokens?: number } };
  const tokens = json.usage?.prompt_tokens;
  if (typeof tokens !== "number") throw new Error("usage_missing");
  return tokens;
}

async function main() {
  for (const sample of samples) {
    const tokens = await promptTokens(sample.text);
    console.info(\`\${sample.id}\\t\${tokens}\`);
  }
}

main();
`,
          "Четыре строки, одна модель"
        ),
        callout(
          "Не заучивайте коэффициент",
          "System один и тот же, поэтому разница prompt_tokens это разница текстов. Если usage нет, в ячейке unknown. Если ваша модель разошлась с ожиданием, в отчёте остаются измеренные числа.",
          "cost"
        ),
        p(
          "Embedding это вектор, который модель (часто отдельная, меньшая) сопоставляет куску текста. Близкие векторы примерно близки по смыслу для той задачи, на которой эмбеддер учили. Это не понимание. «Банк» реки и «банк» денег могут схлопнуться или разъехаться в зависимости от модели."
        ),
        code(
          "ts",
          `export function cosine(a: number[], b: number[]) {
  if (a.length !== b.length) throw new Error("dim");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
`,
          "Косинус, который вы напишете на неделе 13"
        ),
        check(
          "Почему эмбеддинг поиска и эмбеддинг генерации это разные кнопки?",
          "У них разные модели, цены и размерность. Нельзя подставить вектор от одной модели в индекс другой и ждать смысл."
        ),
      ]
    ),
    lesson(
      "how-llms-work-l4",
      "Sampling: temperature, top-p, seed, reasoning",
      20,
      [
        "Выбрать параметры под JSON и под бриф",
        "Не путать «reasoning» с гарантией истины",
      ],
      [
        p(
          "После логитов модель не обязана брать самый вероятный токен. Temperature сглаживает распределение. Top-p отрезает хвост массы. Для схемы JSON обычно ближе к низкой температуре. Для идей в брифе можно выше. Для прод-классификатора почти всегда низко плюс валидация."
        ),
        ul([
          "temperature 0 не всегда детерминизм: провайдер, батчинг, молли.",
          "seed, если он есть, помогает воспроизводимости экспериментов, не юридической гарантии.",
          "max tokens режет ответ. Если JSON обрезан, валидатор должен просить ремонт, а не парсить обрубок.",
        ]),
        p(
          "Reasoning-модели тратят скрытые токены на «думать». Это может поднять качество задач с шагами и поднять счёт. Не включайте reasoning на извлечение email из письма: вы купите театр."
        ),
        compare(
          "Параметры",
          "Одна температура 0.8 на весь продукт, потому что так в туториале.",
          "Профиль: extract (низкая, без стрима), chat (средняя), ideas (выше), и отдельный лимит токенов."
        ),
        h("Один рычаг за раз"),
        p(
          "Temperature и top_p оба режут распределение. Если поднять оба сразу, вы не узнаете, кто сломал JSON. Сетку temperature оставьте как есть, top_p в ней не трогайте. Отдельным прогоном зафиксируйте temperature 0.8 и сравните только top_p: 0.1 и 1."
        ),
        code(
          "ts",
          `function generationBody(args: {
  model: string;
  messages: { role: "system" | "user"; content: string }[];
  topP: number;
}) {
  return {
    model: args.model,
    messages: args.messages,
    temperature: 0.8,
    top_p: args.topP,
    n: 1,
  };
}
`,
          "top_p при одной temperature"
        ),
        p(
          "Повтор того же prompt: пять генераций при temperature 0.8. Посчитайте, сколько текстов различны после trim, и разброс completion_tokens (max минус min). Затем те же пять при temperature 0. Совпадений обычно больше. Провайдер всё равно может вернуть разные строки. Поле n в chat/completions собирает несколько choices одним запросом, но usage тогда общий. Для разброса токенов нужны пять ответов с отдельным usage."
        ),
        code(
          "ts",
          `type ChatMessage = { role: "system" | "user"; content: string };

async function once(args: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
}) {
  const response = await fetch(\`\${args.baseUrl}/chat/completions\`, {
    method: "POST",
    headers: {
      authorization: \`Bearer \${args.apiKey}\`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature,
      n: 1,
    }),
  });
  if (!response.ok) throw new Error(\`llm_http_\${response.status}\`);
  const json = (await response.json()) as {
    choices: { message?: { content?: string | null } }[];
    usage?: { completion_tokens?: number };
  };
  return {
    text: json.choices[0]?.message?.content?.trim() ?? "",
    completionTokens: json.usage?.completion_tokens ?? null,
  };
}

async function sample(
  args: {
    baseUrl: string;
    apiKey: string;
    model: string;
    messages: ChatMessage[];
  },
  temperature: number
) {
  const runs = [];
  for (let i = 0; i < 5; i += 1) runs.push(await once({ ...args, temperature }));
  const distinct = new Set(runs.map((run) => run.text)).size;
  const counts = runs
    .map((run) => run.completionTokens)
    .filter((value): value is number => typeof value === "number");
  const spread = counts.length === 5 ? Math.max(...counts) - Math.min(...counts) : null;
  return { temperature, distinct, spread };
}
`,
          "n=5 и разброс токенов"
        ),
      ]
    ),
    lesson(
      "how-llms-work-l5",
      "Галлюцинации и мультимодальность",
      14,
      [
        "Объяснить галлюцинацию как свойство декодера",
        "Не кормить модель скриншотом там, где нужен текст из API",
      ],
      [
        p(
          "Модель продолжает текст, который был бы правдоподобен. Если факта нет в контексте, правдоподобие не равно истине. Сноски она тоже может выдумать. Поэтому citation без проверки URL это декорация."
        ),
        ul([
          "Снижение: закрытый корпус, retrieval, отказ «не знаю», схема, пост-проверка.",
          "Не снижение: «ты должен быть точным» в system prompt как единственная мера.",
        ]),
        p(
          "Мультимодальность значит, что в сообщении может быть картинка или аудио. Это другой тариф и другие дыры: скрытый текст на картинке (indirect injection) вы разберёте на неделе 24. Пока правило: не считайте pixels источником правды без своего OCR/проверки, если от этого зависят деньги или доступ."
        ),
        reading([
          {
            title: "Attention is All You Need",
            url: "https://arxiv.org/abs/1706.03762",
            note: "Оригинал трансформера. Достаточно введения и картинки attention.",
          },
        ]),
      ]
    ),
    lesson(
      "how-llms-work-l6",
      "Локальная модель: Ollama, GGUF и quantization",
      18,
      [
        "Объяснить llama.cpp как движок: CPU и GPU, зачем GGUF, чем он не Ollama",
        "Сравнить RAM, VRAM, CPU и GPU inference",
        "По одному prompt выбрать hosted API или local",
      ],
      [
        p(
          "Локальный inference значит, что веса лежат на этой машине и ответ считает она. Движок, который читает файл GGUF и считает следующий токен, это llama.cpp. У него есть бэкенд на CPU и бэкенд на GPU: веса и KV попадают в RAM или в VRAM. GGUF сделан как один файл этих весов, чтобы движок отобразил его в память без отдельной конвертации на каждом запуске. Ollama это другой слой: демон, библиотека моделей и локальный HTTP. Он не заменяет движок, он его вызывает. Пометка local unavailable и карточка терминов шаг не закрывают. Одной пометки local unavailable недостаточно: нужен замер одного prompt на hosted API и на local и письменный выбор, где жить продукту."
        ),
        h("Quantization, RAM и VRAM"),
        p(
          "Quantization уменьшает точность чисел в весах, чтобы модель влезла в RAM или VRAM. Q4 занимает меньше Q8 и обычно теряет качество на сложной инструкции. CPU inference идёт через оперативную память и ядра процессора. GPU inference держит веса в VRAM. Если VRAM меньше файла, рантайм либо откажется, либо будет сбрасывать слои в RAM и станет медленным."
        ),
        ul([
          "llama.cpp: движок инференса. Считает токены на CPU или на GPU. Это не каталог моделей и не HTTP-демон.",
          "Ollama: демон, библиотека моделей и локальный HTTP. Сам формат токена не задаёт: считает движок вроде llama.cpp.",
          "GGUF: файл квантованных весов для llama.cpp. Ollama читает тот же файл, потому что опирается на этот движок.",
          "Quantization: меньше RAM и VRAM, другая ошибка на том же промпте.",
          "CPU vs GPU: CPU медленнее на больших моделях, GPU упирается в VRAM.",
          "Local embeddings: тот же принцип, отдельная модель. Вектор вопроса и документа должен быть одной локальной моделью.",
        ]),
        h("Лицензия и приватность"),
        p(
          "Licensing читают до скачивания. Веса бывают с запретом на коммерцию или на дообучение. Apache и MIT у кода рантайма не равны лицензии весов. Privacy локальной модели: промпт и ответ не уходят провайдеру, если вы сами не отправили их дальше. На машине остаются файл GGUF, кэш Ollama и ваши логи. Утекает то, что вы положили в промпт и что процесс записал в журнал: ключ, почта, кусок документа. Локальный runtime не лечит лог, который вы сами отправили в чужой сборщик."
        ),
        callout(
          "Что остаётся и что уходит",
          "На машине: GGUF, процесс Ollama, local embeddings, ответ, который вы не переслали. Уходит: любой промпт, который вы всё же послали в hosted API, и поля, которые ваш код пишет во внешний лог.",
          "security"
        ),
        check(
          "Почему карточка терминов не закрывает шаг?",
          "Нужны две строки одного prompt, hosted и local: куда ушёл промпт, TTFT, total, output tokens, стоимость или 0. Выбор hosted или local опирается на privacy, лицензию весов, RAM или VRAM и CPU или GPU. Одной пометки local unavailable недостаточно."
        ),
        reading([
          {
            title: "llama.cpp",
            url: "https://github.com/ggml-org/llama.cpp",
            note: "Движок инференса и формат GGUF. Лицензию весов смотрите у конкретной модели, не у кода движка.",
          },
          {
            title: "Ollama",
            url: "https://github.com/ollama/ollama",
            note: "Демон, библиотека и локальный HTTP поверх движка. Это не замена llama.cpp.",
          },
        ]),
      ]
    ),
  ],
  lab: lab({
    id: "how-llms-work-lab",
    title: "Сетка параметров",
    goal: "Прогнать один prompt через сетку temperature, отдельно сравнить top_p и пять повторов, и посчитать токены одного смысла в четырёх формах.",
    setup: ["Клиент недели 1", "Таблица в markdown или CSV"],
    steps: [
      {
        title: "Фиксируйте prompt",
        body: "Один и тот же system+user. Задача: вернуть JSON { ok: boolean, reason: string } про фразу «доставка завтра».",
        expected: "Промпт записан в репозиторий, не из головы каждый раз.",
      },
      {
        title: "Сетка",
        body: "temperature 0, 0.3, 0.8, 1.2. По 3 прогона. top_p в этой сетке не меняйте. Считайте долю валидного JSON и средние токены.",
        expected: "Таблица 4x3 не пустая.",
      },
      {
        title: "top_p при фиксированной temperature",
        body: "Temperature держите 0.8. Два прогона: top_p 0.1 и top_p 1, тот же prompt. Не ставьте temperature 1.2 и top_p 1 в одной ячейке.",
        expected: "Две строки: доля валидного JSON и средние токены. Менялся только top_p.",
      },
      {
        title: "Пять повторов",
        body: "Тот же prompt, temperature 0.8, пять генераций. Запишите число различных ответов после trim и разброс completion_tokens: max минус min. Если usage один на весь ответ с n: 5, снимите разброс пятью запросами с n: 1. Повторите пятёрку при temperature 0.",
        expected: "Две строки: temperature, distinct, spread. При 0 совпадений обычно больше. Если все пять разные, запишите model id.",
      },
      {
        title: "Четыре формы",
        body: "Один смысл: английская фраза, русская фраза, компактный JSON, короткий код. Одинаковый system, одна модель. Колонка prompt_tokens из usage. Ожидайте, что русский и JSON/код дороже английского. Если вышло иначе, оставьте измеренные числа.",
        expected: "Четыре числа или unknown. Ни одного коэффициента из блога.",
      },
      {
        title: "Вывод",
        body: "Какой профиль оставите для продакшен-извлечения и почему. Учтите сетку temperature, сравнение top_p и разброс пяти повторов.",
        expected: "Один выбранный профиль + риск.",
      },
      {
        title: "Контролируемый обрыв",
        body: "Тот же prompt, temperature 0. Занизьте max tokens так, чтобы JSON не закрылся. Запишите finish_reason, completion_tokens и итог JSON.parse. Поднимите max tokens и повторите один раз тем же текстом.",
        expected: "Две строки одного prompt. Первая: finish_reason=length, JSON.parse не прошёл. Вторая: JSON разбирается.",
      },
      {
        title: "Один prompt, hosted и local",
        body: "Тот же prompt. Две строки замера, обе обязательны: hosted API и local. Колонки: куда ушёл промпт, TTFT ms, total ms, output tokens, стоимость или «0 provider». Hosted это провайдер, промпт уходит с машины. Local это эта машина: llama.cpp читает GGUF на CPU или GPU, либо Ollama отдаёт локальный HTTP и зовёт тот же класс движка. Карточка терминов без двух строк замера шаг не закрывает. Одной пометки local unavailable недостаточно. После таблицы выберите, где жить продукту: hosted или local. В выборе четыре опоры: privacy (промпт ушёл провайдеру или остался на машине), licensing весов, влезает ли файл в RAM или VRAM, CPU или GPU.",
        expected: "Две заполненные строки одного prompt: hosted и local, с TTFT, total, output tokens и куда ушёл промпт. Выбор hosted или local опирается на privacy, лицензию весов, RAM/VRAM и CPU vs GPU. Карточка терминов без замера не принимается. Одной пометки local unavailable недостаточно.",
      },
    ],
    troubleshooting: [
      {
        problem: "Модель всегда один текст",
        fix: "Провайдер мог зажать sampling. Зафиксируйте model id и поля ответа.",
      },
      {
        problem: "Провайдер отверг n или top_p",
        fix: "Пять отдельных вызовов с n: 1. В таблице напишите sequential. Temperature и текст prompt не меняйте.",
      },
    ],
    reflection: [
      "Где вариативность полезна, где вредна?",
      "Сколько стоила сетка относительно одного вызова?",
      "На ваших числах русский и код дороже английского того же смысла или нет?",
      "Что не сработало на обрыве: на каком prompt, какой finish_reason и почему причина в max tokens?",
      "Как проверить гипотезу: что изменено в max tokens, стало ли лучше и чем это доказано во второй строке?",
      "Что в локальном прогоне осталось на машине, а что всё равно могло утечь логом?",
      "По двум строкам одного prompt вы оставили hosted или local, и какая из четырёх опор это решила?",
    ],
  }),
  practice: exercise({
    id: "how-llms-work-practice",
    title: "Разбор двух расхождений",
    time: "1.5-2 часа",
    context: "Коллега говорит, что «модель нестабильна». Вам нужны факты, не ощущения.",
    requirements: [
      "Два ответа на один prompt с разными параметрами или seed",
      "Объяснение в README: tokenizer, sampling, обрезка, контекст",
      "Рекомендация профиля для JSON-задачи",
    ],
    constraints: ["Нельзя сказать «ну это ИИ» без механизма"],
    acceptance: [
      "Есть сырые ответы",
      "Есть гипотеза и проверка",
      "Есть оценка стоимости эксперимента",
    ],
    tests: ["Человек может повторить прогон по README"],
    hints: [
      { title: "Подсказка 1", text: "Сначала докажите, что prompt байт-в-байт один." },
      { title: "Подсказка 2", text: "Смотрите finish_reason: length это не «креатив»." },
      { title: "Подсказка 3", text: "Сравните usage. Если вход разный, это не sampling." },
    ],
    solution:
      "Зафиксировать messages в файле. Два вызова с temperature 0 и 0.9. Если при 0 ответы разные, писать о недетерминизме провайдера, не о «темпераменте модели». Если JSON обрезан, увеличить max tokens или просить короче.",
  }),
  prompts: [
    promptT({
      id: "how-llms-work-p1",
      title: "Объяснить параметр бизнесу",
      purpose: "Перевод temperature на человеческий",
      when: "Стейкхолдер просит «сделать креативнее»",
      placeholders: ["{{feature}}"],
      text: `Объясни простыми словами, что такое temperature для фичи {{feature}}.
Два абзаца. Один риск. Один пример, когда повышать нельзя.`,
      explanation: "Учит не прятать рычаги за жаргоном.",
      limitations: "Не заменяет таблицу с реальными прогонами.",
    }),
  ],
  quiz: quiz("how-llms-work-quiz", [
    q("w2-q1", "conceptual", "Что видит модель за пределами context window?", ["Кэш диска", "Ничего, пока вы не положили это в запрос", "Всю историю аккаунта", "Интернет по умолчанию"], 1, "Нет скрытой памяти о вашем вчерашнем чате, если вы её не передали."),
    q("w2-q2", "scenario", "JSON периодически обрывается на 256 токене. Что проверить первым?", ["Цвет темы Cursor", "max tokens и finish_reason=length", "Нужен ли Kubernetes", "Температуру 2.0"], 1, "Обрезка это лимит выхода, не «характер»."),
    q("w2-q3", "architecture", "Fine-tune вместо прайса в контексте. В чём риск?", ["Модель станет дешевле гарантированно", "Вы лечите нехватку данных дообучением и платите датасетом", "Tokenizer сломается", "Attention запрещён"], 1, "Сначала контекст и retrieval."),
    q("w2-q4", "debugging", "Эмбеддинги «не ищут». Часто причина:", ["Смешали векторы разных моделей/размерностей", "Мало Tailwind", "Нет Docker Swarm", "Слишком строгий TypeScript"], 0, "Индекс и query должны быть одной моделью."),
    q("w2-q5", "conceptual", "Галлюцинация это:", ["Баг GPU только", "Правдоподобное продолжение без опоры на факт", "Всегда злой jailbreak", "Ошибка DNS"], 1, "Декодер оптимизирует правдоподобие, не истину."),
    q(
      "w2-q6",
      "scenario",
      "JSON сломался после того, как подняли и temperature, и top_p. Что мешает выводу?",
      [
        "Два рычага сдвинули сразу, сетка не отделяет причину",
        "Нужен fine-tune прайса",
        "Эмбеддинги разной размерности",
        "Контекст 1M всегда дешевле короткого",
      ],
      0,
      "Temperature и top_p режут одно распределение. Сетку temperature гоняйте без смены top_p. top_p сравнивайте отдельно при 0.8."
    ),
    q(
      "w2-q7",
      "debugging",
      "Пять choices пришли одним запросом с n: 5, spread completion_tokens пустой. Почему?",
      [
        "usage общий на ответ, разброс токенов так не снять",
        "Tokenizer не умеет русский",
        "temperature 0 запрещает usage",
        "Индекс эмбеддингов собран другой моделью",
      ],
      0,
      "Для spread нужны пять вызовов с n: 1 и отдельным usage.completion_tokens. n: 5 даёт один счётчик."
    ),
    q(
      "w2-q8",
      "architecture",
      "Извлечение полей и брейншторм идей сидят на одной temperature 0.8. Что сменить?",
      [
        "Два профиля: низкая температура для JSON, выше для идей",
        "Reasoning на каждое сохранение заметки",
        "Дообучить модель на прайсе до retrieval",
        "Считать бюджет по strlen",
      ],
      0,
      "Для схемы нужен низкий sampling и валидация. Идеи терпят больший разброс. Один 0.8 на весь продукт смешивает задачи."
    ),
    q(
      "w2-q9",
      "scenario",
      "На ноутбуке нет Ollama. Как закрыть тему локальной модели?",
      [
        "Написать local unavailable и сдать только строку hosted API",
        "Заполнить карточку терминов и не замерять local",
        "Поставить llama.cpp или Ollama, снять тот же prompt на hosted и на local и выбрать, где жить продукту",
        "Смешать векторы hosted embeddings и local embeddings в одном индексе",
      ],
      2,
      "Замер одного prompt на hosted и на local обязателен. Карточка терминов его не заменяет. Выбор опирается на privacy, лицензию весов, RAM/VRAM и CPU vs GPU."
    ),
  ]),
  artifact: artifact({
    result: "Отчёт экспериментов с параметрами и выбранный профиль генерации.",
    repository: "Папка experiments/ с таблицей и сырыми ответами.",
    demo: "Команда повторного прогона в README.",
    readme: ["prompt", "сетка temperature", "top_p при 0.8", "distinct и spread для n=5", "токены en/ru/json/code", "вывод", "стоимость"],
    architecture: ["один клиент, разные generation profiles"],
    tests: ["повтор запуска даёт ту же таблицу структуры"],
    checklist: [
      { id: "how-llms-work-a1", text: "Таблица параметров сохранена" },
      { id: "how-llms-work-a2", text: "Есть вывод для продакшен-профиля" },
      { id: "how-llms-work-a3", text: "Стоимость эксперимента посчитана" },
      { id: "how-llms-work-a4", text: "Токены en, ru, json и code записаны с одной модели" },
      { id: "how-llms-work-a5", text: "Один prompt: строки hosted и local и выбор, где жить продукту" },
    ],
  }),
  recall: [
    {
      fromWeek: "environment-llm-api",
      question: "Почему ключ не живёт в браузере?",
      answer: "Это секрет счёта. Клиент его вытащит.",
    },
  ],
  decisionCards: [
    decision({
      id: "how-llms-work-d1",
      title: "Маленькая или большая модель",
      optionA: "Маленькая / дешёвая",
      optionB: "Большая / reasoning",
      useA: ["классификация", "извлечение полей", "высокий QPS", "жёсткий JSON"],
      useB: ["неоднозначная спецификация", "ревью архитектуры", "редкий сложный кейс"],
      tradeoffs: "Большая модель дороже и медленнее. Маленькая тупее на длинной логике, если не дать структуру.",
      mistake: "Reasoning-модель на каждом нажатии «сохранить заметку».",
    }),
    decision({
      id: "how-llms-work-d2",
      title: "Hosted API или local",
      optionA: "Hosted API",
      optionB: "Local",
      useA: ["веса нельзя класть на эту машину", "нужен провайдерский SLA", "файла нет в RAM и VRAM"],
      useB: ["промпт не должен уходить с машины", "лицензия весов это разрешает", "GGUF влезает в RAM или VRAM"],
      tradeoffs: "Hosted забирает промпт и берёт плату провайдера. Local оставляет промпт на машине, стоит 0 провайдеру и упирается в лицензию весов, RAM или VRAM и в CPU или GPU. llama.cpp считает токены. Ollama даёт демон и локальный HTTP.",
      mistake: "Сдать карточку терминов вместо двух строк одного prompt.",
    }),
  ],
  learningObjectives: [
    "Показать, что вне context window для модели ничего нет, пока это не в запросе.",
    "Записать prompt_tokens одного смысла в формах en, ru, json и code на одной модели.",
    "Сравнить temperature и top_p по одному рычагу и посчитать долю валидного JSON.",
    "По пяти повторам записать distinct и spread completion_tokens при temperature 0.8 и 0.",
    "Объяснить llama.cpp как движок под GGUF и чем демон Ollama от него отличается.",
    "По одному prompt сравнить hosted и local и выбрать, где жить продукту.",
  ],
  experiments: [
    {
      id: "how-llms-work-exp-sampling",
      question: "Как форма текста, temperature, top_p и пять повторов меняют токены и стабильность JSON?",
      method:
        "Один prompt. Сетка temperature 0, 0.3, 0.8, 1.2 по 3 прогона, top_p не менять. Отдельно temperature 0.8 и top_p 0.1 против 1. Пять повторов при 0.8 и при 0. Четыре формы одного смысла: ru, en, json, code, одна модель.",
      metrics: ["prompt_tokens", "доля валидного JSON", "distinct", "spread completion_tokens"],
    },
    {
      id: "how-llms-work-exp-hosted-local",
      question: "На одном prompt этот продукт остаётся на hosted API или переезжает на local?",
      method:
        "Один prompt. Две строки: куда ушёл промпт, TTFT, total, output tokens, стоимость или 0. Local считает llama.cpp или Ollama на этой машине. Затем выбор: privacy, лицензия весов, RAM/VRAM, CPU vs GPU. Карточка терминов замер не заменяет.",
      metrics: ["TTFT ms", "total ms", "output tokens", "provider cost"],
    },
  ],
  failureModes: [
    {
      id: "how-llms-work-f1",
      symptom: "JSON обрывается на одном и том же месте.",
      cause: "max tokens режет выход, finish_reason=length.",
      check: "Смотрите finish_reason и completion_tokens. Это не «креатив» temperature.",
    },
    {
      id: "how-llms-work-f2",
      symptom: "Пять ответов при temperature 0 все разные, вывод списан на характер модели.",
      cause: "Промпт не был байт-в-байт одним или провайдер оставил шум.",
      check: "Сверьте messages и model id. Если вход один, запишите недетерминизм провайдера.",
    },
    {
      id: "how-llms-work-f3",
      symptom: "В отчёте карточка Ollama и GGUF, а строки local с TTFT нет.",
      cause: "Термины заменили замер одного prompt на hosted и на local.",
      check: "Две строки одного prompt и выбор hosted или local по privacy, лицензии весов, RAM/VRAM и CPU vs GPU.",
    },
  ],
  metrics: [
    { name: "prompt_tokens", how: "usage.prompt_tokens для en, ru, json и code. Одна модель, один system." },
    { name: "доля валидного JSON", how: "Доля ответов, которые парсятся в { ok, reason }, по ячейке сетки." },
    { name: "distinct", how: "Число разных текстов после trim в пяти повторах." },
    { name: "spread completion_tokens", how: "max минус min по пяти отдельным usage. Нет пяти чисел значит null." },
    { name: "TTFT ms", how: "Время до первого токена на том же prompt для hosted и для local. Нет замера значит шаг не сдан." },
  ],
  artifactRubric: {
    criteria: [
      {
        id: "how-llms-work-r1",
        name: "Сетка temperature",
        weight: 20,
        evidence: "Таблица 4 температуры × 3 прогона: доля валидного JSON и средние токены, top_p не менялся.",
      },
      {
        id: "how-llms-work-r2",
        name: "top_p отдельно",
        weight: 20,
        evidence: "Две строки при temperature 0.8: top_p 0.1 и 1, тот же prompt.",
      },
      {
        id: "how-llms-work-r3",
        name: "Пять повторов",
        weight: 20,
        evidence: "Две строки temperature 0.8 и 0: distinct и spread completion_tokens.",
      },
      {
        id: "how-llms-work-r4",
        name: "Четыре формы и профиль",
        weight: 20,
        evidence: "prompt_tokens en, ru, json, code с одной модели, выбранный профиль и стоимость сетки.",
      },
      {
        id: "how-llms-work-r5",
        name: "Hosted и local",
        weight: 20,
        evidence:
          "Один prompt, две строки замера hosted и local: куда ушёл промпт, TTFT, total, output tokens, стоимость или 0. Выбор hosted или local по privacy, лицензии весов, RAM/VRAM и CPU vs GPU. Карточка терминов без замера не проходит.",
      },
    ],
  },
  sources: [
    {
      title: "Attention is All You Need",
      url: "https://arxiv.org/abs/1706.03762",
      kind: "paper",
      checkedAt: "2026-09-21",
    },
    {
      title: "llama.cpp",
      url: "https://github.com/ggml-org/llama.cpp",
      kind: "reference",
      checkedAt: "2026-09-22",
    },
    {
      title: "Ollama",
      url: "https://github.com/ollama/ollama",
      kind: "reference",
      checkedAt: "2026-09-22",
    },
  ],
  contentVersion: "2026.09",
  lastReviewedAt: "2026-09-21",
  securityNotes: ["Длинный контекст увозит секреты провайдеру. В окно кладите только то, без чего ответ не собрать."],
  costNotes: ["Токены пишите из usage, не из strlen. Reasoning и длинное окно поднимают счёт."],
});
