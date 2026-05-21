import React from 'react';
import {
  GitBranch,
  Bell,
  AlertCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Code2,
  Bot,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';

export const StatusBar: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore();
  const { cursorPosition, statusMessage, toggleAIPanel } = useUIStore();
  const { isConnected, selectedModel, isStreaming } = useChatStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex items-center justify-between h-[22px] px-2 bg-editor-accent/90 text-white text-[11px] font-medium select-none">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Remote indicator */}
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
          <Code2 size={12} />
        </div>

        {/* Git branch */}
        <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
          <GitBranch size={12} />
          <span>main</span>
        </div>

        {/* Errors & Warnings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
            <AlertCircle size={12} />
            <span>0</span>
          </div>
          <div className="flex items-center gap-0.5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
            <AlertTriangle size={12} />
            <span>0</span>
          </div>
        </div>

        {/* Status message */}
        <span className="text-white/70">{statusMessage}</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Cursor position */}
        {activeTab && (
          <div className="hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </div>
        )}

        {/* Encoding */}
        <div className="hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer">
          UTF-8
        </div>

        {/* Language */}
        {activeTab && (
          <div className="hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer capitalize">
            {activeTab.language}
          </div>
        )}

        {/* AI status */}
        <button
          onClick={toggleAIPanel}
          className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Toggle AI Panel"
        >
          {isConnected ? (
            <>
              <Bot size={12} className={isStreaming ? 'animate-pulse' : ''} />
              <span className="max-w-[100px] truncate">{selectedModel || 'AI Ready'}</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-white/60" />
              <span className="text-white/60">AI Offline</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <div className="hover:bg-white/10 px-1 py-0.5 rounded transition-colors cursor-pointer">
          <Bell size={12} />
        </div>
      </div>
    </div>
  );
};
