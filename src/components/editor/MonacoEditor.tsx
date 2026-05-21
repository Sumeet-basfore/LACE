import React, { useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { registerInlineCompletionProvider } from '../../utils/inlineCompletionProvider';

// Custom VS Code-like dark theme
const editorTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'cba6f7' },
    { token: 'string', foreground: 'a6e3a1' },
    { token: 'number', foreground: 'fab387' },
    { token: 'type', foreground: '89b4fa' },
    { token: 'function', foreground: '89b4fa' },
    { token: 'variable', foreground: 'cdd6f4' },
    { token: 'operator', foreground: '89dceb' },
    { token: 'delimiter', foreground: '9399b2' },
    { token: 'tag', foreground: 'f38ba8' },
    { token: 'attribute.name', foreground: '89b4fa' },
    { token: 'attribute.value', foreground: 'a6e3a1' },
  ],
  colors: {
    'editor.background': '#1e1e2e',
    'editor.foreground': '#cdd6f4',
    'editor.lineHighlightBackground': '#313244',
    'editor.selectionBackground': '#45475a',
    'editor.inactiveSelectionBackground': '#313244',
    'editorLineNumber.foreground': '#6c7086',
    'editorLineNumber.activeForeground': '#cdd6f4',
    'editorCursor.foreground': '#f5e0dc',
    'editor.findMatchBackground': '#f9e2af40',
    'editor.findMatchHighlightBackground': '#f9e2af20',
    'editorWidget.background': '#181825',
    'editorWidget.border': '#313244',
    'editorSuggestWidget.background': '#181825',
    'editorSuggestWidget.border': '#313244',
    'editorSuggestWidget.selectedBackground': '#45475a',
    'editorHoverWidget.background': '#181825',
    'editorHoverWidget.border': '#313244',
    'minimap.background': '#181825',
    'scrollbar.shadow': '#11111b',
    'scrollbarSlider.background': '#45475a40',
    'scrollbarSlider.hoverBackground': '#45475a80',
    'scrollbarSlider.activeBackground': '#45475aCC',
  },
};

export const MonacoEditor: React.FC = () => {
  const { tabs, activeTabId, updateTabContent } = useEditorStore();
  const { setCursorPosition, setStatusMessage } = useUIStore();
  const { updateFileContent } = useFileSystemStore();
  const { editor: editorSettings } = useSettingsStore();
  const editorRef = useRef<any>(null);
  const completionCleanupRef = useRef<(() => void) | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    return () => {
      if (completionCleanupRef.current) {
        completionCleanupRef.current();
        completionCleanupRef.current = null;
      }
    };
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom theme
    monaco.editor.defineTheme('local-ai-dark', editorTheme);
    monaco.editor.setTheme('local-ai-dark');

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition(e.position.lineNumber, e.position.column);
    });

    // Register inline completion provider
    if (completionCleanupRef.current) {
      completionCleanupRef.current();
    }
    completionCleanupRef.current = registerInlineCompletionProvider(monaco);

    // Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentTab = useEditorStore.getState().tabs.find(
        (t) => t.id === useEditorStore.getState().activeTabId
      );
      if (currentTab) {
        updateFileContent(currentTab.filePath, currentTab.content);
        useEditorStore.getState().markTabClean(currentTab.id);
        setStatusMessage(`Saved ${currentTab.fileName}`);
        setTimeout(() => setStatusMessage('Ready'), 2000);
      }
    });

    // Focus the editor
    editor.focus();
  };

  const handleChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  if (!activeTab) return null;

  return (
    <div className="flex-1 h-full">
      <Editor
        key={activeTab.id}
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="local-ai-dark"
        options={{
          fontSize: editorSettings.fontSize,
          fontFamily: editorSettings.fontFamily,
          fontLigatures: true,
          lineNumbers: editorSettings.lineNumbers as any,
          minimap: { enabled: editorSettings.minimap, scale: 1, showSlider: 'mouseover' },
          scrollBeyondLastLine: false,
          wordWrap: editorSettings.wordWrap as any,
          tabSize: editorSettings.tabSize,
          insertSpaces: true,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showIcons: true,
            showStatusBar: true,
          },
          stickyScroll: { enabled: true },
          overviewRulerLanes: 0,
        }}
        loading={
          <div className="flex-1 h-full flex items-center justify-center bg-editor-bg">
            <div className="flex items-center gap-3 text-editor-muted">
              <div className="w-5 h-5 border-2 border-editor-accent/30 border-t-editor-accent rounded-full animate-spin" />
              <span className="text-sm">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};
