import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppState,
  Section,
  DayData,
  WeekData,
  ThemeColors,
  RoutinePattern,
  RoutineSection,
} from '../types';
import {
  getWeekStart,
  getWeekDays,
  formatDate,
  getPrevWeekStart,
  getDayOfWeekIndex,
} from '../utils/dates';
import { loadState, saveState } from '../utils/storage';

/* ── default sections ─────────────────────────────────── */
function emptySections(): Section[] {
  return [];
}

/* ── create day from routine pattern ─────────────────── */
function shouldSkipTask(
  skipEveryNWeeks: number | undefined,
  skipStartWeek: string | undefined,
  currentWeekStart: string
): boolean {
  if (!skipEveryNWeeks || skipEveryNWeeks <= 0) return false;
  const start = skipStartWeek ? new Date(skipStartWeek) : new Date(currentWeekStart);
  const current = new Date(currentWeekStart);
  const diffMs = current.getTime() - start.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 86400000));
  // Skip when week number is a multiple of N (i.e., every Nth week)
  return diffWeeks >= 0 && diffWeeks % skipEveryNWeeks === 0;
}

function createDayFromPattern(
  dateKey: string,
  pattern: RoutinePattern,
  weekStart: string
): DayData {
  return {
    dateKey,
    sections: pattern.sections.map((rs: RoutineSection) => ({
      id: uuidv4(),
      name: rs.name,
      emoji: rs.emoji,
      color: rs.color,
      tasks: rs.tasks
        .filter((rt) => !shouldSkipTask(rt.skipEveryNWeeks, rt.skipStartWeek, weekStart))
        .map((rt) => ({
          id: uuidv4(),
          name: rt.name,
          completed: false,
        })),
    })),
  };
}

function createDayData(dateKey: string, fromDay?: DayData): DayData {
  if (!fromDay) {
    return { dateKey, sections: emptySections() };
  }
  // Clone structure from a previous day, tasks unchecked, preserve colors
  return {
    dateKey,
    color: fromDay.color,
    sections: fromDay.sections.map((s) => ({
      id: uuidv4(),
      name: s.name,
      emoji: s.emoji,
      color: s.color,
      tasks: s.tasks.map((t) => ({
        id: uuidv4(),
        name: t.name,
        completed: false,
      })),
    })),
  };
}

function ensureWeek(state: AppState, weekStart: string): AppState {
  if (state.weeks[weekStart]) return state;

  // Create empty days — user will import from routine or copy manually
  const days: Record<string, DayData> = {};
  const weekDays = getWeekDays(weekStart);
  for (const d of weekDays) {
    const dk = formatDate(d);
    days[dk] = createDayData(dk);
  }

  return {
    ...state,
    weeks: {
      ...state.weeks,
      [weekStart]: { weekStart, days },
    },
  };
}

function ensureDay(state: AppState, weekStart: string, dateKey: string): AppState {
  const s = ensureWeek(state, weekStart);
  const week = s.weeks[weekStart];
  if (week.days[dateKey]) return s;

  // Create empty day — user will import manually
  const newDay = createDayData(dateKey);

  return {
    ...s,
    weeks: {
      ...s.weeks,
      [weekStart]: {
        ...week,
        days: {
          ...week.days,
          [dateKey]: newDay,
        },
      },
    },
  };
}

/* ── helpers to update a day's sections ───────────────── */
function updateDay(
  state: AppState,
  weekStart: string,
  dateKey: string,
  updater: (day: DayData) => DayData
): AppState {
  const s = ensureDay(state, weekStart, dateKey);
  const week = s.weeks[weekStart];
  const day = week.days[dateKey];
  return {
    ...s,
    weeks: {
      ...s.weeks,
      [weekStart]: {
        ...week,
        days: {
          ...week.days,
          [dateKey]: updater(day),
        },
      },
    },
  };
}

/* ── actions ──────────────────────────────────────────── */
type Action =
  | { type: 'SET_DATE'; date: Date }
  | { type: 'NAVIGATE_WEEK'; direction: 'prev' | 'next' }
  | { type: 'ADD_SECTION'; weekStart: string; dateKey: string }
  | {
      type: 'UPDATE_SECTION';
      weekStart: string;
      dateKey: string;
      sectionId: string;
      name: string;
      emoji: string;
    }
  | { type: 'DELETE_SECTION'; weekStart: string; dateKey: string; sectionId: string }
  | { type: 'ADD_TASK'; weekStart: string; dateKey: string; sectionId: string; name: string }
  | {
      type: 'UPDATE_TASK';
      weekStart: string;
      dateKey: string;
      sectionId: string;
      taskId: string;
      name: string;
    }
  | {
      type: 'DELETE_TASK';
      weekStart: string;
      dateKey: string;
      sectionId: string;
      taskId: string;
    }
  | {
      type: 'TOGGLE_TASK';
      weekStart: string;
      dateKey: string;
      sectionId: string;
      taskId: string;
    }
  | { type: 'SET_THEME'; themeId: string }
  | { type: 'ADD_CUSTOM_THEME'; theme: ThemeColors }
  | { type: 'COPY_PREVIOUS_WEEK'; weekStart: string }
  | {
      type: 'REORDER_SECTIONS';
      weekStart: string;
      dateKey: string;
      sectionId: string;
      direction: 'up' | 'down';
    }
  | {
      type: 'SET_DAY_COLOR';
      weekStart: string;
      dateKey: string;
      color: string | undefined;
    }
  | {
      type: 'SET_SECTION_COLOR';
      weekStart: string;
      dateKey: string;
      sectionId: string;
      color: string | undefined;
    }
  | {
      type: 'SET_DAY_NOTES';
      weekStart: string;
      dateKey: string;
      notes: string;
    }
  | { type: 'SET_ROUTINE_PATTERNS'; patterns: RoutinePattern[] }
  | { type: 'SAVE_DAY_AS_ROUTINE'; dateKey: string; weekStart: string }
  | { type: 'IMPORT_FROM_ROUTINE'; weekStart: string; dateKey: string }
  | { type: 'COPY_PREVIOUS_DAY'; weekStart: string; dateKey: string; sourceWeekStart: string; sourceDateKey: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DATE': {
      const weekStart = getWeekStart(action.date);
      const dateKey = formatDate(action.date);
      const next = ensureDay(
        { ...state, currentDate: action.date },
        weekStart,
        dateKey
      );
      return next;
    }
    case 'NAVIGATE_WEEK': {
      const currentWS = getWeekStart(state.currentDate);
      const targetWS =
        action.direction === 'next'
          ? getWeekStart(new Date(new Date(currentWS).getTime() + 7 * 86400000))
          : getWeekStart(new Date(new Date(currentWS).getTime() - 7 * 86400000));
      const newDate = new Date(targetWS);
      const dateKey = formatDate(newDate);
      return ensureDay({ ...state, currentDate: newDate }, targetWS, dateKey);
    }
    case 'ADD_SECTION': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: [
          ...day.sections,
          { id: uuidv4(), name: 'Nueva seccion', emoji: '+', tasks: [] },
        ],
      }));
    }
    case 'UPDATE_SECTION': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.map((sec) =>
          sec.id === action.sectionId
            ? { ...sec, name: action.name, emoji: action.emoji }
            : sec
        ),
      }));
    }
    case 'DELETE_SECTION': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.filter((sec) => sec.id !== action.sectionId),
      }));
    }
    case 'ADD_TASK': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.map((sec) =>
          sec.id === action.sectionId
            ? {
                ...sec,
                tasks: [
                  ...sec.tasks,
                  { id: uuidv4(), name: action.name, completed: false },
                ],
              }
            : sec
        ),
      }));
    }
    case 'UPDATE_TASK': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.map((sec) =>
          sec.id === action.sectionId
            ? {
                ...sec,
                tasks: sec.tasks.map((t) =>
                  t.id === action.taskId ? { ...t, name: action.name } : t
                ),
              }
            : sec
        ),
      }));
    }
    case 'DELETE_TASK': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.map((sec) =>
          sec.id === action.sectionId
            ? { ...sec, tasks: sec.tasks.filter((t) => t.id !== action.taskId) }
            : sec
        ),
      }));
    }
    case 'TOGGLE_TASK': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.map((sec) =>
          sec.id === action.sectionId
            ? {
                ...sec,
                tasks: sec.tasks.map((t) =>
                  t.id === action.taskId
                    ? { ...t, completed: !t.completed }
                    : t
                ),
              }
            : sec
        ),
      }));
    }
    case 'SET_THEME':
      return { ...state, activeThemeId: action.themeId };
    case 'ADD_CUSTOM_THEME':
      return {
        ...state,
        customThemes: [...state.customThemes, action.theme],
        activeThemeId: action.theme.id,
      };
    case 'COPY_PREVIOUS_WEEK': {
      const ws = action.weekStart;
      const prevStart = getPrevWeekStart(ws);
      const prevWeek = state.weeks[prevStart];
      if (!prevWeek) return state;

      const prevDayKeys = Object.keys(prevWeek.days);
      const templateDay = prevDayKeys
        .map((k) => prevWeek.days[k])
        .find((d) => d.sections.some((s) => s.tasks.length > 0));

      if (!templateDay) return state;

      const days: Record<string, DayData> = {};
      const weekDays = getWeekDays(ws);
      for (const d of weekDays) {
        const dk = formatDate(d);
        days[dk] = createDayData(dk, templateDay);
      }

      return {
        ...state,
        weeks: {
          ...state.weeks,
          [ws]: { weekStart: ws, days },
        },
      };
    }
    case 'REORDER_SECTIONS': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => {
        const sections = [...day.sections];
        const idx = sections.findIndex((s) => s.id === action.sectionId);
        if (idx === -1) return day;
        const newIdx = action.direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= sections.length) return day;
        [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
        return { ...day, sections };
      });
    }
    case 'SET_DAY_COLOR': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        color: action.color,
      }));
    }
    case 'SET_SECTION_COLOR': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        sections: day.sections.map((sec) =>
          sec.id === action.sectionId
            ? { ...sec, color: action.color }
            : sec
        ),
      }));
    }
    case 'SET_DAY_NOTES': {
      return updateDay(state, action.weekStart, action.dateKey, (day) => ({
        ...day,
        notes: action.notes,
      }));
    }
    case 'SET_ROUTINE_PATTERNS': {
      return { ...state, routinePatterns: action.patterns };
    }
    case 'SAVE_DAY_AS_ROUTINE': {
      const week = state.weeks[action.weekStart];
      const day = week?.days[action.dateKey];
      if (!day) return state;
      const d = new Date(action.dateKey);
      const dow = getDayOfWeekIndex(d);

      const newPattern: RoutinePattern = {
        id: uuidv4(),
        dayOfWeek: dow,
        sections: day.sections.map((s) => ({
          id: uuidv4(),
          name: s.name,
          emoji: s.emoji,
          color: s.color,
          tasks: s.tasks.map((t) => ({
            id: uuidv4(),
            name: t.name,
          })),
        })),
      };

      // Replace existing pattern for this day, or add new
      const existingIdx = state.routinePatterns.findIndex((p) => p.dayOfWeek === dow);
      const patterns = [...state.routinePatterns];
      if (existingIdx >= 0) {
        patterns[existingIdx] = newPattern;
      } else {
        patterns.push(newPattern);
      }

      return { ...state, routinePatterns: patterns };
    }
    case 'IMPORT_FROM_ROUTINE': {
      const d = new Date(action.dateKey);
      const dow = getDayOfWeekIndex(d);
      const pattern = state.routinePatterns.find((p) => p.dayOfWeek === dow);
      if (!pattern || pattern.sections.length === 0) return state;

      const newDay = createDayFromPattern(action.dateKey, pattern, action.weekStart);
      // Preserve existing day color/notes if any
      const existingDay = state.weeks[action.weekStart]?.days[action.dateKey];
      if (existingDay) {
        newDay.color = existingDay.color;
        newDay.notes = existingDay.notes;
      }

      const s = ensureWeek(state, action.weekStart);
      const week = s.weeks[action.weekStart];
      return {
        ...s,
        weeks: {
          ...s.weeks,
          [action.weekStart]: {
            ...week,
            days: {
              ...week.days,
              [action.dateKey]: newDay,
            },
          },
        },
      };
    }
    case 'COPY_PREVIOUS_DAY': {
      const srcWeek = state.weeks[action.sourceWeekStart];
      const sourceDay = srcWeek?.days[action.sourceDateKey];
      if (!sourceDay || sourceDay.sections.every((s) => s.tasks.length === 0)) return state;

      const newDay = createDayData(action.dateKey, sourceDay);
      const s = ensureWeek(state, action.weekStart);
      const week = s.weeks[action.weekStart];
      // Preserve existing color/notes
      const existingDay = week.days[action.dateKey];
      if (existingDay) {
        newDay.color = existingDay.color;
        newDay.notes = existingDay.notes;
      }

      return {
        ...s,
        weeks: {
          ...s.weeks,
          [action.weekStart]: {
            ...week,
            days: {
              ...week.days,
              [action.dateKey]: newDay,
            },
          },
        },
      };
    }
    default:
      return state;
  }
}

/* ── context ──────────────────────────────────────────── */
interface HabitContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentWeekStart: string;
  currentWeek: WeekData | undefined;
  currentDay: DayData | undefined;
  currentDateKey: string;
}

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const dateKey = formatDate(now);

  const stored = loadState();

  const initialState: AppState = {
    currentDate: now,
    weeks: stored.weeks || {},
    activeThemeId: stored.activeThemeId || 'cream',
    customThemes: stored.customThemes || [],
    routinePatterns: stored.routinePatterns || [],
  };

  // Ensure current week + day exist
  if (!initialState.weeks[weekStart]) {
    const days: Record<string, DayData> = {};
    const weekDays = getWeekDays(weekStart);
    for (const d of weekDays) {
      const dk = formatDate(d);
      days[dk] = createDayData(dk);
    }
    initialState.weeks[weekStart] = { weekStart, days };
  } else if (!initialState.weeks[weekStart].days[dateKey]) {
    initialState.weeks[weekStart].days[dateKey] = createDayData(dateKey);
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentWeekStart = getWeekStart(state.currentDate);
  const currentWeek = state.weeks[currentWeekStart];
  const currentDateKey = formatDate(state.currentDate);
  const currentDay = currentWeek?.days[currentDateKey];

  return (
    <HabitContext.Provider
      value={{ state, dispatch, currentWeekStart, currentWeek, currentDay, currentDateKey }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
}
