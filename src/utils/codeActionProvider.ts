import { useEditorStore } from '../stores/editorStore';

export function registerCodeActionProvider(monaco: any) {
  const provider = {
    provideCodeActions: (model: any, range: any, context: any, token: any) => {
      const markers = context.markers;
      if (!markers || markers.length === 0) {
        return { actions: [], dispose: () => {} };
      }

      // Get current active file path for the prompt
      const editorState = useEditorStore.getState();
      const activeTab = editorState.tabs.find((t) => t.id === editorState.activeTabId);
      const filePath = activeTab ? activeTab.filePath : 'current_file';

      const actions = markers.map((marker: any) => {
        // Get surrounding context (e.g. 5 lines before and after)
        const startLine = Math.max(1, marker.startLineNumber - 5);
        const endLine = Math.min(model.getLineCount(), marker.endLineNumber + 5);
        const contextCode = model.getValueInRange(
          new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))
        );

        const prompt = `I am getting an error in \`${filePath}\`:\n\n**Error:**\n\`${marker.message}\`\n\n**Surrounding Code:**\n\`\`\`${activeTab?.language || 'typescript'}\n${contextCode}\n\`\`\`\n\nPlease analyze this error and provide the complete fixed file content using the \`edit:${filePath}\` syntax.`;

        return {
          title: `✨ Fix with AI: ${marker.message.split('\n')[0]}`,
          diagnostics: [marker],
          kind: 'quickfix',
          isPreferred: true,
          command: {
            id: 'local-ai.fixError',
            title: 'Fix with AI',
            arguments: [prompt]
          }
        };
      });

      return {
        actions,
        dispose: () => {}
      };
    }
  };

  const languages = [
    'typescript',
    'javascript',
    'python',
    'html',
    'css',
    'json',
    'rust',
    'go',
    'cpp',
    'csharp',
    'java',
    'markdown',
  ];

  const disposables = languages.map((lang) =>
    monaco.languages.registerCodeActionProvider(lang, provider)
  );

  return () => {
    disposables.forEach((d) => d.dispose());
  };
}
