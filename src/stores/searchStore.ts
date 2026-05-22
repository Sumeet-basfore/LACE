import { create } from 'zustand';
import { FileNode } from '../types';
import { getAllFiles, readFileContent } from '../utils/fileSystem';

export interface SearchMatch {
  line: number;
  content: string;
  matchStart: number;
  matchLength: number;
}

export interface FileSearchResult {
  file: FileNode;
  matches: SearchMatch[];
}

interface SearchState {
  query: string;
  isSearching: boolean;
  results: FileSearchResult[];
  error: string | null;
  
  setQuery: (query: string) => void;
  clearResults: () => void;
  performSearch: (rootNode: FileNode | null) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  isSearching: false,
  results: [],
  error: null,

  setQuery: (query) => set({ query }),
  
  clearResults: () => set({ results: [], error: null }),

  performSearch: async (rootNode) => {
    const { query } = get();
    if (!query.trim() || !rootNode) {
      set({ results: [], isSearching: false, error: null });
      return;
    }

    set({ isSearching: true, results: [], error: null });

    try {
      const allFiles = getAllFiles(rootNode);
      const searchResults: FileSearchResult[] = [];
      const queryLower = query.toLowerCase();

      // Process in batches to avoid overwhelming Tauri IPC
      const BATCH_SIZE = 20;
      for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
        const batch = allFiles.slice(i, i + BATCH_SIZE);
        
        await Promise.all(
          batch.map(async (file) => {
            try {
              const content = await readFileContent(file.path);
              const lines = content.split('\n');
              const matches: SearchMatch[] = [];

              lines.forEach((lineText, lineIndex) => {
                const lineLower = lineText.toLowerCase();
                let startIndex = 0;
                let index;

                while ((index = lineLower.indexOf(queryLower, startIndex)) !== -1) {
                  matches.push({
                    line: lineIndex + 1,
                    content: lineText,
                    matchStart: index,
                    matchLength: query.length,
                  });
                  startIndex = index + query.length;
                }
              });

              if (matches.length > 0) {
                searchResults.push({
                  file,
                  matches: matches,
                });
              }
            } catch (err) {
              console.warn(`Could not search file ${file.path}`, err);
            }
          })
        );
      }

      set({ results: searchResults, isSearching: false });
    } catch (error) {
      set({ 
        isSearching: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      });
    }
  },
}));
