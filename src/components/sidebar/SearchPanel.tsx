import React, { useState } from 'react';
import { Search, ChevronRight, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { useSearchStore } from '../../stores/searchStore';
import { useFileSystemStore } from '../../stores/fileSystemStore';
import { useEditorStore } from '../../stores/editorStore';
import { readFileContent } from '../../utils/fileSystem';

export const SearchPanel: React.FC = () => {
  const { query, isSearching, results, error, setQuery, performSearch } = useSearchStore();
  const { rootNode } = useFileSystemStore();
  const { openFile } = useEditorStore();

  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (rootNode) {
      performSearch(rootNode);
    }
  };

  const toggleFile = (filePath: string) => {
    const newSet = new Set(expandedFiles);
    if (newSet.has(filePath)) {
      newSet.delete(filePath);
    } else {
      newSet.add(filePath);
    }
    setExpandedFiles(newSet);
  };

  const handleResultClick = async (filePath: string, fileName: string, line: number) => {
    try {
      const content = await readFileContent(filePath);
      openFile(filePath, fileName, content);
      
      // TODO: In the future, we can add logic to MonacoEditor to jump to the specific line
      // For now, this just opens the file.
    } catch (err) {
      console.error('Failed to open file from search:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      <div className="p-4 flex-shrink-0">
        <h3 className="text-[11px] font-semibold text-editor-subtext uppercase tracking-wider mb-3">
          Search
        </h3>
        
        <form onSubmit={handleSearch} className="flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in files..."
              className="w-full px-3 py-1.5 pl-8 bg-editor-surface border border-editor-border rounded-md text-sm text-editor-text placeholder-editor-muted outline-none focus:border-editor-accent/50 transition-colors"
              autoFocus
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-editor-muted" />
          </div>
          <button 
            type="submit"
            disabled={!query.trim() || isSearching || !rootNode}
            className="w-full py-1.5 bg-editor-surface hover:bg-editor-hover border border-editor-border rounded-md text-sm text-editor-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {!rootNode && (
          <p className="text-xs text-editor-warning mt-4 text-center">
            Open a folder to enable search
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-400 mt-4 text-center">
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {results.map((result) => {
          const isExpanded = !expandedFiles.has(result.file.path);
          return (
            <div key={result.file.path} className="mb-2">
              <div 
                className="flex items-center gap-1.5 py-1 px-2 hover:bg-editor-hover rounded cursor-pointer group"
                onClick={() => toggleFile(result.file.path)}
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-editor-muted flex-shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-editor-muted flex-shrink-0" />
                )}
                <FileText size={14} className="text-editor-accent flex-shrink-0" />
                <span className="text-sm text-editor-text truncate">
                  {result.file.name}
                </span>
                <span className="text-xs text-editor-muted ml-auto bg-editor-surface px-1.5 rounded-full group-hover:bg-editor-border">
                  {result.matches.length}
                </span>
              </div>
              
              {isExpanded && (
                <div className="ml-6 flex flex-col gap-0.5 mt-0.5">
                  {result.matches.map((match, i) => (
                    <div 
                      key={`${result.file.path}-${match.line}-${i}`}
                      className="group flex flex-col px-2 py-1 hover:bg-editor-hover rounded cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result.file.path, result.file.name, match.line)}
                    >
                      <div className="flex gap-2">
                        <span className="text-xs text-editor-muted flex-shrink-0 select-none w-6 text-right">
                          {match.line}
                        </span>
                        <div className="text-xs text-editor-text truncate font-mono">
                          {match.content.substring(0, Math.max(0, match.matchStart))}
                          <span className="bg-editor-accent/30 text-editor-accent font-medium rounded-sm px-0.5">
                            {match.content.substring(match.matchStart, match.matchStart + match.matchLength)}
                          </span>
                          {match.content.substring(match.matchStart + match.matchLength)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {results.length === 0 && !isSearching && query.trim() && rootNode && !error && (
          <p className="text-xs text-editor-muted mt-4 text-center">
            No results found
          </p>
        )}
      </div>
    </div>
  );
};
