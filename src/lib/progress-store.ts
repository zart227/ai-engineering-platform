import {
  emptyProgress,
  loadProgress,
  saveProgress,
  type ProgressState,
  type ProjectState,
} from "@/lib/progress";

let state: ProgressState = emptyProgress();
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  state = loadProgress();
}

function emit() {
  for (const listener of listeners) listener();
}

const serverSnapshot = emptyProgress();

export function getProgressSnapshot() {
  return state;
}

export function getServerProgressSnapshot() {
  return serverSnapshot;
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setProgressState(next: ProgressState) {
  state = next;
  if (typeof window !== "undefined") saveProgress(state);
  emit();
}

export function patchDone(id: string, value: boolean) {
  setProgressState({
    ...state,
    done: { ...state.done, [id]: value },
  });
}

export function patchNote(id: string, value: string) {
  setProgressState({
    ...state,
    notes: { ...state.notes, [id]: value },
  });
}

export function patchProject(patch: Partial<ProjectState>) {
  setProgressState({
    ...state,
    project: { ...state.project, ...patch },
  });
}

export function resetProgress() {
  setProgressState(emptyProgress());
}
