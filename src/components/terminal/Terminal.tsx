import React, { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const Terminal: React.FC = () => {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!termRef.current) return;

    const xterm = new XTerminal({
      theme: {
        background: '#11111b',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        cursorAccent: '#11111b',
        selectionBackground: '#45475a',
        selectionForeground: '#cdd6f4',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#89dceb',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#cba6f7',
        brightCyan: '#89dceb',
        brightWhite: '#a6adc8',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 1000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(termRef.current);

    // Slight delay to ensure DOM is ready
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit errors during initialization
      }
    }, 100);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    xterm.writeln('\x1b[38;2;137;180;250m╭──────────────────────────────────────────╮\x1b[0m');
    xterm.writeln('\x1b[38;2;137;180;250m│\x1b[0m  \x1b[1;38;2;205;214;244mLocal AI Code Editor\x1b[0m — \x1b[38;2;166;173;200mTerminal\x1b[0m         \x1b[38;2;137;180;250m│\x1b[0m');
    xterm.writeln('\x1b[38;2;137;180;250m│\x1b[0m  \x1b[38;2;108;112;134mFull terminal access coming with Tauri\x1b[0m  \x1b[38;2;137;180;250m│\x1b[0m');
    xterm.writeln('\x1b[38;2;137;180;250m╰──────────────────────────────────────────╯\x1b[0m');
    xterm.writeln('');
    xterm.write('\x1b[38;2;166;227;161m➜\x1b[0m \x1b[38;2;137;180;250m~/sample-project\x1b[0m $ ');

    // Echo typed input (mock shell)
    let currentLine = '';
    xterm.onKey(({ key, domEvent }) => {
      const char = key;
      if (domEvent.keyCode === 13) {
        // Enter
        xterm.writeln('');
        if (currentLine.trim()) {
          handleCommand(xterm, currentLine.trim());
        }
        currentLine = '';
        xterm.write('\x1b[38;2;166;227;161m➜\x1b[0m \x1b[38;2;137;180;250m~/sample-project\x1b[0m $ ');
      } else if (domEvent.keyCode === 8) {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write('\b \b');
        }
      } else if (char.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
        currentLine += char;
        xterm.write(char);
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore resize errors
      }
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
    };
  }, []);

  return (
    <div
      ref={termRef}
      className="h-full w-full terminal-container"
      style={{ padding: '8px 0 0 8px' }}
    />
  );
};

function handleCommand(xterm: XTerminal, command: string) {
  const parts = command.split(' ');
  const cmd = parts[0];

  switch (cmd) {
    case 'help':
      xterm.writeln('\x1b[38;2;137;180;250mAvailable commands:\x1b[0m');
      xterm.writeln('  help     - Show this help message');
      xterm.writeln('  clear    - Clear terminal');
      xterm.writeln('  echo     - Echo text');
      xterm.writeln('  date     - Show current date');
      xterm.writeln('  whoami   - Show user info');
      xterm.writeln('  ls       - List files');
      xterm.writeln('');
      xterm.writeln('\x1b[38;2;108;112;134mNote: Full shell coming with Tauri integration\x1b[0m');
      break;
    case 'clear':
      xterm.clear();
      break;
    case 'echo':
      xterm.writeln(parts.slice(1).join(' '));
      break;
    case 'date':
      xterm.writeln(new Date().toString());
      break;
    case 'whoami':
      xterm.writeln('developer');
      break;
    case 'ls':
      xterm.writeln('\x1b[38;2;137;180;250msrc/\x1b[0m  package.json  tsconfig.json  README.md  .gitignore');
      break;
    default:
      xterm.writeln(`\x1b[38;2;243;139;168mbash: ${cmd}: command not found\x1b[0m`);
      xterm.writeln(`\x1b[38;2;108;112;134mType 'help' for available commands\x1b[0m`);
  }
}
