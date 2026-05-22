import { create } from 'zustand';
import { FileNode } from '../types';
import {
  openProjectDirectory,
  findFileByPath,
  readFileContent,
  writeFileContent,
  createFile,
  createDirectory,
  deleteFileOrDirectory,
  renameFileOrDirectory,
  refreshProjectDirectory,
} from '../utils/fileSystem';
import { invoke } from '@tauri-apps/api/core';

interface FileSystemState {
  rootNode: FileNode;
  selectedPath: string | null;
  gitStatus: Record<string, string>;
  creatingNode: { parentPath: string; type: 'file' | 'directory' } | null;
  renamingPath: string | null;

  // Actions
  initialize: () => void;
  openFolder: () => Promise<void>;
  toggleDirectory: (path: string) => void;
  selectFile: (path: string) => void;
  getFileContent: (path: string) => Promise<string | undefined>;
  updateFileContent: (path: string, content: string) => Promise<void>;
  refreshGitStatus: () => Promise<void>;
  refreshFileTree: () => Promise<void>;
  createFile: (parentPath: string, name: string) => Promise<void>;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  deletePath: (path: string) => Promise<void>;
  renamePath: (path: string, newName: string) => Promise<void>;
  setCreatingNode: (val: { parentPath: string; type: 'file' | 'directory' } | null) => void;
  setRenamingPath: (val: string | null) => void;
  collapseAll: () => void;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  rootNode: {
    id: 'root',
    name: 'No Folder Opened',
    path: '/',
    type: 'directory',
    children: [],
  },
  selectedPath: null,
  gitStatus: {},
  creatingNode: null,
  renamingPath: null,

  initialize: () => {
    // We start empty, user needs to click 'Open Folder'
  },

  openFolder: async () => {
    const node = await openProjectDirectory();
    if (node) {
      set({ rootNode: node, selectedPath: null });
      await get().refreshGitStatus();
    }
  },

  toggleDirectory: (path: string) => {
    set((state) => {
      const newRoot = JSON.parse(JSON.stringify(state.rootNode));
      const node = findFileByPath(newRoot, path);
      if (node && node.type === 'directory') {
        node.isExpanded = !node.isExpanded;
      }
      return { rootNode: newRoot };
    });
  },

  selectFile: (path: string) => {
    set({ selectedPath: path });
  },

  getFileContent: async (path: string) => {
    try {
      const content = await readFileContent(path);
      // We also update the node in store to cache it
      set((state) => {
        const newRoot = JSON.parse(JSON.stringify(state.rootNode));
        const node = findFileByPath(newRoot, path);
        if (node) {
          node.content = content;
        }
        return { rootNode: newRoot };
      });
      return content;
    } catch (e) {
      return undefined;
    }
  },

  updateFileContent: async (path: string, content: string) => {
    try {
      await writeFileContent(path, content);
      set((state) => {
        const newRoot = JSON.parse(JSON.stringify(state.rootNode));
        const node = findFileByPath(newRoot, path);
        if (node) {
          node.content = content;
        }
        return { rootNode: newRoot };
      });
      // Refresh git status when file changes
      await get().refreshGitStatus();
    } catch (e) {
      console.error('Failed to save file', e);
    }
  },

  refreshGitStatus: async () => {
    const { rootNode } = get();
    if (!rootNode.path || rootNode.path === '/' || rootNode.path === 'No Folder Opened') return;
    try {
      const status = await invoke<Record<string, string>>('get_git_status', { path: rootNode.path });
      set({ gitStatus: status });
    } catch (e) {
      console.error('Failed to get git status', e);
      set({ gitStatus: {} });
    }
  },

  refreshFileTree: async () => {
    const { rootNode } = get();
    if (!rootNode.path || rootNode.path === '/' || rootNode.path === 'No Folder Opened') return;
    try {
      // Keep track of expanded paths
      const getExpandedPaths = (node: FileNode): string[] => {
        const paths: string[] = [];
        if (node.type === 'directory' && node.isExpanded) {
          paths.push(node.path);
        }
        if (node.children) {
          for (const child of node.children) {
            paths.push(...getExpandedPaths(child));
          }
        }
        return paths;
      };
      const expandedPaths = getExpandedPaths(rootNode);

      const refreshedNode = await refreshProjectDirectory(rootNode.path);

      // Restore expanded paths
      const restoreExpanded = (node: FileNode) => {
        if (node.type === 'directory') {
          node.isExpanded = expandedPaths.includes(node.path);
        }
        if (node.children) {
          node.children.forEach(restoreExpanded);
        }
      };
      restoreExpanded(refreshedNode);

      set({ rootNode: refreshedNode });
      await get().refreshGitStatus();
    } catch (e) {
      console.error('Failed to refresh file tree', e);
    }
  },

  createFile: async (parentPath: string, name: string) => {
    const separator = parentPath.endsWith('/') ? '' : '/';
    const filePath = `${parentPath}${separator}${name}`;
    try {
      await createFile(filePath);
      await get().refreshFileTree();
    } catch (e) {
      console.error('Failed to create file', e);
    }
  },

  createFolder: async (parentPath: string, name: string) => {
    const separator = parentPath.endsWith('/') ? '' : '/';
    const dirPath = `${parentPath}${separator}${name}`;
    try {
      await createDirectory(dirPath);
      await get().refreshFileTree();
    } catch (e) {
      console.error('Failed to create directory', e);
    }
  },

  deletePath: async (path: string) => {
    try {
      await deleteFileOrDirectory(path);
      if (get().selectedPath === path) {
        set({ selectedPath: null });
      }
      await get().refreshFileTree();
    } catch (e) {
      console.error('Failed to delete path', e);
    }
  },

  renamePath: async (path: string, newName: string) => {
    const parts = path.split(/[/\\]/);
    parts.pop();
    const parentDir = parts.join('/');
    const separator = parentDir.endsWith('/') ? '' : '/';
    const newPath = `${parentDir}${separator}${newName}`;

    try {
      await renameFileOrDirectory(path, newPath);
      if (get().selectedPath === path) {
        set({ selectedPath: newPath });
      }
      await get().refreshFileTree();
    } catch (e) {
      console.error('Failed to rename path', e);
    }
  },

  setCreatingNode: (val) => {
    set({ creatingNode: val });
  },

  setRenamingPath: (val) => {
    set({ renamingPath: val });
  },

  collapseAll: () => {
    set((state) => {
      const newRoot = JSON.parse(JSON.stringify(state.rootNode));
      const collapseNode = (node: FileNode) => {
        if (node.type === 'directory') {
          node.isExpanded = false;
        }
        if (node.children) {
          node.children.forEach(collapseNode);
        }
      };
      if (newRoot.children) {
        newRoot.children.forEach(collapseNode);
      }
      return { rootNode: newRoot };
    });
  },
}));
