import Link from "next/link";
import { ContinueButton } from "@/components/continue-button";
import { WeekGrid } from "@/components/week-grid";
import { courseMeta, weeks } from "@course";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Самостоятельный курс · {courseMeta.length}
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            ИИ встраивается в процесс, а не живёт отдельной вкладкой
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/80 sm:text-lg">
            Шесть недель, один свой проект. Сначала учишься ставить задачу модели.
            Потом проверяешь проблему фактами, выбираешь направление, собираешь
            прототип, выкатываешь живую ссылку и читаешь данные. В конце остаётся
            кейс, а не список сервисов.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContinueButton />
            <Link
              href="/project"
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Сначала завести проект
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <p className="text-sm font-medium">Как устроена неделя</p>
          <ol className="mt-4 space-y-4">
            {[
              ["Смотришь теорию", "Короткие уроки про этап процесса, без каталога тулов."],
              ["Делаешь на своём проекте", "Практика сразу в той задаче, которая станет кейсом."],
              ["Складываешь артефакт", "Бриф, прототип, URL, воронка. Неделя без артефакта не считается."],
            ].map(([title, text], index) => (
              <li key={title} className="flex gap-3">
                <span className="font-heading text-lg text-primary">{index + 1}</span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl tracking-tight">Программа</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Одна неделя, один этап. Структура взята из публичной программы
              курса AI для продуктовых дизайнеров. Материалы здесь свои: теория,
              задания и промпты, которые можно проходить в Cursor, Claude или ChatGPT.
            </p>
          </div>
        </div>
        <WeekGrid />
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          [
            "Кому это",
            "Дизайнеру, вайбкодеру или разработчику, который уже пользуется Cursor «по наитию» и хочет систему от проблемы до данных.",
          ],
          [
            "Что нужно",
            "4-8 часов в неделю, любой чат с нормальной моделью и место для кода. Свой проект лучше учебного. Если проекта нет, возьми одну свою боль и доведи её до ссылки.",
          ],
          [
            "Чего тут нет",
            "Проверки домашек преподавателем и обещания оффера. Есть процесс, критерии и место, куда складывать работу.",
          ],
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-border bg-card p-5">
            <h3 className="font-heading text-xl">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <p className="mt-14 max-w-3xl text-xs leading-5 text-muted-foreground">
        Это независимый учебный курс. Недели повторяют публичную программу
        с {weeks.length} этапами: фундамент, discovery, ideation, валидация,
        имплементация, аналитика. Это не официальные материалы FAANG+ Careers
        и не замена живого потока с разбором домашек.
      </p>
    </div>
  );
}
