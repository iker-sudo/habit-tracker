import { useState, useRef, useEffect, useCallback } from 'react';
import { useHabits } from '../context/HabitContext';
import { getThemeById } from '../themes';
import type { Section as SectionType } from '../types';
import EmojiPicker from './EmojiPicker';

interface Props {
  section: SectionType;
  index: number;
  total: number;
  dayColor?: string;
}

const SECTION_COLORS = [
  '#e8a87c', '#d4a5a5', '#a5c4d4', '#b5d4a5', '#c4a5d4',
  '#d4c8a5', '#a5d4c8', '#d4a5b5', '#8ec6c5', '#f5c6aa',
];

export default function SectionBlock({ section, index, total, dayColor }: Props) {
  const { state, dispatch, currentWeekStart, currentDateKey } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);

  // Effective accent: section color > day color > theme accent
  const accent = section.color || dayColor || theme.accent;
  const accentLight = section.color
    ? section.color + '22'
    : dayColor
      ? dayColor + '22'
      : theme.accentLight;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [editEmoji, setEditEmoji] = useState(section.emoji);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const editAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  // Click-outside handler for edit mode
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (editAreaRef.current && !editAreaRef.current.contains(e.target as Node)) {
        handleSaveSection();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, editName, editEmoji]);

  const handleSaveSection = useCallback(() => {
    if (editName.trim()) {
      dispatch({
        type: 'UPDATE_SECTION',
        weekStart: currentWeekStart,
        dateKey: currentDateKey,
        sectionId: section.id,
        name: editName.trim(),
        emoji: editEmoji.trim() || section.emoji,
      });
    }
    setIsEditing(false);
  }, [editName, editEmoji, dispatch, currentWeekStart, currentDateKey, section.id, section.emoji]);

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    dispatch({
      type: 'ADD_TASK',
      weekStart: currentWeekStart,
      dateKey: currentDateKey,
      sectionId: section.id,
      name: newTaskName.trim(),
    });
    setNewTaskName('');
    taskInputRef.current?.focus();
  };

  const handleStartEditTask = (taskId: string, name: string) => {
    setEditingTaskId(taskId);
    setEditingTaskName(name);
  };

  const handleSaveTask = (taskId: string) => {
    if (editingTaskName.trim()) {
      dispatch({
        type: 'UPDATE_TASK',
        weekStart: currentWeekStart,
        dateKey: currentDateKey,
        sectionId: section.id,
        taskId,
        name: editingTaskName.trim(),
      });
    }
    setEditingTaskId(null);
  };

  const completedCount = section.tasks.filter((t) => t.completed).length;
  const totalTasks = section.tasks.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div
      className="section-block"
      style={{
        background: theme.bgCard,
        borderColor: section.color || theme.border,
      }}
    >
      {/* Section header */}
      <div
        className="section-header"
        style={{ background: section.color ? accentLight : theme.sectionHeaderBg }}
      >
        <div className="section-header-left" ref={editAreaRef}>
          {isEditing ? (
            <div className="section-edit-row">
              <EmojiPicker
                current={editEmoji}
                onSelect={(emoji) => setEditEmoji(emoji)}
                theme={theme}
              />
              <input
                ref={nameInputRef}
                className="section-name-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSection()}
                style={{
                  color: theme.text,
                  borderColor: accent,
                  background: theme.bg,
                }}
                placeholder="Nombre de seccion"
              />
            </div>
          ) : (
            <button
              className="section-title-btn"
              onClick={() => {
                setEditName(section.name);
                setEditEmoji(section.emoji);
                setIsEditing(true);
              }}
              style={{ color: theme.text }}
            >
              <span className="section-emoji">{section.emoji}</span>
              <span className="section-name">{section.name}</span>
            </button>
          )}
        </div>

        <div className="section-header-right">
          {totalTasks > 0 && (
            <span
              className="section-progress"
              style={{ color: theme.textSecondary }}
            >
              {completedCount}/{totalTasks}
            </span>
          )}

          {/* Section color picker */}
          <div className="section-color-wrapper">
            <button
              className="section-color-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{
                background: section.color || accent,
                borderColor: theme.border,
              }}
              title="Color de seccion"
            />
            {showColorPicker && (
              <div
                className="section-color-picker"
                style={{ background: theme.bgCard, borderColor: theme.border }}
              >
                {SECTION_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${section.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => {
                      dispatch({
                        type: 'SET_SECTION_COLOR',
                        weekStart: currentWeekStart,
                        dateKey: currentDateKey,
                        sectionId: section.id,
                        color: c,
                      });
                      setShowColorPicker(false);
                    }}
                  />
                ))}
                {/* Custom color picker */}
                <label
                  className="color-swatch custom-color-swatch"
                  style={{
                    background: section.color && !SECTION_COLORS.includes(section.color)
                      ? section.color
                      : `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                    borderColor: section.color && !SECTION_COLORS.includes(section.color) ? '#333' : 'transparent',
                  }}
                  title="Color personalizado"
                >
                  <input
                    type="color"
                    className="hidden-color-input"
                    value={section.color || accent}
                    onChange={(e) => {
                      dispatch({
                        type: 'SET_SECTION_COLOR',
                        weekStart: currentWeekStart,
                        dateKey: currentDateKey,
                        sectionId: section.id,
                        color: e.target.value,
                      });
                    }}
                  />
                </label>
                {section.color && (
                  <button
                    className="color-swatch clear"
                    onClick={() => {
                      dispatch({
                        type: 'SET_SECTION_COLOR',
                        weekStart: currentWeekStart,
                        dateKey: currentDateKey,
                        sectionId: section.id,
                        color: undefined,
                      });
                      setShowColorPicker(false);
                    }}
                    style={{ borderColor: theme.border, color: theme.textSecondary }}
                    title="Quitar color"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="section-actions">
            <button
              className="icon-btn"
              onClick={() =>
                dispatch({
                  type: 'REORDER_SECTIONS',
                  weekStart: currentWeekStart,
                  dateKey: currentDateKey,
                  sectionId: section.id,
                  direction: 'up',
                })
              }
              disabled={index === 0}
              style={{ color: theme.textSecondary }}
              title="Mover arriba"
            >
              ▲
            </button>
            <button
              className="icon-btn"
              onClick={() =>
                dispatch({
                  type: 'REORDER_SECTIONS',
                  weekStart: currentWeekStart,
                  dateKey: currentDateKey,
                  sectionId: section.id,
                  direction: 'down',
                })
              }
              disabled={index === total - 1}
              style={{ color: theme.textSecondary }}
              title="Mover abajo"
            >
              ▼
            </button>
            <button
              className="icon-btn danger"
              onClick={() => {
                if (confirm('¿Eliminar esta seccion?')) {
                  dispatch({
                    type: 'DELETE_SECTION',
                    weekStart: currentWeekStart,
                    dateKey: currentDateKey,
                    sectionId: section.id,
                  });
                }
              }}
              style={{ color: theme.danger }}
              title="Eliminar seccion"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div
          className="progress-bar-bg"
          style={{ background: theme.checkboxBg }}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
              background: accent,
            }}
          />
        </div>
      )}

      {/* Tasks */}
      <div className="task-list">
        {section.tasks.map((task) => {
          const isDone = task.completed;
          return (
            <div
              key={task.id}
              className={`task-row ${isDone ? 'completed' : ''}`}
              style={{ borderColor: theme.border }}
            >
              <div className="task-left">
                {editingTaskId === task.id ? (
                  <input
                    className="task-edit-input"
                    value={editingTaskName}
                    onChange={(e) => setEditingTaskName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSaveTask(task.id)
                    }
                    onBlur={() => handleSaveTask(task.id)}
                    autoFocus
                    style={{
                      color: theme.text,
                      borderColor: accent,
                      background: theme.bg,
                    }}
                  />
                ) : (
                  <span
                    className="task-name"
                    onClick={() => handleStartEditTask(task.id, task.name)}
                    style={{
                      color: isDone ? theme.textSecondary : theme.text,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {task.name}
                  </span>
                )}
              </div>
              <div className="task-right">
                <button
                  className="icon-btn small danger"
                  onClick={() =>
                    dispatch({
                      type: 'DELETE_TASK',
                      weekStart: currentWeekStart,
                      dateKey: currentDateKey,
                      sectionId: section.id,
                      taskId: task.id,
                    })
                  }
                  style={{ color: theme.danger }}
                  title="Eliminar tarea"
                >
                  ✕
                </button>
                <button
                  className={`checkbox ${isDone ? 'checked' : ''}`}
                  onClick={() =>
                    dispatch({
                      type: 'TOGGLE_TASK',
                      weekStart: currentWeekStart,
                      dateKey: currentDateKey,
                      sectionId: section.id,
                      taskId: task.id,
                    })
                  }
                  style={{
                    background: isDone ? accent : theme.checkboxBg,
                    borderColor: isDone ? accent : theme.border,
                  }}
                >
                  {isDone && <span className="check-icon">✓</span>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add task */}
      <div className="add-task-row">
        <input
          ref={taskInputRef}
          className="add-task-input"
          placeholder="Añadir tarea..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          style={{
            color: theme.text,
            borderColor: theme.border,
            background: theme.bg,
          }}
        />
        <button
          className="add-task-btn"
          onClick={handleAddTask}
          disabled={!newTaskName.trim()}
          style={{
            background: accent,
            color: '#fff',
            opacity: newTaskName.trim() ? 1 : 0.5,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
