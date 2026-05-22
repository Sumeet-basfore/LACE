import { FileNode } from '../types';
import { detectLanguage } from './languageDetect';
import { readDir, readTextFile, writeTextFile, mkdir, remove, rename } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';

// Generate a unique ID
let idCounter = 0;
function generateId(): string {
  return `file-${++idCounter}-${Date.now()}`;
}

export async function openProjectDirectory(): Promise<FileNode | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    recursive: true,
    title: 'Open Project Folder',
  });

  if (!selected) {
    return null;
  }

  const pathStr = Array.isArray(selected) ? selected[0] : selected;
  const name = pathStr.split(/[/\\]/).pop() || 'Project';

  const rootNode = await buildFileTree(pathStr, name);
  return rootNode;
}

async function buildFileTree(dirPath: string, dirName: string): Promise<FileNode> {
  const root: FileNode = {
    id: generateId(),
    name: dirName,
    path: dirPath,
    type: 'directory',
    children: [],
    isExpanded: true,
  };

  try {
    const entries = await readDir(dirPath);

    for (const entry of entries) {
      // Skip common hidden/build dirs to avoid massive trees
      if (['.git', 'node_modules', 'dist', 'target'].includes(entry.name)) {
        continue;
      }

      const fullPath = `${dirPath}/${entry.name}`;

      if (entry.isDirectory) {
        // Recursively build children
        const childDir = await buildFileTree(fullPath, entry.name);
        childDir.isExpanded = false; // Collapse by default
        root.children!.push(childDir);
      } else {
        root.children!.push({
          id: generateId(),
          name: entry.name,
          path: fullPath,
          type: 'file',
          language: detectLanguage(entry.name),
        });
      }
    }

    // Sort: directories first, then files, alphabetically
    root.children!.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return root;
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await readTextFile(filePath);
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

export async function writeFileContent(filePath: string, content: string): Promise<void> {
  try {
    await writeTextFile(filePath, content);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
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

export async function createFile(filePath: string): Promise<void> {
  try {
    await writeTextFile(filePath, '');
  } catch (error) {
    console.error(`Error creating file ${filePath}:`, error);
    throw error;
  }
}

export async function createDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

export async function deleteFileOrDirectory(targetPath: string): Promise<void> {
  try {
    await remove(targetPath, { recursive: true });
  } catch (error) {
    console.error(`Error deleting path ${targetPath}:`, error);
    throw error;
  }
}

export async function renameFileOrDirectory(oldPath: string, newPath: string): Promise<void> {
  try {
    await rename(oldPath, newPath);
  } catch (error) {
    console.error(`Error renaming path from ${oldPath} to ${newPath}:`, error);
    throw error;
  }
}

export async function refreshProjectDirectory(pathStr: string): Promise<FileNode> {
  const name = pathStr.split(/[/\\]/).pop() || 'Project';
  return await buildFileTree(pathStr, name);
}
