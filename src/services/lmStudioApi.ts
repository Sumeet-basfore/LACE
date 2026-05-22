/**
 * LM Studio REST API Service
 * 
 * Connects to a locally running LM Studio instance (OpenAI-compatible server) for:
 * - Listing loaded local models
 * - Checking connection health
 * - Streaming chat completions (SSE format)
 */

export interface LMStudioModel {
  id: string;
  object: 'model';
  owned_by: string;
}

export interface LMStudioChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LMStudioChatRequest {
  model: string;
  messages: LMStudioChatMessage[];
  options?: {
    temperature?: number;
    num_ctx?: number;
  };
}

class LMStudioService {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = 'http://localhost:1234') {
    // Strip trailing slash/v1 if exists
    this.baseUrl = baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '');
  }

  setEndpoint(url: string) {
    this.baseUrl = url.replace(/\/v1\/?$/, '').replace(/\/$/, '');
  }

  getEndpoint(): string {
    return this.baseUrl;
  }

  private get v1Url() {
    return `${this.baseUrl}/v1`;
  }

  /**
   * Check if LM Studio server is running and reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.v1Url}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List loaded models from LM Studio
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
    try {
      const response = await fetch(`${this.v1Url}/models`);
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      const data = await response.json();
      const models: LMStudioModel[] = data.data || [];
      return models.map((m) => ({
        id: m.id,
        name: m.id,
        size: 'Loaded',
        parameterSize: 'Unknown',
        quantization: 'Unknown',
        family: 'Unknown',
      }));
    } catch (error) {
      console.error('Error listing LM Studio models:', error);
      return [];
    }
  }

  /**
   * Cancel any ongoing chat stream
   */
  cancelStream() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Stream a chat completion from LM Studio (OpenAI-compatible)
   */
  async *streamChat(
    request: LMStudioChatRequest
  ): AsyncGenerator<string, void, unknown> {
    this.cancelStream();
    this.abortController = new AbortController();

    try {
      const payload: any = {
        model: request.model,
        messages: request.messages,
        temperature: request.options?.temperature ?? 0.7,
        stream: true,
      };

      const response = await fetch(`${this.v1Url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep trailing incomplete line in buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          // SSE protocol terminates stream with data: [DONE]
          if (cleanLine === 'data: [DONE]') {
            return;
          }

          if (cleanLine.startsWith('data: ')) {
            try {
              const dataStr = cleanLine.substring(6);
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (err) {
              // Ignore parse errors from partial buffers
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error streaming from LM Studio:', error);
      throw error;
    }
  }
}

export const lmStudioService = new LMStudioService();
