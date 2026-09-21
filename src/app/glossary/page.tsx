import Link from "next/link";
import { glossary } from "@course/glossary";
import { weekHref, getWeek } from "@course";
import { getSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { BookmarkButton } from "@/components/bookmark-button";

export default async function GlossaryPage() {
  const session = await getSession();
  const saved = session
    ? await prisma.bookmark.findMany({
        where: { userId: session.user.id, targetType: "glossary" },
        select: { targetId: true },
      })
    : [];
  const ids = new Set(saved.map((item) => item.targetId));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl">Справочник</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Короткие определения. Урок рядом, если термин привязан к неделе.
      </p>
      <div className="mt-8 space-y-4">
        {glossary.map((term) => {
          const week = term.weekSlug ? getWeek(term.weekSlug) : null;
          return (
            <article key={term.id} id={term.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-heading text-2xl">{term.term}</h2>
                <BookmarkButton
                  targetType="glossary"
                  targetId={term.id}
                  title={term.term}
                  href={`/glossary#${term.id}`}
                  initial={ids.has(term.id)}
                />
              </div>
              <p className="mt-2 text-sm leading-6">{term.definition}</p>
              {week ? (
                <Link className="mt-2 inline-block text-sm text-primary" href={weekHref(week)}>
                  Неделя {week.id}. {week.short}
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
