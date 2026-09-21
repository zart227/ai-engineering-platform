import Link from "next/link";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

const typeLabels: Record<string, string> = {
  lesson: "урок",
  glossary: "глоссарий",
  prompt: "промпт",
  decision: "карточка",
};

export default async function BookmarksPage() {
  const user = await requireUser();
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl">Закладки</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Уроки, промпты, карточки решений и термины справочника.
      </p>
      <div className="mt-8 space-y-3">
        {bookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока пусто. Кнопка «В закладки» на уроке или в справочнике.</p>
        ) : null}
        {bookmarks.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase text-muted-foreground">
              {typeLabels[item.targetType] ?? item.targetType}
            </p>
            <Link href={item.href} className="font-medium hover:text-primary">
              {item.title}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
