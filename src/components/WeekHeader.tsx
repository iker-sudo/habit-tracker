import { useState, useRef } from 'react';
import { useHabits } from '../context/HabitContext';
import { getWeekDays, capitalize, getDayName, formatDayNumber, isDayToday, getMonthYear, formatDate, isSameDate } from '../utils/dates';
import { getThemeById } from '../themes';

const DAY_COLORS = [
  '#e8a87c', '#d4a5a5', '#a5c4d4', '#b5d4a5', '#c4a5d4',
  '#d4c8a5', '#a5d4c8', '#d4a5b5', '#8ec6c5', '#f5c6aa',
];

export default function WeekHeader() {
  const { state, dispatch, currentWeekStart, currentDay, currentDateKey } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);
  const days = getWeekDays(currentWeekStart);
  const monthYear = capitalize(getMonthYear(state.currentDate));
  const [showDayColorPicker, setShowDayColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const dayColor = currentDay?.color;

  return (
    <header className="week-header" style={{ background: theme.bgSecondary }}>
      {/* Month + navigation */}
      <div className="week-nav">
        <button
          className="nav-btn"
          onClick={() => dispatch({ type: 'NAVIGATE_WEEK', direction: 'prev' })}
          style={{ color: theme.accent }}
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <span className="month-label" style={{ color: theme.text }}>
          {monthYear}
        </span>
        <button
          className="nav-btn"
          onClick={() => dispatch({ type: 'NAVIGATE_WEEK', direction: 'next' })}
          style={{ color: theme.accent }}
          aria-label="Semana siguiente"
        >
          ›
        </button>
      </div>

      {/* Day tabs */}
      <div className="day-tabs">
        {days.map((day) => {
          const dk = formatDate(day);
          const isSelected = isSameDate(day, state.currentDate);
          const isToday = isDayToday(day);
          const week = state.weeks[currentWeekStart];
          const thisDayColor = week?.days[dk]?.color;
          return (
            <button
              key={dk}
              className={`day-tab ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => dispatch({ type: 'SET_DATE', date: day })}
              style={{
                background: isSelected
                  ? (thisDayColor || theme.accent)
                  : 'transparent',
                color: isSelected ? '#fff' : theme.text,
                borderColor: isToday && !isSelected
                  ? (thisDayColor || theme.accent)
                  : 'transparent',
              }}
            >
              <span className="day-tab-name">
                {capitalize(getDayName(day)).slice(0, 3)}
              </span>
              <span className="day-tab-num">{formatDayNumber(day)}</span>
              {thisDayColor && !isSelected && (
                <span
                  className="day-color-dot"
                  style={{ background: thisDayColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Current day name + color picker */}
      <div className="current-day-row">
        <h1
          className="current-day-name"
          style={{ color: dayColor || theme.text }}
        >
          {capitalize(getDayName(state.currentDate))}
        </h1>
        <div className="day-color-picker-wrapper" ref={colorPickerRef}>
          <button
            className="day-color-btn"
            onClick={() => setShowDayColorPicker(!showDayColorPicker)}
            style={{
              background: dayColor || theme.accent,
              borderColor: theme.border,
            }}
            title="Color del dia"
          />
          {showDayColorPicker && (
            <div
              className="day-color-picker"
              style={{ background: theme.bgCard, borderColor: theme.border }}
            >
              {DAY_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${dayColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => {
                    dispatch({
                      type: 'SET_DAY_COLOR',
                      weekStart: currentWeekStart,
                      dateKey: currentDateKey,
                      color: c,
                    });
                    setShowDayColorPicker(false);
                  }}
                />
              ))}
              {dayColor && (
                <button
                  className="color-swatch clear"
                  onClick={() => {
                    dispatch({
                      type: 'SET_DAY_COLOR',
                      weekStart: currentWeekStart,
                      dateKey: currentDateKey,
                      color: undefined,
                    });
                    setShowDayColorPicker(false);
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
      </div>
    </header>
  );
}
