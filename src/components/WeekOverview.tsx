import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { getThemeById } from '../themes';
import { getWeekDays, formatDate, capitalize, getDayShort, formatDayNumber, getMonthYear } from '../utils/dates';

export default function WeekOverview() {
  const { state, currentWeekStart, currentWeek } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);
  const days = getWeekDays(currentWeekStart);
  const [expanded, setExpanded] = useState(false);

  if (!currentWeek) return null;

  // Check if there are any tasks at all this week
  const hasAnyTasks = Object.values(currentWeek.days).some((d) =>
    d.sections.some((s) => s.tasks.length > 0)
  );
  if (!hasAnyTasks) return null;

  // Compute daily completion stats
  const dailyStats = days.map((day) => {
    const dk = formatDate(day);
    const dayData = currentWeek.days[dk];
    let total = 0;
    let done = 0;
    if (dayData) {
      dayData.sections.forEach((s) => {
        s.tasks.forEach((t) => {
          total++;
          if (t.completed) done++;
        });
      });
    }
    return { day, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  const weekTotal = dailyStats.reduce((a, d) => a + d.total, 0);
  const weekDone = dailyStats.reduce((a, d) => a + d.done, 0);
  const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  return (
    <div
      className="week-overview"
      style={{ background: theme.bgCard, borderColor: theme.border }}
    >
      <button
        className="overview-toggle"
        onClick={() => setExpanded(!expanded)}
        style={{ color: theme.text }}
      >
        <span>
          Resumen semanal — {capitalize(getMonthYear(state.currentDate))}
        </span>
        <span className="overview-pct" style={{ color: theme.accent }}>
          {weekPct}%
        </span>
        <span className="toggle-arrow">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="overview-grid">
          {dailyStats.map(({ day, done, total, pct }) => (
            <div key={formatDate(day)} className="overview-day">
              <span
                className="overview-day-label"
                style={{ color: theme.textSecondary }}
              >
                {capitalize(getDayShort(day))} {formatDayNumber(day)}
              </span>
              <div
                className="overview-bar-bg"
                style={{ background: theme.checkboxBg }}
              >
                <div
                  className="overview-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct === 100
                        ? theme.checkboxChecked
                        : pct > 0
                          ? theme.accent
                          : 'transparent',
                  }}
                />
              </div>
              <span
                className="overview-day-count"
                style={{ color: theme.textSecondary }}
              >
                {done}/{total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
