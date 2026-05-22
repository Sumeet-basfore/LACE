import React, { useEffect, useState } from 'react';
import { ChevronDown, FolderOpen, FilePlus, FolderPlus, RefreshCw, ListCollapse, File, Folder } from 'lucide-react';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileTreeItem, InlineCreateInput } from './FileTreeItem';
import { FileNode } from '../../types';
import { findFileByPath } from '../../utils/fileSystem';

export const FileExplorer: React.FC = () => {
  const {
    rootNode,
    selectedPath,
    toggleDirectory,
    selectFile,
    initialize,
    openFolder,
    getFileContent,
    creatingNode,
    setCreatingNode,
    setRenamingPath,
    deletePath,
    refreshFileTree,
    collapseAll,
  } = useFileSystemStore();
  const { openFile } = useEditorStore();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    path: string;
    type: 'file' | 'directory';
  } | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('contextmenu', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [contextMenu]);

  const handleFileClick = async (node: FileNode) => {
    selectFile(node.path);
    if (!node.content) {
      const content = await getFileContent(node.path);
      openFile(node.path, node.name, content || '');
    } else {
      openFile(node.path, node.name, node.content);
    }
  };

  const handleDirectoryClick = (node: FileNode) => {
    toggleDirectory(node.path);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, type: 'file' | 'directory') => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      path,
      type,
    });
  };

  const getActiveDirectory = (): string => {
    if (!selectedPath || selectedPath === '/' || selectedPath === 'No Folder Opened') {
      return rootNode.path;
    }
    const node = findFileByPath(rootNode, selectedPath);
    if (node && node.type === 'directory') {
      return node.path;
    } else {
      const parts = selectedPath.split(/[/\\]/);
      parts.pop();
      return parts.join('/') || rootNode.path;
    }
  };

  const handleNewFileHeader = (e: React.MouseEvent) => {
    e.stopPropagation();
    const activeDir = getActiveDirectory();
    const node = findFileByPath(rootNode, activeDir);
    if (node && node.type === 'directory' && !node.isExpanded) {
      toggleDirectory(activeDir);
    }
    setCreatingNode({ parentPath: activeDir, type: 'file' });
  };

  const handleNewFolderHeader = (e: React.MouseEvent) => {
    e.stopPropagation();
    const activeDir = getActiveDirectory();
    const node = findFileByPath(rootNode, activeDir);
    if (node && node.type === 'directory' && !node.isExpanded) {
      toggleDirectory(activeDir);
    }
    setCreatingNode({ parentPath: activeDir, type: 'directory' });
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-bg relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-editor-subtext uppercase tracking-wider select-none">
        <span>Explorer</span>
        <div className="flex items-center gap-1.5">
          {rootNode.path !== '/' && rootNode.path !== 'No Folder Opened' && (
            <>
              <button
                onClick={handleNewFileHeader}
                className="p-0.5 rounded hover:bg-sidebar-hover text-editor-muted hover:text-editor-text transition-colors"
                title="New File"
              >
                <FilePlus size={14} />
              </button>
              <button
                onClick={handleNewFolderHeader}
                className="p-0.5 rounded hover:bg-sidebar-hover text-editor-muted hover:text-editor-text transition-colors"
                title="New Folder"
              >
                <FolderPlus size={14} />
              </button>
              <button
                onClick={refreshFileTree}
                className="p-0.5 rounded hover:bg-sidebar-hover text-editor-muted hover:text-editor-text transition-colors"
                title="Refresh Explorer"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={collapseAll}
                className="p-0.5 rounded hover:bg-sidebar-hover text-editor-muted hover:text-editor-text transition-colors"
                title="Collapse Folders"
              >
                <ListCollapse size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project name */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 text-[13px] font-semibold text-editor-text cursor-pointer hover:bg-sidebar-hover transition-colors"
        onClick={openFolder}
        title="Click to open a folder"
      >
        <ChevronDown size={16} className="text-editor-muted" />
        <FolderOpen size={16} className="text-editor-warning" />
        <span className="truncate ml-0.5">{rootNode.name}</span>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {creatingNode && creatingNode.parentPath === rootNode.path && (
          <div
            className="flex items-center gap-1.5 py-[3px] pr-2 animate-fade-in"
            style={{ paddingLeft: '24px' }}
          >
            {creatingNode.type === 'directory' ? (
              <Folder size={16} className="text-editor-warning flex-shrink-0" />
            ) : (
              <File size={16} className="text-editor-muted flex-shrink-0" />
            )}
            <InlineCreateInput
              parentPath={rootNode.path}
              type={creatingNode.type}
              onCancel={() => setCreatingNode(null)}
            />
          </div>
        )}
        {rootNode.children?.map((child) => (
          <FileTreeItem
            key={child.id}
            node={child}
            depth={1}
            onFileClick={handleFileClick}
            onDirectoryClick={handleDirectoryClick}
            selectedPath={selectedPath}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* Outline section */}
      <div className="border-t border-editor-border">
        <div className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-editor-subtext uppercase tracking-wider cursor-pointer hover:bg-sidebar-hover transition-colors">
          <ChevronDown size={14} className="text-editor-muted" />
          <span>Outline</span>
        </div>
        <div className="px-4 py-2 text-[12px] text-editor-muted italic">
          No outline available
        </div>
      </div>

      {/* Custom Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div
          className="fixed z-50 bg-editor-surface border border-editor-border rounded shadow-lg py-1 w-44 animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'directory' && (
            <>
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-hover flex items-center gap-2 transition-colors"
                onClick={() => {
                  setCreatingNode({ parentPath: contextMenu.path, type: 'file' });
                  const node = findFileByPath(rootNode, contextMenu.path);
                  if (node && !node.isExpanded) {
                    toggleDirectory(contextMenu.path);
                  }
                  setContextMenu(null);
                }}
              >
                New File
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-hover flex items-center gap-2 transition-colors"
                onClick={() => {
                  setCreatingNode({ parentPath: contextMenu.path, type: 'directory' });
                  const node = findFileByPath(rootNode, contextMenu.path);
                  if (node && !node.isExpanded) {
                    toggleDirectory(contextMenu.path);
                  }
                  setContextMenu(null);
                }}
              >
                New Folder
              </button>
              <div className="border-t border-editor-border my-1" />
            </>
          )}
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-editor-text hover:bg-editor-hover flex items-center gap-2 transition-colors"
            onClick={() => {
              setRenamingPath(contextMenu.path);
              setContextMenu(null);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-editor-error hover:bg-editor-hover flex items-center gap-2 transition-colors"
            onClick={async () => {
              const fileName = contextMenu.path.split(/[/\\]/).pop();
              const confirmed = window.confirm(`Are you sure you want to delete "${fileName}"?`);
              if (confirmed) {
                await deletePath(contextMenu.path);
              }
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
