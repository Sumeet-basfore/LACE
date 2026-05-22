import React, { useState, useEffect } from 'react';
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
  GitBranch,
  Paperclip,
} from 'lucide-react';
import { FileNode } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { useFileSystemStore } from '../../stores/fileSystemStore';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileClick: (node: FileNode) => void;
  onDirectoryClick: (node: FileNode) => void;
  selectedPath: string | null;
  onContextMenu: (e: React.MouseEvent, path: string, type: 'file' | 'directory') => void;
}

function getFileIcon(fileName: string, isOpen?: boolean): React.ReactNode {
  if (isOpen !== undefined) {
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
  onContextMenu,
}) => {
  const isDirectory = node.type === 'directory';
  const isSelected = selectedPath === node.path;

  const { contextFiles, addContextFile, removeContextFile } = useChatStore();
  const isInContext = !isDirectory && contextFiles.includes(node.path);

  const {
    gitStatus,
    creatingNode,
    renamingPath,
    renamePath,
    setCreatingNode,
    setRenamingPath,
    rootNode,
  } = useFileSystemStore();

  const isRenaming = renamingPath === node.path;
  const [renameValue, setRenameValue] = useState(node.name);

  // Sync state if node name updates
  useEffect(() => {
    setRenameValue(node.name);
  }, [node.name]);

  // Compute Git status color styling
  const getRelativePath = (fullPath: string): string => {
    const rootPath = rootNode.path;
    if (!fullPath || fullPath === '/' || !rootPath || rootPath === '/') return '';
    if (fullPath.startsWith(rootPath)) {
      return fullPath.substring(rootPath.length).replace(/^[/\\]/, '').replace(/\\/g, '/');
    }
    return fullPath;
  };

  const relativePath = getRelativePath(node.path);
  const status = gitStatus[relativePath];

  const getTextColorClass = () => {
    if (isSelected) {
      return 'text-sidebar-text';
    }
    if (status === 'M') {
      return 'text-editor-warning font-medium';
    }
    if (status === 'A' || status === '??') {
      return 'text-editor-success font-medium';
    }
    if (isInContext) {
      return 'text-editor-accent';
    }
    return 'text-editor-subtext hover:text-editor-text';
  };

  const handleClick = () => {
    if (isDirectory) {
      onDirectoryClick(node);
    } else {
      onFileClick(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.path, node.type);
  };

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.name) {
      await renamePath(node.path, trimmed);
    }
    setRenamingPath(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenameValue(node.name);
      setRenamingPath(null);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          group flex items-center gap-1 py-[3px] pr-2 cursor-pointer
          text-[13px] select-none transition-colors duration-100
          ${isSelected ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover'}
          ${getTextColorClass()}
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

        {/* Name / Inline Rename Input */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="bg-editor-surface border border-editor-accent text-editor-text text-xs px-1 py-0 rounded outline-none w-full max-w-[150px] font-sans h-5"
          />
        ) : (
          <span className="truncate ml-1 font-sans flex-1">{node.name}</span>
        )}

        {/* Git status code badge */}
        {status && !isRenaming && (
          <span
            className={`text-[10px] font-semibold px-1 select-none mr-1 flex-shrink-0 ${
              status === 'M' ? 'text-editor-warning' : 'text-editor-success'
            }`}
            title={status === 'M' ? 'Modified' : status === 'A' ? 'Added' : 'Untracked'}
          >
            {status === 'M' ? 'M' : status === 'A' ? 'A' : 'U'}
          </span>
        )}

        {/* AI Context Pin Button */}
        {!isDirectory && !isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isInContext) {
                removeContextFile(node.path);
              } else {
                addContextFile(node.path);
              }
            }}
            className={`
              p-0.5 rounded transition-colors flex-shrink-0
              ${isInContext
                ? 'text-editor-accent opacity-100 hover:bg-sidebar-active'
                : 'text-editor-muted opacity-0 group-hover:opacity-100 hover:text-editor-text hover:bg-sidebar-active'
              }
            `}
            title={isInContext ? 'Remove from AI Context' : 'Add to AI Context'}
          >
            <Paperclip size={13} />
          </button>
        )}
      </div>

      {/* Children */}
      {isDirectory && node.isExpanded && (
        <div className="animate-fade-in">
          {/* Inline Input for New Child Creation under this directory */}
          {creatingNode && creatingNode.parentPath === node.path && (
            <div
              className="flex items-center gap-1.5 py-[3px] pr-2"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              {creatingNode.type === 'directory' ? (
                <Folder size={16} className="text-editor-warning flex-shrink-0" />
              ) : (
                <File size={16} className="text-editor-muted flex-shrink-0" />
              )}
              <InlineCreateInput
                parentPath={node.path}
                type={creatingNode.type}
                onCancel={() => setCreatingNode(null)}
              />
            </div>
          )}

          {node.children?.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              onDirectoryClick={onDirectoryClick}
              selectedPath={selectedPath}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Inline creation helper component
export interface InlineCreateInputProps {
  parentPath: string;
  type: 'file' | 'directory';
  onCancel: () => void;
}

export const InlineCreateInput: React.FC<InlineCreateInputProps> = ({
  parentPath,
  type,
  onCancel,
}) => {
  const [value, setValue] = useState('');
  const createFileStore = useFileSystemStore((s) => s.createFile);
  const createFolderStore = useFileSystemStore((s) => s.createFolder);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (trimmed) {
      if (type === 'file') {
        await createFileStore(parentPath, trimmed);
      } else {
        await createFolderStore(parentPath, trimmed);
      }
    }
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      autoFocus
      placeholder={type === 'file' ? 'file name' : 'folder name'}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSubmit}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className="bg-editor-surface border border-editor-accent text-editor-text text-xs px-1 py-0 rounded outline-none w-full max-w-[150px] font-sans h-5"
    />
  );
};
