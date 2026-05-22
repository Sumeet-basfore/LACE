import React, { useMemo, useState } from 'react';
import {
  Check,
  X,
  FileCode,
  ChevronDown,
  ChevronRight,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { DiffLine, computeDiff } from '../../utils/actionParser';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import { useEditorStore } from '../../stores/editorStore';

interface DiffViewProps {
  filePath: string;
  newContent: string;
  language: string;
  onAccept: () => void;
  onReject: () => void;
  status: 'pending' | 'applied' | 'rejected' | 'completed' | 'error';
}

export const DiffView: React.FC<DiffViewProps> = ({
  filePath,
  newContent,
  language,
  onAccept,
  onReject,
  status,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [oldContent, setOldContent] = useState<string>('');
  const { getFileContent } = useFileSystemStore();

  React.useEffect(() => {
    getFileContent(filePath).then((content) => {
      setOldContent(content || '');
    });
  }, [filePath, getFileContent]);

  const fileName = filePath.split('/').pop() || filePath;

  const diffLines = useMemo(
    () => computeDiff(oldContent, newContent.replace(/\n$/, '')),
    [oldContent, newContent]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diffLines.forEach((l) => {
      if (l.type === 'added') added++;
      if (l.type === 'removed') removed++;
    });
    return { added, removed };
  }, [diffLines]);

  const isNewFile = !oldContent;

  return (
    <div className="my-2 rounded-lg border border-editor-border overflow-hidden bg-editor-overlay animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-editor-surface/80 border-b border-editor-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-editor-muted hover:text-editor-text transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <FileCode size={14} className="text-editor-accent flex-shrink-0" />
          <span className="text-xs font-mono text-editor-text truncate">
            {filePath}
          </span>
          {isNewFile ? (
            <span className="text-[10px] px-1.5 py-0.5 bg-editor-success/20 text-editor-success rounded font-medium">
              NEW
            </span>
          ) : (
            <span className="text-[10px] text-editor-muted">
              <span className="text-editor-success">+{stats.added}</span>
              {' '}
              <span className="text-editor-error">-{stats.removed}</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {status === 'pending' && (
            <>
              <button
                onClick={onAccept}
                className="flex items-center gap-1 px-2.5 py-1 bg-editor-success/15 hover:bg-editor-success/25 text-editor-success text-[11px] font-medium rounded-md transition-all hover:scale-[1.02]"
                title="Accept changes"
              >
                <Check size={12} />
                Accept
              </button>
              <button
                onClick={onReject}
                className="flex items-center gap-1 px-2.5 py-1 bg-editor-error/15 hover:bg-editor-error/25 text-editor-error text-[11px] font-medium rounded-md transition-all hover:scale-[1.02]"
                title="Reject changes"
              >
                <X size={12} />
                Reject
              </button>
            </>
          )}
          {status === 'applied' && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-editor-success/10 text-editor-success text-[11px] font-medium rounded-md">
              <Check size={12} />
              Applied
            </span>
          )}
          {status === 'rejected' && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-editor-error/10 text-editor-muted text-[11px] font-medium rounded-md line-through">
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Diff content */}
      {isExpanded && (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-[12px] font-mono leading-[1.6] border-collapse">
            <tbody>
              {diffLines.map((line, idx) => (
                <DiffLineRow key={idx} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const DiffLineRow: React.FC<{ line: DiffLine }> = ({ line }) => {
  const bgClass =
    line.type === 'added'
      ? 'bg-green-500/10'
      : line.type === 'removed'
      ? 'bg-red-500/10'
      : '';

  const textClass =
    line.type === 'added'
      ? 'text-editor-success'
      : line.type === 'removed'
      ? 'text-editor-error'
      : 'text-editor-subtext';

  const prefix =
    line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

  const gutterClass =
    line.type === 'added'
      ? 'text-green-500/40 bg-green-500/5'
      : line.type === 'removed'
      ? 'text-red-500/40 bg-red-500/5'
      : 'text-editor-muted/30';

  return (
    <tr className={`${bgClass} hover:brightness-110 transition-all`}>
      {/* Old line number */}
      <td
        className={`w-[45px] text-right px-2 select-none border-r border-editor-border/20 ${gutterClass}`}
      >
        {line.oldLineNumber || ''}
      </td>
      {/* New line number */}
      <td
        className={`w-[45px] text-right px-2 select-none border-r border-editor-border/20 ${gutterClass}`}
      >
        {line.newLineNumber || ''}
      </td>
      {/* Prefix */}
      <td className={`w-[20px] text-center select-none ${textClass} font-bold`}>
        {prefix}
      </td>
      {/* Content */}
      <td className={`px-2 whitespace-pre ${textClass}`}>
        {line.content || '\u00A0'}
      </td>
    </tr>
  );
};
