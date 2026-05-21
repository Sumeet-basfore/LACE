import { create } from 'zustand';
import { EditorTab } from '../types';
import { detectLanguage } from '../utils/languageDetect';

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;

  // Actions
  openFile: (filePath: string, fileName: string, content: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabClean: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openFile: (filePath: string, fileName: string, content: string) => {
    const { tabs } = get();

    // Check if already open
    const existingTab = tabs.find((t) => t.filePath === filePath);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const newTab: EditorTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      filePath,
      fileName,
      language: detectLanguage(fileName),
      content,
      isDirty: false,
      isActive: true,
    };

    set((state) => ({
      tabs: [
        ...state.tabs.map((t) => ({ ...t, isActive: false })),
        newTab,
      ],
      activeTabId: newTab.id,
    }));
  },

  closeTab: (tabId: string) => {
    set((state) => {
      const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);

      let newActiveId = state.activeTabId;
      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Activate the tab to the left, or the first tab
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveId = newTabs[newIndex].id;
          newTabs[newIndex].isActive = true;
        } else {
          newActiveId = null;
        }
      }

      return { tabs: newTabs, activeTabId: newActiveId };
    });
  },

  setActiveTab: (tabId: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) => ({
        ...t,
        isActive: t.id === tabId,
      })),
      activeTabId: tabId,
    }));
  },

  updateTabContent: (tabId: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, content, isDirty: true } : t
      ),
    }));
  },

  markTabClean: (tabId: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: false } : t
      ),
    }));
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  closeOtherTabs: (tabId: string) => {
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id === tabId),
      activeTabId: tabId,
    }));
  },
}));
