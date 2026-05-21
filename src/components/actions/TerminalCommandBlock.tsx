import React, { useState } from 'react';
import {
  TerminalSquare,
  Play,
  X,
  Check,
  Copy,
  Loader2,
} from 'lucide-react';

interface TerminalCommandBlockProps {
  command: string;
  status: 'pending' | 'applied' | 'rejected';
  onApprove: () => void;
  onReject: () => void;
}

export const TerminalCommandBlock: React.FC<TerminalCommandBlockProps> = ({
  command,
  status,
  onApprove,
  onReject,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="my-2 rounded-lg border border-editor-border overflow-hidden bg-editor-overlay animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-editor-surface/80 border-b border-editor-border/50">
        <div className="flex items-center gap-2">
          <TerminalSquare size={14} className="text-editor-warning" />
          <span className="text-[11px] font-semibold text-editor-text">
            Terminal Command
          </span>
          {status === 'pending' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-editor-warning/15 text-editor-warning rounded font-medium animate-pulse">
              Requires approval
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-colors"
            title="Copy command"
          >
            {copied ? <Check size={12} className="text-editor-success" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Command display */}
      <div className="px-4 py-3 bg-terminal-bg">
        <div className="flex items-start gap-2">
          <span className="text-editor-success font-mono text-[13px] select-none flex-shrink-0">$</span>
          <pre className="text-[13px] font-mono text-editor-text whitespace-pre-wrap break-all flex-1">
            {command}
          </pre>
        </div>
      </div>

      {/* Action buttons */}
      {status === 'pending' && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-editor-border/50 bg-editor-surface/30">
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-editor-success/15 hover:bg-editor-success/25 text-editor-success text-[11px] font-medium rounded-md transition-all hover:scale-[1.02]"
          >
            <Play size={12} />
            Run Command
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-editor-error/15 hover:bg-editor-error/25 text-editor-error text-[11px] font-medium rounded-md transition-all hover:scale-[1.02]"
          >
            <X size={12} />
            Skip
          </button>
          <span className="text-[10px] text-editor-muted ml-auto">
            AI-suggested command — review before running
          </span>
        </div>
      )}

      {status === 'applied' && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-editor-border/50 bg-editor-success/5">
          <span className="flex items-center gap-1 text-editor-success text-[11px] font-medium">
            <Check size={12} />
            Executed
          </span>
        </div>
      )}

      {status === 'rejected' && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-editor-border/50 bg-editor-surface/30">
          <span className="flex items-center gap-1 text-editor-muted text-[11px] line-through">
            Skipped
          </span>
        </div>
      )}
    </div>
  );
};
