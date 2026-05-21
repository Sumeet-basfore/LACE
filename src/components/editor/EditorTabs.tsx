import React from 'react';
import { X, Circle } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { EditorTab } from '../../types';

// Tab file icon colors
function getTabIconColor(language: string): string {
  switch (language) {
    case 'typescript':
      return 'bg-blue-400';
    case 'javascript':
      return 'bg-yellow-400';
    case 'python':
      return 'bg-green-400';
    case 'rust':
      return 'bg-orange-500';
    case 'html':
      return 'bg-orange-400';
    case 'css':
      return 'bg-pink-400';
    case 'json':
      return 'bg-yellow-300';
    case 'markdown':
      return 'bg-blue-300';
    default:
      return 'bg-editor-muted';
  }
}

export const EditorTabs: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleMiddleClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  return (
    <div className="flex items-center bg-tab-bg border-b border-editor-border overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
            className={`
              group flex items-center gap-2 px-3 py-[7px] min-w-[120px] max-w-[200px]
              cursor-pointer text-[13px] border-r border-editor-border
              transition-colors duration-100 select-none relative
              ${
                isActive
                  ? 'bg-tab-active text-tab-textActive'
                  : 'bg-tab-bg text-tab-text hover:bg-editor-hover/30'
              }
            `}
          >
            {/* Active tab top indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-editor-accent" />
            )}

            {/* Language dot */}
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${getTabIconColor(
                tab.language
              )}`}
            />

            {/* File name */}
            <span className="truncate">{tab.fileName}</span>

            {/* Dirty indicator or close button */}
            <div className="flex-shrink-0 ml-auto w-4 h-4 flex items-center justify-center">
              {tab.isDirty ? (
                <Circle
                  size={8}
                  className="fill-editor-text text-editor-text group-hover:hidden"
                />
              ) : (
                <span className="hidden group-hover:block" />
              )}
              <button
                onClick={(e) => handleClose(e, tab.id)}
                className={`
                  rounded p-0.5 hover:bg-editor-hover transition-colors
                  ${tab.isDirty ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'}
                `}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
