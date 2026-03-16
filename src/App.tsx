import { useState } from 'react';
import { HabitProvider, useHabits } from './context/HabitContext';
import { getThemeById } from './themes';
import WeekHeader from './components/WeekHeader';
import DayView from './components/DayView';
import WeekOverview from './components/WeekOverview';
import ThemePicker from './components/ThemePicker';
import RoutineManager from './components/RoutineManager';
import StatsPanel from './components/StatsPanel';
import './App.css';

type SettingsTab = 'theme' | 'routines' | 'stats';

function AppContent() {
  const { state } = useHabits();
  const theme = getThemeById(state.activeThemeId, state.customThemes);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('theme');

  return (
    <div className="app-container" style={{ background: theme.bg, color: theme.text }}>
      <div className="app-inner">
        {/* Settings toggle */}
        <button
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          style={{ color: theme.textSecondary }}
          aria-label="Ajustes"
        >
          ⚙
        </button>

        {showSettings && (
          <div
            className="settings-panel"
            style={{ background: theme.bgCard, borderColor: theme.border }}
          >
            {/* Settings tabs */}
            <div className="settings-tabs">
              <button
                className={`settings-tab ${settingsTab === 'theme' ? 'active' : ''}`}
                onClick={() => setSettingsTab('theme')}
                style={{
                  color: settingsTab === 'theme' ? theme.accent : theme.textSecondary,
                  borderColor: settingsTab === 'theme' ? theme.accent : 'transparent',
                }}
              >
                Tema
              </button>
              <button
                className={`settings-tab ${settingsTab === 'routines' ? 'active' : ''}`}
                onClick={() => setSettingsTab('routines')}
                style={{
                  color: settingsTab === 'routines' ? theme.accent : theme.textSecondary,
                  borderColor: settingsTab === 'routines' ? theme.accent : 'transparent',
                }}
              >
                Rutinas
              </button>
              <button
                className={`settings-tab ${settingsTab === 'stats' ? 'active' : ''}`}
                onClick={() => setSettingsTab('stats')}
                style={{
                  color: settingsTab === 'stats' ? theme.accent : theme.textSecondary,
                  borderColor: settingsTab === 'stats' ? theme.accent : 'transparent',
                }}
              >
                Stats
              </button>
            </div>

            {settingsTab === 'theme' && <ThemePicker />}
            {settingsTab === 'routines' && <RoutineManager />}
            {settingsTab === 'stats' && <StatsPanel />}
          </div>
        )}

        <WeekHeader />
        <WeekOverview />
        <DayView />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HabitProvider>
      <AppContent />
    </HabitProvider>
  );
}
