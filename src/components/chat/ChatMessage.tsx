import React, { useMemo, useCallback } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { ChatMessage } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DiffView } from '../actions/DiffView';
import { TerminalCommandBlock } from '../actions/TerminalCommandBlock';
import { parseAIResponse, ParsedBlock } from '../../utils/actionParser';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import { useEditorStore } from '../../stores/editorStore';
import { useChatStore } from '../../stores/chatStore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

// Track block statuses across renders
const blockStatuses = new Map<string, 'pending' | 'applied' | 'rejected'>();

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';
  const { updateFileContent } = useFileSystemStore();
  const { openFile, tabs, activeTabId, updateTabContent } = useEditorStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Parse assistant messages for actions
  const parsedBlocks = useMemo(() => {
    if (isUser) return null;
    return parseAIResponse(message.content);
  }, [message.content, isUser]);

  const hasActions = parsedBlocks?.some(
    (b) => b.type === 'file-edit' || b.type === 'terminal-command'
  );

  // Handle accepting a file edit
  const handleAcceptEdit = useCallback(
    (block: ParsedBlock) => {
      if (!block.filePath) return;

      // Apply the edit to the file system
      updateFileContent(block.filePath, block.content.replace(/\n$/, ''));

      // If the file is open in a tab, update its content
      const tab = tabs.find((t) => t.filePath === block.filePath);
      if (tab) {
        updateTabContent(tab.id, block.content.replace(/\n$/, ''));
      } else {
        // Open the file in the editor
        const fileName = block.filePath.split('/').pop() || block.filePath;
        openFile(block.filePath, fileName, block.content.replace(/\n$/, ''));
      }

      blockStatuses.set(block.id, 'applied');
    },
    [updateFileContent, tabs, updateTabContent, openFile]
  );

  const handleRejectEdit = useCallback((block: ParsedBlock) => {
    blockStatuses.set(block.id, 'rejected');
  }, []);

  // Handle terminal command approval
  const handleApproveCommand = useCallback((block: ParsedBlock) => {
    if (!block.command) return;
    // In web mode, we can't execute commands. Show it in the terminal.
    // When Tauri is integrated, this will execute via the shell API.
    blockStatuses.set(block.id, 'applied');
  }, []);

  const handleRejectCommand = useCallback((block: ParsedBlock) => {
    blockStatuses.set(block.id, 'rejected');
  }, []);

  // Force re-render when status changes
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  // Auto-apply file edits if autoApply is enabled
  const autoApply = useChatStore((state) => state.autoApply);

  React.useEffect(() => {
    if (autoApply && parsedBlocks) {
      parsedBlocks.forEach((block) => {
        if (block.type === 'file-edit') {
          const status = blockStatuses.get(block.id) || block.status || 'pending';
          if (status === 'pending') {
            handleAcceptEdit(block);
            forceUpdate();
          }
        }
      });
    }
  }, [autoApply, parsedBlocks, handleAcceptEdit]);

  if (isUser) {
    return (
      <div className="flex gap-3 px-4 py-3 animate-fade-in group">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-editor-accent/20 flex items-center justify-center mt-0.5">
          <User size={14} className="text-editor-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-editor-text">You</span>
            <span className="text-[10px] text-editor-muted">{timeStr}</span>
          </div>
          <div className="text-[13px] text-editor-text leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message with parsed blocks
  return (
    <div className="flex gap-3 px-4 py-3 bg-editor-surface/30 animate-fade-in group">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mt-0.5">
        <Bot size={14} className="text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-editor-text">
            AI Assistant
          </span>
          {message.model && (
            <span className="text-[10px] px-1.5 py-0.5 bg-editor-overlay rounded text-editor-muted">
              {message.model}
            </span>
          )}
          <span className="text-[10px] text-editor-muted">{timeStr}</span>
          <button
            onClick={handleCopy}
            className="ml-auto p-1 rounded hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-all opacity-0 group-hover:opacity-100"
            title="Copy response"
          >
            {copied ? (
              <Check size={12} className="text-editor-success" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>

        {/* Render parsed blocks */}
        <div className="text-[13px] text-editor-subtext leading-relaxed prose-invert max-w-none">
          {parsedBlocks ? (
            parsedBlocks.map((block) => {
              const status = blockStatuses.get(block.id) || block.status || 'pending';

              switch (block.type) {
                case 'text':
                  return (
                    <div key={block.id}>
                      <MarkdownRenderer content={block.content} />
                    </div>
                  );

                case 'file-edit':
                  return (
                    <DiffView
                      key={block.id}
                      filePath={block.filePath!}
                      newContent={block.content}
                      language={block.language || 'plaintext'}
                      status={status}
                      onAccept={() => {
                        handleAcceptEdit(block);
                        forceUpdate();
                      }}
                      onReject={() => {
                        handleRejectEdit(block);
                        forceUpdate();
                      }}
                    />
                  );

                case 'terminal-command':
                  return (
                    <TerminalCommandBlock
                      key={block.id}
                      command={block.command!}
                      status={status}
                      onApprove={() => {
                        handleApproveCommand(block);
                        forceUpdate();
                      }}
                      onReject={() => {
                        handleRejectCommand(block);
                        forceUpdate();
                      }}
                    />
                  );

                case 'code':
                  return (
                    <div key={block.id} className="my-2 relative group/code">
                      <div className="flex items-center justify-between px-4 py-1.5 bg-editor-overlay rounded-t-lg border-b border-editor-border/30">
                        <span className="text-[10px] text-editor-muted uppercase tracking-wider font-medium">
                          {block.language}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(block.content);
                            } catch {}
                          }}
                          className="flex items-center gap-1 text-[10px] text-editor-muted hover:text-editor-text transition-colors"
                        >
                          <Copy size={10} />
                          Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={block.language || 'text'}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderBottomLeftRadius: '8px',
                          borderBottomRightRadius: '8px',
                          background: '#11111b',
                          padding: '12px 16px',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        }}
                      >
                        {block.content.replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );

                default:
                  return null;
              }
            })
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Streaming message component — shows the content as it arrives
 */
interface StreamingMessageProps {
  content: string;
  model: string | null;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  model,
}) => {
  return (
    <div className="flex gap-3 px-4 py-3 bg-editor-surface/30 animate-fade-in">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mt-0.5">
        <Bot size={14} className="text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-editor-text">
            AI Assistant
          </span>
          {model && (
            <span className="text-[10px] px-1.5 py-0.5 bg-editor-overlay rounded text-editor-muted">
              {model}
            </span>
          )}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-editor-accent rounded-full animate-pulse" />
            <span className="text-[10px] text-editor-accent">Generating...</span>
          </div>
        </div>
        <div className="text-[13px] text-editor-subtext leading-relaxed prose-invert max-w-none">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-editor-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-editor-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-editor-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-editor-muted">Thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
