import { FileNode } from '../types';
import { detectLanguage } from './languageDetect';

// Generate a unique ID
let idCounter = 0;
function generateId(): string {
  return `file-${++idCounter}-${Date.now()}`;
}

// ===== Sample Project Files =====
// A mock project to demonstrate the editor's capabilities

const sampleFiles: Record<string, string> = {
  'src/main.ts': `import { App } from './app';
import { Logger } from './utils/logger';

const logger = new Logger('Main');

async function bootstrap() {
  logger.info('Starting application...');
  
  const app = new App({
    port: 3000,
    host: 'localhost',
    debug: true,
  });

  await app.initialize();
  await app.start();

  logger.info(\`Server running at http://\${app.config.host}:\${app.config.port}\`);
}

bootstrap().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`,

  'src/app.ts': `import { Router } from './router';
import { Middleware } from './middleware';

export interface AppConfig {
  port: number;
  host: string;
  debug: boolean;
}

export class App {
  public config: AppConfig;
  private router: Router;
  private middlewares: Middleware[] = [];

  constructor(config: AppConfig) {
    this.config = config;
    this.router = new Router();
  }

  async initialize() {
    // Register default middlewares
    this.use(new Middleware('cors'));
    this.use(new Middleware('bodyParser'));
    this.use(new Middleware('logger'));

    // Setup routes
    this.router.get('/', (req, res) => {
      res.json({ message: 'Hello, World!' });
    });

    this.router.get('/health', (req, res) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  async start() {
    // Start listening...
    console.log(\`Registered \${this.middlewares.length} middlewares\`);
    console.log(\`Registered \${this.router.routes.length} routes\`);
  }
}
`,

  'src/utils/logger.ts': `export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private context: string;
  private level: LogLevel;

  constructor(context: string, level: LogLevel = 'info') {
    this.context = context;
    this.level = level;
  }

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return \`[\${timestamp}] [\${level.toUpperCase()}] [\${this.context}] \${message}\`;
  }

  debug(message: string) {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message));
    }
  }

  info(message: string) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message));
    }
  }

  warn(message: string) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message));
    }
  }

  error(message: string) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message));
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
`,

  'src/router.ts': `export interface Route {
  method: string;
  path: string;
  handler: (req: any, res: any) => void;
}

export class Router {
  public routes: Route[] = [];

  get(path: string, handler: (req: any, res: any) => void) {
    this.routes.push({ method: 'GET', path, handler });
  }

  post(path: string, handler: (req: any, res: any) => void) {
    this.routes.push({ method: 'POST', path, handler });
  }

  put(path: string, handler: (req: any, res: any) => void) {
    this.routes.push({ method: 'PUT', path, handler });
  }

  delete(path: string, handler: (req: any, res: any) => void) {
    this.routes.push({ method: 'DELETE', path, handler });
  }

  match(method: string, path: string): Route | undefined {
    return this.routes.find(
      (route) => route.method === method && route.path === path
    );
  }
}
`,

  'src/middleware.ts': `export class Middleware {
  public name: string;
  private enabled: boolean;

  constructor(name: string) {
    this.name = name;
    this.enabled = true;
  }

  async execute(req: any, res: any, next: () => void) {
    if (!this.enabled) {
      return next();
    }

    console.log(\`[Middleware] \${this.name} executing...\`);

    // Middleware-specific logic
    switch (this.name) {
      case 'cors':
        res.headers = {
          ...res.headers,
          'Access-Control-Allow-Origin': '*',
        };
        break;
      case 'bodyParser':
        req.body = req.body || {};
        break;
      case 'logger':
        console.log(\`\${req.method} \${req.url}\`);
        break;
    }

    next();
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
`,

  'package.json': `{
  "name": "sample-project",
  "version": "1.0.0",
  "description": "A sample TypeScript project",
  "main": "dist/main.js",
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0"
  }
}
`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,

  'README.md': `# Sample Project

A sample TypeScript project to demonstrate the **Local AI Code Editor**.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- 🚀 TypeScript-first development
- 📦 Express.js web server
- 🔧 Middleware architecture
- 📝 Built-in logging

## Project Structure

\`\`\`
src/
├── main.ts          # Entry point
├── app.ts           # Application class
├── router.ts        # HTTP routing
├── middleware.ts     # Middleware system
└── utils/
    └── logger.ts    # Logging utility
\`\`\`

## License

MIT
`,

  '.gitignore': `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`,
};

function buildFileTree(files: Record<string, string>): FileNode {
  const root: FileNode = {
    id: generateId(),
    name: 'sample-project',
    path: '/',
    type: 'directory',
    children: [],
    isExpanded: true,
  };

  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = '/' + parts.slice(0, i + 1).join('/');

      if (isFile) {
        current.children!.push({
          id: generateId(),
          name: part,
          path: currentPath,
          type: 'file',
          content,
          language: detectLanguage(part),
        });
      } else {
        let dir = current.children!.find(
          (c) => c.name === part && c.type === 'directory'
        );
        if (!dir) {
          dir = {
            id: generateId(),
            name: part,
            path: currentPath,
            type: 'directory',
            children: [],
            isExpanded: true,
          };
          current.children!.push(dir);
        }
        current = dir;
      }
    }
  }

  // Sort children: directories first, then files, alphabetically
  function sortChildren(node: FileNode) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  }
  sortChildren(root);

  return root;
}

export function getMockFileSystem(): FileNode {
  return buildFileTree(sampleFiles);
}

export function findFileByPath(root: FileNode, path: string): FileNode | null {
  if (root.path === path) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findFileByPath(child, path);
      if (found) return found;
    }
  }
  return null;
}

export function getAllFiles(root: FileNode): FileNode[] {
  const files: FileNode[] = [];
  if (root.type === 'file') {
    files.push(root);
  }
  if (root.children) {
    for (const child of root.children) {
      files.push(...getAllFiles(child));
    }
  }
  return files;
}
