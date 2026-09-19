import { notFound } from "next/navigation";
import { WeekView } from "@/components/week-view";
import { getWeek, weeks } from "@/lib/course";

export function generateStaticParams() {
  return weeks.map((week) => ({ slug: week.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) return { title: "Неделя не найдена" };
  return {
    title: `Неделя ${week.id}. ${week.short}`,
    description: week.goal,
  };
}

export default async function WeekPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();
  return <WeekView key={week.slug} week={week} />;
}
