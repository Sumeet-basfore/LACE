// ===== File System Types =====
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  language?: string;
  isExpanded?: boolean;
}

// ===== Editor Types =====
export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
}

// ===== AI Chat Types =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface AIModel {
  id: string;
  name: string;
  type: 'ollama' | 'gguf';
  size?: string;
  path?: string;
}

// ===== Settings Types =====
export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  theme: 'dark' | 'light';
  fontFamily: string;
}

export type AIProvider = 'ollama' | 'lmstudio';

export interface AISettings {
  provider: AIProvider;
  ollamaEndpoint: string;
  lmStudioEndpoint: string;
  selectedModel: string;
  contextWindowSize: number;
  allowFileEdits: boolean;
  allowTerminalCommands: boolean;
  autoApplyChanges: boolean;
  enableInlineCompletion: boolean;
}

// ===== UI State Types =====
export type SidebarView = 'explorer' | 'search' | 'ai' | 'settings';

export interface PanelSizes {
  sidebarWidth: number;
  aiPanelWidth: number;
  terminalHeight: number;
}
