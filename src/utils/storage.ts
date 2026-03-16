import type { AppState, WeekData, ThemeColors, RoutinePattern } from '../types';

const STORAGE_KEY = 'habit-tracker-data';

interface StoredState {
  weeks: Record<string, WeekData>;
  activeThemeId: string;
  customThemes: ThemeColors[];
  routinePatterns: RoutinePattern[];
}

export function loadState(): Partial<StoredState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredState;
  } catch {
    return {};
  }
}

export function saveState(state: AppState): void {
  try {
    const toStore: StoredState = {
      weeks: state.weeks,
      activeThemeId: state.activeThemeId,
      customThemes: state.customThemes,
      routinePatterns: state.routinePatterns,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // silently fail
  }
}
