# Wave 6: Redis и очередь

База: `origin/main` `1592ea9abc595749c8d0c1661c014203cf15d0ba`.

**W6-REDIS = NOT_APPLICABLE.**

Один процесс Next.js и Postgres уже делают эту работу. Redis, очередь, worker и новая зависимость не добавляются. Wave 7 не начинается.

Топология в коде: `compose.yaml` поднимает один контейнер приложения и Postgres. `scripts/docker-entrypoint.sh` заканчивается на `exec node server.js`. Отдельного процесса и второго инстанса в репозитории нет.

## Login и register rate limit

USE CASE: регистрация останавливается после 5 попыток на email за 15 минут, вход после 8. Счётчик в `src/server/rate-limit.ts`, вызов в `registerUser` и `loginUser`.

CURRENT BOTTLENECK: `Map` в памяти процесса. Рестарт её обнуляет. Второй процесс её не увидит.

EXPECTED LOAD: человек вводит пароль. 8 попыток за 15 минут на один email. Один контейнер, один Node-процесс.

WHY ASYNC: ответ нужен до создания сессии. Проверка это чтение и запись одной записи в `Map`.

WHY POSTGRES IS NOT ENOUGH: Postgres достаточен, если появится второй инстанс: одна строка счётчика на ключ. Второго инстанса нет, поэтому память процесса совпадает с выкладкой.

## Course search indexing

USE CASE: уроки и глоссарий становятся строками `CourseChunk`, и поиск идёт через pgvector. `ensureCourseIndex` вызывают страница `/search`, `GET /api/search` и живой MCP `course.search`.

CURRENT BOTTLENECK: при смене штампа контента первый поиск пишет все чанки одной транзакцией, timeout 60 секунд. Совпадение штампа оставляет один `SELECT`.

EXPECTED LOAD: 167 уроков и 70 терминов, 237 чанков. Тело урока обрезано до 4000 символов. Пересборка идёт при смене контента в Git, один раз на базу, а не на каждого ученика.

WHY ASYNC: ожидание первого поиска после смены контента укладывается в тот же запрос. Следующие поиски читают штамп и пропускают запись.

WHY POSTGRES IS NOT ENOUGH: Postgres хранит чанки, штамп и HNSW-индекс `CourseChunk_embedding_idx`. Повторная работа отсекается строкой штампа.

## Embeddings

USE CASE: `feature-hash-v1` в `src/server/embeddings.ts` считает вектор на 384 измерения из текста урока и из запроса. Внешнего API нет.

CURRENT BOTTLENECK: циклы хеширования в том же процессе. Сетевого вызова и квоты провайдера нет.

EXPECTED LOAD: один короткий запрос на поиск. Весь корпус хешируется только при смене штампа.

WHY ASYNC: вектор запроса нужен до `ORDER BY embedding <=>`. Считать его заранее нечего: текста запроса ещё нет.

WHY POSTGRES IS NOT ENOUGH: Postgres хранит `vector(384)` и сортирует по косинусному расстоянию. Сам хеш это локальный подсчёт токенов.

## AI eval jobs

USE CASE: платформа не гоняет eval модели. Неделя 25 (`evals`) задаёт студенту свой `eval.ts`. В `src/` нет клиента модели и нет таблицы заданий.

CURRENT BOTTLENECK: в этом процессе eval не запускается.

EXPECTED LOAD: ноль прогонов платформы.

WHY ASYNC: с запроса снимать нечего.

WHY POSTGRES IS NOT ENOUGH: результата eval, который Postgres не может хранить, нет. Очередь под будущий тьютор открыла бы Wave 7.

## Document ingestion

USE CASE: текст курса лежит в TypeScript в Git. `buildCourseChunks` читает `weeks` и `glossary` из памяти. Маршрута загрузки файла и корпуса пользователя нет.

CURRENT BOTTLENECK: та же запись по штампу, что и у индекса поиска.

EXPECTED LOAD: 237 чанков при смене контента.

WHY ASYNC: разбор текста уже сделан модулями курса. В рантайме остаётся копия в таблицу.

WHY POSTGRES IS NOT ENOUGH: копия это `INSERT`/`UPDATE` этих строк. Ingest из недель 15–16 живёт в отдельном проекте студента, не в этом приложении.

## Scheduled recall

USE CASE: блок «Сегодня повторить» показывает вопросы недель, которые ученик начал. Срок лежит в `RecallReview.nextReviewAt`. Интервалы 1, 3, 7 и 21 день.

CURRENT BOTTLENECK: главная страница читает строки этого пользователя и отбирает их в `selectDueRecall`. В момент `nextReviewAt` процесс ничего не запускает.

EXPECTED LOAD: 67 вопросов в курсе. На дашборд выходит не больше `DUE_RECALL_LIMIT` (8). Отметка повтора это один `upsert`.

WHY ASYNC: список становится виден при следующей загрузке страницы. Почты и push нет, SMTP в приложении нет.

WHY POSTGRES IS NOT ENOUGH: дата следующего показа уже в Postgres, индекс `(userId, nextReviewAt)`. Страница считает срок чтением.

## Analytics jobs

USE CASE: главная страница считает воронку одного ученика по `LearningEvent`. Событие пишется в том же server action, что и прогресс.

CURRENT BOTTLENECK: `loadLearningFunnel` забирает строки пользователя, `countFunnel` считает их в запросе страницы.

EXPECTED LOAD: один пользователь и 33 недели. Это сотни событий на полный курс, не ночной отчёт по всем ученикам.

WHY ASYNC: вставка и есть событие. Дашборд читает ту же таблицу.

WHY POSTGRES IS NOT ENOUGH: таблица и индексы `(userId, createdAt)`, `(userId, type)` хранят события. Подсчёт идёт по одному пользователю.

## Checklist

- [x] Семь кандидатов прочитаны в коде `1592ea9`
- [x] W6-REDIS = NOT_APPLICABLE
- [x] GATE 6
