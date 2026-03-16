import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useHabits } from '../context/HabitContext';
import { getThemeById } from '../themes';
import type { RoutinePattern, RoutineSection, RoutineTask } from '../types';
import EmojiPicker from './EmojiPicker';

const DAY_NAMES = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function RoutineManager() {
  const { state, dispatch, currentWeekStart, currentDateKey } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0=lunes
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editSkipN, setEditSkipN] = useState<number>(0);
  const [showImportPicker, setShowImportPicker] = useState(false);

  const patterns = state.routinePatterns;
  const currentPattern = patterns.find((p) => p.dayOfWeek === selectedDay);

  // Days that have a routine with at least one section (excluding current day)
  const importableDays = patterns.filter(
    (p) => p.dayOfWeek !== selectedDay && p.sections.length > 0
  );

  const updatePatterns = (updated: RoutinePattern[]) => {
    dispatch({ type: 'SET_ROUTINE_PATTERNS', patterns: updated });
  };

  const getOrCreatePattern = (): RoutinePattern => {
    if (currentPattern) return currentPattern;
    const newPattern: RoutinePattern = {
      id: uuidv4(),
      dayOfWeek: selectedDay,
      sections: [],
    };
    updatePatterns([...patterns, newPattern]);
    return newPattern;
  };

  const updateCurrentPattern = (updater: (p: RoutinePattern) => RoutinePattern) => {
    const p = getOrCreatePattern();
    const updated = patterns.map((pat) => (pat.dayOfWeek === selectedDay ? updater(pat) : pat));
    // If pattern didn't exist yet, it won't be in the map, add it
    if (!patterns.find((pat) => pat.dayOfWeek === selectedDay)) {
      updated.push(updater(p));
    }
    updatePatterns(updated);
  };

  const addSection = () => {
    updateCurrentPattern((p) => ({
      ...p,
      sections: [
        ...p.sections,
        { id: uuidv4(), name: 'Nueva seccion', emoji: '+', tasks: [] },
      ],
    }));
  };

  const removeSection = (sectionId: string) => {
    updateCurrentPattern((p) => ({
      ...p,
      sections: p.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<RoutineSection>) => {
    updateCurrentPattern((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  const addTask = (sectionId: string, name: string) => {
    updateCurrentPattern((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === sectionId
          ? { ...s, tasks: [...s.tasks, { id: uuidv4(), name }] }
          : s
      ),
    }));
  };

  const removeTask = (sectionId: string, taskId: string) => {
    updateCurrentPattern((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === sectionId
          ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
          : s
      ),
    }));
  };

  const updateTask = (sectionId: string, taskId: string, updates: Partial<RoutineTask>) => {
    updateCurrentPattern((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          : s
      ),
    }));
  };

  /** Deep-clone sections from a source routine pattern into the current day */
  const importFromDay = (sourceDayOfWeek: number) => {
    const sourcePattern = patterns.find((p) => p.dayOfWeek === sourceDayOfWeek);
    if (!sourcePattern || sourcePattern.sections.length === 0) return;

    // Deep-clone sections with new UUIDs so they're fully independent
    const clonedSections: RoutineSection[] = sourcePattern.sections.map((s) => ({
      id: uuidv4(),
      name: s.name,
      emoji: s.emoji,
      color: s.color,
      tasks: s.tasks.map((t) => ({
        id: uuidv4(),
        name: t.name,
        skipEveryNWeeks: t.skipEveryNWeeks,
        skipStartWeek: t.skipStartWeek,
      })),
    }));

    updateCurrentPattern((p) => ({
      ...p,
      sections: [...p.sections, ...clonedSections],
    }));
    setShowImportPicker(false);
  };

  const saveDayAsRoutine = () => {
    dispatch({
      type: 'SAVE_DAY_AS_ROUTINE',
      dateKey: currentDateKey,
      weekStart: currentWeekStart,
    });
  };

  return (
    <div className="routine-manager" style={{ color: theme.text }}>
      <h3 className="routine-title" style={{ color: theme.text }}>
        Mis Rutinas
      </h3>
      <p className="routine-subtitle" style={{ color: theme.textSecondary }}>
        Define tu rutina para cada dia. Las semanas nuevas se generan automaticamente.
      </p>

      {/* Save current day as routine */}
      <button
        className="save-as-routine-btn"
        onClick={saveDayAsRoutine}
        style={{ background: theme.accent, color: '#fff' }}
      >
        Guardar dia actual como rutina
      </button>

      {/* Day selector */}
      <div className="routine-day-tabs">
        {DAY_NAMES.map((name, i) => {
          const hasPattern = patterns.some((p) => p.dayOfWeek === i && p.sections.length > 0);
          return (
            <button
              key={i}
              className={`routine-day-tab ${selectedDay === i ? 'selected' : ''}`}
              onClick={() => setSelectedDay(i)}
              style={{
                background: selectedDay === i ? theme.accent : 'transparent',
                color: selectedDay === i ? '#fff' : theme.text,
                borderColor: theme.border,
              }}
            >
              {name.slice(0, 3)}
              {hasPattern && <span className="routine-dot">*</span>}
            </button>
          );
        })}
      </div>

      {/* Pattern editor for selected day */}
      <div className="routine-pattern-editor">
        {currentPattern?.sections.map((section) => (
          <div
            key={section.id}
            className="routine-section"
            style={{ background: theme.bgCard, borderColor: theme.border }}
          >
            <div className="routine-section-header">
              <EmojiPicker
                current={section.emoji}
                onSelect={(emoji) => updateSection(section.id, { emoji })}
                theme={theme}
              />
              <input
                className="routine-section-name"
                value={section.name}
                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                style={{ color: theme.text, borderColor: theme.border, background: theme.bg }}
              />
              <button
                className="icon-btn small danger"
                onClick={() => removeSection(section.id)}
                style={{ color: theme.danger }}
              >
                ✕
              </button>
            </div>

            {/* Tasks in this routine section */}
            <div className="routine-task-list">
              {section.tasks.map((task) => (
                <div key={task.id} className="routine-task-row" style={{ borderColor: theme.border }}>
                  <span className="routine-task-name" style={{ color: theme.text }}>
                    {task.name}
                  </span>
                  <div className="routine-task-actions">
                    {/* Skip rule indicator */}
                    {task.skipEveryNWeeks && task.skipEveryNWeeks > 0 ? (
                      <span
                        className="skip-badge"
                        style={{ background: theme.accentLight, color: theme.accent }}
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditSkipN(task.skipEveryNWeeks || 0);
                        }}
                        title={`Se omite cada ${task.skipEveryNWeeks} semanas`}
                      >
                        /{task.skipEveryNWeeks}sem
                      </span>
                    ) : (
                      <button
                        className="skip-btn"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditSkipN(0);
                        }}
                        style={{ color: theme.textSecondary }}
                        title="Configurar omision periodica"
                      >
                        skip?
                      </button>
                    )}
                    <button
                      className="icon-btn small danger"
                      onClick={() => removeTask(section.id, task.id)}
                      style={{ color: theme.danger }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Skip editor */}
                  {editingTaskId === task.id && (
                    <div className="skip-editor" style={{ background: theme.bg, borderColor: theme.border }}>
                      <label style={{ color: theme.textSecondary }}>
                        Omitir cada N semanas (0 = nunca):
                      </label>
                      <div className="skip-editor-row">
                        <input
                          type="number"
                          min={0}
                          max={52}
                          value={editSkipN}
                          onChange={(e) => setEditSkipN(parseInt(e.target.value) || 0)}
                          style={{ color: theme.text, background: theme.bgCard, borderColor: theme.border }}
                        />
                        <button
                          className="skip-save-btn"
                          onClick={() => {
                            updateTask(section.id, task.id, {
                              skipEveryNWeeks: editSkipN > 0 ? editSkipN : undefined,
                              skipStartWeek: editSkipN > 0 ? currentWeekStart : undefined,
                            });
                            setEditingTaskId(null);
                          }}
                          style={{ background: theme.accent, color: '#fff' }}
                        >
                          OK
                        </button>
                        <button
                          className="skip-cancel-btn"
                          onClick={() => setEditingTaskId(null)}
                          style={{ color: theme.textSecondary }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add task to routine section */}
            <AddRoutineTask
              onAdd={(name) => addTask(section.id, name)}
              theme={theme}
            />
          </div>
        ))}

        <button
          className="add-section-btn"
          onClick={addSection}
          style={{ color: theme.accent, borderColor: theme.border, background: theme.bgCard }}
        >
          + Añadir seccion a rutina
        </button>

        {/* Import from another day */}
        {importableDays.length > 0 && (
          <div className="import-routine-wrapper">
            <button
              className="import-routine-btn"
              onClick={() => setShowImportPicker(!showImportPicker)}
              style={{ color: theme.accent, borderColor: theme.border, background: theme.bgCard }}
            >
              {showImportPicker ? 'Cancelar' : 'Importar de otro dia'}
            </button>

            {showImportPicker && (
              <div className="import-routine-picker" style={{ background: theme.bgCard, borderColor: theme.border }}>
                <p className="import-routine-hint" style={{ color: theme.textSecondary }}>
                  Selecciona el dia del que quieres copiar la rutina:
                </p>
                <div className="import-routine-options">
                  {importableDays.map((p) => (
                    <button
                      key={p.id}
                      className="import-routine-option"
                      onClick={() => importFromDay(p.dayOfWeek)}
                      style={{ background: theme.accentLight, color: theme.text, borderColor: theme.border }}
                    >
                      {DAY_NAMES[p.dayOfWeek]}
                      <span className="import-routine-count" style={{ color: theme.textSecondary }}>
                        ({p.sections.length} {p.sections.length === 1 ? 'seccion' : 'secciones'})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Small sub-component for adding a task */
function AddRoutineTask({
  onAdd,
  theme,
}: {
  onAdd: (name: string) => void;
  theme: { text: string; border: string; bg: string; accent: string };
}) {
  const [name, setName] = useState('');
  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
  };
  return (
    <div className="routine-add-task">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Añadir tarea..."
        style={{ color: theme.text, borderColor: theme.border, background: theme.bg }}
      />
      <button
        onClick={handleAdd}
        disabled={!name.trim()}
        style={{ background: theme.accent, color: '#fff', opacity: name.trim() ? 1 : 0.5 }}
      >
        +
      </button>
    </div>
  );
}
