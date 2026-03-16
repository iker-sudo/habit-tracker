import { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { getThemeById } from '../themes';
import { getWeekDays, formatDate, getDayOfWeekIndex } from '../utils/dates';

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

interface WeekStats {
  weekStart: string;
  completed: number;
  total: number;
  pct: number;
}

interface DayOfWeekStats {
  dayIndex: number;
  completed: number;
  total: number;
  pct: number;
  weeksTracked: number;
}

export default function StatsPanel() {
  const { state } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);

  const stats = useMemo(() => {
    const weekKeys = Object.keys(state.weeks).sort();
    const weeklyStats: WeekStats[] = [];
    const dayOfWeekTotals: Record<number, { completed: number; total: number; weeksTracked: number }> = {};

    // Initialize day-of-week totals
    for (let i = 0; i < 7; i++) {
      dayOfWeekTotals[i] = { completed: 0, total: 0, weeksTracked: 0 };
    }

    let totalCompleted = 0;
    let totalTasks = 0;

    // Current streak: consecutive days (going backwards from today) with 100% completion
    let currentStreak = 0;
    let longestStreak = 0;
    let streakBroken = false;

    // Collect all days sorted by date for streak calculation
    const allDays: { dateKey: string; completed: number; total: number }[] = [];

    for (const ws of weekKeys) {
      const week = state.weeks[ws];
      let weekCompleted = 0;
      let weekTotal = 0;

      const days = getWeekDays(ws);
      for (const d of days) {
        const dk = formatDate(d);
        const dayData = week.days[dk];
        if (!dayData) continue;

        let dayCompleted = 0;
        let dayTotal = 0;
        for (const section of dayData.sections) {
          for (const task of section.tasks) {
            dayTotal++;
            if (task.completed) dayCompleted++;
          }
        }

        if (dayTotal > 0) {
          const dow = getDayOfWeekIndex(d);
          dayOfWeekTotals[dow].completed += dayCompleted;
          dayOfWeekTotals[dow].total += dayTotal;
          dayOfWeekTotals[dow].weeksTracked++;
          allDays.push({ dateKey: dk, completed: dayCompleted, total: dayTotal });
        }

        weekCompleted += dayCompleted;
        weekTotal += dayTotal;
      }

      totalCompleted += weekCompleted;
      totalTasks += weekTotal;

      if (weekTotal > 0) {
        weeklyStats.push({
          weekStart: ws,
          completed: weekCompleted,
          total: weekTotal,
          pct: Math.round((weekCompleted / weekTotal) * 100),
        });
      }
    }

    // Calculate streak (consecutive days with all tasks done, from most recent)
    allDays.sort((a, b) => b.dateKey.localeCompare(a.dateKey)); // newest first
    for (const day of allDays) {
      if (day.total === 0) continue;
      if (!streakBroken && day.completed === day.total) {
        currentStreak++;
      } else {
        streakBroken = true;
      }
    }

    // Longest streak (any consecutive run)
    allDays.reverse(); // oldest first
    let tempStreak = 0;
    for (const day of allDays) {
      if (day.total === 0) continue;
      if (day.completed === day.total) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const overallPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    const dayOfWeekStats: DayOfWeekStats[] = Object.entries(dayOfWeekTotals).map(
      ([idx, data]) => ({
        dayIndex: parseInt(idx),
        completed: data.completed,
        total: data.total,
        pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        weeksTracked: data.weeksTracked,
      })
    );

    return {
      weeklyStats: weeklyStats.slice(-8), // last 8 weeks
      dayOfWeekStats,
      overallPct,
      totalCompleted,
      totalTasks,
      currentStreak,
      longestStreak,
      totalWeeks: weeklyStats.length,
    };
  }, [state.weeks]);

  return (
    <div className="stats-panel" style={{ color: theme.text }}>
      <h3 className="stats-title" style={{ color: theme.text }}>Estadisticas</h3>

      {/* Summary cards */}
      <div className="stats-summary">
        <div className="stat-card" style={{ background: theme.bg, borderColor: theme.border }}>
          <span className="stat-value" style={{ color: theme.accent }}>{stats.overallPct}%</span>
          <span className="stat-label" style={{ color: theme.textSecondary }}>Cumplimiento</span>
        </div>
        <div className="stat-card" style={{ background: theme.bg, borderColor: theme.border }}>
          <span className="stat-value" style={{ color: theme.accent }}>{stats.currentStreak}</span>
          <span className="stat-label" style={{ color: theme.textSecondary }}>Racha actual</span>
        </div>
        <div className="stat-card" style={{ background: theme.bg, borderColor: theme.border }}>
          <span className="stat-value" style={{ color: theme.accent }}>{stats.longestStreak}</span>
          <span className="stat-label" style={{ color: theme.textSecondary }}>Mejor racha</span>
        </div>
        <div className="stat-card" style={{ background: theme.bg, borderColor: theme.border }}>
          <span className="stat-value" style={{ color: theme.accent }}>{stats.totalWeeks}</span>
          <span className="stat-label" style={{ color: theme.textSecondary }}>Semanas</span>
        </div>
      </div>

      {/* Per day-of-week breakdown */}
      <div className="stats-section">
        <h4 className="stats-section-title" style={{ color: theme.textSecondary }}>
          Por dia de la semana
        </h4>
        {stats.dayOfWeekStats.map((ds) => (
          <div key={ds.dayIndex} className="stats-bar-row">
            <span className="stats-bar-label" style={{ color: theme.text }}>
              {DAY_NAMES_SHORT[ds.dayIndex]}
            </span>
            <div className="stats-bar-bg" style={{ background: theme.checkboxBg }}>
              <div
                className="stats-bar-fill"
                style={{ width: `${ds.pct}%`, background: theme.accent }}
              />
            </div>
            <span className="stats-bar-pct" style={{ color: theme.textSecondary }}>
              {ds.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Weekly trend */}
      {stats.weeklyStats.length > 1 && (
        <div className="stats-section">
          <h4 className="stats-section-title" style={{ color: theme.textSecondary }}>
            Ultimas semanas
          </h4>
          {stats.weeklyStats.map((ws) => (
            <div key={ws.weekStart} className="stats-bar-row">
              <span className="stats-bar-label" style={{ color: theme.text }}>
                {ws.weekStart.slice(5)} {/* MM-DD */}
              </span>
              <div className="stats-bar-bg" style={{ background: theme.checkboxBg }}>
                <div
                  className="stats-bar-fill"
                  style={{ width: `${ws.pct}%`, background: theme.accent }}
                />
              </div>
              <span className="stats-bar-pct" style={{ color: theme.textSecondary }}>
                {ws.pct}%
              </span>
            </div>
          ))}
        </div>
      )}

      {stats.totalTasks === 0 && (
        <p className="stats-empty" style={{ color: theme.textSecondary }}>
          Aun no hay datos. Completa tareas para ver tus estadisticas.
        </p>
      )}
    </div>
  );
}
