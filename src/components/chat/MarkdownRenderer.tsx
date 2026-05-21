import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

// Custom dark theme overrides to match our Catppuccin palette
const customStyle = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#11111b',
    borderRadius: '8px',
    margin: '8px 0',
    padding: '12px 16px',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: '13px',
  },
};

const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-editor-hover/50 hover:bg-editor-hover text-editor-muted hover:text-editor-text transition-all opacity-0 group-hover:opacity-100"
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? <Check size={14} className="text-editor-success" /> : <Copy size={14} />}
    </button>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className;

          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-editor-overlay text-editor-accent text-[12px] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }

          const codeString = String(children).replace(/\n$/, '');

          return (
            <div className="relative group my-2">
              {/* Language label */}
              {match && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-editor-overlay rounded-t-lg border-b border-editor-border/30">
                  <span className="text-[10px] text-editor-muted uppercase tracking-wider font-medium">
                    {match[1]}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(codeString);
                      } catch {}
                    }}
                    className="flex items-center gap-1 text-[10px] text-editor-muted hover:text-editor-text transition-colors"
                  >
                    <Copy size={10} />
                    Copy
                  </button>
                </div>
              )}
              <SyntaxHighlighter
                style={customStyle}
                language={match ? match[1] : 'text'}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderTopLeftRadius: match ? 0 : '8px',
                  borderTopRightRadius: match ? 0 : '8px',
                }}
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          );
        },
        p({ children }: any) {
          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
        },
        ul({ children }: any) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
        },
        ol({ children }: any) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
        },
        li({ children }: any) {
          return <li className="leading-relaxed">{children}</li>;
        },
        h1({ children }: any) {
          return <h1 className="text-lg font-bold mb-2 text-editor-text">{children}</h1>;
        },
        h2({ children }: any) {
          return <h2 className="text-base font-bold mb-2 text-editor-text">{children}</h2>;
        },
        h3({ children }: any) {
          return <h3 className="text-sm font-bold mb-1 text-editor-text">{children}</h3>;
        },
        strong({ children }: any) {
          return <strong className="font-semibold text-editor-text">{children}</strong>;
        },
        em({ children }: any) {
          return <em className="italic text-editor-subtext">{children}</em>;
        },
        blockquote({ children }: any) {
          return (
            <blockquote className="border-l-2 border-editor-accent/50 pl-3 my-2 text-editor-subtext italic">
              {children}
            </blockquote>
          );
        },
        hr() {
          return <hr className="my-3 border-editor-border/50" />;
        },
        a({ children, href }: any) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-editor-accent hover:underline"
            >
              {children}
            </a>
          );
        },
        table({ children }: any) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          );
        },
        th({ children }: any) {
          return (
            <th className="border border-editor-border/50 px-3 py-1.5 bg-editor-overlay text-left font-semibold text-editor-text">
              {children}
            </th>
          );
        },
        td({ children }: any) {
          return (
            <td className="border border-editor-border/50 px-3 py-1.5">
              {children}
            </td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
