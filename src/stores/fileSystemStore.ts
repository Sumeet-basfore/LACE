import { create } from 'zustand';
import { FileNode } from '../types';
import { getMockFileSystem, findFileByPath } from '../utils/fileSystem';

interface FileSystemState {
  rootNode: FileNode;
  selectedPath: string | null;

  // Actions
  initialize: () => void;
  toggleDirectory: (path: string) => void;
  selectFile: (path: string) => void;
  getFileContent: (path: string) => string | undefined;
  updateFileContent: (path: string, content: string) => void;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  rootNode: {
    id: 'root',
    name: 'root',
    path: '/',
    type: 'directory',
    children: [],
  },
  selectedPath: null,

  initialize: () => {
    set({ rootNode: getMockFileSystem() });
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

  getFileContent: (path: string) => {
    const node = findFileByPath(get().rootNode, path);
    return node?.content;
  },

  updateFileContent: (path: string, content: string) => {
    set((state) => {
      const newRoot = JSON.parse(JSON.stringify(state.rootNode));
      const node = findFileByPath(newRoot, path);
      if (node) {
        node.content = content;
      }
      return { rootNode: newRoot };
    });
  },
}));
