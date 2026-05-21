import React from 'react';
import {
  Files,
  Search,
  MessageSquare,
  Settings,
  GitBranch,
  Bug,
} from 'lucide-react';
import { SidebarView } from '../../types';
import { useUIStore } from '../../stores/uiStore';

interface ActivityBarItem {
  id: SidebarView;
  icon: React.ReactNode;
  tooltip: string;
}

const items: ActivityBarItem[] = [
  { id: 'explorer', icon: <Files size={22} />, tooltip: 'Explorer' },
  { id: 'search', icon: <Search size={22} />, tooltip: 'Search' },
  { id: 'ai', icon: <MessageSquare size={22} />, tooltip: 'AI Chat' },
  { id: 'settings', icon: <Settings size={22} />, tooltip: 'Settings' },
];

export const ActivityBar: React.FC = () => {
  const { activeSidebarView, setSidebarView, sidebarVisible, toggleSidebar } =
    useUIStore();

  const handleClick = (view: SidebarView) => {
    if (activeSidebarView === view && sidebarVisible) {
      toggleSidebar();
    } else {
      setSidebarView(view);
    }
  };

  return (
    <div className="flex flex-col items-center w-12 bg-sidebar-bg border-r border-editor-border py-2 gap-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          title={item.tooltip}
          className={`
            relative w-10 h-10 flex items-center justify-center rounded-lg
            transition-all duration-200 group
            ${
              activeSidebarView === item.id && sidebarVisible
                ? 'text-sidebar-iconActive bg-sidebar-hover'
                : 'text-sidebar-icon hover:text-sidebar-text hover:bg-sidebar-hover/50'
            }
          `}
        >
          {item.icon}
          {/* Active indicator */}
          {activeSidebarView === item.id && sidebarVisible && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-editor-accent rounded-r" />
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-editor-overlay text-editor-text text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-editor-border shadow-lg">
            {item.tooltip}
          </div>
        </button>
      ))}

      <div className="flex-1" />

      {/* Bottom icons */}
      <button
        title="Source Control"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-sidebar-icon hover:text-sidebar-text hover:bg-sidebar-hover/50 transition-all duration-200"
      >
        <GitBranch size={22} />
      </button>
      <button
        title="Debug"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-sidebar-icon hover:text-sidebar-text hover:bg-sidebar-hover/50 transition-all duration-200"
      >
        <Bug size={22} />
      </button>
    </div>
  );
};
