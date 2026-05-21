import { ollamaService } from '../services/ollamaApi';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';

// Simple debounce helper
let debounceTimeout: any = null;

export function registerInlineCompletionProvider(monaco: any) {
  const provider = {
    async provideInlineCompletions(
      model: any,
      position: any,
      context: any,
      token: any
    ) {
      const settings = useSettingsStore.getState().ai;
      const chatState = useChatStore.getState();

      // Check if inline completions are enabled and a model is connected/selected
      if (!settings.enableInlineCompletion || !chatState.isConnected || !chatState.selectedModel) {
        return { items: [] };
      }

      // Debounce to prevent slamming the Ollama endpoint on rapid keystrokes
      return new Promise<any>((resolve) => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(async () => {
          if (token.isCancellationRequested) {
            resolve({ items: [] });
            return;
          }

          try {
            // Get prefix (text before cursor) and suffix (text after cursor)
            const modelValue = model.getValue();
            const offset = model.getOffsetAt(position);
            const prefix = modelValue.substring(0, offset);
            const suffix = modelValue.substring(offset);

            // Limit sizes to fit context and keep response fast
            const limitedPrefix = prefix.slice(-2000);
            const limitedSuffix = suffix.slice(0, 1000);

            // Detect if selected model is Qwen or Qwen2.5 Coder
            const modelName = chatState.selectedModel!.toLowerCase();
            let prompt = '';

            if (modelName.includes('qwen') || modelName.includes('coder')) {
              // Qwen FIM prompt structure
              prompt = `<fim_prefix>${limitedPrefix}<fim_suffix>${limitedSuffix}<fim_middle>`;
            } else if (modelName.includes('codellama')) {
              // CodeLlama FIM prompt structure
              prompt = `< PRE> ${limitedPrefix} < SUF>${limitedSuffix} < MID>`;
            } else {
              // Standard prompt
              prompt = `Continue the following code:
${limitedPrefix}

[CURSOR IS HERE]

${limitedSuffix}

Generate ONLY the code that should be inserted at [CURSOR IS HERE]. Do not include markdown code block syntax.`;
            }

            const completion = await ollamaService.generateCompletion(
              chatState.selectedModel!,
              prompt,
              {
                stop: [
                  '\n\n',
                  '<|file_separator|>',
                  '<fim_middle>',
                  '<fim_suffix>',
                  '< EOT >',
                  '<EOT>',
                ],
                temperature: 0.0, // Low temperature for deterministic code autocompletions
                num_predict: 48,  // Keep it short and extremely snappy
              }
            );

            if (token.isCancellationRequested || !completion.trim()) {
              resolve({ items: [] });
              return;
            }

            // Create inline completion item
            const item = {
              insertText: completion,
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
            };

            resolve({ items: [item] });
          } catch (err) {
            console.error('Failed to provide inline completion:', err);
            resolve({ items: [] });
          }
        }, 350); // 350ms debounce delay
      });
    },

    freeInlineCompletions() {},
  };

  // Register for all major coding languages in Monaco
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
    monaco.languages.registerInlineCompletionsProvider(lang, provider)
  );

  // Return a cleanup function
  return () => {
    disposables.forEach((d) => d.dispose());
  };
}
