import { create } from 'zustand';
import { ChatMessage } from '../types';
import { ollamaService, OllamaChatMessage } from '../services/ollamaApi';
import { lmStudioService } from '../services/lmStudioApi';
import { useEditorStore } from './editorStore';
import { useFileSystemStore } from './fileSystemStore';
import { useSettingsStore } from './settingsStore';
import { getAllFiles } from '../utils/fileSystem';

interface ModelInfo {
  id: string;
  name: string;
  size: string;
  parameterSize: string;
  quantization: string;
  family: string;
}

interface ChatState {
  // Connection
  isConnected: boolean;
  isCheckingConnection: boolean;
  connectionError: string | null;
  activeEndpoint: string;

  // Models
  availableModels: ModelInfo[];
  selectedModel: string | null;
  isLoadingModels: boolean;

  // Messages
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;

  // Context
  contextFiles: string[]; // file paths included as context

  // Actions
  checkConnection: () => Promise<void>;
  setEndpoint: (url: string) => void;
  loadModels: () => Promise<void>;
  selectModel: (modelId: string) => void;
  sendMessage: (content: string, hiddenSystemMessage?: string) => Promise<void>;
  cancelStream: () => void;
  clearChat: () => void;
  addContextFile: (filePath: string) => void;
  removeContextFile: (filePath: string) => void;
  // AI Actions settings
  autoApply: boolean;
  toggleAutoApply: () => void;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Determine initial endpoint based on active provider
const getInitialEndpoint = (): string => {
  try {
    const aiSettings = useSettingsStore.getState().ai;
    return aiSettings.provider === 'ollama' ? aiSettings.ollamaEndpoint : aiSettings.lmStudioEndpoint;
  } catch {
    return 'http://localhost:11434';
  }
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Connection
  isConnected: false,
  isCheckingConnection: false,
  connectionError: null,
  activeEndpoint: getInitialEndpoint(),

  // Models
  availableModels: [],
  selectedModel: null,
  isLoadingModels: false,

  // Messages
  messages: [],
  isStreaming: false,
  streamingContent: '',

  // Context
  contextFiles: [],

  // AI Actions
  autoApply: false,
  toggleAutoApply: () => set((state) => ({ autoApply: !state.autoApply })),

  checkConnection: async () => {
    set({ isCheckingConnection: true, connectionError: null });
    try {
      const aiSettings = useSettingsStore.getState().ai;
      const provider = aiSettings.provider;
      let healthy = false;
      if (provider === 'ollama') {
        ollamaService.setEndpoint(aiSettings.ollamaEndpoint);
        healthy = await ollamaService.checkHealth();
      } else {
        lmStudioService.setEndpoint(aiSettings.lmStudioEndpoint);
        healthy = await lmStudioService.checkHealth();
      }

      set({ isConnected: healthy, isCheckingConnection: false });
      if (healthy) {
        // Auto-load models on successful connection
        get().loadModels();
      } else {
        const name = provider === 'ollama' ? 'Ollama' : 'LM Studio';
        set({ connectionError: `Cannot reach ${name}. Is it running?` });
      }
    } catch (error: any) {
      set({
        isConnected: false,
        isCheckingConnection: false,
        connectionError: error.message || 'Connection failed',
      });
    }
  },

  setEndpoint: (url: string) => {
    const settingsStore = useSettingsStore.getState();
    const provider = settingsStore.ai.provider;
    if (provider === 'ollama') {
      ollamaService.setEndpoint(url);
      settingsStore.updateAISetting('ollamaEndpoint', url);
    } else {
      lmStudioService.setEndpoint(url);
      settingsStore.updateAISetting('lmStudioEndpoint', url);
    }
    set({ activeEndpoint: url, isConnected: false, connectionError: null });
  },

  loadModels: async () => {
    set({ isLoadingModels: true });
    try {
      const aiSettings = useSettingsStore.getState().ai;
      const provider = aiSettings.provider;
      let models = [];
      if (provider === 'ollama') {
        models = await ollamaService.getModelList();
      } else {
        models = await lmStudioService.getModelList();
      }
      set({
        availableModels: models,
        isLoadingModels: false,
        // Auto-select first model if none selected
        selectedModel:
          get().selectedModel || (models.length > 0 ? models[0].id : null),
      });
    } catch (error: any) {
      set({ isLoadingModels: false });
      console.error('Failed to load models:', error);
    }
  },

  selectModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },

  sendMessage: async (content: string, hiddenSystemMessage?: string) => {
    const { selectedModel, messages, contextFiles, isStreaming } = get();

    if (!selectedModel || isStreaming) return;

    if (hiddenSystemMessage) {
      // It's an automated tool response
      const sysMsg: ChatMessage = {
        id: generateId(),
        role: 'system',
        content: hiddenSystemMessage,
        timestamp: Date.now(),
        model: selectedModel,
      };
      set({
        messages: [...messages, sysMsg],
        isStreaming: true,
        streamingContent: '',
      });
    } else {
      // Build the user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        model: selectedModel,
      };
      // Add user message to state
      set({
        messages: [...messages, userMessage],
        isStreaming: true,
        streamingContent: '',
      });
    }

    const fsState = useFileSystemStore.getState();
    const rootNode = fsState.rootNode;
    const workspacePath = rootNode?.path;
    let workspaceInfo = '';
    let projectStructure = '';

    if (workspacePath && workspacePath !== '/' && workspacePath !== 'No Folder Opened') {
      workspaceInfo = `\nCurrent workspace directory: ${workspacePath}\n`;
      try {
        const allFiles = getAllFiles(rootNode);
        const relativePaths = allFiles.map((file) => {
          const fullPath = file.path;
          if (fullPath.startsWith(workspacePath)) {
            return fullPath.substring(workspacePath.length).replace(/^[/\\]/, '').replace(/\\/g, '/');
          }
          return file.name;
        }).filter(p => p !== '');

        if (relativePaths.length > 0) {
          const limit = 400;
          const shownPaths = relativePaths.slice(0, limit);
          projectStructure = `\nFiles available in the workspace:\n${shownPaths.map(p => `- ${p}`).join('\n')}\n`;
          if (relativePaths.length > limit) {
            projectStructure += `- ... and ${relativePaths.length - limit} more files.\n`;
          }
        }
      } catch (err) {
        console.error('Failed to compile file list for system prompt:', err);
      }
    }

    // Build context from active file and mentioned files
    let systemContext = await buildContext(contextFiles);

    try {
      // Build Ollama message history
      const ollamaMessages: OllamaChatMessage[] = [];

      // System message with context
      const systemPrompt = `You are a helpful AI coding assistant integrated into a code editor. You help with code understanding, debugging, refactoring, and writing code. Be concise and precise.
${workspaceInfo}
When you want to modify a file, use this exact format:
\`\`\`edit:path/to/file.ts
// complete new file content here
\`\`\`

The path must match the file path in the project. The user will see a diff view and can accept or reject your changes.

When you want to suggest a terminal command, use:
\`\`\`bash
npm install express
\`\`\`

You have autonomous, read-only access to the user's file system to explore the codebase.
If you need to list the contents of a directory to see what files exist, use this exact format:
\`\`\`list_dir:path/to/folder
\`\`\`

If you need to read the contents of a file to understand it before answering or editing, use this exact format:
\`\`\`read_file:path/to/file.ts
\`\`\`

You can also run read-only terminal commands (like \`grep\`, \`rg\`, \`find\`, \`git diff\`, etc.) inside \`\`\`bash code blocks to search or inspect the codebase. These safe, read-only commands will execute automatically and feed their output directly back to you as a response. For example:
\`\`\`bash
grep -rn "function_name" src/
\`\`\`

IMPORTANT: You do NOT need to ask for permission or explain why you are reading files, listing directories, or running read-only search commands. Just output the tool block immediately and wait for the results from the editor. Always provide the COMPLETE file content in edit blocks — not just the changed lines. Wait for the tool results before answering.

${projectStructure}`;

      if (systemContext) {
        ollamaMessages.push({
          role: 'system',
          content: `${systemPrompt}\n\n${systemContext}`,
        });
      } else {
        ollamaMessages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      // Include recent message history (limit to last 20 messages for context window)
      const recentMessages = get().messages.slice(-20);
      for (const msg of recentMessages) {
        ollamaMessages.push({
          role: msg.role === 'system' ? 'user' : (msg.role as 'user' | 'assistant'),
          content: msg.content,
        });
      }

      const settingsState = useSettingsStore.getState();
      const provider = settingsState.ai.provider;
      const contextWindowSize = settingsState.ai.contextWindowSize;
      const chatOptions: any = {
        temperature: 0.7,
      };
      if (contextWindowSize && contextWindowSize > 0) {
        chatOptions.num_ctx = contextWindowSize;
      }

      // Stream the response
      let fullContent = '';
      const stream = provider === 'ollama'
        ? ollamaService.streamChat({
            model: selectedModel,
            messages: ollamaMessages,
            options: chatOptions,
          })
        : lmStudioService.streamChat({
            model: selectedModel,
            messages: ollamaMessages,
            options: chatOptions,
          });

      for await (const chunk of stream) {
        fullContent += chunk;
        set({ streamingContent: fullContent });
      }

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        model: selectedModel,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamingContent: '',
      }));

      // --- Tool Execution Loop ---
      import('../utils/actionParser').then(async ({ parseAIResponse }) => {
        const parsedBlocks = parseAIResponse(fullContent);
        const toolCalls = parsedBlocks.filter(b => b.type === 'tool-call' && b.tool && b.filePath);
        
        if (toolCalls.length > 0) {
          // We only process the first tool call to avoid overwhelming the context
          const block = toolCalls[0];
          let toolResultStr = '';
          
          try {
            const fsState = useFileSystemStore.getState();
            const rootNode = fsState.rootNode;
            if (!rootNode) throw new Error('No workspace loaded');

            // Resolve relative paths to absolute paths
            const resolvePath = (relPath: string) => {
              let clean = relPath.trim();
              if (clean === '.' || clean === './' || clean === '') {
                return rootNode.path;
              }
              if (clean.startsWith('./')) {
                clean = clean.substring(2);
              }
              // If it's already absolute (starts with / or has drive letter on Windows like C:)
              if (clean.startsWith('/') || /^[a-zA-Z]:/.test(clean)) {
                return clean;
              }
              // Resolve relative to rootNode.path
              return rootNode.path.endsWith('/') ? `${rootNode.path}${clean}` : `${rootNode.path}/${clean}`;
            };

            const targetPath = resolvePath(block.filePath!);

            if (block.tool === 'read_file') {
              const content = await fsState.getFileContent(targetPath);
              if (content !== undefined) {
                toolResultStr = `[Tool Result: read_file on ${block.filePath}]\n\`\`\`\n${content}\n\`\`\``;
              } else {
                toolResultStr = `[Tool Result: read_file on ${block.filePath}]\nError: File not found or empty.`;
              }
            } else if (block.tool === 'list_dir') {
               const findNode = (node: any, targetPath: string): any => {
                 if (node.path === targetPath || node.name === targetPath) return node;
                 if (node.children) {
                   for (const child of node.children) {
                     const found = findNode(child, targetPath);
                     if (found) return found;
                   }
                 }
                 return null;
               };
               
               const node = findNode(rootNode, targetPath);
               if (node && node.type === 'directory' && node.children) {
                 const files = node.children.map((c: any) => {
                   const rel = c.path.startsWith(rootNode.path)
                     ? c.path.substring(rootNode.path.length).replace(/^[/\\]/, '')
                     : c.path;
                   return `${c.type === 'directory' ? '📁' : '📄'} ${rel}`;
                 }).join('\n');
                 toolResultStr = `[Tool Result: list_dir on ${block.filePath}]\n${files}`;
               } else {
                 toolResultStr = `[Tool Result: list_dir on ${block.filePath}]\nError: Directory not found.`;
               }
            }
          } catch (e: any) {
             toolResultStr = `[Tool Error]\n${e.message}`;
          }

          if (toolResultStr) {
             // Let the UI breathe, then trigger next message
             setTimeout(() => {
                get().sendMessage('', toolResultStr);
             }, 100);
          }
        }
      });
    } catch (error: any) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `❌ **Error:** ${error.message || 'Failed to get response from model'}`,
        timestamp: Date.now(),
        model: selectedModel,
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isStreaming: false,
        streamingContent: '',
      }));
    }
  },

  cancelStream: () => {
    ollamaService.cancelStream();
    lmStudioService.cancelStream();
    const { streamingContent } = get();

    if (streamingContent) {
      // Save partial response
      const partialMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: streamingContent + '\n\n*[Response cancelled]*',
        timestamp: Date.now(),
      };
      set((state) => ({
        messages: [...state.messages, partialMessage],
        isStreaming: false,
        streamingContent: '',
      }));
    } else {
      set({ isStreaming: false, streamingContent: '' });
    }
  },

  clearChat: () => {
    set({ messages: [], streamingContent: '', contextFiles: [] });
  },

  addContextFile: (filePath: string) => {
    set((state) => ({
      contextFiles: state.contextFiles.includes(filePath)
        ? state.contextFiles
        : [...state.contextFiles, filePath],
    }));
  },

  removeContextFile: (filePath: string) => {
    set((state) => ({
      contextFiles: state.contextFiles.filter((f) => f !== filePath),
    }));
  },
}));

/**
 * Build context string from active file + mentioned files
 */
async function buildContext(contextFiles: string[]): Promise<string> {
  const parts: string[] = [];

  // Include active file content
  const editorState = useEditorStore.getState();
  const activeTab = editorState.tabs.find(
    (t) => t.id === editorState.activeTabId
  );
  if (activeTab) {
    parts.push(
      `Currently open file (${activeTab.fileName}):\n\`\`\`${activeTab.language}\n${activeTab.content}\n\`\`\``
    );
  }

  // Include context files
  const fsState = useFileSystemStore.getState();
  for (const filePath of contextFiles) {
    const content = await fsState.getFileContent(filePath);
    if (content) {
      const fileName = filePath.split('/').pop() || filePath;
      parts.push(
        `Referenced file (${fileName}):\n\`\`\`\n${content}\n\`\`\``
      );
    }
  }

  return parts.join('\n\n');
}
