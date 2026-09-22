import { prisma } from "@/server/db";
import type { McpDeps } from "@/server/mcp";
import { searchCourse } from "@/server/semantic-search";

export function liveMcpDeps(): McpDeps {
  return {
    search: async (query) => {
      const result = await searchCourse(query);
      if (!result.ok) throw new Error(result.error);
      return result.hits;
    },
    progress: async (userId, weekSlug) => {
      const rows = await prisma.weekProgress.findMany({
        where: { userId, ...(weekSlug ? { weekSlug } : {}) },
        select: { weekSlug: true, percent: true, completedAt: true },
        orderBy: { weekSlug: "asc" },
      });
      return rows.map((row) => ({
        weekSlug: row.weekSlug,
        percent: row.percent,
        completed: Boolean(row.completedAt),
      }));
    },
    notes: async (userId, weekSlug) => {
      const rows = await prisma.note.findMany({
        where: { userId, ...(weekSlug ? { weekSlug } : {}) },
        select: { key: true, body: true, weekSlug: true, lessonId: true },
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((row) => ({
        key: row.key,
        body: row.body,
        weekSlug: row.weekSlug,
        lessonId: row.lessonId,
      }));
    },
  };
}
