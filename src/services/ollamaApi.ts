/**
 * Ollama REST API Service
 *
 * Connects to a locally running Ollama instance for:
 * - Listing available models
 * - Streaming chat completions
 * - Checking connection health
 */

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model?: string;
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_ctx?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

class OllamaService {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  setEndpoint(url: string) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  getEndpoint(): string {
    return this.baseUrl;
  }

  /**
   * Check if Ollama is running and reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List all available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      throw error;
    }
  }

  /**
   * Get formatted model list with display info
   */
  async getModelList(): Promise<
    Array<{
      id: string;
      name: string;
      size: string;
      parameterSize: string;
      quantization: string;
      family: string;
    }>
  > {
    const models = await this.listModels();
    return models.map((m) => ({
      id: m.name,
      name: m.name,
      size: formatBytes(m.size),
      parameterSize: m.details?.parameter_size || 'Unknown',
      quantization: m.details?.quantization_level || 'Unknown',
      family: m.details?.family || 'Unknown',
    }));
  }

  /**
   * Stream a chat completion from Ollama
   */
  async *streamChat(
    request: OllamaChatRequest
  ): AsyncGenerator<string, void, unknown> {
    // Cancel any ongoing request
    this.cancelStream();

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, stream: true }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk: OllamaChatResponse = JSON.parse(line);
            if (chunk.message?.content) {
              yield chunk.message.content;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const chunk: OllamaChatResponse = JSON.parse(buffer);
          if (chunk.message?.content) {
            yield chunk.message.content;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Stream was cancelled, don't throw
        return;
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Non-streaming chat (for simple requests)
   */
  async chat(request: OllamaChatRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error (${response.status}): ${errorText}`);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message.content;
  }

  /**
   * Generate text completion using Ollama's /api/generate endpoint (optimized for FIM/autocomplete)
   */
  async generateCompletion(
    model: string,
    prompt: string,
    options?: {
      stop?: string[];
      temperature?: number;
      num_predict?: number;
    }
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 64,
            stop: ['\n\n', '<|file_separator|>', '<fim_middle>', '<fim_suffix>'],
            ...(options || {}),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }

  /**
   * Cancel ongoing stream
   */
  cancelStream() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Singleton instance
export const ollamaService = new OllamaService();
