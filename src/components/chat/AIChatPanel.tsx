import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  ChevronDown,
  Settings2,
  Eraser,
  RefreshCw,
  Square,
  Wifi,
  WifiOff,
  Loader2,
  FileCode,
  X,
  MessageSquare,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useEditorStore } from '../../stores/editorStore';
import { ChatMessageBubble, StreamingMessage } from './ChatMessage';

export const AIChatPanel: React.FC = () => {
  const {
    isConnected,
    isCheckingConnection,
    connectionError,
    ollamaEndpoint,
    availableModels,
    selectedModel,
    isLoadingModels,
    messages,
    isStreaming,
    streamingContent,
    contextFiles,
    checkConnection,
    setEndpoint,
    loadModels,
    selectModel,
    sendMessage,
    cancelStream,
    clearChat,
    removeContextFile,
    autoApply,
    toggleAutoApply,
  } = useChatStore();

  const { tabs, activeTabId } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const [inputValue, setInputValue] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showEndpointEdit, setShowEndpointEdit] = useState(false);
  const [endpointInput, setEndpointInput] = useState(ollamaEndpoint);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (!isConnected && !isCheckingConnection) {
      checkConnection();
    }
  }, []);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isStreaming || !selectedModel) return;

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(content);
  }, [inputValue, isStreaming, selectedModel, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndpointSave = () => {
    setEndpoint(endpointInput);
    setShowEndpointEdit(false);
    checkConnection();
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg border-l border-editor-border animate-slide-in-right">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-editor-accent" />
          <span className="text-sm font-semibold text-editor-text">
            AI Assistant
          </span>
          {/* Connection indicator */}
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-editor-success' : 'bg-editor-error'
            }`}
            title={isConnected ? 'Connected to Ollama' : 'Disconnected'}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              checkConnection();
              loadModels();
            }}
            title="Refresh connection"
            className="p-1.5 rounded-md hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-colors"
          >
            <RefreshCw
              size={14}
              className={isCheckingConnection ? 'animate-spin' : ''}
            />
          </button>
          <button
            onClick={clearChat}
            title="Clear chat"
            className="p-1.5 rounded-md hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-colors"
          >
            <Eraser size={14} />
          </button>
          <button
            onClick={() => setShowEndpointEdit(!showEndpointEdit)}
            title="Settings"
            className="p-1.5 rounded-md hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-colors"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* ===== Endpoint Editor ===== */}
      {showEndpointEdit && (
        <div className="px-3 py-2 border-b border-editor-border/50 bg-editor-surface/50 animate-slide-up">
          <label className="text-[10px] text-editor-muted uppercase tracking-wider font-medium mb-1 block">
            Ollama Endpoint
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1 px-2.5 py-1.5 bg-editor-overlay border border-editor-border rounded-md text-xs text-editor-text placeholder-editor-muted outline-none focus:border-editor-accent/50 transition-colors font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleEndpointSave()}
            />
            <button
              onClick={handleEndpointSave}
              className="px-3 py-1.5 bg-editor-accent/20 hover:bg-editor-accent/30 text-editor-accent text-xs rounded-md transition-colors font-medium"
            >
              Save
            </button>
          </div>
          {connectionError && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-editor-error">
              <AlertCircle size={12} />
              {connectionError}
            </div>
          )}

          {/* Auto-Apply changes */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-editor-border/30">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-editor-text">Auto-Apply Changes</span>
              <span className="text-[9px] text-editor-muted">Automatically apply file edits from assistant</span>
            </div>
            <button
              onClick={toggleAutoApply}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                autoApply ? 'bg-editor-accent' : 'bg-editor-border'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                  autoApply ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ===== Model Selector ===== */}
      <div className="px-3 py-2 border-b border-editor-border/50 relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setShowModelDropdown(!showModelDropdown);
            if (!showModelDropdown && isConnected) loadModels();
          }}
          className="flex items-center gap-2 px-3 py-1.5 w-full rounded-md bg-editor-surface border border-editor-border hover:border-editor-accent/30 transition-colors text-sm"
        >
          <Bot size={14} className="text-editor-accent flex-shrink-0" />
          <span className="text-xs text-editor-text truncate flex-1 text-left">
            {selectedModel || 'Select Model'}
          </span>
          {isLoadingModels ? (
            <Loader2 size={12} className="animate-spin text-editor-muted flex-shrink-0" />
          ) : (
            <ChevronDown
              size={12}
              className={`text-editor-muted transition-transform flex-shrink-0 ${
                showModelDropdown ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {/* Model dropdown */}
        {showModelDropdown && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-editor-overlay border border-editor-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin animate-slide-up">
            {!isConnected ? (
              <div className="px-3 py-4 text-center">
                <WifiOff size={20} className="mx-auto mb-2 text-editor-muted" />
                <p className="text-xs text-editor-muted">
                  Not connected to Ollama
                </p>
                <button
                  onClick={() => {
                    checkConnection();
                    setShowModelDropdown(false);
                  }}
                  className="mt-2 px-3 py-1 bg-editor-accent/10 text-editor-accent text-xs rounded-md hover:bg-editor-accent/20 transition-colors"
                >
                  Try connecting
                </button>
              </div>
            ) : availableModels.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-editor-muted">No models found</p>
                <p className="text-[10px] text-editor-muted mt-1">
                  Run <code className="text-editor-accent">ollama pull llama3.2</code> to download a model
                </p>
              </div>
            ) : (
              availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    selectModel(model.id);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left hover:bg-editor-hover transition-colors flex items-center gap-3 border-b border-editor-border/30 last:border-b-0 ${
                    selectedModel === model.id ? 'bg-editor-hover/50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-editor-text truncate">
                        {model.name}
                      </span>
                      {selectedModel === model.id && (
                        <Check size={12} className="text-editor-accent flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-editor-muted">
                        {model.parameterSize}
                      </span>
                      <span className="text-[10px] text-editor-muted">•</span>
                      <span className="text-[10px] text-editor-muted">
                        {model.size}
                      </span>
                      <span className="text-[10px] text-editor-muted">•</span>
                      <span className="text-[10px] text-editor-muted capitalize">
                        {model.family}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ===== Context Files Bar ===== */}
      {(contextFiles.length > 0 || activeTab) && (
        <div className="px-3 py-1.5 border-b border-editor-border/30 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-editor-muted">Context:</span>
          {activeTab && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-editor-accent/10 text-editor-accent text-[10px] rounded-md">
              <FileCode size={10} />
              {activeTab.fileName}
              <span className="text-editor-muted">(active)</span>
            </span>
          )}
          {contextFiles.map((fp) => (
            <span
              key={fp}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-editor-surface text-editor-subtext text-[10px] rounded-md"
            >
              <FileCode size={10} />
              {fp.split('/').pop()}
              <button
                onClick={() => removeContextFile(fp)}
                className="hover:text-editor-error transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ===== Chat Messages ===== */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && !isStreaming ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-editor-accent/5 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-editor-accent/10 to-transparent p-5 rounded-2xl border border-editor-border/50">
                <MessageSquare size={32} className="text-editor-accent/60" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-editor-text mb-2">
              {isConnected ? 'Ready to Chat' : 'Connect to Ollama'}
            </h3>
            <p className="text-xs text-editor-muted leading-relaxed max-w-[240px] mb-4">
              {isConnected
                ? `Ask questions about your code. The currently open file is automatically included as context.`
                : 'Start Ollama on your machine to begin chatting with AI about your code.'}
            </p>
            {isConnected && (
              <div className="space-y-2 w-full max-w-[240px]">
                {['Explain this code', 'Find bugs in this file', 'How can I refactor this?'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputValue(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="w-full px-3 py-2 text-xs text-left text-editor-subtext bg-editor-surface/50 border border-editor-border/50 rounded-lg hover:border-editor-accent/30 hover:bg-editor-surface transition-all"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            )}
            {!isConnected && (
              <button
                onClick={checkConnection}
                disabled={isCheckingConnection}
                className="px-4 py-2 bg-editor-accent/10 hover:bg-editor-accent/20 border border-editor-accent/30 rounded-lg text-editor-accent text-xs font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isCheckingConnection ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi size={12} />
                    Connect to Ollama
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          /* Messages */
          <div className="divide-y divide-editor-border/20">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && (
              <StreamingMessage
                content={streamingContent}
                model={selectedModel}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ===== Input Area ===== */}
      <div className="p-3 border-t border-editor-border">
        <div className="flex items-end gap-2 bg-editor-surface rounded-lg border border-editor-border focus-within:border-editor-accent/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            placeholder={
              isConnected
                ? selectedModel
                  ? 'Ask AI about your code...'
                  : 'Select a model first...'
                : 'Connect to Ollama first...'
            }
            disabled={!isConnected || !selectedModel}
            rows={1}
            className="flex-1 bg-transparent text-sm text-editor-text placeholder-editor-muted py-2.5 pl-3 pr-2 resize-none outline-none max-h-32 scrollbar-thin disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={cancelStream}
              className="p-2 text-editor-error hover:bg-editor-error/10 rounded-md transition-colors flex-shrink-0 mr-1 mb-0.5"
              title="Stop generating"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected || !selectedModel}
              className="p-2 text-editor-accent disabled:text-editor-muted disabled:opacity-50 hover:bg-editor-accent/10 rounded-md transition-colors flex-shrink-0 mr-1 mb-0.5"
              title="Send message (Enter)"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-editor-muted">
            Enter to send • Shift+Enter for new line
          </span>
          {isStreaming && (
            <span className="text-[10px] text-editor-accent flex items-center gap-1">
              <div className="w-1 h-1 bg-editor-accent rounded-full animate-pulse" />
              Generating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
