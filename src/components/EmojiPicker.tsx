import { useState, useRef, useEffect } from 'react';

/**
 * Curated emoji categories for section icons.
 * Only widely-supported emojis to avoid tofu/broken rendering.
 */
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Rutina',
    emojis: [
      '☀️', '🌙', '⭐', '🌅', '🌃', '💤',
      '⏰', '🔔', '📅', '🗓️', '✅', '📝',
    ],
  },
  {
    label: 'Salud',
    emojis: [
      '💪', '🏃', '🧘', '🚴', '🏋️', '🧗',
      '💊', '🩺', '🧠', '❤️', '🦷', '👁️',
    ],
  },
  {
    label: 'Comida',
    emojis: [
      '🍳', '☕', '🥗', '🍎', '🥤', '🍽️',
      '🧃', '💧', '🍕', '🥑', '🍞', '🫖',
    ],
  },
  {
    label: 'Trabajo',
    emojis: [
      '💻', '📚', '🎓', '✏️', '📊', '💼',
      '📧', '🔧', '🎯', '📌', '🗂️', '📖',
    ],
  },
  {
    label: 'Casa',
    emojis: [
      '🏠', '🧹', '🧺', '🛒', '🪴', '🐕',
      '🐱', '🚿', '🛏️', '🪥', '👕', '🧽',
    ],
  },
  {
    label: 'Ocio',
    emojis: [
      '🎮', '🎵', '🎬', '📺', '🎨', '📸',
      '✈️', '🌍', '🎤', '🎧', '🏖️', '⚽',
    ],
  },
  {
    label: 'Social',
    emojis: [
      '👋', '💬', '📞', '👥', '🤝', '💌',
      '🎁', '🎉', '😊', '🙏', '👨‍👩‍👧', '❤️‍🔥',
    ],
  },
  {
    label: 'Simbolos',
    emojis: [
      '➕', '🔥', '💡', '🚀', '🏆', '💎',
      '🌈', '🎯', '♻️', '⚡', '🔑', '🏷️',
    ],
  },
];

interface Props {
  current: string;
  onSelect: (emoji: string) => void;
  theme: {
    bg: string;
    bgCard: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentLight: string;
    border: string;
  };
}

export default function EmojiPicker({ current, onSelect, theme }: Props) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="emoji-picker-wrapper" ref={ref}>
      <button
        className="emoji-picker-trigger"
        onClick={() => setOpen(!open)}
        style={{
          background: theme.accentLight,
          borderColor: open ? theme.accent : theme.border,
          color: theme.text,
        }}
        title="Elegir icono"
        type="button"
      >
        {current || '➕'}
      </button>

      {open && (
        <div
          className="emoji-picker-dropdown"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          {/* Category tabs */}
          <div className="emoji-picker-tabs">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                className={`emoji-picker-tab ${activeCategory === i ? 'active' : ''}`}
                onClick={() => setActiveCategory(i)}
                style={{
                  color: activeCategory === i ? theme.accent : theme.textSecondary,
                  borderColor: activeCategory === i ? theme.accent : 'transparent',
                }}
                type="button"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="emoji-picker-grid">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                className={`emoji-picker-item ${current === emoji ? 'active' : ''}`}
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                style={{
                  background: current === emoji ? theme.accentLight : 'transparent',
                  borderColor: current === emoji ? theme.accent : 'transparent',
                }}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Custom input for pasting any emoji */}
          <div className="emoji-picker-custom">
            <input
              className="emoji-picker-custom-input"
              placeholder="O escribe aqui..."
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if ([...val].length <= 2 && val.trim()) {
                  onSelect(val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setOpen(false);
              }}
              style={{
                color: theme.text,
                background: theme.bg,
                borderColor: theme.border,
              }}
              maxLength={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
