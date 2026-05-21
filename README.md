# 🌌 LACE — Local AI Code Editor

A completely offline, premium, and open-source IDE built to bypass cloud-based AI coding subscriptions. LACE runs entirely on your local machine, keeping your source code secure, private, and latency-free by leveraging locally served large language models.

Scaffolded as a high-fidelity Single Page Application (Vite + React + TypeScript + TailwindCSS) and structured to wrap seamlessly inside a native desktop shell (Tauri v2 + Rust), LACE delivers a premium VS Code-like coding experience.

---

## ✨ Features

### 💻 1. Core Editor Shell
*   **Monaco Editor Integration**: Embedded with full language syntax highlighting, automatic saving (`Ctrl+S`), smooth animations, and active cursor line/column tracking.
*   **Theme**: Styled with a gorgeous, dark VS Code-like **Catppuccin Mocha** palette.
*   **3-Panel Responsive Layout**: Drag-to-resize operations for the Left Sidebar (File Explorer/Settings), Center Workspace, Bottom Terminal Panel, and Right AI Assistant.
*   **Integrated Terminal**: High-performance simulated Xterm.js shell mapping local files for instant sandbox execution.
*   **Activity & Status Bar**: Quick navigation tabs, status indicators reflecting local AI connections, active model families, languages, and workspace states.

### 💬 2. AI Chat Sidebar
*   **Local Ollama Connection**: Seamlessly connects to your local Ollama API instance with instant tag loading and cancelable token-by-token completion streaming.
*   **Context File Injection**: Auto-injects your active file as context into prompts, with a removable files bar to manage added source file tags.
*   **Rich Markdown Rendering**: Renders code blocks dynamically with language indicators and one-click copy-to-clipboard buttons.

### ⚡ 3. AI Actions & Visual Diff Engine
*   **Interactive Code Edits**: Parses ```edit:filepath``` code blocks dynamically from AI completions.
*   **Longest Common Subsequence (LCS) Diff**: Computes precise, line-by-line insertions (`+`) and deletions (`-`) comparing original source contents against AI recommendations.
*   **Visual Diff Blocks**: Collapsible code widget with color-coded diff overlays and premium "Accept" / "Reject" controls. Accept operations write immediately to your filesystem and update or open tabs automatically.
*   **Auto-Apply Toggle**: Switch "Auto-Apply Changes" in settings to automatically commit AI code proposals without manual review.
*   **Suggested Terminal Commands**: Parses suggested shell commands from completions, rendering interactive blocks with "Run Command" and "Skip" approvals.

### 🚀 4. Direct `.gguf` Model Support (llama.cpp)
*   **Tauri v2 Backend**: Scaffolds a native Rust desktop environment inside the workspace.
*   **Native OS File Dialog**: Integrates `rfd` (Rust File Dialog) for native, extension-filtered (`.gguf`) file dialog selections.
*   **Background llama-server Process Supervisor**: Launches a native `llama-server` process bound to the picked `.gguf` file on port `11435`.
*   **Clean Window Lifetime Teardown**: Intercepts Tauri window destroy hooks to kill background subprocesses automatically, preventing resource leaks.
*   **Dual Dev Simulator Fallback**: Gracefully detects if running inside a standard browser environment and simulates a mock llama-server transition to facilitate browser testing.

### ✍️ 5. Ghost-Text Inline Completions
*   **Autocomplete Provider**: Monaco Inline Completions provider registered globally across 12 major languages.
*   **Fill-In-the-Middle (FIM) Prompt Engineering**: Optimized for local autocomplete giants:
    *   **Qwen2.5-Coder / Qwen**: Format structure using `<fim_prefix>`, `<fim_suffix>`, `<fim_middle>` tags.
    *   **CodeLlama**: Uses `< PRE>`, `< SUF>`, `< MID>` tags.
    *   Fallback instruction completion for general LLMs.
*   **Snappy Debouncing**: Evaluates cursor activity with a 350ms keyup debounce delay to prevent flooding the local endpoint.
*   **High Performance**: Restricts token context overhead (temperature `0.0`, predict `48` tokens) to deliver autocompletions instantly.

### ⚙️ 6. Centralized Settings Panel
*   **Persistent Preferences**: Stores editor and AI helper settings locally via `localStorage`.
*   **Custom Editor Settings**: Font size sliders, font family selects, dynamic minimap toggle, word wrapping switches, and line numbering styles (Normal, Disabled, Relative).
*   **AI Setup**: Toggle permissions (Allow File Edits, Suggest Terminal Commands, Auto-apply, Autocomplete), set context window sizes (2048 to 16384 tokens), customize port endpoints, and run quick connection health checks.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| **`Ctrl + L`** | Toggle Right AI Assistant Panel |
| **`Ctrl + \``** | Toggle Bottom Terminal Panel |
| **`Ctrl + B`** | Toggle Left Sidebar Explorer / Settings |
| **`Ctrl + S`** | Save Current File and Sync tab content |

---

## 🏗️ Architecture

```
LACE/
├── src-tauri/                         # Tauri v2 Desktop Backend (Rust)
│   ├── src/
│   │   ├── main.rs                    # Application entry point
│   │   └── lib.rs                     # Native GGUF file pickers & llama-server process managers
│   ├── Cargo.toml                     # Rust dependencies (rfd, tauri, serde)
│   └── tauri.conf.json                # Tauri window & builder permissions
├── src/                               # Frontend Application (React + TypeScript)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx           # Resizable 3-panel shell & hotkeys
│   │   │   └── StatusBar.tsx          # Real-time state trackers & model tags
│   │   ├── editor/
│   │   │   ├── MonacoEditor.tsx       # Monaco instance, themes, and autocomplete binds
│   │   │   └── WelcomeTab.tsx         # Welcome screen, branding, and shortcuts card
│   │   ├── chat/
│   │   │   ├── AIChatPanel.tsx        # Stream completions & chat drawers
│   │   │   └── ChatMessage.tsx        # Message bubbles, DiffView, and terminal buttons
│   │   ├── sidebar/
│   │   │   ├── FileExplorer.tsx       # Sidebar explorer displaying files
│   │   │   └── SettingsPanel.tsx      # Persistent font/wrapping & GGUF loaders
│   ├── stores/
│   │   ├── settingsStore.ts       # Editor options & AI settings
│   │   ├── chatStore.ts           # Streaming conversation log
│   │   ├── editorStore.ts         # Active tabs, languages, and dirty markers
│   │   └── fileSystemStore.ts     # In-memory virtual filesystem
│   ├── utils/
│   │   ├── inlineCompletionProvider.ts # FIM prompt formats & autocompleters
│   │   ├── actionParser.ts            # LCS line-by-line git diff parsers
│   │   └── fileSystem.ts              # Virtual workspace node blueprints
```

---

## 🚀 Getting Started

### Prerequisites

1.  **Node.js**: `v18.x` or higher installed.
2.  **Rust & Cargo**: Standard toolchain installed (required to compile the Tauri backend).
3.  **Local LLMs**:
    *   **Ollama** running locally on `http://localhost:11434` (recommended: `qwen2.5-coder:1.5b` or `qwen2.5-coder:7b`).
    *   **Or raw `.gguf` files** (such as Qwen2.5-Coder `.gguf` models) loaded directly through our integrated GGUF Model Loader (requires `llama-server` installed in your system path).

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Sumeet-basfore/LACE.git
    cd LACE
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server (Web Sandbox Mode)**:
    ```bash
    npm run dev
    ```
    Open **`http://localhost:5173`** in your browser to experience the entire visual interface, mock terminal, chat, autocomplete, settings, and diff system.

4.  **Run Desktop Application (Tauri Mode)**:
    Ensure you have Tauri's prerequisites installed for your OS, then run:
    ```bash
    npx tauri dev
    ```
    This launches the native Rust compiler, launches your system file dialogs for `.gguf` loaders, and wraps the app in a standalone native desktop frame.

---

## 🛠️ Verification & Development Commands

Validate typings and build integrity during development:

*   **Type Checker (TypeScript)**:
    ```bash
    npx tsc --noEmit
    ```
*   **Compile Production Web Bundle**:
    ```bash
    npm run build
    ```
*   **Verify Tauri Backend Compilation**:
    ```bash
    cargo check --manifest-path src-tauri/Cargo.toml
    ```

---

## 🔮 Roadmap

*   [ ] **Full Tauri File System Integrations**: Connect mock filesystem stores directly to physical OS directories via Tauri FS APIs.
*   [ ] **Tauri Terminal Bindings**: Hook the terminal simulated panel to real backend shell processes (`/bin/bash` or `powershell`).
*   [ ] **RAG Context Embeddings**: Local vector database (using SQLite or native Rust vector indexes) to feed multi-file folder context into the chat dynamically.
*   [ ] **Packaged llama.cpp server**: Precompile and bundle direct `llama-server` sidecar binaries for completely zero-config out-of-the-box offline GGUF execution.

---

## 📄 License

LACE is open-source software licensed under the [MIT License](LICENSE).
