import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Check,
  Bot,
  Layout,
  Undo,
  FileCode,
  Terminal,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';

export const SettingsPanel: React.FC = () => {
  const { editor, ai, updateEditorSetting, updateAISetting, resetToDefaults } =
    useSettingsStore();

  const { isConnected, isCheckingConnection, connectionError, checkConnection } =
    useChatStore();

  const [activeCategory, setActiveCategory] = useState<'editor' | 'ai'>('editor');
  const [testSuccess, setTestSuccess] = useState(false);

  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
  const [ggufModelPath, setGgufModelPath] = useState<string | null>(null);
  const [isLlamaServerLoading, setIsLlamaServerLoading] = useState(false);
  const [ggufError, setGgufError] = useState<string | null>(null);

  // Load status on mount
  React.useEffect(() => {
    if (isTauri) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke<string | null>('get_gguf_status')
          .then((status) => setGgufModelPath(status))
          .catch((err) => console.error('Failed to get GGUF status', err));
      });
    }
  }, [isTauri]);

  const handlePickAndLoadGguf = async () => {
    setGgufError(null);
    if (!isTauri) {
      // Mock mode
      setIsLlamaServerLoading(true);
      setTimeout(() => {
        setGgufModelPath('/home/user/models/qwen2.5-coder-1.5b-instruct.gguf');
        setIsLlamaServerLoading(false);
        updateAISetting('ollamaEndpoint', 'http://localhost:11435');
        useChatStore.getState().setEndpoint('http://localhost:11435');
        useChatStore.getState().selectModel('llama-server (Qwen2.5-Coder)');
        useChatStore.setState({ isConnected: true, connectionError: null });
      }, 1000);
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const pickedFile = await invoke<string | null>('pick_gguf_file');
      if (!pickedFile) return;

      setIsLlamaServerLoading(true);
      await invoke<string>('load_gguf_model', { filePath: pickedFile });
      setGgufModelPath(pickedFile);
      setIsLlamaServerLoading(false);

      // Re-point endpoint and model to local llama-server
      updateAISetting('ollamaEndpoint', 'http://localhost:11435');
      useChatStore.getState().setEndpoint('http://localhost:11435');
      useChatStore.getState().selectModel('llama-server');
      useChatStore.setState({ isConnected: true, connectionError: null });
    } catch (err: any) {
      setIsLlamaServerLoading(false);
      setGgufError(err.toString());
    }
  };

  const handleUnloadGguf = async () => {
    setGgufError(null);
    if (!isTauri) {
      setGgufModelPath(null);
      return;
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('unload_gguf_model');
      setGgufModelPath(null);
    } catch (err: any) {
      setGgufError(err.toString());
    }
  };

  const handleTestConnection = async () => {
    setTestSuccess(false);
    await checkConnection();
    if (useChatStore.getState().isConnected) {
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-bg animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-editor-border">
        <Settings size={16} className="text-editor-accent" />
        <span className="text-sm font-semibold text-editor-text">Settings</span>
      </div>

      {/* Categories */}
      <div className="flex border-b border-editor-border/40 px-2 bg-editor-bg/40">
        <button
          onClick={() => setActiveCategory('editor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-all ${
            activeCategory === 'editor'
              ? 'border-editor-accent text-editor-text bg-editor-surface/30'
              : 'border-transparent text-editor-muted hover:text-editor-text'
          }`}
        >
          <Sliders size={12} />
          Editor
        </button>
        <button
          onClick={() => setActiveCategory('ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-all ${
            activeCategory === 'ai'
              ? 'border-editor-accent text-editor-text bg-editor-surface/30'
              : 'border-transparent text-editor-muted hover:text-editor-text'
          }`}
        >
          <Sparkles size={12} />
          AI Preferences
        </button>
      </div>

      {/* Settings list container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
        {activeCategory === 'editor' ? (
          /* ===== Editor Settings Category ===== */
          <div className="space-y-4 animate-slide-up">
            {/* Font Size */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-editor-text block">
                Font Size
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={editor.fontSize}
                  onChange={(e) =>
                    updateEditorSetting('fontSize', parseInt(e.target.value))
                  }
                  className="flex-1 accent-editor-accent h-1 bg-editor-border rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono px-2 py-1 bg-editor-surface rounded border border-editor-border text-editor-text">
                  {editor.fontSize}px
                </span>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-editor-text block">
                Font Family
              </label>
              <select
                value={editor.fontFamily}
                onChange={(e) => updateEditorSetting('fontFamily', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40"
              >
                <option value="'JetBrains Mono', 'Fira Code', Consolas, monospace">
                  JetBrains Mono / Fira Code
                </option>
                <option value="Consolas, 'Courier New', monospace">
                  Consolas
                </option>
                <option value="monospace">
                  Generic Monospace
                </option>
              </select>
            </div>

            {/* Tab Size */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-editor-text block">
                Tab Size
              </label>
              <select
                value={editor.tabSize}
                onChange={(e) =>
                  updateEditorSetting('tabSize', parseInt(e.target.value))
                }
                className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
              </select>
            </div>

            {/* Word Wrap */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-editor-text block">
                Word Wrap
              </label>
              <select
                value={editor.wordWrap}
                onChange={(e) =>
                  updateEditorSetting('wordWrap', e.target.value as any)
                }
                className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40"
              >
                <option value="off">Off</option>
                <option value="on">On (Wrap to width)</option>
              </select>
            </div>

            {/* Minimap */}
            <div className="flex items-center justify-between py-1 border-t border-editor-border/20 pt-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-editor-text">
                  Show Minimap
                </span>
                <span className="text-[9px] text-editor-muted">
                  Displays collapsible minimap on the right
                </span>
              </div>
              <button
                onClick={() => updateEditorSetting('minimap', !editor.minimap)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  editor.minimap ? 'bg-editor-accent' : 'bg-editor-border'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                    editor.minimap ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Line Numbers */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-editor-text block">
                Line Numbers
              </label>
              <select
                value={editor.lineNumbers}
                onChange={(e) =>
                  updateEditorSetting('lineNumbers', e.target.value as any)
                }
                className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40"
              >
                <option value="on">Normal (On)</option>
                <option value="off">Disabled (Off)</option>
                <option value="relative">Relative</option>
              </select>
            </div>
          </div>
        ) : (
          /* ===== AI Settings Category ===== */
          <div className="space-y-4 animate-slide-up">
            {/* AI Provider Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-editor-text block">
                AI Provider
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-editor-surface rounded-lg border border-editor-border">
                <button
                  onClick={() => {
                    updateAISetting('provider', 'ollama');
                    const endpoint = ai.ollamaEndpoint;
                    useChatStore.getState().setEndpoint(endpoint);
                    setTimeout(() => {
                      useChatStore.getState().checkConnection();
                    }, 50);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    ai.provider === 'ollama'
                      ? 'bg-editor-accent text-white shadow-sm'
                      : 'text-editor-muted hover:text-editor-text hover:bg-editor-hover/30'
                  }`}
                >
                  Ollama
                </button>
                <button
                  onClick={() => {
                    updateAISetting('provider', 'lmstudio');
                    const endpoint = ai.lmStudioEndpoint;
                    useChatStore.getState().setEndpoint(endpoint);
                    setTimeout(() => {
                      useChatStore.getState().checkConnection();
                    }, 50);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    ai.provider === 'lmstudio'
                      ? 'bg-editor-accent text-white shadow-sm'
                      : 'text-editor-muted hover:text-editor-text hover:bg-editor-hover/30'
                  }`}
                >
                  LM Studio
                </button>
              </div>
            </div>

            {/* Provider-specific Endpoint */}
            {ai.provider === 'ollama' ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-editor-text block">
                    Ollama Endpoint
                  </label>
                  <button
                    onClick={handleTestConnection}
                    disabled={isCheckingConnection}
                    className="text-[10px] text-editor-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isCheckingConnection ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : testSuccess ? (
                      <Check size={10} className="text-editor-success" />
                    ) : (
                      'Test'
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={ai.ollamaEndpoint}
                  onChange={(e) => {
                    updateAISetting('ollamaEndpoint', e.target.value);
                    useChatStore.getState().setEndpoint(e.target.value);
                  }}
                  placeholder="http://localhost:11434"
                  className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40 font-mono"
                />
                {connectionError ? (
                  <div className="flex items-center gap-1 text-[9px] text-editor-error mt-0.5">
                    <AlertCircle size={10} />
                    Not reachable
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-1 text-[9px] text-editor-success mt-0.5">
                    <Check size={10} />
                    Connected
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-editor-text block">
                    LM Studio Endpoint
                  </label>
                  <button
                    onClick={handleTestConnection}
                    disabled={isCheckingConnection}
                    className="text-[10px] text-editor-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isCheckingConnection ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : testSuccess ? (
                      <Check size={10} className="text-editor-success" />
                    ) : (
                      'Test'
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={ai.lmStudioEndpoint}
                  onChange={(e) => {
                    updateAISetting('lmStudioEndpoint', e.target.value);
                    useChatStore.getState().setEndpoint(e.target.value);
                  }}
                  placeholder="http://localhost:1234"
                  className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40 font-mono"
                />
                {connectionError ? (
                  <div className="flex items-center gap-1 text-[9px] text-editor-error mt-0.5">
                    <AlertCircle size={10} />
                    Not reachable
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-1 text-[9px] text-editor-success mt-0.5">
                    <Check size={10} />
                    Connected
                  </div>
                ) : null}
              </div>
            )}

            {/* Direct GGUF Inference - Ollama only */}
            {ai.provider === 'ollama' && (
              <div className="space-y-2 pt-2 border-t border-editor-border/20">
                <label className="text-[11px] font-semibold text-editor-text block">
                  Local .gguf Model Loader (llama.cpp)
                </label>
                
                {ggufModelPath ? (
                  <div className="p-2.5 rounded-lg bg-editor-surface border border-editor-border space-y-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <Bot size={14} className="text-editor-accent flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-editor-muted uppercase tracking-wider font-semibold">Active Model</div>
                        <div className="text-xs text-editor-text font-mono truncate" title={ggufModelPath}>
                          {ggufModelPath.split('/').pop()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-editor-muted">
                      <span>Endpoint: http://localhost:11435</span>
                      <button
                        onClick={handleUnloadGguf}
                        className="px-2 py-1 bg-editor-error/10 hover:bg-editor-error/20 text-editor-error rounded transition-colors font-semibold"
                      >
                        Unload
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePickAndLoadGguf}
                    disabled={isLlamaServerLoading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-editor-accent/10 hover:bg-editor-accent/20 text-editor-accent rounded-lg border border-editor-accent/30 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLlamaServerLoading ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        Loading Llama Server...
                      </>
                    ) : (
                      <>
                        <FileCode size={12} />
                        Choose Local .gguf File
                      </>
                    )}
                  </button>
                )}

                {ggufError && (
                  <div className="flex items-start gap-1 text-[10px] text-editor-error">
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                    <span>{ggufError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Context Window Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-editor-text block">
                  Context Window Size (tokens)
                </label>
                <span className="text-[9px] text-editor-muted">
                  0 = Model default
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="1024"
                value={ai.contextWindowSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateAISetting('contextWindowSize', isNaN(val) ? 0 : val);
                }}
                className="w-full px-2.5 py-1.5 bg-editor-surface border border-editor-border rounded-md text-xs text-editor-text outline-none focus:border-editor-accent/40"
                placeholder="e.g. 4096 (0 for model default)"
              />
            </div>

            {/* Auto-apply edits */}
            <div className="flex items-center justify-between py-1 border-t border-editor-border/20 pt-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-editor-text">
                  Auto-Apply Edits
                </span>
                <span className="text-[9px] text-editor-muted">
                  Write proposals directly to files
                </span>
              </div>
              <button
                onClick={() => {
                  const val = !ai.autoApplyChanges;
                  updateAISetting('autoApplyChanges', val);
                  useChatStore.setState({ autoApply: val });
                }}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  ai.autoApplyChanges ? 'bg-editor-accent' : 'bg-editor-border'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                    ai.autoApplyChanges ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Allow File Edits */}
            <div className="flex items-center justify-between py-1 border-t border-editor-border/20 pt-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-editor-text">
                  Allow File Edits
                </span>
                <span className="text-[9px] text-editor-muted">
                  Enable AI to propose visual code changes
                </span>
              </div>
              <button
                onClick={() => updateAISetting('allowFileEdits', !ai.allowFileEdits)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  ai.allowFileEdits ? 'bg-editor-accent' : 'bg-editor-border'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                    ai.allowFileEdits ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Allow Terminal Commands */}
            <div className="flex items-center justify-between py-1 border-t border-editor-border/20 pt-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-editor-text">
                  Terminal Suggestions
                </span>
                <span className="text-[9px] text-editor-muted">
                  Enable AI to suggest shell execution blocks
                </span>
              </div>
              <button
                onClick={() =>
                  updateAISetting('allowTerminalCommands', !ai.allowTerminalCommands)
                }
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  ai.allowTerminalCommands ? 'bg-editor-accent' : 'bg-editor-border'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                    ai.allowTerminalCommands ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Enable Inline Completions */}
            <div className="flex items-center justify-between py-1 border-t border-editor-border/20 pt-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-editor-text">
                  Inline Completions
                </span>
                <span className="text-[9px] text-editor-muted">
                  Show ghost text completions (Phase 6)
                </span>
              </div>
              <button
                onClick={() =>
                  updateAISetting('enableInlineCompletion', !ai.enableInlineCompletion)
                }
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  ai.enableInlineCompletion ? 'bg-editor-accent' : 'bg-editor-border'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                    ai.enableInlineCompletion ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset footer */}
      <div className="p-3 border-t border-editor-border bg-editor-surface/30 flex justify-end">
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-1 px-3 py-1.5 bg-editor-border hover:bg-editor-hover text-editor-text text-xs rounded-md font-medium transition-colors"
        >
          <Undo size={12} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
