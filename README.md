# Local AI Code Editor

A fully offline, open-source code editor powered by local AI models. Built with **Tauri v2** (Rust) + **React/TypeScript** (Vite), featuring **Monaco Editor**, integrated **xterm.js terminal**, and native support for **Ollama**, **LM Studio**, and **GGUF** models.

No cloud. No subscriptions. Your code stays on your machine.

---

## Features

### 1. Code Editor (Monaco)
- Full language syntax highlighting via Monaco Editor (VS Code engine)
- Catppuccin Mocha dark theme with custom syntax colors
- Smooth animations, bracket pair colorization, minimap, font ligatures
- Resizable 3-panel layout: Sidebar | Editor + Terminal | AI Chat Panel
- Drag-to-resize all panels
- Ctrl+S to save directly to the filesystem

### 2. AI Chat Sidebar
- **Multi-provider**: Connect to **Ollama** (`http://localhost:11434`) or **LM Studio** (`http://localhost:1234`)
- Streaming token-by-token chat completions
- Model selector with detailed info (parameter size, quantization, family)
- Automatic active file injection as context
- Context file pins — add any file to the prompt via the file explorer
- Rich Markdown rendering with syntax-highlighted code blocks

### 3. AI Actions & Diff Engine
- **`edit:path/to/file`** — AI proposes file edits shown as interactive diff views
- **LCS-based diff** — line-by-line insertions (+) and deletions (-)
- Accept/Reject controls — accepted edits write directly to the filesystem and open in the editor
- **Auto-Apply** toggle to accept edits without manual review
- Terminal command blocks with Run/Skip approval
- Read-only terminal commands (ls, cat, grep, etc.) auto-execute without prompting
- Terminal output captured and fed back to the AI

### 4. Autonomous AI Tool Use
The AI agent can autonomously explore your codebase:
- `read_file:path` — read file contents
- `list_dir:path` — list directory entries
- Tool results are fed back into the conversation for context-aware responses

### 5. Inline Completions (Ghost Text)
- Monaco `InlineCompletionsProvider` registered across 12 languages
- Fill-in-the-Middle (FIM) prompt engineering:
  - **Qwen2.5-Coder**: `<fim_prefix>`, `<fim_suffix>`, `<fim_middle>`
  - **CodeLlama**: `< PRE>`, `< SUF>`, `< MID>`
  - Fallback instruction prompt for general models
- 350ms debounce — low temperature (0.0), 48 tokens max for snappy suggestions

### 6. Code Actions (Fix with AI)
- Monaco lightbulb actions appear on editor errors
- "Fix with AI" sends the error + surrounding code context to the AI
- AI responds with a complete file edit

### 7. Integrated Terminal
- xterm.js with Catppuccin Mocha theme
- Backed by a native PTY process via Tauri (Rust `portable-pty`)
- Spawns your system shell (bash/zsh on macOS/Linux, PowerShell on Windows)
- Automatically opens in the workspace directory
- Terminal output is piped back to the AI for tool execution

### 8. File Explorer
- Full file tree with Tauri FS integration (not mocked)
- Open/Save files natively through the OS
- Right-click context menu: New File, New Folder, Rename, Delete
- Inline rename and file creation inputs
- Click-to-open files in editor tabs
- Open folder via `Ctrl+K O` or the folder button
- Refresh explorer and collapse all buttons
- Git status badges (M, A, U) and AI context pin (paperclip icon)

### 9. Search Panel
- Cross-file text search with batched Tauri FS reads
- Highlighted match previews per file
- Click results to open the file in the editor

### 10. Settings Panel
- **Editor settings**: font size (slider), font family, tab size, word wrap, minimap toggle, line number style
- **AI preferences**: provider switch (Ollama/LM Studio), endpoint customization with test button, context window size
- **Auto-Apply Edits**, **Allow File Edits**, **Terminal Suggestions**, **Inline Completions** toggles
- **GGUF Model Loader**: native file dialog to pick `.gguf` files, launches `llama-server` on port `11435`, with unload support
- All settings persisted to `localStorage`
- Reset to defaults

### 11. Direct GGUF Inference
- Tauri backend launches `llama-server` as a child process
- Native OS file dialog filtered to `.gguf`
- Background process supervisor with clean teardown on window close
- Re-routes AI endpoint to `http://localhost:11435`

### 12. Status Bar
- Git branch, error/warning counts, status messages
- Cursor position (Ln/Col), file encoding, language indicator
- AI connection status with model name
- Click AI status to toggle the AI panel

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+L` | Toggle AI Chat Panel |
| `` Ctrl+` `` | Toggle Terminal Panel |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+S` | Save current file |
| `Ctrl+Shift+F` | Open Search panel |
| `Ctrl+K O` | Open folder |

---

## Architecture

```
local-ai-code-editor/
├── src-tauri/                            # Tauri v2 Desktop Backend (Rust)
│   ├── src/
│   │   ├── main.rs                       # Entry point
│   │   └── lib.rs                        # PTY management, GGUF loader, file dialog
│   ├── Cargo.toml                        # tauri, portable-pty, rfd, serde
│   └── tauri.conf.json                   # Window config, build commands
├── src/                                  # Frontend (React + TypeScript + Tailwind)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # 3-panel resizable layout, keyboard shortcuts
│   │   │   └── StatusBar.tsx             # Connection state, cursor, language, model
│   │   ├── editor/
│   │   │   ├── MonacoEditor.tsx          # Monaco instance, theme, inline completions, code actions
│   │   │   ├── EditorTabs.tsx            # Tab bar with dirty indicators, middle-click close
│   │   │   └── WelcomeTab.tsx            # Welcome screen with quick actions
│   │   ├── chat/
│   │   │   ├── AIChatPanel.tsx           # Chat UI, model selector, endpoint config
│   │   │   ├── ChatMessage.tsx           # Message bubbles, diff views, terminal blocks, tool calls
│   │   │   └── MarkdownRenderer.tsx      # react-markdown with syntax highlighting
│   │   ├── sidebar/
│   │   │   ├── ActivityBar.tsx           # Explorer/Search/AI/Settings icons
│   │   │   ├── FileExplorer.tsx          # File tree, context menu, toolbar
│   │   │   ├── FileTreeItem.tsx          # Recursive tree nodes, git status, AI context pin
│   │   │   ├── SearchPanel.tsx           # Cross-file text search
│   │   │   └── SettingsPanel.tsx         # Editor & AI settings, GGUF loader
│   │   ├── actions/
│   │   │   ├── DiffView.tsx              # Color-coded diff with accept/reject
│   │   │   └── TerminalCommandBlock.tsx  # Command block with run/skip
│   │   └── terminal/
│   │       └── Terminal.tsx              # xterm.js + Tauri PTY bridge
│   ├── stores/
│   │   ├── editorStore.ts                # Tabs, active tab, content, dirty state
│   │   ├── fileSystemStore.ts            # File tree, open folder, read/write, create/rename/delete
│   │   ├── chatStore.ts                  # Messages, streaming, models, tool execution loop
│   │   ├── settingsStore.ts              # Editor + AI settings (localStorage)
│   │   ├── searchStore.ts                # Search query, results, batched searching
│   │   └── uiStore.ts                    # Panel visibility, sizes, sidebar view
│   ├── services/
│   │   ├── ollamaApi.ts                  # Ollama REST client (chat, streaming, inline completion)
│   │   └── lmStudioApi.ts                # LM Studio OpenAI-compatible client (SSE streaming)
│   ├── utils/
│   │   ├── actionParser.ts               # Parse AI response into blocks, LCS diff
│   │   ├── inlineCompletionProvider.ts   # Monaco inline completion with FIM support
│   │   ├── codeActionProvider.ts         # Monaco "Fix with AI" lightbulb actions
│   │   ├── fileSystem.ts                # Tauri FS wrappers (read, write, tree builder)
│   │   └── languageDetect.ts            # Extension-to-language mapping
│   └── types/
│       └── index.ts                      # Shared TypeScript interfaces
```

---

## Getting Started

### Prerequisites

1. **Node.js** v18+ and **npm**
2. **Rust & Cargo** (for Tauri backend compilation)
3. A local AI provider (one of):
   - **Ollama** running at `http://localhost:11434` (recommended: `qwen2.5-coder:1.5b` or `qwen2.5-coder:7b`)
   - **LM Studio** with a model loaded and server running at `http://localhost:1234`
   - A `.gguf` file + `llama-server` binary in your `PATH`

### Installation

```bash
git clone <repo-url>
cd local-ai-code-editor
npm install
```

### Development

**Web sandbox mode** (browser, no Tauri features):
```bash
npm run dev
```
Open `http://localhost:5173`

**Desktop mode** (full Tauri experience):
```bash
npx tauri dev
```

### Production Build

```bash
npm run build
npx tauri build
```

### Verification Commands

```bash
npx tsc --noEmit                          # Type check
npm run build                              # Build frontend
cargo check --manifest-path src-tauri/Cargo.toml  # Rust check
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | [Tauri v2](https://v2.tauri.app/) (Rust) |
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | TailwindCSS 3 |
| Code Editor | Monaco Editor via `@monaco-editor/react` |
| Terminal | xterm.js + `@xterm/addon-fit` |
| State | Zustand |
| AI Providers | Ollama (REST) + LM Studio (OpenAI-compatible SSE) |
| PTY | `portable-pty` (Rust crate) |
| Diff Engine | Custom LCS-based line diff |

---

## License

MIT
