import { create } from 'zustand';
import { EditorSettings, AISettings } from '../types';

interface SettingsState {
  editor: EditorSettings;
  ai: AISettings;

  // Actions
  updateEditorSetting: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void;
  updateAISetting: <K extends keyof AISettings>(key: K, value: AISettings[K]) => void;
  resetToDefaults: () => void;
}

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'off',
  minimap: true,
  lineNumbers: 'on',
  theme: 'dark',
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
};

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'ollama',
  ollamaEndpoint: 'http://localhost:11434',
  lmStudioEndpoint: 'http://localhost:1234',
  selectedModel: '',
  contextWindowSize: 4096,
  allowFileEdits: true,
  allowTerminalCommands: true,
  autoApplyChanges: false,
  enableInlineCompletion: false,
};

// Safe localStorage helper
const getStoredSettings = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const useSettingsStore = create<SettingsState>((set) => ({
  editor: getStoredSettings<EditorSettings>('editor_settings', DEFAULT_EDITOR_SETTINGS),
  ai: getStoredSettings<AISettings>('ai_settings', DEFAULT_AI_SETTINGS),

  updateEditorSetting: (key, value) => {
    set((state) => {
      const newEditor = { ...state.editor, [key]: value };
      try {
        localStorage.setItem('editor_settings', JSON.stringify(newEditor));
      } catch (err) {
        console.error('Failed to save editor settings', err);
      }
      return { editor: newEditor };
    });
  },

  updateAISetting: (key, value) => {
    set((state) => {
      const newAI = { ...state.ai, [key]: value };
      try {
        localStorage.setItem('ai_settings', JSON.stringify(newAI));
      } catch (err) {
        console.error('Failed to save AI settings', err);
      }
      return { ai: newAI };
    });
  },

  resetToDefaults: () => {
    set({
      editor: DEFAULT_EDITOR_SETTINGS,
      ai: DEFAULT_AI_SETTINGS,
    });
    try {
      localStorage.setItem('editor_settings', JSON.stringify(DEFAULT_EDITOR_SETTINGS));
      localStorage.setItem('ai_settings', JSON.stringify(DEFAULT_AI_SETTINGS));
    } catch {}
  },
}));
