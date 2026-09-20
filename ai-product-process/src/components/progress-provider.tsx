"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { weeks } from "@course";
import { type ProgressState, type ProjectState } from "@/lib/progress";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  patchDone,
  patchNote,
  patchProject,
  resetProgress,
  subscribeProgress,
} from "@/lib/progress-store";

type ProgressContextValue = {
  ready: boolean;
  state: ProgressState;
  setDone: (id: string, value: boolean) => void;
  setNote: (id: string, value: string) => void;
  setProject: (patch: Partial<ProjectState>) => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot
  );

  const ready = true;

  const setDone = useCallback((id: string, value: boolean) => {
    patchDone(id, value);
  }, []);

  const setNote = useCallback((id: string, value: string) => {
    patchNote(id, value);
  }, []);

  const setProject = useCallback((patch: Partial<ProjectState>) => {
    patchProject(patch);
  }, []);

  const reset = useCallback(() => {
    resetProgress();
  }, []);

  const value = useMemo(
    () => ({ ready, state, setDone, setNote, setProject, reset }),
    [ready, state, setDone, setNote, setProject, reset]
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within ProgressProvider");
  }
  return ctx;
}

export function weekItemIds(slug: string) {
  const week = weeks.find((item) => item.slug === slug);
  if (!week) return [];
  return [
    ...week.theory.map((lesson) => lesson.id),
    ...week.practice.map((exercise) => exercise.id),
    ...week.checklist.map((item) => item.id),
  ];
}

export function weekCompletion(done: Record<string, boolean>, slug: string) {
  const ids = weekItemIds(slug);
  if (ids.length === 0) return 0;
  const finished = ids.filter((id) => done[id]).length;
  return Math.round((finished / ids.length) * 100);
}

export function courseCompletion(done: Record<string, boolean>) {
  const ids = weeks.flatMap((week) => weekItemIds(week.slug));
  if (ids.length === 0) return 0;
  const finished = ids.filter((id) => done[id]).length;
  return Math.round((finished / ids.length) * 100);
}

