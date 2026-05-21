import { create } from 'zustand';
import { ChatMessage } from '../types';
import { ollamaService, OllamaChatMessage } from '../services/ollamaApi';
import { useEditorStore } from './editorStore';
import { useFileSystemStore } from './fileSystemStore';

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
  ollamaEndpoint: string;

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
  sendMessage: (content: string) => Promise<void>;
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

export const useChatStore = create<ChatState>((set, get) => ({
  // Connection
  isConnected: false,
  isCheckingConnection: false,
  connectionError: null,
  ollamaEndpoint: 'http://localhost:11434',

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
      const healthy = await ollamaService.checkHealth();
      set({ isConnected: healthy, isCheckingConnection: false });
      if (healthy) {
        // Auto-load models on successful connection
        get().loadModels();
      } else {
        set({ connectionError: 'Cannot reach Ollama. Is it running?' });
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
    ollamaService.setEndpoint(url);
    set({ ollamaEndpoint: url, isConnected: false, connectionError: null });
  },

  loadModels: async () => {
    set({ isLoadingModels: true });
    try {
      const models = await ollamaService.getModelList();
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

  sendMessage: async (content: string) => {
    const { selectedModel, messages, contextFiles, isStreaming } = get();

    if (!selectedModel || isStreaming) return;

    // Build the user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      model: selectedModel,
    };

    // Build context from active file and mentioned files
    let systemContext = buildContext(contextFiles);

    // Add user message to state
    set({
      messages: [...messages, userMessage],
      isStreaming: true,
      streamingContent: '',
    });

    try {
      // Build Ollama message history
      const ollamaMessages: OllamaChatMessage[] = [];

      // System message with context
      const systemPrompt = `You are a helpful AI coding assistant integrated into a code editor. You help with code understanding, debugging, refactoring, and writing code. Be concise and precise.

When you want to modify a file, use this exact format:
\`\`\`edit:path/to/file.ts
// complete new file content here
\`\`\`

The path must match the file path in the project. The user will see a diff view and can accept or reject your changes.

When you want to suggest a terminal command, use:
\`\`\`bash
npm install express
\`\`\`

For regular code examples (not file edits), use normal markdown code blocks with the language:
\`\`\`typescript
const x = 42;
\`\`\`

Always provide the COMPLETE file content in edit blocks — not just the changed lines.`;

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
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }

      // Stream the response
      let fullContent = '';
      for await (const chunk of ollamaService.streamChat({
        model: selectedModel,
        messages: ollamaMessages,
        options: {
          temperature: 0.7,
          num_ctx: 4096,
        },
      })) {
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
function buildContext(contextFiles: string[]): string {
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
    const content = fsState.getFileContent(filePath);
    if (content) {
      const fileName = filePath.split('/').pop() || filePath;
      parts.push(
        `Referenced file (${fileName}):\n\`\`\`\n${content}\n\`\`\``
      );
    }
  }

  return parts.join('\n\n');
}
