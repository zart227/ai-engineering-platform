import { notFound } from "next/navigation";
import { WeekWorkspace } from "@/components/week-workspace";
import { getWeek, weeks } from "@course";
import { requireUser } from "@/server/auth";
import { mergeAssessmentView } from "@/server/artifact-assessment";
import { loadLearningState, recordWeekOpened, summarizeWeeks } from "@/server/progress";
import { toWeekClientPayload } from "@/server/week-client-payload";
import { weekLabel } from "@/lib/week-label";

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
  return { title: `${weekLabel(week)}. ${week.short}`, description: week.goal };
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
  await recordWeekOpened(user.id, week.slug);
  const state = await loadLearningState(user.id);
  const row = summarizeWeeks(state).find((item) => item.week.slug === slug);
  const answer = state.answers.find((item) => item.exerciseId === week.practice.id);
  const exerciseProgress = state.exercises.find((item) => item.exerciseId === week.practice.id);
  const artifact = state.artifacts.find((item) => item.weekSlug === week.slug);
  const assessment = state.assessments.find((item) => item.weekSlug === week.slug);
  const assessmentView = mergeAssessmentView(
    week,
    assessment
      ? {
          source: assessment.source,
          score: assessment.score,
          passed: assessment.passed,
          assessedAt: assessment.assessedAt,
          criteria: assessment.criteria.map((criterion) => ({
            criterionId: criterion.criterionId,
            met: criterion.met,
            evidence: criterion.evidence,
            weight: criterion.weight,
          })),
        }
      : null
  );
  const quiz = state.quizzes.get(week.slug);
  const note = state.notes.find((item) => item.key === `${week.slug}-lab`);

  return (
    <WeekWorkspace
      key={week.slug}
      week={toWeekClientPayload(week, { hintsUnlocked: exerciseProgress?.hintsUsed ?? 0 })}
      initial={{
        completedLessons: state.lessons
          .filter((item) => item.weekSlug === week.slug && item.completedAt)
          .map((item) => item.lessonId),
        labDone: Boolean(state.labs.find((item) => item.labId === week.lab.id)?.completedAt),
        practiceDone: Boolean(
          state.exercises.find((item) => item.exerciseId === week.practice.id)?.completedAt
        ),
        artifactDone: Boolean(row?.parts.artifact),
        artifactNotes: artifact?.notes ?? "",
        githubUrl: artifact?.githubUrl ?? "",
        demoUrl: artifact?.demoUrl ?? "",
        artifactAssessment: assessmentView
          ? {
              score: assessmentView.score,
              passed: assessmentView.passed,
              source: assessmentView.source,
              criteria: assessmentView.criteria.map((criterion) => ({
                criterionId: criterion.criterionId,
                name: criterion.name,
                weight: criterion.weight,
                expectedEvidence: criterion.expectedEvidence,
                met: criterion.met,
                evidence: criterion.evidence,
              })),
            }
          : null,
        practiceBody: answer?.body ?? "",
        practiceGithub: answer?.githubUrl ?? "",
        practiceResult: answer?.resultUrl ?? "",
        hintsUsed: exerciseProgress?.hintsUsed ?? 0,
        solutionViewed: Boolean(exerciseProgress?.solutionViewed),
        note: note?.body ?? "",
        quizPassed: Boolean(quiz?.passed),
        lastQuizScore: quiz?.score ?? null,
        bookmarks: state.bookmarks.map((item) => item.targetId),
        percent: row?.percent ?? 0,
      }}
    />
  );
}
