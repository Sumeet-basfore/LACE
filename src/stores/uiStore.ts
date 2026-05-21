import { create } from 'zustand';
import { SidebarView, PanelSizes } from '../types';

interface UIState {
  // Panel visibility
  sidebarVisible: boolean;
  aiPanelVisible: boolean;
  terminalVisible: boolean;

  // Panel sizes
  panelSizes: PanelSizes;

  // Sidebar
  activeSidebarView: SidebarView;

  // Theme
  theme: 'dark' | 'light';

  // Status bar info
  statusMessage: string;
  cursorPosition: { line: number; column: number };

  // Actions
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleTerminal: () => void;
  setSidebarView: (view: SidebarView) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setPanelSizes: (sizes: Partial<PanelSizes>) => void;
  setStatusMessage: (message: string) => void;
  setCursorPosition: (line: number, column: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarVisible: true,
  aiPanelVisible: false,
  terminalVisible: true,
  panelSizes: {
    sidebarWidth: 260,
    aiPanelWidth: 360,
    terminalHeight: 220,
  },
  activeSidebarView: 'explorer',
  theme: 'dark',
  statusMessage: 'Ready',
  cursorPosition: { line: 1, column: 1 },

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  toggleAIPanel: () =>
    set((state) => ({ aiPanelVisible: !state.aiPanelVisible })),

  toggleTerminal: () =>
    set((state) => ({ terminalVisible: !state.terminalVisible })),

  setSidebarView: (view: SidebarView) =>
    set({ activeSidebarView: view, sidebarVisible: true }),

  setTheme: (theme: 'dark' | 'light') => set({ theme }),

  setPanelSizes: (sizes: Partial<PanelSizes>) =>
    set((state) => ({
      panelSizes: { ...state.panelSizes, ...sizes },
    })),

  setStatusMessage: (message: string) => set({ statusMessage: message }),

  setCursorPosition: (line: number, column: number) =>
    set({ cursorPosition: { line, column } }),
}));
