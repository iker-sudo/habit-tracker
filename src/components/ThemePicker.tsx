import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { themes, getThemeById } from '../themes';
import type { ThemeColors } from '../types';
import { v4 as uuidv4 } from 'uuid';

const EDITABLE_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'bg', label: 'Fondo' },
  { key: 'bgSecondary', label: 'Fondo secundario' },
  { key: 'bgCard', label: 'Tarjeta' },
  { key: 'text', label: 'Texto' },
  { key: 'textSecondary', label: 'Texto secundario' },
  { key: 'accent', label: 'Acento' },
  { key: 'accentLight', label: 'Acento claro' },
  { key: 'border', label: 'Borde' },
  { key: 'checkboxBg', label: 'Checkbox' },
  { key: 'checkboxChecked', label: 'Checkbox marcado' },
  { key: 'danger', label: 'Peligro' },
  { key: 'sectionHeaderBg', label: 'Cabecera sección' },
];

export default function ThemePicker() {
  const { state, dispatch } = useHabits();
  const current = getThemeById(state.activeThemeId, state.customThemes);
  const allThemes = [...themes, ...state.customThemes];
  const [showEditor, setShowEditor] = useState(false);
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...current, id: '', name: '' });
  const [customName, setCustomName] = useState('');

  const handleOpenEditor = () => {
    setCustomColors({ ...current, id: '', name: '' });
    setCustomName('');
    setShowEditor(true);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setCustomColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveCustom = () => {
    if (!customName.trim()) return;
    const newTheme: ThemeColors = {
      ...customColors,
      id: uuidv4(),
      name: customName.trim(),
    };
    dispatch({ type: 'ADD_CUSTOM_THEME', theme: newTheme });
    setShowEditor(false);
  };

  return (
    <div className="theme-picker">
      <h3 style={{ color: current.text, margin: '0 0 12px 0', fontSize: 14 }}>
        Tema
      </h3>
      <div className="theme-options">
        {allThemes.map((t: ThemeColors) => (
          <button
            key={t.id}
            className={`theme-swatch ${t.id === state.activeThemeId ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_THEME', themeId: t.id })}
            title={t.name}
            style={{
              background: `linear-gradient(135deg, ${t.bg} 0%, ${t.accent} 100%)`,
              borderColor:
                t.id === state.activeThemeId ? t.accent : 'transparent',
            }}
          >
            {t.id === state.activeThemeId && (
              <span className="theme-check">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        className="customize-btn"
        onClick={handleOpenEditor}
        style={{
          color: current.accent,
          borderColor: current.border,
          marginTop: 12,
        }}
      >
        Personalizar colores
      </button>

      {showEditor && (
        <div className="color-editor" style={{ borderColor: current.border }}>
          <div className="color-editor-name">
            <input
              placeholder="Nombre del tema..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={{
                color: current.text,
                borderColor: current.border,
                background: current.bg,
              }}
            />
          </div>
          <div className="color-editor-grid">
            {EDITABLE_FIELDS.map(({ key, label }) => (
              <div key={key} className="color-editor-row">
                <label style={{ color: current.textSecondary }}>{label}</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={customColors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="color-input"
                  />
                  <span
                    className="color-hex"
                    style={{ color: current.textSecondary }}
                  >
                    {customColors[key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="color-editor-actions">
            <button
              className="editor-cancel-btn"
              onClick={() => setShowEditor(false)}
              style={{ color: current.textSecondary }}
            >
              Cancelar
            </button>
            <button
              className="editor-save-btn"
              onClick={handleSaveCustom}
              disabled={!customName.trim()}
              style={{
                background: current.accent,
                color: '#fff',
                opacity: customName.trim() ? 1 : 0.5,
              }}
            >
              Guardar tema
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
