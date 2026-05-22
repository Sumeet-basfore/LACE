import React, { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import '@xterm/xterm/css/xterm.css';

export const Terminal: React.FC = () => {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const rootNode = useFileSystemStore((state) => state.rootNode);

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

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
      }
    }, 100);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Send keystrokes to PTY
    xterm.onData((data) => {
      invoke('write_pty', { input: data }).catch(console.error);
    });

    // Listen to output from PTY
    const unlisten = listen<string>('pty_output', (event) => {
      xterm.write(event.payload);
    });

    // Spawn the PTY backend
    const cwd = rootNode && rootNode.path !== '/' ? rootNode.path : undefined;
    invoke('spawn_pty', { cwd }).catch(console.error);

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
      }
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      unlisten.then(f => f());
      xterm.dispose();
    };
  }, [rootNode.path]);

  return (
    <div
      ref={termRef}
      className="h-full w-full terminal-container"
      style={{ padding: '8px 0 0 8px' }}
    />
  );
};
