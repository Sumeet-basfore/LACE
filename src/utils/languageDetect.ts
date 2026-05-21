const extensionToLanguage: Record<string, string> = {
  // Web
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.xml': 'xml',
  '.svg': 'xml',

  // Systems
  '.rs': 'rust',
  '.go': 'go',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.java': 'java',
  '.cs': 'csharp',

  // Scripting
  '.py': 'python',
  '.rb': 'ruby',
  '.php': 'php',
  '.lua': 'lua',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.ps1': 'powershell',

  // Data
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.env': 'plaintext',

  // Docs
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.txt': 'plaintext',
  '.log': 'plaintext',

  // Config
  '.dockerfile': 'dockerfile',
  '.sql': 'sql',
  '.graphql': 'graphql',
};

const filenameToLanguage: Record<string, string> = {
  'Dockerfile': 'dockerfile',
  'Makefile': 'makefile',
  'Cargo.toml': 'toml',
  'Cargo.lock': 'toml',
  '.gitignore': 'plaintext',
  '.env': 'plaintext',
  '.env.local': 'plaintext',
  '.prettierrc': 'json',
  '.eslintrc': 'json',
  'tsconfig.json': 'json',
  'package.json': 'json',
  'package-lock.json': 'json',
};

export function detectLanguage(filename: string): string {
  // Check full filename first
  if (filenameToLanguage[filename]) {
    return filenameToLanguage[filename];
  }

  // Check extension
  const lastDot = filename.lastIndexOf('.');
  if (lastDot !== -1) {
    const ext = filename.substring(lastDot).toLowerCase();
    if (extensionToLanguage[ext]) {
      return extensionToLanguage[ext];
    }
  }

  return 'plaintext';
}

export function getFileIcon(filename: string, isDirectory: boolean): string {
  if (isDirectory) return 'folder';

  const lang = detectLanguage(filename);
  const iconMap: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    rust: 'rs',
    html: 'html',
    css: 'css',
    json: 'json',
    markdown: 'md',
    yaml: 'yaml',
  };

  return iconMap[lang] || 'file';
}
