export interface Task {
  id: string;
  name: string;
  completed: boolean;
}

export interface Section {
  id: string;
  name: string;
  emoji: string;
  color?: string; // custom accent color for this section
  tasks: Task[];
}

export interface DayData {
  dateKey: string; // "YYYY-MM-DD"
  color?: string; // custom accent color for this day
  notes?: string; // free-text notes for this day
  sections: Section[];
}

export interface WeekData {
  weekStart: string; // ISO date string of Monday
  days: Record<string, DayData>; // key = "YYYY-MM-DD"
}

/* ── Routine Patterns ─────────────────────────────────── */

/** A task within a routine pattern, with optional skip rule */
export interface RoutineTask {
  id: string;
  name: string;
  /** Skip this task every N weeks (e.g. 4 = skip every 4th week). 0 or undefined = never skip */
  skipEveryNWeeks?: number;
  /** The week start date from which counting begins (ISO string) */
  skipStartWeek?: string;
}

/** A section template within a routine pattern */
export interface RoutineSection {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  tasks: RoutineTask[];
}

/** Defines the routine for a specific day of the week (0=lunes ... 6=domingo) */
export interface RoutinePattern {
  id: string;
  /** Day of week: 0=lunes, 1=martes, ..., 6=domingo */
  dayOfWeek: number;
  sections: RoutineSection[];
}

/* ── Theme & App State ───────────────────────────────── */

export interface ThemeColors {
  id: string;
  name: string;
  bg: string;
  bgSecondary: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  border: string;
  checkboxBg: string;
  checkboxChecked: string;
  danger: string;
  sectionHeaderBg: string;
}

export interface AppState {
  currentDate: Date;
  weeks: Record<string, WeekData>; // key = weekStart ISO string
  activeThemeId: string;
  customThemes: ThemeColors[];
  routinePatterns: RoutinePattern[]; // one per day-of-week (max 7)
}
