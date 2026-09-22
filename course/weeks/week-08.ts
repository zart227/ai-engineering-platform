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

export const week08 = week({
  id: 8,
  slug: "n8n",
  moduleId: "m03",
  title: "n8n как движок",
  short: "n8n",
  track: "automation",
  status: "ready",
  hours: 10,
  goal:
    "Собрать workflow с веткой, под-workflow и error path и понять, какой кусок пора вынести в TypeScript.",
  technologies: ["n8n", "expressions", "Error Trigger", "Execute Sub-workflow"],
  overview: {
    why:
      "n8n быстро соединяет системы. Без модели execution, credentials и ошибок получается прод, который нельзя ни прогнать тестом, ни объяснить через git.",
    prerequisites: ["неделя 7: граф, идемпотентность, cron не равен уникальности"],
    productionUse: ["внутренние интеграции", "операционные уведомления", "прототип маршрута"],
    previousKnowledge: [
      "side effect нельзя повторять вслепую",
      "секреты не в репозитории",
      "выражение это код",
    ],
    asOf: "2026-09-21",
  },
  lessons: [
    lesson(
      "n8n-l1",
      "Workflow, item, execution, credentials",
      18,
      [
        "Отличить определение графа от одного прогона",
        "Хранить секреты отдельно от экспорта",
      ],
      [
        p(
          "Workflow это сохранённый граф узлов. Execution это один прогон с данными. Узел получает items: объекты с json и иногда binary. Путаница «я поправил граф» и «этот прогон уже шёл по старому графу» стоит потерянных писем."
        ),
        ul([
          "Item. Единица данных между узлами. Узел может получить пачку items.",
          "Execution. Запись прогона: какой workflow, чем кончился, на каком узле. Её смотрят, когда прод молчит.",
          "Credentials. Секреты лежат отдельно от графа. Экспорт workflow не должен быть способом вытащить токен.",
          "Публикация. Schedule и production webhook начинают работать по правилам продукта только у опубликованного workflow. Черновик на холсте это не прод.",
        ]),
        diagram(
          `Определение (git / экспорт JSON)
  → публикация
    → trigger
      → execution
        → items между узлами
          → side effect
Ошибка execution → error workflow, если он назначен`,
          "Что есть что"
        ),
        callout(
          "Секреты в execution",
          "Данные прогона могут содержать заголовок Authorization, если webhook его принял. Кто видит Executions, видит эти поля. Не логируйте туда лишнее и не зовите в просмотр всех подряд.",
          "security"
        ),
        check(
          "Почему экспорт JSON не заменяет ревью секретов?",
          "Секрет может сидеть в credentials или в данных прогона, а не в узле, который вы глазами прочитали как «без пароля»."
        ),
        reading([
          {
            title: "n8n credentials",
            url: "https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials.md",
            note: "Секреты отдельно. В полях credential бывают expressions, их считают на каждый execution.",
          },
        ]),
      ]
    ),
    lesson(
      "n8n-l2",
      "Выражения, ветки и Code node",
      18,
      [
        "Читать expression как код",
        "Вынести в Code node то, что в кликах становится ложью",
      ],
      [
        p(
          "Выражение в n8n это JavaScript в двойных фигурных скобках. Оно подставляет данные прошлого узла в параметр. Это не подпись на кнопке. Ошибка синтаксиса и ссылка на узел, который ещё не выполнялся, ломают прогон. Документация прямо говорит: если выражение ссылается на невыполненный узел, его надо переписать или провести связь так, чтобы узел шёл раньше."
        ),
        h("Данные"),
        ul([
          "$json в режиме «на каждый item» это json текущего item.",
          "В Code node $input.all() даёт все входные items, $input.first() и $input.last() края.",
          "Code node по умолчанию Run Once for All Items: код один раз на пачку. Run Once for Each Item запускает код на каждый item.",
          "Вернуть нужно items в форме, которую ждёт следующий узел, обычно объекты с полем json.",
        ]),
        code(
          "js",
          `// Code node, Run Once for All Items
const rows = $input.all().map((item) => item.json);
const seen = new Set();
const unique = [];
for (const row of rows) {
  if (seen.has(row.eventId)) continue;
  seen.add(row.eventId);
  unique.push({ json: row });
}
return unique;
`,
          "Дедуп в Code node"
        ),
        p(
          "IF и Switch оставляйте для явных веток: тип равен bug или billing. Цикл по items есть отдельной механикой. Если выражение разрастается на экран условий, это уже функция: её проще тестировать в репозитории."
        ),
        compare(
          "Логика",
          "Двадцать вложенных IF с копипастой полей.",
          "Code node или HTTP в ваш TypeScript, где на функцию есть тест. В n8n остаётся маршрут."
        ),
        check(
          "Почему $json в Code node «на все items» легко промахнуться?",
          "В этом режиме $json не является произвольным item пачки. Для пачки берут $input.all()."
        ),
        reading([
          {
            title: "n8n Code node",
            url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code",
            note: "Режимы Run Once for All Items и for Each Item.",
          },
          {
            title: "Expressions",
            url: "https://docs.n8n.io/build/work-with-data/transform-data/expressions-for-data-transformation",
            note: "Синтаксис и типичные ошибки ссылок.",
          },
        ]),
      ]
    ),
    lesson(
      "n8n-l3",
      "Под-workflow",
      14,
      [
        "Вынести повтор в вызываемый граф",
        "Задать вход, а не принимать что попало",
      ],
      [
        p(
          "Официальная схема на 2026-09-21: родитель вызывает узел Execute Sub-workflow. У ребёнка первым стоит Execute Sub-workflow Trigger (на холсте его также подписывают When Executed by Another Workflow). Последний узел ребёнка возвращает данные в вызывающий узел."
        ),
        ul([
          "Define using fields: ребёнок называет поля и типы, родитель их заполняет.",
          "Define using JSON example: пример объекта как контракт.",
          "Accept all data: ребёнок берёт что дали. Дыры во входе тогда его забота. Для прод-куска это хуже явных полей.",
          "Вызов умеет ссылаться на workflow по id, файлу, JSON или URL. Id виден в адресе workflow.",
        ]),
        compare(
          "Контракт",
          "Accept all data и надежда, что поле type всегда есть.",
          "Поля type и eventId обязательны. Родитель не собирается без них."
        ),
        check(
          "Зачем под-workflow, если можно скопировать узлы?",
          "Один контракт входа и одно место правки. Копия расходится в тот же день."
        ),
        reading([
          {
            title: "Break workflows into smaller parts",
            url: "https://docs.n8n.io/build/flow-logic/break-workflows-into-smaller-parts",
            note: "Execute Sub-workflow и режимы входа.",
          },
        ]),
      ]
    ),
    lesson(
      "n8n-l4",
      "Расписание, webhook и ошибка",
      18,
      [
        "Развести test URL и production URL",
        "Назначить error workflow",
        "Не считать расписание защитой от двойного side effect",
      ],
      [
        p(
          "Schedule Trigger повторяет идею cron: интервал от секунд до месяцев или своё cron-выражение. Можно несколько правил. Если в расписании переменная, документация предупреждает: значение снимают в момент публикации. Поменяли переменную и не переопубликовали, расписание старое."
        ),
        h("Webhook"),
        ul([
          "Есть test URL и production URL. Production регистрируется, когда workflow опубликован. Данные production-прогона смотрят во вкладке Executions, не на холсте.",
          "Аутентификация вызова: Basic, Header, JWT или None. None значит URL сам по себе секрет, и это плохой секрет: он утекает в логи и чаты.",
          "Список IP ограничивает, кто может дернуть URL. Пустой список не ограничение.",
          "В актуальной документации узла есть опция выражения, которое решает, запускать ли прогон. Если выражение не вычислилось, n8n пишет предупреждение и пропускает запрос, а не отвергает его. Такое выражение не замена подписи.",
        ]),
        h("Error workflow"),
        p(
          "В настройках workflow выбирают error workflow. Он стартует с Error Trigger и запускается, когда execution падает. Один обработчик можно повесить на несколько графов. В данных обычно есть execution.id, url, текст ошибки и lastNodeExecuted, но id и url не приходят, если ошибка в самом trigger и прогон не создался. retryOf есть только у повтора упавшего прогона. Узел Stop And Error роняет прогон специально, чтобы сработал этот путь: например, схема входа не сошлась."
        ),
        callout(
          "Тишина хуже падения",
          "Ветка без error workflow узнаётся от пользователя. Падение trigger и падение середины графа приходят в обработчик разной формой. Разберите обе, не только «узел посередине бросил».",
          "warn"
        ),
        check(
          "Почему URL webhook без аутентификации опасен?",
          "Кто знает адрес, тот запускает side effect. Адрес почти всегда куда-то копируют."
        ),
        reading([
          {
            title: "Handle errors gracefully",
            url: "https://docs.n8n.io/build/flow-logic/handle-errors-gracefully.md",
            note: "Error Trigger, Settings, Stop And Error, форма payload.",
          },
          {
            title: "Webhook node",
            url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook",
            note: "Test и production URL, способы аутентификации.",
          },
          {
            title: "Schedule Trigger",
            url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger",
            note: "Cron и публикация.",
          },
        ]),
      ]
    ),
    lesson(
      "n8n-l5",
      "Когда граф хуже репозитория",
      14,
      [
        "Оставить в n8n коннекторы и маршрут",
        "Вынести домен туда, где есть тест",
      ],
      [
        p(
          "n8n выигрывает, когда нужны готовые коннекторы и граф меняет человек, который не живёт в git. Код выигрывает, когда ветки это домен: деньги, идемпотентность, подпись, сложные края. Тогда n8n вызывает ваш HTTP и не содержит правил в выражениях."
        ),
        ul([
          "Нет нормального diff и ревью на выражение из десяти строк.",
          "Нагрузка и ретраи по каждому событию живут в очереди, не в одном клике.",
          "Секрет в параметре узла, а не в credentials, почти наверняка уедет в экспорт.",
          "Граф без error workflow нельзя считать готовым.",
        ]),
        compare(
          "Граница",
          "Весь биллинг кликами, потому что наглядно.",
          "n8n принимает webhook и зовёт ваш сервис. Правило «один платёж на event id» живёт в коде и в тесте."
        ),
        callout(
          "Можно ли дешевле",
          "Отдельный n8n в проде это ещё один рантайм: бэкапы, права, обновления. Один скрипт по cron дешевле, если коннекторов нет и шагов три.",
          "cost"
        ),
        check(
          "Какой кусок вы не оставите только в GUI?",
          "Тот, чью ошибку вы хотите поймать unit-тестом: подпись, ключ идемпотентности, схема денег."
        ),
      ]
    ),
  ],
  lab: lab({
    id: "n8n-lab",
    title: "Webhook, ветка, ошибка",
    goal: "Граф принимает POST, ветвится по type и роняет неизвестный type в error workflow.",
    setup: [
      "Локальный n8n или его Docker. Если поднять нельзя, сдайте JSON экспорта и отдельный тест контракта входом",
      "Не кладите боевые токены",
    ],
    steps: [
      {
        title: "Вход",
        body: "Webhook с Header auth или иным не-None. Тело: type и eventId. Production URL не включайте в заметку.",
        expected: "Тестовый POST с верным заголовком создаёт execution.",
      },
      {
        title: "Ветка",
        body: "IF или Switch: bug и billing. Третий type ведёт в Stop And Error.",
        expected: "Два счастливых пути и один сознательный провал.",
      },
      {
        title: "Ошибка",
        body: "Отдельный workflow с Error Trigger. В настройках основного выберите его. Уроните Stop And Error и найдите прогон обработчика.",
        expected: "В данных обработчика видно имя упавшего workflow или узла.",
      },
      {
        title: "Таблица двух способов",
        body: "Тот же маршрут type соберите графом и функцией route. Заполните таблицу по своему прогону. Строки: n8n и TypeScript. Колонки: development speed, testability, debugging, version control, observability, deployment, maintainability. Чужие оценки в клетки не копировать.",
        expected: "Семь колонок заполнены для обоих способов.",
      },
      {
        title: "Контролируемый сбой",
        body: "Снимите error workflow в Settings. Холст не трогайте: Stop And Error остаётся, и ветка выглядит обработанной. Пошлите type=unknown. Запишите, упал ли execution и стартовал ли обработчик. Затем снова выберите error workflow и повторите. Оба факта из ваших прогонов.",
        expected: "Сначала обработчик молчит. После назначения в Settings его прогон есть.",
      },
    ],
    troubleshooting: [
      {
        problem: "Production URL молчит",
        fix: "Workflow не опубликован, или вы бьёте в test URL после закрытия холста. Сверьте режим в документации узла.",
      },
      {
        problem: "Error workflow не стартовал",
        fix: "Он должен начинаться с Error Trigger и быть выбран в Settings именно этого workflow.",
      },
    ],
    reflection: [
      "Какое правило из графа вы бы перенесли в тест на TypeScript?",
      "Что оказалось в данных execution лишнего?",
      "Что не сработало, когда error workflow не был выбран?",
      "На каком type вы это увидели?",
      "Почему холст выглядел готовым?",
      "Как вы проверили, что обработчик молчит?",
      "Что вы изменили в Settings?",
      "Стало ли лучше и чем это доказано: два прогона до и после?",
    ],
  }),
  practice: exercise({
    id: "n8n-practice",
    title: "Один процесс двумя способами",
    time: "2 часа",
    context:
      "Один и тот же маршрут type=bug|billing сделайте графом и функцией на TypeScript. Это сравнение, не два продакшена.",
    requirements: [
      "Экспорт workflow в git без секретов",
      "Функция route(type), покрытая тестом",
      "Таблица одного процесса двумя способами. Колонки: development speed, testability, debugging, version control, observability, deployment, maintainability. Клетки из вашего прогона",
      "Честный вывод, что оставите",
    ],
    constraints: [
      "Не подключать боевые системы",
      "Не коммитить credentials",
    ],
    acceptance: [
      "Оба варианта на bug и billing дают один и тот же маршрут",
      "Неизвестный type не молчит",
    ],
    tests: ["Юнит на route", "В экспорте нет значений секретов"],
    hints: [
      {
        title: "Подсказка 1",
        text: "Сравнивайте один входной JSON, не разные продукты.",
      },
      {
        title: "Подсказка 2",
        text: "В коде неизвестный type бросает ошибку. В n8n ту же роль играет Stop And Error.",
      },
      {
        title: "Подсказка 3",
        text: "Если коннектора Slack у вас нет, не считайте это победой n8n в этой задаче.",
      },
    ],
    solution:
      "README со сравнением и вывод: маршрут из двух веток остаётся в коде, потому что тест короче графа. n8n имеет смысл, когда появляется готовый коннектор, которого в репозитории нет.",
  }),
  prompts: [
    promptT({
      id: "n8n-p1",
      title: "Ревью экспорта",
      purpose: "Прочитать граф как текст",
      when: "Перед тем как считать workflow готовым",
      placeholders: ["{{workflow_json}}"],
      text: `Прочитай экспорт n8n как код. Найди:
- нет error workflow или Stop And Error на плохом входе
- секреты в параметрах
- выражения, которые ссылаются на данные без проверки
- куски, которые проще тестировать в репозитории
Экспорт:
{{workflow_json}}
Не предлагай новые интеграции, которых нет в графе.`,
      explanation: "JSON можно ревьюить без кликов.",
      limitations: "Имена узлов меняются между версиями. Сверьте с docs вашей установки.",
    }),
    promptT({
      id: "n8n-p2",
      title: "Контракт под-workflow",
      purpose: "Сузить вход",
      when: "Граф копируют во второй раз",
      placeholders: ["{{steps}}"],
      text: `Эти шаги повторяются:
{{steps}}
Предложи поля входа под-workflow и что вернуть родителю. Режим Accept all data не предлагай, если поля известны.`,
      explanation: "Заставляет назвать контракт до копипасты.",
      limitations: "Узлы в вашей версии называйте по документации, не по памяти модели.",
    }),
  ],
  quiz: quiz("n8n-quiz", [
    q(
      "w8-q1",
      "conceptual",
      "Чем execution отличается от workflow?",
      [
        "Ничем",
        "Workflow это граф, execution это один прогон",
        "Execution хранит только секреты",
        "Workflow нельзя сохранить",
      ],
      1,
      "Граф определяют. Прогон случается."
    ),
    q(
      "w8-q2",
      "architecture",
      "С чего начинается error workflow?",
      [
        "С Webhook без аутентификации",
        "С Error Trigger",
        "С Code node",
        "С ручного клика",
      ],
      1,
      "Так задано в документации n8n. Иначе обработчик не примет ошибку."
    ),
    q(
      "w8-q3",
      "scenario",
      "Выражение Only Run If не вычислилось. Чего нельзя от него ждать?",
      [
        "Записи в лог",
        "Надёжного отказа: при сбое вычисления запрос могут пропустить",
        "Работы опубликованного графа",
        "Полей json",
      ],
      1,
      "Отказ должен быть явным правилом, не побочным эффектом битого выражения."
    ),
    q(
      "w8-q4",
      "debugging",
      "Поменяли переменную в cron и расписание не сдвинулось. Что проверить?",
      [
        "Цвет холста",
        "Публиковали ли workflow заново: значение снимают при публикации",
        "Версию Zod",
        "Наличие embeddings",
      ],
      1,
      "Документация Schedule Trigger описывает именно это."
    ),
    q(
      "w8-q5",
      "architecture",
      "Куда положить правило «один платёж на event id»?",
      [
        "Только в название узла",
        "В код с тестом. n8n может лишь вызвать этот код",
        "В цвет стикера",
        "В промпт без схемы",
      ],
      1,
      "Идемпотентность денег не оставляют в выражении без теста."
    ),
    q(
      "w8-q6",
      "scenario",
      "Один маршрут собран в n8n и в route(). Что обязано быть в таблице?",
      [
        "Только ощущение, что GUI быстрее",
        "Колонки development speed, testability, debugging, version control, observability, deployment, maintainability по вашему прогону",
        "Чужая таблица из блога",
        "Только цена подписки",
      ],
      1,
      "Сравнение одного процесса двумя способами. Клетки заполняете вы."
    ),
    q(
      "w8-q7",
      "debugging",
      "На холсте unknown ведёт в Stop And Error. Error workflow в Settings не выбран. Что увидеть?",
      [
        "Обработчик всегда стартует сам",
        "Execution может упасть, обработчик молчит. Записать оба факта и затем назначить error workflow",
        "Секрет удалится из экспорта сам",
        "Тест route() запустится внутри n8n",
      ],
      1,
      "Узел на холсте не включает обработчик. Его выбирают в Settings."
    ),
    q(
      "w8-q8",
      "architecture",
      "Правило надо покрыть тестом. Где в сравнении обычно сильнее репозиторий?",
      [
        "Только development speed на готовых коннекторах",
        "Testability и version control: diff и unit-тест. n8n может звать этот код",
        "Observability бывает только у холста",
        "Deployment есть только у GUI",
      ],
      1,
      "Код выигрывает там, где ошибку ловит тест и diff. Коннекторы остаются доводом за n8n."
    ),
  ]),
  artifact: artifact({
    result: "Экспорт workflow с веткой и error path плюс сравнение с функцией route.",
    repository: "JSON без секретов и тест route.",
    demo: "Скрин или id тестового execution, без URL с токеном.",
    readme: ["как поднять n8n", "какие type ожидаются", "почему часть логики в коде"],
    architecture: ["webhook → ветка → stop on unknown", "error workflow с Error Trigger"],
    tests: ["route(bug|billing|unknown)", "в JSON нет секретов"],
    checklist: [
      { id: "n8n-a1", text: "Экспорт в git без credentials" },
      { id: "n8n-a2", text: "Неизвестный type не молчит" },
      { id: "n8n-a3", text: "Error workflow назначен" },
      { id: "n8n-a4", text: "Есть письменное сравнение с кодом" },
      {
        id: "n8n-a5",
        text: "Таблица: development speed, testability, debugging, version control, observability, deployment, maintainability",
      },
    ],
  }),
  recall: recall([
    {
      fromWeek: "Неделя 7",
      question: "Что такое идемпотентность прогона?",
      answer: "Повтор того же ключа не создаёт второй side effect. Фаза reserved должна доделываться.",
    },
    {
      fromWeek: "Неделя 5",
      question: "Куда класть правило, которое должно пережить сессию?",
      answer: "В git. Для n8n это ещё и экспорт без секретов, не только память кликов.",
    },
  ]),
  decisionCards: [
    decision({
      id: "n8n-d1",
      title: "n8n или код",
      optionA: "n8n",
      optionB: "TypeScript",
      useA: [
        "нужны готовые коннекторы",
        "граф меняет не только автор репозитория",
        "прототип интеграции",
      ],
      useB: [
        "правило надо покрыть тестом",
        "идемпотентность и деньги",
        "высокая нагрузка и явные ретраи",
      ],
      tradeoffs:
        "GUI быстрее на коннекторах и хуже ревьюится. Код наоборот. Их стыкуют: граф зовёт сервис.",
      mistake: "Переписать биллинг кликами, потому что холст наглядный.",
    }),
  ],
  learningObjectives: [
    "Собрать webhook, ветку bug или billing и error workflow с Error Trigger.",
    "Заполнить таблицу n8n и TypeScript по одному процессу: development speed, testability, debugging, version control, observability, deployment, maintainability.",
    "Увидеть молчащий обработчик, когда Stop And Error есть, а error workflow в Settings не выбран.",
    "Не класть секреты в экспорт workflow.",
  ],
  experiments: [
    {
      id: "n8n-exp-compare",
      question: "Чем один маршрут type отличается в n8n и в TypeScript по семи колонкам?",
      method:
        "Один вход: bug, billing, unknown. Граф и функция route. Таблица из своего прогона, колонки development speed, testability, debugging, version control, observability, deployment, maintainability. Отдельно: unknown без error workflow в Settings и с ним.",
      metrics: [
        "development speed",
        "testability",
        "debugging",
        "version control",
        "observability",
        "deployment",
        "maintainability",
      ],
    },
  ],
  failureModes: [
    {
      id: "n8n-f1",
      symptom: "Unknown роняет execution, error workflow не стартует.",
      cause: "Stop And Error на холсте, обработчик не выбран в Settings этого workflow.",
      check: "Два прогона: до назначения и после. Во втором в обработчике есть имя упавшего узла.",
    },
    {
      id: "n8n-f2",
      symptom: "В экспорте или в execution лежит токен.",
      cause: "Секрет в параметре узла или заголовок Authorization принят и открыт в просмотре.",
      check: "В JSON нет значений секретов. Кто видит Executions, тот не видит лишний заголовок.",
    },
  ],
  metrics: [
    {
      name: "development speed",
      how: "Ваша заметка: сколько заняла сборка графа и сколько функция route. Не чужой бенчмарк.",
    },
    {
      name: "testability",
      how: "Где вы запустили проверку сами: unit на route или только ручной POST. Напишите, что именно гоняли.",
    },
    {
      name: "debugging",
      how: "Где вы увидели сбой unknown: execution, error workflow или вывод теста.",
    },
    {
      name: "version control",
      how: "Что легло в git: экспорт без секретов и diff функции. Что осталось только на холсте.",
    },
    {
      name: "observability",
      how: "Какой след прогона вы открыли: Executions или лог теста. Что в нём лишнего.",
    },
    {
      name: "deployment",
      how: "Что нужно опубликовать, чтобы production URL ожил, и как вы запускаете функцию локально.",
    },
    {
      name: "maintainability",
      how: "Куда вы положите следующую правку правила: выражение или тест. Одна фраза из вашего сравнения.",
    },
  ],
  artifactRubric: {
    criteria: [
      {
        id: "n8n-r1",
        name: "Граф и ошибка",
        weight: 25,
        evidence: "Экспорт без секретов. Unknown не молчит. Error workflow назначен.",
      },
      {
        id: "n8n-r2",
        name: "Таблица семи колонок",
        weight: 25,
        evidence:
          "Строки n8n и TypeScript. Колонки development speed, testability, debugging, version control, observability, deployment, maintainability из своего прогона.",
      },
      {
        id: "n8n-r3",
        name: "Контролируемый сбой",
        weight: 25,
        evidence: "Без error workflow в Settings обработчик молчит. После назначения прогон обработчика есть.",
      },
      {
        id: "n8n-r4",
        name: "route()",
        weight: 25,
        evidence: "Тест на bug, billing и unknown. Тот же маршрут, что у графа.",
      },
    ],
  },
  sources: [
    {
      title: "n8n documentation",
      url: "https://docs.n8n.io/",
      kind: "official-docs",
      checkedAt: "2026-09-21",
    },
  ],
  contentVersion: "2026.09",
  lastReviewedAt: "2026-09-21",
  securityNotes: ["Credentials отдельно от экспорта. Webhook без аутентификации не оставлять: URL утекает."],
  privacyNotes: ["Execution может содержать Authorization и тело запроса. В заметку URL с токеном не копировать."],
  costNotes: ["Отдельный n8n это ещё один рантайм. Три стабильных шага без коннектора дешевле скриптом."],
});
