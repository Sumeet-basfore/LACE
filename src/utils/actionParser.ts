/**
 * AI Action Parser
 *
 * Parses AI responses to extract structured actions:
 * - File edits (code blocks with file paths)
 * - Terminal commands (shell/bash code blocks)
 *
 * The AI is instructed to use a specific format:
 *   ```edit:path/to/file.ts
 *   <new file content>
 *   ```
 *
 *   ```terminal
 *   npm install express
 *   ```
 */

export type ActionBlockType = 'text' | 'code' | 'file-edit' | 'terminal-command' | 'tool-call';

export interface ParsedBlock {
  id: string;
  type: ActionBlockType;
  content: string;
  // For file-edit blocks
  filePath?: string;
  language?: string;
  // For terminal-command blocks
  command?: string;
  // For tool-call blocks
  tool?: 'read_file' | 'list_dir';
  // State
  status?: 'pending' | 'applied' | 'rejected' | 'completed' | 'error';
}

let blockIdCounter = 0;
function nextBlockId(): string {
  return `block-${++blockIdCounter}-${Date.now()}`;
}

/**
 * Parse an AI response into structured blocks
 */
export function parseAIResponse(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const codeBlockRegex = /```(\w[\w.:\/\\-]*)?(?:\s*\n)([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before this code block
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({
        id: nextBlockId(),
        type: 'text',
        content: textBefore,
      });
    }

    const langOrPath = match[1] || '';
    const codeContent = match[2];

    // Detect file edit: ```edit:path/to/file.ts
    if (langOrPath.startsWith('edit:')) {
      const filePath = langOrPath.substring(5).trim();
      const language = detectLangFromPath(filePath);
      blocks.push({
        id: nextBlockId(),
        type: 'file-edit',
        content: codeContent,
        filePath,
        language,
        status: 'pending',
      });
    }
    // Detect tool calls: ```read_file:path or ```list_dir:path
    else if (langOrPath.startsWith('read_file:') || langOrPath.startsWith('list_dir:')) {
      const isReadFile = langOrPath.startsWith('read_file:');
      const tool = isReadFile ? 'read_file' : 'list_dir';
      const filePath = langOrPath.substring(isReadFile ? 10 : 9).trim();
      blocks.push({
        id: nextBlockId(),
        type: 'tool-call',
        content: codeContent,
        tool,
        filePath,
        status: 'pending',
      });
    }
    // Detect terminal command: ```terminal or ```bash or ```shell or ```sh
    else if (['terminal', 'bash', 'shell', 'sh', 'zsh', 'cmd', 'powershell'].includes(langOrPath.toLowerCase())) {
      // Check if the code block looks like a single command (vs code example)
      const lines = codeContent.trim().split('\n').filter((l: string) => l.trim());
      const looksLikeCommand = lines.length <= 5 && lines.every((l: string) =>
        l.startsWith('$') || l.startsWith('#') || l.startsWith('>') ||
        /^(npm|npx|yarn|pnpm|cargo|pip|python|node|git|cd|ls|mkdir|rm|cp|mv|cat|echo|curl|wget|docker|make|go|rustc|gcc|g\+\+)\s/.test(l.trim()) ||
        /^(sudo|apt|brew|yum|dnf|pacman)\s/.test(l.trim()) ||
        /^[a-zA-Z_][\w-]*\s/.test(l.trim())
      );

      if (looksLikeCommand) {
        // Clean command prefixes
        const cleanedCmd = lines
          .map((l: string) => l.replace(/^\$\s*/, '').replace(/^>\s*/, '').trim())
          .filter((l: string) => !l.startsWith('#'))
          .join('\n');

        blocks.push({
          id: nextBlockId(),
          type: 'terminal-command',
          content: codeContent,
          command: cleanedCmd,
          language: langOrPath.toLowerCase(),
          status: 'pending',
        });
      } else {
        // Regular code block that happens to be shell
        blocks.push({
          id: nextBlockId(),
          type: 'code',
          content: codeContent,
          language: langOrPath.toLowerCase(),
        });
      }
    }
    // Regular code block
    else {
      blocks.push({
        id: nextBlockId(),
        type: 'code',
        content: codeContent,
        language: langOrPath.toLowerCase() || 'text',
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last code block
  const remainingText = content.substring(lastIndex).trim();
  if (remainingText) {
    blocks.push({
      id: nextBlockId(),
      type: 'text',
      content: remainingText,
    });
  }

  // If no blocks parsed, return the whole content as text
  if (blocks.length === 0 && content.trim()) {
    blocks.push({
      id: nextBlockId(),
      type: 'text',
      content: content.trim(),
    });
  }

  return blocks;
}

function detectLangFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go', java: 'java', cs: 'csharp',
    cpp: 'cpp', c: 'c', h: 'cpp', hpp: 'cpp',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', sql: 'sql', graphql: 'graphql',
    rb: 'ruby', php: 'php', lua: 'lua', sh: 'shell',
  };
  return map[ext || ''] || 'plaintext';
}

/**
 * Compute a simple line-by-line diff between two strings
 */
export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function computeDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = computeLCS(oldLines, newLines);
  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length && oldIdx < oldLines.length && oldLines[oldIdx] === lcs[lcsIdx] &&
        newIdx < newLines.length && newLines[newIdx] === lcs[lcsIdx]) {
      // Unchanged line
      result.push({
        type: 'unchanged',
        content: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
        newLineNumber: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
      lcsIdx++;
    } else {
      // Check if current old line is in LCS
      if (oldIdx < oldLines.length &&
          (lcsIdx >= lcs.length || oldLines[oldIdx] !== lcs[lcsIdx])) {
        result.push({
          type: 'removed',
          content: oldLines[oldIdx],
          oldLineNumber: oldIdx + 1,
        });
        oldIdx++;
      }
      // Check if current new line is in LCS
      if (newIdx < newLines.length &&
          (lcsIdx >= lcs.length || newLines[newIdx] !== lcs[lcsIdx])) {
        result.push({
          type: 'added',
          content: newLines[newIdx],
          newLineNumber: newIdx + 1,
        });
        newIdx++;
      }
    }
  }

  return result;
}

/**
 * Compute Longest Common Subsequence
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // Optimization: for very large files, use a simpler approach
  if (m * n > 1000000) {
    return simpleLCS(a, b);
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Simple LCS for large files — match consecutive equal lines
 */
function simpleLCS(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((line) => bSet.has(line));
}
