import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Terminal as TerminalIcon, X, ChevronDown, PanelRight, PanelLeft } from 'lucide-react';
import { ActivityBar } from '../sidebar/ActivityBar';
import { FileExplorer } from '../sidebar/FileExplorer';
import { EditorTabs } from '../editor/EditorTabs';
import { MonacoEditor } from '../editor/MonacoEditor';
import { WelcomeTab } from '../editor/WelcomeTab';
import { Terminal } from '../terminal/Terminal';
import { AIChatPanel } from '../chat/AIChatPanel';
import { SettingsPanel } from '../sidebar/SettingsPanel';
import { StatusBar } from './StatusBar';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';

export const AppShell: React.FC = () => {
  const {
    sidebarVisible,
    aiPanelVisible,
    terminalVisible,
    panelSizes,
    activeSidebarView,
    toggleTerminal,
    toggleAIPanel,
    setPanelSizes,
  } = useUIStore();

  const { tabs, activeTabId } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // ===== Resizable panels =====
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingAI, setIsResizingAI] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isResizingSidebar) {
        const newWidth = Math.max(180, Math.min(500, e.clientX - rect.left - 48)); // 48px for activity bar
        setPanelSizes({ sidebarWidth: newWidth });
      }

      if (isResizingAI) {
        const newWidth = Math.max(280, Math.min(600, rect.right - e.clientX));
        setPanelSizes({ aiPanelWidth: newWidth });
      }

      if (isResizingTerminal) {
        const newHeight = Math.max(120, Math.min(500, rect.bottom - e.clientY - 22)); // 22px for status bar
        setPanelSizes({ terminalHeight: newHeight });
      }
    },
    [isResizingSidebar, isResizingAI, isResizingTerminal, setPanelSizes]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizingSidebar(false);
    setIsResizingAI(false);
    setIsResizingTerminal(false);
  }, []);

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl+L — Toggle AI panel
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        toggleAIPanel();
      }
      // Ctrl+` — Toggle terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
      // Ctrl+B — Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [toggleAIPanel, toggleTerminal]);

  useEffect(() => {
    if (isResizingSidebar || isResizingAI || isResizingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingTerminal ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSidebar, isResizingAI, isResizingTerminal, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex flex-col h-screen w-screen bg-editor-bg overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar */}
        {sidebarVisible && (
          <>
            <div
              className="h-full overflow-hidden flex-shrink-0"
              style={{ width: panelSizes.sidebarWidth }}
            >
              {activeSidebarView === 'explorer' && <FileExplorer />}
              {activeSidebarView === 'search' && (
                <div className="flex flex-col h-full bg-sidebar-bg p-4">
                  <h3 className="text-[11px] font-semibold text-editor-subtext uppercase tracking-wider mb-3">
                    Search
                  </h3>
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="w-full px-3 py-1.5 bg-editor-surface border border-editor-border rounded-md text-sm text-editor-text placeholder-editor-muted outline-none focus:border-editor-accent/50 transition-colors"
                  />
                  <p className="text-xs text-editor-muted mt-4 text-center">
                    Type to search across files
                  </p>
                </div>
              )}
              {activeSidebarView === 'settings' && <SettingsPanel />}
              {activeSidebarView === 'ai' && (
                <div className="flex flex-col h-full bg-sidebar-bg p-4">
                  <h3 className="text-[11px] font-semibold text-editor-subtext uppercase tracking-wider mb-3">
                    AI Models
                  </h3>
                  <p className="text-xs text-editor-muted text-center">
                    Open the AI panel →
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar resize handle */}
            <div
              className="w-[3px] h-full cursor-col-resize hover:bg-editor-accent/40 active:bg-editor-accent/60 transition-colors flex-shrink-0"
              onMouseDown={() => setIsResizingSidebar(true)}
            />
          </>
        )}

        {/* Center: Editor + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tabs */}
            <EditorTabs />

            {/* Editor or Welcome */}
            {activeTab ? <MonacoEditor /> : <WelcomeTab />}
          </div>

          {/* Terminal resize handle */}
          {terminalVisible && (
            <div
              className="h-[3px] cursor-row-resize hover:bg-editor-accent/40 active:bg-editor-accent/60 transition-colors flex-shrink-0"
              onMouseDown={() => setIsResizingTerminal(true)}
            />
          )}

          {/* Terminal panel */}
          {terminalVisible && (
            <div
              className="flex flex-col flex-shrink-0 bg-terminal-bg border-t border-editor-border overflow-hidden"
              style={{ height: panelSizes.terminalHeight }}
            >
              {/* Terminal header */}
              <div className="flex items-center justify-between px-3 py-1 bg-editor-surface/50 border-b border-editor-border/50">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs text-editor-text font-medium border-b-2 border-editor-accent pb-0.5">
                    <TerminalIcon size={12} />
                    Terminal
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-editor-muted hover:text-editor-text pb-0.5 transition-colors">
                    Problems
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-editor-muted hover:text-editor-text pb-0.5 transition-colors">
                    Output
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTerminal}
                    className="p-1 rounded hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Terminal content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <Terminal />
              </div>
            </div>
          )}
        </div>

        {/* AI Chat resize handle */}
        {aiPanelVisible && (
          <div
            className="w-[3px] h-full cursor-col-resize hover:bg-editor-accent/40 active:bg-editor-accent/60 transition-colors flex-shrink-0"
            onMouseDown={() => setIsResizingAI(true)}
          />
        )}

        {/* AI Chat Panel */}
        {aiPanelVisible && (
          <div
            className="h-full flex-shrink-0 overflow-hidden"
            style={{ width: panelSizes.aiPanelWidth }}
          >
            <AIChatPanel />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
};
