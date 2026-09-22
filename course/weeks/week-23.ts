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
  recall,
  ul,
  week,
} from "../blocks";

export const week23 = week({
  id: 23,
  slug: "human-in-the-loop",
  moduleId: "m11",
  title: "Пауза, права и журнал",
  short: "HITL",
  track: "engineering",
  status: "ready",
  hours: 10,
  goal:
    "Письмо, удаление и деньги остаются в статусе pending, пока человек с нужной ролью не нажмёт approve. Класс права считается по имени инструмента. Журнал пишет, кто предложил и кто решил.",
  technologies: ["permission model", "audit log", "TypeScript"],
  overview: {
    why:
      "Модель предлагает имя инструмента. Side effect делает ваш код. Если отправка стоит в том же вызове, человек уже не успевает остановить письмо.",
    prerequisites: [
      "неделя 11: allowlist и журнал вызова",
      "неделя 12: observation возвращается в цикл",
      "неделя 22: необратимый узел не переигрывают",
    ],
    productionUse: ["отправка письма", "удаление записи", "платёж"],
    previousKnowledge: [
      "исполняется только имя из списка",
      "повтор side effect без ключа дублирует действие",
      "успешный необратимый шаг не откатывают новым планом",
    ],
  },
  lessons: [
    lesson(
      "hitl-l1",
      "Письмо уходит в том же вызове",
      16,
      ["Увидеть side effect до решения человека", "Отделить предложение модели от транспорта"],
      [
        p(
          "Агент «хочет отправить письмо»: в тесте это вызов с именем send_email и аргументами to и body. Если функция сразу кладёт письмо в транспорт, счётчик sent равен 1 до любой кнопки. Ошибку в адресе уже не остановить. На неделе 22 такой узел помечен необратимым: после успеха его не пересобирают."
        ),
        p(
          "В Laravel это тот же момент, что Mail::send или уведомление в очереди, которая уже взяла job. Во Vue спиннер «агент печатает» этот момент прячет. На этой неделе транспорт учебный: объект со счётчиком, без SMTP и без сети. Дыра видна по счётчику, не по реальному ящику."
        ),
        code(
          "ts",
          `export type Mailbox = { sent: { to: string; body: string }[] };

export function sendEmailNow(args: { to: string; body: string }, box: Mailbox) {
  box.sent.push(args);
  return { ok: true as const };
}
`,
          "Так письмо уже ушло"
        ),
        compare(
          "Один вызов",
          "Имя send_email сразу вызывает транспорт. Человеку нечего одобрять.",
          "Имя send_email пишет запись и останавливается. Транспорт вызывается отдельной функцией, когда статус уже approved."
        ),
        check(
          "Модель вернула send_email, а человек ещё не нажал кнопку. Чему равен счётчик фикстуры?",
          "Нулю. Предложение модели не является отправкой."
        ),
      ]
    ),
    lesson(
      "hitl-l2",
      "Пауза, решение, продолжение",
      16,
      ["Хранить ожидание у себя", "Вернуть в цикл denied или expired без отправки"],
      [
        p(
          "Пауза это ваша запись, не реплика модели. Поля: id, tool, args, status, assignee, expiresAt, decidedBy. Старт для письма: status pending. Продолжение одно из трёх. Оператор в срок ставит approved, и только тогда фикстура принимает письмо. Оператор ставит denied: транспорт молчит, в цикл уходит observation denied. Время вышло: status expired, транспорт молчит, observation expired."
        ),
        p(
          "Запись pending это checkpoint прогона. Процесс можно остановить и поднять снова. Resume читает ту же запись. Пока статус не approved, транспорт молчит. После approved deliver шлёт один раз. Второй resume с тем же id письмо не повторяет."
        ),
        diagram(
          `send_email
  -> запись pending, транспорт не вызван
pending + operator approve, срок жив -> фикстура sent
pending + operator deny -> observation denied
now >= expiresAt -> expired
клик роли без права -> статус остаётся pending`,
          "Кто двигает статус"
        ),
        code(
          "ts",
          `export type PendingStatus = "pending" | "approved" | "denied" | "expired";

export type PendingAction = {
  id: string;
  tool: string;
  args: { to: string; body: string };
  status: PendingStatus;
  assignee: "operator";
  expiresAt: number;
  decidedBy: string | null;
};

export function decide(
  action: PendingAction,
  decision: "approved" | "denied",
  actor: { kind: "agent" | "user"; id: string; role: "intern" | "operator" },
  now: number
) {
  if (actor.kind !== "user") return { ok: false as const, error: "not a user" };
  if (action.status !== "pending") return { ok: false as const, error: "not pending" };
  if (now >= action.expiresAt) return { ok: false as const, error: "expired", status: "expired" as const };
  if (actor.role !== action.assignee) return { ok: false as const, error: "wrong role" };
  return { ok: true as const, status: decision, decidedBy: actor.id };
}
`,
          "Решение пишет человек, не модель"
        ),
        h("Эскалация"),
        ul([
          "intern не равен assignee. Его клик не меняет status и не вызывает транспорт.",
          "Запись остаётся pending и по-прежнему назначена operator. Это и есть передача вверх.",
          "kind agent отклоняется до смены статуса. Модель не ставит approved себе.",
        ]),
        compare(
          "Где лежит пауза",
          "Последняя фраза модели: «жду подтверждения». После нового хода фразы уже нет.",
          "Строка pending у вас. Цикл читает статус из неё и на deny получает observation."
        ),
        check(
          "Оператор нажал deny. Что видит следующий ход цикла и вызывался ли транспорт?",
          "Observation denied. Счётчик фикстуры не вырос."
        ),
      ]
    ),
    lesson(
      "hitl-l3",
      "Пять классов права",
      16,
      ["Пометить инструмент классом", "Держать ADMIN вне каталога модели"],
      [
        p(
          "Класс висит на имени инструмента в вашем каталоге. Текст цели в каталог не входит. READ в своём tenant выполняется сразу: чужой tenantId код отклоняет до чтения. WRITE делится. draft.save пишет черновик в вашу таблицу и обратим, пауза не нужна. send_email покидает процесс, поэтому у него пауза, хотя класс тоже WRITE."
        ),
        ul([
          "DELETE всегда ждёт approve, даже если флаг в каталоге забыли.",
          "FINANCIAL всегда ждёт approve. В учебном агенте платёж без человека не исполняется.",
          "ADMIN в каталог модели не кладут. Неизвестное имя и инструмент класса ADMIN дают deny без pending.",
          "Роль intern на send_email получает deny, строку pending gate не создаёт.",
          "Если запись уже создана и assignee равен operator, клик intern разбирает decide: статус не меняется.",
        ]),
        code(
          "ts",
          `export type Permission = "READ" | "WRITE" | "DELETE" | "FINANCIAL" | "ADMIN";

export type ToolPolicy = {
  name: string;
  permission: Permission;
  requiresApproval: boolean;
};

export function needsHuman(policy: ToolPolicy) {
  if (policy.permission === "DELETE" || policy.permission === "FINANCIAL") return true;
  return policy.requiresApproval;
}

export function gate(policy: ToolPolicy | undefined, role: "intern" | "operator") {
  if (!policy || policy.permission === "ADMIN") return "deny" as const;
  if (role === "intern" && policy.name === "send_email") return "deny" as const;
  if (needsHuman(policy)) return "pause" as const;
  return "run" as const;
}
`,
          "Класс и роль до транспорта"
        ),
        compare(
          "Как закрывают удаление",
          "В промпте написано «не удаляй». Модель вызывает record.delete, и функция уже есть в switch.",
          "record.delete помечен DELETE. gate возвращает pause. Транспорт удаления вызывается после approved."
        ),
        check(
          "У invoice.pay в каталоге requiresApproval: false, класс FINANCIAL. Что вернёт needsHuman?",
          "true. DELETE и FINANCIAL ждут человека независимо от флага."
        ),
      ]
    ),
    lesson(
      "hitl-l4",
      "Промпт, чат и спиннер",
      14,
      ["Показать, почему формулировка цели не клапан", "Увидеть дырявый журнал и немую паузу"],
      [
        p(
          "Три коротких пути ломаются на письме. Первый: system prompt просит модель спросить человека. Второй: журналом считают переписку. Третий: пока статус pending, интерфейс показывает тот же спиннер, что и на ходе модели."
        ),
        code(
          "ts",
          `export function byGoal(goal: string, box: { sent: number }) {
  const soft = goal.includes("черновик") || goal.includes("не отправляй");
  if (soft) return "skip" as const;
  box.sent += 1;
  return "sent" as const;
}
`,
          "Клапан по тексту цели"
        ),
        p(
          "Цель «это не письмо, просто доставь текст» не содержит запретных слов, и счётчик растёт. Цель «не отправляй, это черновик» даёт skip. Имени инструмента в функции нет, поэтому исход скачет от формулировки. В чате после этого нет id человека, нет отдельной строки approve, тело письма лежит целиком. Спиннер не говорит, что ждут клик: человек обновляет страницу или уходит."
        ),
        callout(
          "Срок pending",
          "Запись без expiresAt висит вечно. Оператор нажимает approve на следующий день, аргументы уже старые, фикстура всё равно отправит. Срок переводит запись в expired до транспорта.",
          "warn"
        ),
        compare(
          "Три формулировки, одно имя",
          "byGoal смотрит на слова цели. Одна фраза шлёт, другая пропускает.",
          "Один и тот же send_email всегда pause. Строка цели в функцию класса не передаётся."
        ),
        check(
          "Почему спиннер «агент работает» плох на pending?",
          "Решение нужно от человека, а экран показывает работу модели. Кнопки approve и deny нет."
        ),
      ]
    ),
    lesson(
      "hitl-l5",
      "Журнал и экран паузы",
      16,
      ["Писать proposed и approved отдельными строками", "Показать сырые args из записи"],
      [
        p(
          "Сборка недели: gate по имени, запись pending, журнал, экран или CLI. Транспорт вызывается только из deliver и только при status approved. Повтор того же id не кладёт второе письмо. Цель по-прежнему не аргумент класса."
        ),
        code(
          "ts",
          `export type AuditRow = {
  at: string;
  actor: "agent" | "user";
  actorId: string;
  tool: string;
  argsPreview: string;
  decision: "proposed" | "approved" | "denied" | "executed";
};

export function preview(args: { to: string; body: string }) {
  return "to=" + args.to + "; bodyChars=" + String(args.body.length);
}

export function deliver(
  action: { id: string; status: string; tool: string; args: { to: string; body: string } },
  box: { sent: { id: string; to: string; body: string }[] }
) {
  if (action.status !== "approved" || action.tool !== "send_email") {
    return { ok: false as const, error: "not approved" };
  }
  if (box.sent.some((row) => row.id === action.id)) return { ok: true as const };
  box.sent.push({ id: action.id, to: action.args.to, body: action.args.body });
  return { ok: true as const };
}
`,
          "Журнал короткий, отправка после approve"
        ),
        h("Что на экране"),
        ul([
          "Действие: имя tool и класс, например send_email, WRITE.",
          "Риск одной фразой: письмо уйдёт во внешний ящик, отозвать его план не сможет.",
          "Сырые args из записи pending: to и body. Пересказ модели рядом можно, вместо записи нельзя.",
          "Approve и deny оба на виду. Подпись не «одобри быстро».",
          "Срок и assignee. Если роль intern, текст: ждёт operator, кнопки решения нет.",
          "Для лабы хватает CLI: напечатать те же поля и спросить y/n. y вызывает decide, не транспорт напрямую.",
        ]),
        compare(
          "Две строки журнала",
          "Одна простыня чата. Кто нажал approve, не восстановить.",
          "proposed от actor agent и approved от actor user с actorId. Тело письма в строке заменено длиной."
        ),
        reading([
          {
            title: "OWASP LLM06 Excessive Agency",
            url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/2_0_vulns/LLM06_ExcessiveAgency",
            note: "Пункт про approval перед опасным действием. У вас его делает запись pending и проверка статуса до фикстуры.",
          },
        ]),
        check(
          "Что человек видит на approve, кроме пересказа модели?",
          "Действие, аргументы, риск и сырые args из записи pending. Плюс кто assignee и до какого срока."
        ),
      ]
    ),
  ],
  lab: lab({
    id: "hitl-lab",
    title: "Письмо ждёт approve",
    goal: "send_email не увеличивает счётчик фикстуры, пока operator не поставил approved.",
    setup: [
      "фикстура ящика: массив sent и больше ничего, без SMTP и без сети",
      "массив или таблица pending",
      "журнал в массиве строк",
    ],
    steps: [
      {
        title: "Propose",
        body: "Тест передаёт имя send_email и args. Код пишет pending и строку proposed. deliver не вызывается.",
        expected: "status pending, sent.length равен 0, в журнале actor agent.",
      },
      {
        title: "Approve",
        body: "Пользователь с id и ролью operator вызывает decide, затем deliver. Повтор deliver с тем же id второй строки не добавляет.",
        expected: "sent.length равен 1. В журнале есть approved с этим user id и executed.",
      },
      {
        title: "Deny",
        body: "Новый pending. Оператор ставит denied. deliver вызывают нарочно.",
        expected: "Счётчик не растёт. Наблюдение для цикла: denied.",
      },
      {
        title: "Сбой: действие до approve",
        body: "Нарочно вызовите транспорт в том же шаге, что и предложение модели. Запишите sent до кнопки.",
        expected: "Счётчик 1 до approve. Это сбой. В рабочем пути так не оставляют.",
      },
      {
        title: "Checkpoint и resume",
        body: "Рабочий путь: pending, затем чтение той же записи заново, как после рестарта. До approve sent равен 0. Потом operator ставит approved и deliver один раз. Повтор resume с тем же id второе письмо не добавляет. Колонки таблицы: sent до клика, sent после чтения checkpoint до approve, sent после approve, sent после второго resume.",
        expected: "0, 0, 1, 1. Повтор того же id не шлёт копию.",
      },
    ],
    troubleshooting: [
      {
        problem: "Счётчик стал 1 уже на propose",
        fix: "Транспорт стоит в обработчике имени. Перенесите его в deliver и проверяйте status === approved.",
      },
      {
        problem: "В журнале полное тело письма",
        fix: "В строку пишите preview: адрес и длину body. Полный body остаётся в записи pending для экрана человека.",
      },
    ],
    reflection: [
      "Как закрыть send_email для роли intern целиком, без строки pending?",
      "Чем сырые args на экране отличаются от пересказа, который написала модель?",
      "Что не сработало, когда агент вызвал транспорт до approve?",
      "На каком действии счётчик стал 1 до кнопки?",
      "Почему предложение модели уже оказалось отправкой?",
      "Как проверить гипотезу: pending, рестарт, sent остаётся 0 до approved?",
      "Что вы изменили: где теперь стоит deliver и что читает resume?",
      "Стало ли лучше на рабочем пути?",
      "Какие четыре числа таблицы это доказывают?",
    ],
  }),
  practice: exercise({
    id: "hitl-practice",
    title: "Перефраз цели",
    time: "3 часа",
    context:
      "Каталог прав, запись pending, журнал и фикстура письма. Три разные формулировки цели вызывают один и тот же send_email.",
    requirements: [
      "тип Permission: READ, WRITE, DELETE, FINANCIAL, ADMIN",
      "inbox.list это READ своего tenant, draft.save это WRITE без паузы",
      "send_email ждёт approve, record.delete и invoice.pay ждут approve всегда",
      "инструмента класса ADMIN в каталоге модели нет, gate на такое имя даёт deny",
      "тест: три цели, включая «не отправляй, это черновик», оставляют sent.length равным 0 и status pending",
      "тест: вызов decide от агента или от intern не ставит approved",
      "тест: now >= expiresAt не вызывает транспорт",
      "журнал: proposed и approved, в строке нет тела письма",
      "таблица sent: до approve, после чтения checkpoint, после approved, после второго resume",
    ],
    constraints: [
      "проверка в коде до side effect, не фраза в system prompt",
      "почтовый провайдер не подключать",
      "класс выбирать по имени tool, аргумент goal не читать",
    ],
    acceptance: [
      "перефраз цели не меняет pause и не отправляет письмо",
      "FINANCIAL без approved не исполняется",
    ],
    tests: ["классы", "три формулировки", "чужая роль", "срок", "preview журнала"],
    hints: [
      {
        title: "Подсказка 1",
        text: "Функция класса принимает имя tool. Строку цели в неё не передавайте, тогда обойти её текстом нельзя.",
      },
      {
        title: "Подсказка 2",
        text: "Экран лабы может быть CLI: напечатать tool, args, риск и прочитать y/n. n это deny.",
      },
      {
        title: "Подсказка 3",
        text: "У pending есть expiresAt. Сравнение now >= expiresAt стоит в decide раньше смены статуса.",
      },
    ],
    solution:
      "permissions.ts с каталогом и gate. Запись pending, decide и deliver. Журнал с preview. Тест гоняет три цели в один send_email и проверяет нулевой счётчик до approve.",
  }),
  prompts: [
    promptT({
      id: "hitl-p1",
      title: "Объяснить паузу",
      purpose: "Текст рядом с записью, чтобы человек понял риск.",
      when: "Запись уже pending, кнопки ещё не нажаты.",
      placeholders: ["{{action}}", "{{args}}"],
      text: `Объясни человеку, что агент хочет сделать, чем это рискованно и какие поля args сверить.
Не проси одобрить быстро и не скрывай отказ.
Действие: {{action}}
Аргументы: {{args}}`,
      explanation: "Абзац помогает прочитать запись. На экран всё равно выводят сырые args из pending.",
      limitations: "Текст модели не заменяет запись и не ставит статус approved.",
    }),
    promptT({
      id: "hitl-p2",
      title: "Наблюдение после отказа",
      purpose: "Короткая observation в цикл, когда человек нажал deny.",
      when: "decide уже записал denied, транспорт не вызывался.",
      placeholders: ["{{tool}}", "{{reason}}"],
      text: `Человек отклонил {{tool}}. Причина: {{reason}}.
Верни одно предложение для следующего хода цикла.
Не предлагай тот же tool и не проси поставить approved.`,
      explanation: "Цикл получает observation и продолжает без side effect.",
      limitations: "Этот текст статус не меняет. Статус записал decide.",
    }),
  ],
  quiz: quiz("hitl-quiz", [
    q(
      "w23-q1",
      "architecture",
      "Где решается, можно ли вызвать транспорт send_email?",
      [
        "В system prompt, если модель вежливая",
        "В runtime: имя tool, класс, роль и статус pending",
        "В названии CSS-класса кнопки",
        "В числе токенов цели",
      ],
      1,
      "Промпт не стоит на пути функции. Транспорт смотрит на статус."
    ),
    q(
      "w23-q2",
      "scenario",
      "Цель переписали: «не письмо, а дружеское уведомление». Модель снова вызвала send_email. Что с фикстурой до клика operator?",
      [
        "Письмо уходит, тон цели мягкий",
        "Класс меняется на READ",
        "Счётчик 0, статус pending",
        "Достаточно temperature 0, пауза не нужна",
      ],
      2,
      "Класс привязан к имени. Формулировка цели транспорт не открывает."
    ),
    q(
      "w23-q3",
      "scenario",
      "invoice.pay класса FINANCIAL исполнили без approve, потому что это учебная фикстура. Что не так?",
      [
        "FINANCIAL в учебном агенте всё равно ждёт человека",
        "Фикстура отменяет класс",
        "Платёж относится к READ",
        "Пауза нужна только для SMTP",
      ],
      0,
      "Фикстура заменяет провайдера, не правило класса."
    ),
    q(
      "w23-q4",
      "debugging",
      "Письмо ушло, в журнале есть proposed и approved, у approved пустой actorId. Что вы не сможете установить?",
      [
        "Имя tool",
        "Кто из людей нажал approve",
        "Что статус был pending",
        "Длину body, если preview записан",
      ],
      1,
      "Строка решения без id человека не расследуется."
    ),
    q(
      "w23-q5",
      "conceptual",
      "Где хранить паузу между ходами цикла?",
      [
        "В последней реплике модели",
        "Только в подписи кнопки",
        "Нигде: модель помнит, что ждала",
        "В вашей записи со статусом pending",
      ],
      3,
      "Следующий ход читает вашу запись. Чат модели записью не является."
    ),
    q(
      "w23-q6",
      "debugging",
      "sent равен 1, кнопка approve ещё не нажата. Где сбой?",
      [
        "Так и задумана фикстура",
        "Транспорт вызвался в том же шаге, что и предложение модели",
        "Журнал слишком короткий",
        "Роль intern обязана слать письмо",
      ],
      1,
      "До approved счётчик нулевой. Иначе человек уже не останавливает письмо."
    ),
    q(
      "w23-q7",
      "scenario",
      "Процесс подняли заново. Запись pending на месте, approve ещё нет. Чему равен sent?",
      [
        "0. Resume читает checkpoint и не шлёт",
        "1. Рестарт сам означает согласие",
        "2. Письмо ушло и до паузы, и после",
        "Число токенов цели",
      ],
      0,
      "Checkpoint держит паузу. Транспорт ждёт approved."
    ),
    q(
      "w23-q8",
      "architecture",
      "После approved deliver уже отправил письмо. Resume с тем же id вызывает deliver снова. Сколько писем должно остаться?",
      [
        "Два, на каждый resume",
        "Ноль, approve отменяет отправку",
        "Одно. Повтор того же id не добавляет копию",
        "Столько, сколько слов в цели",
      ],
      2,
      "Checkpoint после успеха тоже читается. Второй deliver с тем же id молчит."
    ),
  ], 70),
  artifact: artifact({
    result: "Модуль прав и журнала: каталог классов, pending, decide, фикстура письма, audit.",
    repository: "Git URL.",
    demo: "Лог: propose не шлёт, approve вызывает фикстуру один раз, три формулировки цели оставляют счётчик нулём.",
    readme: [
      "таблица классов и кто assignee",
      "срок pending",
      "что попадает в preview журнала",
    ],
    architecture: [
      "gate по имени tool и роли до транспорта",
      "deliver только при approved",
      "proposed и approved это две строки с actor",
    ],
    tests: [
      "три формулировки send_email",
      "FINANCIAL без approve",
      "intern и агент не ставят approved",
      "expired не шлёт",
      "preview без тела",
    ],
    checklist: [
      { id: "hitl-a1", text: "Каталог READ, WRITE, DELETE, FINANCIAL, без ADMIN у модели" },
      { id: "hitl-a2", text: "send_email пишет pending и не трогает фикстуру" },
      { id: "hitl-a3", text: "Approve operator шлёт один раз, deny не шлёт" },
      { id: "hitl-a4", text: "Перефраз цели не снимает паузу" },
      { id: "hitl-a5", text: "Журнал: кто предложил, кто одобрил, args без тела письма" },
    ],
  }),
  recall: recall([
    {
      fromWeek: "Неделя 11",
      question: "Что такое allowlist инструментов?",
      answer: "Исполняется только явное имя из списка. На этой неделе у имени ещё есть класс права.",
    },
    {
      fromWeek: "Неделя 22",
      question: "Что делать с необратимым узлом после успеха?",
      answer: "Не исполнять его снова. Письмо после executed не отменяют новым планом. До executed его держит pending.",
    },
    {
      fromWeek: "Неделя 9",
      question: "Зачем ключ идемпотентности на side effect?",
      answer: "Повтор того же события не делает второе действие. Повтор deliver с тем же id письма не шлёт копию.",
    },
  ]),
  decisionCards: [
    decision({
      id: "hitl-d1",
      title: "Пауза на каждый инструмент или пауза по классу",
      optionA: "На каждый tool",
      optionB: "На внешний WRITE, DELETE и FINANCIAL",
      useA: [
        "каталог ещё широкий и классы не размечены",
        "организация требует кнопку даже на чтение",
      ],
      useB: [
        "READ в своём tenant частый",
        "черновик WRITE обратим и остаётся в вашей таблице",
        "письмо, удаление и деньги из процесса уже не забрать",
      ],
      tradeoffs:
        "Пауза на каждое чтение останавливает цикл на поиске. Пауза по классу оставляет READ и черновик быстрыми и держит side effect до кнопки.",
      mistake: "Снять паузу с send_email, потому что цель в промпте звучит как черновик.",
    }),
  ],
  learningObjectives: [
    "Оставить send_email в pending, пока человек с ролью operator не поставил approved.",
    "Поймать сбой, когда транспорт вызывается до approve.",
    "После рестарта прочитать ту же запись и не слать письмо, пока статуса approved нет.",
    "После approved отправить один раз и не повторить письмо на втором resume.",
  ],
  experiments: [
    {
      id: "hitl-exp-approval",
      question: "Когда фикстура письма растёт: до approve, после чтения checkpoint или только после approved?",
      method:
        "Один send_email. Строка сбоя: транспорт в том же шаге, что предложение модели. Строка рабочего пути: pending, чтение записи заново, approve, второй resume. Студент пишет sent на каждой точке.",
      metrics: ["sent before approval", "sent after resume before approval", "sent after approval", "sent on second resume"],
    },
  ],
  failureModes: [
    {
      id: "hitl-f1",
      symptom: "Счётчик sent равен 1, кнопка approve ещё не нажата.",
      cause: "Агент вызывает транспорт в том же шаге, что и предложение модели.",
      check: "До decide с approved sent равен 0. Транспорт стоит в deliver.",
    },
    {
      id: "hitl-f2",
      symptom: "После рестарта письмо уходит само или approve шлёт его дважды.",
      cause: "Запись pending не прочитали или deliver не смотрит id.",
      check: "Resume до approve оставляет sent 0. Второй deliver с тем же id не добавляет строку.",
    },
  ],
  metrics: [
    { name: "sent before approval", how: "Длина фикстуры до клика operator. В рабочем пути 0." },
    { name: "sent after resume before approval", how: "Длина фикстуры после чтения той же pending-записи до approved. В рабочем пути 0." },
    { name: "sent after approval", how: "Длина фикстуры после deliver при status approved. В рабочем пути 1." },
    { name: "sent on second resume", how: "Длина фикстуры после повторного deliver с тем же id. Остаётся 1." },
  ],
  artifactRubric: {
    criteria: [
      {
        id: "hitl-r1",
        name: "Пауза до side effect",
        weight: 25,
        evidence: "send_email пишет pending. До approved sent равен 0.",
      },
      {
        id: "hitl-r2",
        name: "Сбой пойман",
        weight: 25,
        evidence: "Прогон, где транспорт вызван в том же шаге, даёт sent 1 до кнопки и записан как сбой.",
      },
      {
        id: "hitl-r3",
        name: "Checkpoint",
        weight: 25,
        evidence: "Повторное чтение pending до approve не шлёт. После approved один раз. Второй resume с тем же id не добавляет письмо.",
      },
      {
        id: "hitl-r4",
        name: "Журнал",
        weight: 25,
        evidence: "Строки proposed и approved с actor. В строке нет тела письма. Агент и intern не ставят approved.",
      },
    ],
  },
  sources: [
    {
      title: "OWASP LLM06 Excessive Agency",
      url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/2_0_vulns/LLM06_ExcessiveAgency",
      kind: "official-docs",
      checkedAt: "2026-09-21",
    },
  ],
  contentVersion: "2026.09",
  lastReviewedAt: "2026-09-21",
  securityNotes: ["Side effect ждёт approved. Агент и роль intern статус не ставят."],
  privacyNotes: ["В журнал пишут preview: адрес и длину body. Полное тело остаётся в записи для экрана человека."],
  costNotes: ["Повтор deliver с тем же id не делает второе письмо."],
});
