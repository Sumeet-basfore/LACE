import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileJson,
  FileCode,
  FileText,
  Hash,
  Braces,
  FileType,
  GitBranch,
} from 'lucide-react';
import { FileNode } from '../../types';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileClick: (node: FileNode) => void;
  onDirectoryClick: (node: FileNode) => void;
  selectedPath: string | null;
}

function getFileIcon(fileName: string, isOpen?: boolean): React.ReactNode {
  if (isOpen !== undefined) {
    // Directory
    return isOpen ? (
      <FolderOpen size={16} className="text-editor-warning flex-shrink-0" />
    ) : (
      <Folder size={16} className="text-editor-warning flex-shrink-0" />
    );
  }

  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={16} className="text-blue-400 flex-shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode size={16} className="text-yellow-400 flex-shrink-0" />;
    case 'json':
      return <FileJson size={16} className="text-yellow-300 flex-shrink-0" />;
    case 'md':
    case 'mdx':
      return <FileText size={16} className="text-blue-300 flex-shrink-0" />;
    case 'css':
    case 'scss':
    case 'less':
      return <Hash size={16} className="text-pink-400 flex-shrink-0" />;
    case 'html':
      return <Braces size={16} className="text-orange-400 flex-shrink-0" />;
    case 'py':
      return <FileCode size={16} className="text-green-400 flex-shrink-0" />;
    case 'rs':
      return <FileCode size={16} className="text-orange-500 flex-shrink-0" />;
    case 'gitignore':
      return <GitBranch size={16} className="text-gray-400 flex-shrink-0" />;
    default:
      return <File size={16} className="text-editor-muted flex-shrink-0" />;
  }
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  onFileClick,
  onDirectoryClick,
  selectedPath,
}) => {
  const isDirectory = node.type === 'directory';
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (isDirectory) {
      onDirectoryClick(node);
    } else {
      onFileClick(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1 py-[3px] pr-2 cursor-pointer
          text-[13px] select-none transition-colors duration-100
          ${isSelected
            ? 'bg-sidebar-active text-sidebar-text'
            : 'text-editor-subtext hover:bg-sidebar-hover'
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Chevron for directories */}
        {isDirectory ? (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {node.isExpanded ? (
              <ChevronDown size={14} className="text-editor-muted" />
            ) : (
              <ChevronRight size={14} className="text-editor-muted" />
            )}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* Icon */}
        {getFileIcon(node.name, isDirectory ? node.isExpanded : undefined)}

        {/* Name */}
        <span className="truncate ml-1 font-sans">{node.name}</span>
      </div>

      {/* Children */}
      {isDirectory && node.isExpanded && node.children && (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              onDirectoryClick={onDirectoryClick}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};
