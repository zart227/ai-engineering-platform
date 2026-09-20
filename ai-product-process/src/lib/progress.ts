export type ProjectState = {
  name: string;
  oneLiner: string;
  audience: string;
  problem: string;
};

export type ProgressState = {
  project: ProjectState;
  notes: Record<string, string>;
  done: Record<string, boolean>;
};

const KEY = "cycle-course-v1";

export const emptyProgress = (): ProgressState => ({
  project: { name: "", oneLiner: "", audience: "", problem: "" },
  notes: {},
  done: {},
});

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...emptyProgress(),
      ...parsed,
      project: { ...emptyProgress().project, ...parsed.project },
      notes: parsed.notes ?? {},
      done: parsed.done ?? {},
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
