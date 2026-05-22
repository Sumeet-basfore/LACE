# 🌌 LACE — Local AI Code Editor

<div align="center">

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-2024-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A premium, fully offline, open-source IDE built to keep your code private, secure, and latency-free.**
*Powered entirely by local AI models running right on your workstation.*

[Key Features](#-features) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [System Architecture](#-architecture) • [Getting Started](#-getting-started) • [GGUF Troubleshooting](#-gguf--llama-server-troubleshooting)

</div>

---

## ✨ Value Proposition

LACE is a privacy-first Single Page Desktop Application (built with **Tauri v2**, **Rust**, **React**, **TypeScript**, and **TailwindCSS**) customized using a sleek **Catppuccin Mocha** dark theme. It delivers a premium, VS Code-like coding environment while completely bypassing cloud subscriptions.

```
+-----------------------------------------------------------------------+
|  🌌 Local AI Code Editor (LACE)                                       |
|                                                                       |
|  [ File Explorer ]  |  [ Active Tabs ]                                |
|  📁 src/            |  📄 Monaco Editor (Catppuccin Mocha)            |
|    📄 main.rs       |     * FIM Ghost-Text Autocompletions (Tab)      |
|    📄 App.tsx       |     * AI compiler error fixes (Lightbulb)       |
|                     |                                                 |
|  [ Panel Sizes ]    |  [ Bottom xterm.js Panel ]                      |
|                     |  $ npm run test (Direct Native PTY Bindings)    |
|                     +-------------------------------------------------+
|                     |  [ Right Panel: AI Chat & Agentic Loops ]       |
|                     |  💬 Chat streams                                |
|                     |  🛠️ Visual LCS Line Diffs (Accept / Reject)     |
|                     |  🐚 Terminal output feed-backs                  |
+-----------------------------------------------------------------------+
```

---

## 🎨 Features

### 💻 1. Code Editor (Monaco)
*   **VS Code Core Engine**: Integrated with high-performance language parsing, syntax highlights, smooth scroll transitions, font ligature rendering, and active cursor line/column tracking.
*   **Catppuccin Mocha Dark Palette**: Curated syntax configurations designed to provide optimal readability and modern aesthetics.
*   **Flexible 3-Panel Grid**: Drag-to-resize layouts for the Left Sidebar (File Tree/Search/Settings), Center Workspace, Bottom Terminal Panel, and Right AI Assistant Chat.
*   **Keyboard File Syncs**: Save changes directly to your hardware using native `Ctrl+S` commands, automatically clearing dirty tab indicators.

### 🤖 2. Advanced Agentic Loop Interceptors
LACE features a highly advanced, human-in-the-loop agentic executor that parses AI completions and bridges the LLM directly with your operating system:
*   **Visual Diff proposals (`edit:path/to/file`)**: Model proposed code revisions are parsed by a custom **Longest Common Subsequence (LCS) Diff Algorithm**. LACE overlays these revisions in a visual table (`+` and `-` additions/deletions) offering quick **Accept** or **Reject** triggers. Accepting instantly writes to your disk and refreshes active Monaco tabs.
*   **Interactive Shell Blocks (`terminal`/`bash`)**: Suggested commands (e.g., `npm install`) are rendered inside interactive approval widgets. Upon approval, LACE executes the commands in your background PTY and pipes the terminal logs back into the AI context window, allowing the model to debug build failures autonomously.
*   **Virtual Directory & File Browsers**: The AI model can output structured system queries (````read_file:path```` or ````list_dir:path````). LACE interceptors capture these tags, queries the virtual filesystem, and feeds results back to the LLM automatically.

### ✍️ 3. Ghost-Text Inline Completions (Fill-In-The-Middle)
Globally registered across 12 programming languages in Monaco:
*   **FIM Prompt Formatting**: Custom-structures context blocks based on the active local model family:
    *   **Qwen2.5-Coder / Qwen**: Formats using `<fim_prefix>`, `<fim_suffix>`, and `<fim_middle>` tags.
    *   **CodeLlama**: Formats using `< PRE>`, `< SUF>`, and `< MID>` tags.
*   **Debounced Key Listener**: Employs a 350ms keyup debounce to prevent CPU/GPU flooding.
*   **Deterministic Speeds**: Fixes temperature to `0.0` and limits completions to `48` predicted tokens to yield lightning-fast inline autocompletions.

### 🔌 4. Deep Editor Diagnostics (AI Fixes)
Whenever the Monaco compiler detects syntax warnings or type mismatches:
*   A native quickfix lightbulb action displays: `"✨ Fix with AI: <error details>"`.
*   Clicking it automatically assembles a specialized context package (including error codes and 10 lines of surrounding code), opens the AI Chat, and streams a debug prompt requesting a replacement edit.

### 🐚 5. Native Pseudoterminal (PTY) Panel
*   **Direct Hardware Shells**: Spawns native system shells (`bash`/`zsh` login shells on macOS/Linux to load user aliases and paths, `PowerShell` on Windows) via Rust's `portable-pty` crate.
*   **xterm.js Integration**: Renders terminal outputs instantly using a custom Catppuccin terminal color theme and automatic panel resizing.
*   **Automatic Workspace Binding**: Spawns terminal sessions directly in the root of your opened folder.

### 📂 6. Native File Explorer & Search Panels
*   **OS File Dialogs**: Leverages native Tauri Rust dialog APIs (`rfd`) to open project folders.
*   **Recursive File Tree**: Integrated with context menus to create, delete, or rename folders and files instantly on disk. Shows real-time Git status indicator badges (M, A, U) and AI context pin (paperclip icon).
*   **Cross-File Search**: Instantly indexes and searches your project files with highlighted match previews.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| **`Ctrl + L`** | Toggle Right AI Assistant Panel |
| **`Ctrl + \``** | Toggle Bottom Terminal Panel |
| **`Ctrl + B`** | Toggle Left Sidebar Explorer / Settings |
| **`Ctrl + S`** | Save Current File and Sync active tabs |
| **`Ctrl + Shift + F`** | Trigger Cross-File Search |
| **`Ctrl + K` then `O`** | Open Project Folder |

---

## 🏗️ Architecture

```
local-ai-code-editor/
├── src-tauri/                            # Tauri v2 Desktop Backend (Rust)
│   ├── src/
│   │   ├── main.rs                       # Native application entry point
│   │   └── lib.rs                        # PTY spawners, GGUF loader & process supervision
│   ├── Cargo.toml                        # Rust dependencies (portable-pty, rfd, tauri)
│   └── tauri.conf.json                   # Window size parameters & builder setups
├── src/                                  # Frontend Single Page App (React + TS + Tailwind)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # Resizable grid shell & global hotkey listeners
│   │   │   └── StatusBar.tsx             # Real-time state trackers, model names & cursor coordinates
│   │   ├── editor/
│   │   │   ├── MonacoEditor.tsx          # Monaco bindings, custom theme & completions provider
│   │   │   ├── EditorTabs.tsx            # Tab bar with dirty indicators & middle-click close
│   │   │   └── WelcomeTab.tsx            # Welcome screen, branding and shortcuts panel
│   │   ├── chat/
│   │   │   ├── AIChatPanel.tsx           # Chat UI, model lists & settings overrides
│   │   │   ├── ChatMessage.tsx           # Message bubbles, visual diff boxes & terminal interceptors
│   │   │   └── MarkdownRenderer.tsx      # react-markdown + SyntaxHighlighter
│   │   ├── sidebar/
│   │   │   ├── ActivityBar.tsx           # Sidebar panels selectors (Explorer, Search, Settings)
│   │   │   ├── FileExplorer.tsx          # File tree directories & context menus
│   │   │   ├── FileTreeItem.tsx          # Directory tree nodes & Git status markers
│   │   │   ├── SearchPanel.tsx           # Cross-file text search input and match list
│   │   │   └── SettingsPanel.tsx         # Font modifications, autocomplete toggles & GGUF loaders
│   │   ├── actions/
│   │   │   ├── DiffView.tsx              # Color-coded inline Git diff table (Accept/Reject)
│   │   │   └── TerminalCommandBlock.tsx  # Interactive terminal execution cards
│   │   └── terminal/
│   │       └── Terminal.tsx              # xterm.js hooked to Tauri Rust PTY bridge
│   ├── stores/
│   │   ├── editorStore.ts                # Tab tracking, document dirty states & language detection
│   │   ├── fileSystemStore.ts            # Tauri FS disk syncs, folder trees & creations/deletions
│   │   ├── chatStore.ts                  # Chat messages log, streaming endpoints & agentic tools
│   │   ├── settingsStore.ts              # LocalStorage-backed configuration keys
│   │   ├── searchStore.ts                # Batched search trackers & match indexes
│   │   └── uiStore.ts                    # Panel sizes, visibility configurations & cursor trackers
│   ├── services/
│   │   ├── ollamaApi.ts                  # Ollama REST connector (streaming, autocomplete)
│   │   └── lmStudioApi.ts                # LM Studio OpenAI-compatible client (SSE stream)
│   ├── utils/
│   │   ├── actionParser.ts               # Code block diff generators and text parsers
│   │   ├── inlineCompletionProvider.ts   # Monaco FIM inline completion debouncers
│   │   ├── codeActionProvider.ts         # Diagnostic diagnostic fixers (AI lightbulb)
│   │   ├── fileSystem.ts                 # Tauri FS file loaders & tree generators
│   │   └── languageDetect.ts             # File extensions to Monaco language indexers
│   └── types/
│       └── index.ts                      # Shared TypeScript definitions
```

---

## 🚀 Getting Started

### 📦 Prerequisites

1.  **Node.js** (v18+) and **npm**.
2.  **Rust & Cargo** compilation toolchain.
3.  **Local LLM Service** (any of the following):
    *   **Ollama** running locally on `http://localhost:11434` (Recommended: `qwen2.5-coder:1.5b` or `qwen2.5-coder:7b`).
    *   **LM Studio** running locally on `http://localhost:1234` with an active model server.
    *   A local `.gguf` file + system `llama-server` binary.

### 📥 Installation

```bash
# Clone the repository
git clone https://github.com/Sumeet-basfore/LACE.git
cd LACE

# Install node dependencies
npm install
```

### 💻 Run Development Servers

**Web Sandbox Mode** (Standard browser container with mock Tauri APIs):
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser. This sandbox mode lets you preview the Monaco themes, edit parameters, and test Ollama/LM Studio streaming configurations.

**Native Desktop Mode** (Full desktop app shell with direct PTY system commands & file dialogs):
```bash
npx tauri dev
```

### 🔨 Production Compilation

Build your optimized frontend and compile native desktop installer packages (`.deb`, `.dmg`, `.exe` based on your platform):
```bash
npm run build
npx tauri build
```

---

## 🛠️ Verification & Development Commands

Validate typings and build integrity during local development:

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Test Web package production builds
npm run build

# Verify Rust Tauri configurations
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 🛠️ GGUF & `llama-server` Troubleshooting

If you load a raw local `.gguf` file in LACE's GGUF loader and receive the following error:
> `Failed to run 'llama-server' binary. Error: No such file or directory (os error 2)`

This occurs because LACE's Tauri backend attempts to spawn a local background server using the `llama-server` command, which is missing from your system `PATH`. 

### 🔧 Resolving on Arch Linux / CachyOS
Install the `llama.cpp` packages providing `llama-server` using your AUR helper (`yay`):

```bash
# Option 1: For NVIDIA GPUs (CUDA) - Recommended
yay -S llama.cpp-cuda

# Option 2: For AMD GPUs (ROCm/HIP)
yay -S llama.cpp-hip

# Option 3: For Cross-Platform GPU Acceleration (Vulkan)
yay -S llama.cpp-vulkan

# Option 4: For CPU Only
yay -S llama.cpp
```

### 💡 Alternative: Leverage Ollama
If you prefer not to manage individual server binaries, you can bypass this entirely by using **Ollama**. Pull the model via the terminal and use it directly under the Ollama provider settings in LACE:
```bash
ollama run qwen2.5-coder:1.5b
```

---

## 📄 License

LACE is open-source software licensed under the [MIT License](LICENSE).
