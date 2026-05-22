import React, { useMemo, useCallback } from 'react';
import { User, Bot, Copy, Check, Wrench } from 'lucide-react';
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
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Keep track of active terminal command output listener to avoid multiple concurrent listeners
let activeTerminalListenerUnsubscribe: (() => void) | null = null;

function stripAnsi(text: string): string {
  const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return text.replace(ansiRegex, '');
}

function cleanTerminalOutput(raw: string, command: string): string {
  // Strip ANSI escape codes
  let clean = stripAnsi(raw);

  // Normalize line endings
  clean = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Filter out echoes, suffixes, and prompt lines containing __CMD_FINISHED__
  const lines = clean.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.includes('__CMD_FINISHED__')) return false;
    // Strip the echoed command line
    if (trimmed === command || trimmed.startsWith(command + ';') || trimmed.startsWith(command + ' ;')) return false;
    return true;
  });

  return filteredLines.join('\n').trim();
}

function isReadOnlyCommand(cmdStr: string): boolean {
  const trimmed = cmdStr.trim();
  if (!trimmed) return false;

  // Disallow write redirection: any > that is not preceded by 2 or &
  const checkRedirect = trimmed.replace(/2>/g, '').replace(/&>/g, '');
  if (checkRedirect.includes('>')) {
    return false;
  }

  // Split by shell separators: ;, &&, ||, |
  const parts = trimmed.split(/;|&&|\|\||\|/);
  
  const readOnlyBinaries = new Set([
    'cat', 'grep', 'egrep', 'fgrep', 'rg', 'ripgrep', 'ls', 'find', 'locate',
    'which', 'whereis', 'pwd', 'du', 'df', 'head', 'tail', 'less', 'more',
    'file', 'echo', 'cd', 'stat', 'diff', 'tree'
  ]);

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    // Get the first word/binary
    const words = part.split(/\s+/);
    const binary = words[0];

    if (binary === 'git') {
      const sub = words[1];
      const gitReadOnlySubs = ['diff', 'status', 'log', 'show', 'branch'];
      if (!sub || !gitReadOnlySubs.includes(sub)) {
        return false;
      }
    } else if (!readOnlyBinaries.has(binary)) {
      return false;
    }
  }

  return true;
}

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
    if (isUser || message.role === 'system') return null;
    return parseAIResponse(message.content);
  }, [message.content, isUser, message.role]);

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
  const handleApproveCommand = useCallback(async (block: ParsedBlock) => {
    if (!block.command) return;
    
    try {
      // Unsubscribe any previous active listener
      if (activeTerminalListenerUnsubscribe) {
        activeTerminalListenerUnsubscribe();
        activeTerminalListenerUnsubscribe = null;
      }

      // Determine command suffix based on platform
      const isWindows = navigator.userAgent.toLowerCase().includes('win');
      const suffix = isWindows 
        ? `; echo "__CMD_FINISHED__:$LASTEXITCODE"`
        : `; echo "__CMD_FINISHED__:$?"`;

      // Start capturing output
      let outputBuffer = '';
      const unlistenPromise = listen<string>('pty_output', (event) => {
        outputBuffer += event.payload;
        
        // Check if command finished
        if (outputBuffer.includes('__CMD_FINISHED__')) {
          // Stop listening
          unlistenPromise.then((unlistenFn) => {
            unlistenFn();
            if (activeTerminalListenerUnsubscribe === unlistenFn) {
              activeTerminalListenerUnsubscribe = null;
            }
          });
          
          // Clean the output
          let cleanOutput = cleanTerminalOutput(outputBuffer, block.command!);
          if (cleanOutput.length > 8000) {
            cleanOutput = '... [Output truncated for length]\n\n' + cleanOutput.substring(cleanOutput.length - 8000);
          }
          
          // Feed output back to AI
          const chatStore = useChatStore.getState();
          chatStore.sendMessage('', `[Terminal Command Output: \`${block.command}\`]\n\`\`\`\n${cleanOutput}\n\`\`\``);
        }
      });

      unlistenPromise.then((unlistenFn) => {
        activeTerminalListenerUnsubscribe = unlistenFn;
      });

      // Send the command followed by carriage return to execute it in PTY
      await invoke('write_pty', { input: block.command + suffix + '\r' });
      blockStatuses.set(block.id, 'applied');
    } catch (err) {
      console.error('Failed to run terminal command:', err);
    }
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

  // Auto-approve and execute terminal commands if they are read-only
  React.useEffect(() => {
    if (parsedBlocks) {
      const pendingReadOnlyBlock = parsedBlocks.find((block) => {
        if (block.type !== 'terminal-command') return false;
        const status = blockStatuses.get(block.id) || block.status || 'pending';
        return status === 'pending' && block.command && isReadOnlyCommand(block.command);
      });

      if (pendingReadOnlyBlock) {
        handleApproveCommand(pendingReadOnlyBlock);
        forceUpdate();
      }
    }
  }, [parsedBlocks, handleApproveCommand]);

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

  if (message.role === 'system') {
    return (
      <div className="flex px-4 py-1.5 animate-fade-in opacity-50">
        <span className="text-[10px] text-editor-muted italic">
          {message.content.split('\n')[0]}
        </span>
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

                case 'tool-call':
                  return (
                    <div key={block.id} className="my-2 px-3 py-2 bg-editor-overlay/50 rounded-lg border border-editor-border/20 flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/20 text-blue-400">
                        <Wrench size={12} />
                      </div>
                      <span className="text-xs text-editor-text">
                        Used <span className="font-mono text-[10px] text-editor-accent">{block.tool}</span> on <span className="font-mono text-[10px] text-editor-accent">{block.filePath}</span>
                      </span>
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
