import { notFound } from "next/navigation";
import { WeekWorkspace } from "@/components/week-workspace";
import { getWeek, weeks } from "@course";
import { requireUser } from "@/server/auth";
import { loadLearningState, summarizeWeeks } from "@/server/progress";

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
  return { title: `Неделя ${week.id}. ${week.short}`, description: week.goal };
}

export default async function WeekPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();
  const state = await loadLearningState(user.id);
  const row = summarizeWeeks(state).find((item) => item.week.slug === slug);
  const answer = state.answers.find((item) => item.exerciseId === week.practice.id);
  const artifact = state.artifacts.find((item) => item.weekSlug === week.slug);
  const quiz = state.quizzes.get(week.slug);
  const note = state.notes.find((item) => item.key === `${week.slug}-lab`);

  return (
    <WeekWorkspace
      key={week.slug}
      week={week}
      initial={{
        completedLessons: state.lessons
          .filter((item) => item.weekSlug === week.slug && item.completedAt)
          .map((item) => item.lessonId),
        labDone: Boolean(state.labs.find((item) => item.labId === week.lab.id)?.completedAt),
        practiceDone: Boolean(
          state.exercises.find((item) => item.exerciseId === week.practice.id)?.completedAt
        ),
        artifactDone: Boolean(artifact?.completed),
        artifactNotes: artifact?.notes ?? "",
        githubUrl: artifact?.githubUrl ?? "",
        demoUrl: artifact?.demoUrl ?? "",
        practiceBody: answer?.body ?? "",
        practiceGithub: answer?.githubUrl ?? "",
        practiceResult: answer?.resultUrl ?? "",
        note: note?.body ?? "",
        quizPassed: Boolean(quiz?.passed),
        lastQuizScore: quiz?.score ?? null,
        bookmarks: state.bookmarks.map((item) => item.targetId),
        percent: row?.percent ?? 0,
      }}
    />
  );
}
