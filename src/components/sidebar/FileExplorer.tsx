import React, { useEffect } from 'react';
import { ChevronDown, MoreHorizontal, FolderOpen } from 'lucide-react';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileTreeItem } from './FileTreeItem';
import { FileNode } from '../../types';

export const FileExplorer: React.FC = () => {
  const { rootNode, selectedPath, toggleDirectory, selectFile, initialize } =
    useFileSystemStore();
  const { openFile } = useEditorStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleFileClick = (node: FileNode) => {
    selectFile(node.path);
    openFile(node.path, node.name, node.content || '');
  };

  const handleDirectoryClick = (node: FileNode) => {
    toggleDirectory(node.path);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-editor-subtext uppercase tracking-wider">
        <span>Explorer</span>
        <button className="p-0.5 rounded hover:bg-sidebar-hover text-editor-muted hover:text-editor-text transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Project name */}
      <div className="flex items-center gap-1 px-2 py-1.5 text-[13px] font-semibold text-editor-text cursor-pointer hover:bg-sidebar-hover transition-colors">
        <ChevronDown size={16} className="text-editor-muted" />
        <FolderOpen size={16} className="text-editor-warning" />
        <span className="truncate ml-0.5">{rootNode.name}</span>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {rootNode.children?.map((child) => (
          <FileTreeItem
            key={child.id}
            node={child}
            depth={1}
            onFileClick={handleFileClick}
            onDirectoryClick={handleDirectoryClick}
            selectedPath={selectedPath}
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
    </div>
  );
};
