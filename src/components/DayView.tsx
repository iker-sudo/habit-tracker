import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { getThemeById } from '../themes';
import {
  getDayOfWeekIndex,
  getWeekDays,
  formatDate,
  getPrevWeekStart,
} from '../utils/dates';
import SectionBlock from './SectionBlock';

const DAY_NAMES = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function DayView() {
  const { state, dispatch, currentWeekStart, currentWeek, currentDay, currentDateKey } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);
  const [showNotes, setShowNotes] = useState(false);

  const hasNotes = !!(currentDay?.notes?.trim());

  // Check if day has any tasks (truly empty vs. has empty sections)
  const hasTasks = currentDay?.sections.some((s) => s.tasks.length > 0) ?? false;
  const hasSections = (currentDay?.sections.length ?? 0) > 0;
  const isDayEmpty = !hasTasks && !hasSections;

  // Determine available import sources
  const currentDate = new Date(currentDateKey);
  const dow = getDayOfWeekIndex(currentDate);
  const routineForToday = state.routinePatterns.find(
    (p) => p.dayOfWeek === dow && p.sections.length > 0
  );

  // Find previous day in same week that has tasks
  const weekDays = getWeekDays(currentWeekStart);
  const currentDayIndex = weekDays.findIndex(
    (d) => formatDate(d) === currentDateKey
  );
  let previousDayKey: string | undefined;
  let previousDayLabel: string | undefined;
  if (currentDayIndex > 0) {
    // Look backwards from current day in same week
    for (let i = currentDayIndex - 1; i >= 0; i--) {
      const dk = formatDate(weekDays[i]);
      const dayData = currentWeek?.days[dk];
      if (dayData && dayData.sections.some((s) => s.tasks.length > 0)) {
        previousDayKey = dk;
        previousDayLabel = DAY_NAMES[i];
        break;
      }
    }
  }

  // Same day-of-week from previous week
  const prevWeekStart = getPrevWeekStart(currentWeekStart);
  const prevWeek = state.weeks[prevWeekStart];
  let prevWeekSameDayKey: string | undefined;
  if (prevWeek) {
    const prevWeekDays = getWeekDays(prevWeekStart);
    const sameDayDate = prevWeekDays[currentDayIndex];
    if (sameDayDate) {
      const dk = formatDate(sameDayDate);
      const dayData = prevWeek.days[dk];
      if (dayData && dayData.sections.some((s) => s.tasks.length > 0)) {
        prevWeekSameDayKey = dk;
      }
    }
  }

  // Any routine available (for other days too)
  const otherRoutines = state.routinePatterns.filter(
    (p) => p.dayOfWeek !== dow && p.sections.length > 0
  );

  const hasAnyImportOption = !!(routineForToday || previousDayKey || prevWeekSameDayKey || otherRoutines.length > 0);

  return (
    <main className="day-view" style={{ background: theme.bg }}>
      {/* Empty day — show import options */}
      {isDayEmpty && hasAnyImportOption && (
        <div
          className="import-panel"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <p className="import-panel-title" style={{ color: theme.text }}>
            Este dia esta vacio
          </p>
          <p className="import-panel-subtitle" style={{ color: theme.textSecondary }}>
            Puedes importar tareas o empezar desde cero:
          </p>

          <div className="import-panel-options">
            {/* Import from routine for this day-of-week */}
            {routineForToday && (
              <button
                className="import-panel-btn primary"
                onClick={() =>
                  dispatch({
                    type: 'IMPORT_FROM_ROUTINE',
                    weekStart: currentWeekStart,
                    dateKey: currentDateKey,
                  })
                }
                style={{ background: theme.accent, color: '#fff' }}
              >
                <span className="import-panel-btn-icon">📋</span>
                <span className="import-panel-btn-text">
                  <strong>Usar mi rutina de {DAY_NAMES[dow]}</strong>
                  <small>{routineForToday.sections.length} {routineForToday.sections.length === 1 ? 'seccion' : 'secciones'}</small>
                </span>
              </button>
            )}

            {/* Copy from previous day in same week */}
            {previousDayKey && (
              <button
                className="import-panel-btn secondary"
                onClick={() =>
                  dispatch({
                    type: 'COPY_PREVIOUS_DAY',
                    weekStart: currentWeekStart,
                    dateKey: currentDateKey,
                    sourceWeekStart: currentWeekStart,
                    sourceDateKey: previousDayKey!,
                  })
                }
                style={{ background: theme.accentLight, color: theme.text }}
              >
                <span className="import-panel-btn-icon">📄</span>
                <span className="import-panel-btn-text">
                  <strong>Copiar de {previousDayLabel}</strong>
                  <small>Mismo formato, tareas sin completar</small>
                </span>
              </button>
            )}

            {/* Copy same day from previous week */}
            {prevWeekSameDayKey && (
              <button
                className="import-panel-btn secondary"
                onClick={() =>
                  dispatch({
                    type: 'COPY_PREVIOUS_DAY',
                    weekStart: currentWeekStart,
                    dateKey: currentDateKey,
                    sourceWeekStart: prevWeekStart,
                    sourceDateKey: prevWeekSameDayKey!,
                  })
                }
                style={{ background: theme.accentLight, color: theme.text }}
              >
                <span className="import-panel-btn-icon">🔄</span>
                <span className="import-panel-btn-text">
                  <strong>Copiar {DAY_NAMES[dow]} de la semana anterior</strong>
                  <small>Mismas tareas, sin completar</small>
                </span>
              </button>
            )}

            {/* Import from another day's routine */}
            {!routineForToday && otherRoutines.length > 0 && (
              <ImportOtherRoutine
                otherRoutines={otherRoutines}
                currentDateKey={currentDateKey}
                currentWeekStart={currentWeekStart}
                theme={theme}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty day with no import options */}
      {isDayEmpty && !hasAnyImportOption && (
        <div
          className="import-panel"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <p className="import-panel-title" style={{ color: theme.text }}>
            Este dia esta vacio
          </p>
          <p className="import-panel-subtitle" style={{ color: theme.textSecondary }}>
            Añade secciones y tareas, o guarda una rutina en Ajustes para reutilizarla.
          </p>
        </div>
      )}

      {/* Sections */}
      {currentDay?.sections.map((section, i) => (
        <SectionBlock
          key={section.id}
          section={section}
          index={i}
          total={currentDay.sections.length}
          dayColor={currentDay.color}
        />
      ))}

      {/* Add section button */}
      <button
        className="add-section-btn"
        onClick={() =>
          dispatch({
            type: 'ADD_SECTION',
            weekStart: currentWeekStart,
            dateKey: currentDateKey,
          })
        }
        style={{
          color: theme.accent,
          borderColor: theme.border,
          background: theme.bgCard,
        }}
      >
        + Añadir seccion
      </button>

      {/* Day notes */}
      <div
        className="day-notes-block"
        style={{ background: theme.bgCard, borderColor: theme.border }}
      >
        <button
          className="day-notes-toggle"
          onClick={() => setShowNotes(!showNotes)}
          style={{ color: theme.textSecondary }}
        >
          <span>Notas del dia {hasNotes ? '•' : ''}</span>
          <span className="toggle-arrow">{showNotes ? '▲' : '▼'}</span>
        </button>
        {showNotes && (
          <textarea
            className="day-notes-textarea"
            placeholder="Escribe notas para este dia..."
            value={currentDay?.notes || ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_DAY_NOTES',
                weekStart: currentWeekStart,
                dateKey: currentDateKey,
                notes: e.target.value,
              })
            }
            style={{
              color: theme.text,
              background: theme.bg,
              borderColor: theme.border,
            }}
          />
        )}
      </div>
    </main>
  );
}

/* Sub-component: pick a routine from another day-of-week */
import type { RoutinePattern } from '../types';
import type { ThemeColors } from '../types';

function ImportOtherRoutine({
  otherRoutines,
  theme,
}: {
  otherRoutines: RoutinePattern[];
  currentDateKey: string;
  currentWeekStart: string;
  theme: ThemeColors;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="import-other-routine">
      <button
        className="import-panel-btn secondary"
        onClick={() => setExpanded(!expanded)}
        style={{ background: theme.accentLight, color: theme.text }}
      >
        <span className="import-panel-btn-icon">📂</span>
        <span className="import-panel-btn-text">
          <strong>Tienes rutinas de otros dias</strong>
          <small>Puedes importarlas desde Ajustes {'>'} Rutinas</small>
        </span>
      </button>
      {expanded && (
        <div className="import-other-list" style={{ color: theme.textSecondary }}>
          <p style={{ fontSize: '12px', padding: '6px 0' }}>
            Rutinas disponibles: {otherRoutines.map((r) => DAY_NAMES[r.dayOfWeek]).join(', ')}.
            Ve a Ajustes {'>'} Rutinas para importar una rutina a este dia.
          </p>
        </div>
      )}
    </div>
  );
}
