"use server";

import { requireUser } from "@/server/auth";
import { saveRecallReview } from "@/server/learning-lab";

export async function markRecallReviewedAction(weekSlug: string, itemIndex: number) {
  const user = await requireUser();
  try {
    return await saveRecallReview(user.id, weekSlug, itemIndex);
  } catch {
    return { ok: false as const, error: "Не удалось записать повтор." };
  }
}
