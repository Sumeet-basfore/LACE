import React from 'react';
import { Code2, Sparkles, FolderOpen, MessageSquare } from 'lucide-react';

export const WelcomeTab: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-editor-bg animate-fade-in">
      <div className="text-center max-w-lg px-8">
        {/* Logo */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-editor-accent/10 rounded-3xl blur-xl animate-pulse-glow" />
          <div className="relative bg-gradient-to-br from-editor-accent/20 to-editor-accent/5 p-6 rounded-2xl border border-editor-accent/20">
            <Code2 size={48} className="text-editor-accent" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-editor-text mb-2 tracking-tight">
          Local AI Code Editor
        </h1>
        <p className="text-editor-subtext text-sm mb-10 leading-relaxed">
          Fully offline, AI-powered coding assistant.
          <br />
          No cloud. No subscriptions. Your code stays on your machine.
        </p>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-3 text-left">
          <QuickAction
            icon={<FolderOpen size={18} />}
            title="Open a file"
            description="Click any file in the explorer to start editing"
            shortcut="Ctrl+O"
          />
          <QuickAction
            icon={<FolderOpen size={18} />}
            title="Open a folder"
            description="Open a project directory to load your files"
            shortcut="Ctrl+K O"
          />
          <QuickAction
            icon={<MessageSquare size={18} />}
            title="AI Chat"
            description="Ask your local AI model for help with code"
            shortcut="Ctrl+L"
          />
          <QuickAction
            icon={<Sparkles size={18} />}
            title="AI Completions"
            description="Get inline code suggestions as you type"
            shortcut="Tab"
          />
        </div>

        {/* Version */}
        <p className="mt-10 text-[11px] text-editor-muted">
          v1.0.0 • Built with ❤️ for privacy-conscious developers
        </p>
      </div>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  shortcut: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  title,
  description,
  shortcut,
}) => (
  <div className="flex items-center gap-4 p-3 rounded-lg bg-editor-surface/50 border border-editor-border/50 hover:border-editor-accent/30 hover:bg-editor-surface transition-all duration-200 cursor-pointer group">
    <div className="p-2 rounded-lg bg-editor-accent/10 text-editor-accent group-hover:bg-editor-accent/20 transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-editor-text">{title}</div>
      <div className="text-xs text-editor-muted truncate">{description}</div>
    </div>
    <kbd className="px-2 py-1 text-[10px] font-mono bg-editor-overlay border border-editor-border rounded text-editor-muted">
      {shortcut}
    </kbd>
  </div>
);
