import type { Highlight } from '@/types';
import type { AIAnalysis, AIErrorCode } from '@/types/ai.types';

import { getAPIKey, getActiveProviderConfig, getProviderForApiKey, hasAPIKey } from './apiKeyManager';
import { DEFAULT_AI_MODEL, getProviderConfig } from './aiProvider';
import { cacheService } from './cacheService';
import { estimateTokens, calculateCost } from './costTracker';

export interface AnalyzePaperOptions {
  paperId: number;
  pdfText: string;
  highlights: Highlight[];
  onProgress?: (chunk: string) => void;
}

export interface AnalysisResult extends AIAnalysis {
  paperId: number;
}

interface ChatCompletionOptions {
  prompt: string;
  maxTokens: number;
  onProgress?: (chunk: string) => void;
  stream?: boolean;
  apiKey?: string;
  model?: string;
}

interface StructuredDataOptions {
  prompt: string;
  maxTokens: number;
  apiKey?: string;
  model?: string;
}

class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIService {
  isConfigured(): boolean {
    return hasAPIKey();
  }

  getClient(): {
    messages: {
      create: (options: any) => Promise<any>;
    };
  } {
    return {
      messages: {
        create: async (options) => {
          const prompt = options.messages[0]?.content || '';

          if (options.stream) {
            const fullText = await this.requestChatCompletion({
              prompt,
              maxTokens: options.max_tokens,
              stream: false,
            });

            return {
              async *[Symbol.asyncIterator]() {
                yield {
                  type: 'content_block_delta',
                  delta: {
                    type: 'text_delta',
                    text: fullText,
                  },
                };
              },
            };
          }

          const text = await this.requestChatCompletion({
            prompt,
            maxTokens: options.max_tokens,
            stream: false,
          });

          return {
            content: [{ text }],
          };
        },
      },
    };
  }

  async analyzePaper(options: AnalyzePaperOptions): Promise<AnalysisResult> {
    const { paperId, pdfText, highlights, onProgress } = options;

    const cached = await cacheService.getAnalysis(paperId);
    if (cached) {
      return cached as AnalysisResult;
    }

    if (!this.isConfigured()) {
      throw new AIError('API_KEY_MISSING', '请先在设置中配置API Key');
    }

    try {
      const tokenEstimate = estimateTokens(pdfText, highlights.length);
      const estimatedCost = calculateCost(DEFAULT_AI_MODEL, tokenEstimate);
      const prompt = this.buildAnalysisPrompt(pdfText, highlights);
      const startTime = performance.now();
      const fullResponse = await this.requestChatCompletion({
        prompt,
        maxTokens: 3000,
        onProgress,
        stream: true,
      });
      const duration = performance.now() - startTime;

      const result = this.parseAnalysisResponse(fullResponse);
      const actualOutputTokens = Math.ceil(fullResponse.length / 4);

      result.paperId = paperId;
      result.tokenUsage = {
        input: tokenEstimate.input,
        output: actualOutputTokens,
        total: tokenEstimate.input + actualOutputTokens,
      };
      result.estimatedCost = estimatedCost;
      result.createdAt = new Date().toISOString();
      result.model = DEFAULT_AI_MODEL;

      if (duration > 10000) {
        console.warn(`AI analysis took ${duration.toFixed(0)}ms (threshold: 10000ms)`);
      }

      await cacheService.saveAnalysis(paperId, result);

      return result;
    } catch (error: unknown) {
      throw this.handleAIError(error);
    }
  }

  async generateText(options: ChatCompletionOptions): Promise<string> {
    return this.requestChatCompletion(options);
  }

  async generateStructuredData<T>(options: StructuredDataOptions): Promise<T> {
    try {
      const response = await this.requestChatCompletion({
        prompt: options.prompt,
        maxTokens: options.maxTokens,
        stream: false,
        apiKey: options.apiKey,
        model: options.model,
      });
      const rawJson = this.extractJsonObject(response);

      if (!rawJson) {
        return await this.recoverStructuredData<T>(response, options);
      }

      return JSON.parse(rawJson) as T;
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        throw new AIError('PARSE_ERROR', 'Structured AI response did not contain valid JSON');
      }
      if (error instanceof AIError) {
        throw error;
      }

      throw this.handleAIError(error);
    }
  }

  private async recoverStructuredData<T>(
    originalResponse: string,
    options: StructuredDataOptions
  ): Promise<T> {
    try {
      return await this.repairStructuredData<T>(originalResponse, options);
    } catch (error: unknown) {
      const candidate = error as Error & { code?: string };
      if (candidate.code !== 'PARSE_ERROR') {
        throw error;
      }
    }

    const strictRetryPrompt = [
      'Your previous reply was not valid JSON.',
      'Retry the original task and return exactly one strict JSON object.',
      'Do not use markdown fences.',
      'Do not add any explanation before or after the JSON.',
      'Use only double-quoted JSON keys and values where applicable.',
      'Original task:',
      options.prompt,
    ].join('\n\n');

    const strictRetryResponse = await this.requestChatCompletion({
      prompt: strictRetryPrompt,
      maxTokens: options.maxTokens,
      stream: false,
      apiKey: options.apiKey,
      model: options.model,
    });

    const strictRetryJson = this.extractJsonObject(strictRetryResponse);
    if (!strictRetryJson) {
      throw new AIError('PARSE_ERROR', 'Structured AI response did not contain valid JSON');
    }

    return JSON.parse(strictRetryJson) as T;
  }

  private async repairStructuredData<T>(
    originalResponse: string,
    options: StructuredDataOptions
  ): Promise<T> {
    const repairPrompt = [
      'Convert the following model output into one strict JSON object.',
      'Return JSON only.',
      'Do not use markdown fences.',
      'Do not add commentary.',
      'Preserve the original meaning and fields when possible.',
      'If some values are uncertain, keep them concise instead of inventing new facts.',
      'Model output to repair:',
      originalResponse,
    ].join('\n\n');

    const repairedResponse = await this.requestChatCompletion({
      prompt: repairPrompt,
      maxTokens: Math.min(options.maxTokens, 1200),
      stream: false,
      apiKey: options.apiKey,
      model: options.model,
    });
    const repairedJson = this.extractJsonObject(repairedResponse);

    if (!repairedJson) {
      throw new AIError('PARSE_ERROR', 'Structured AI response did not contain valid JSON');
    }

    return JSON.parse(repairedJson) as T;
  }

  private extractJsonObject(response: string): string | null {
    const trimmed = response.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidates = [
      fencedMatch?.[1],
      this.findBalancedJsonObject(trimmed),
      trimmed,
    ].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);

    for (const candidate of candidates) {
      const normalized = this.normalizeJsonCandidate(candidate);

      try {
        JSON.parse(normalized);
        return normalized;
      } catch {
        continue;
      }
    }

    return null;
  }

  private normalizeJsonCandidate(candidate: string): string {
    return candidate
      .trim()
      .replace(/^\uFEFF/, '')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .replace(/,\s*([}\]])/g, '$1');
  }

  private findBalancedJsonObject(input: string): string | null {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = 0; index < input.length; index += 1) {
      const character = input[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === '\\') {
        escaped = true;
        continue;
      }

      if (character === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (character === '{') {
        if (depth === 0) {
          start = index;
        }
        depth += 1;
      } else if (character === '}') {
        if (depth > 0) {
          depth -= 1;
          if (depth === 0 && start >= 0) {
            return input.slice(start, index + 1);
          }
        }
      }
    }

    return null;
  }

  private async requestChatCompletion(options: ChatCompletionOptions): Promise<string> {
    const { prompt, maxTokens, onProgress, stream = Boolean(onProgress) } = options;
    const apiKey = options.apiKey ?? getAPIKey();
    const provider = apiKey ? getProviderForApiKey(apiKey) : 'bigmodel';
    const providerConfig = getProviderConfig(provider);
    const activeProviderConfig = typeof window !== 'undefined' ? getActiveProviderConfig() : null;
    const requestModel =
      options.model ??
      (activeProviderConfig?.id === provider ? activeProviderConfig.model : null) ??
      providerConfig.model;

    if (!apiKey) {
      throw new AIError('API_KEY_MISSING', '请先在设置中配置API Key');
    }

    let response: Response;
    const requestBody = {
      model: requestModel,
      max_tokens: maxTokens,
      temperature: 0.2,
      stream,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    try {
      if ((provider === 'openrouter' || provider === 'deepseek') && typeof window !== 'undefined') {
        response = await fetch('/api/ai/provider-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            apiKey,
            ...requestBody,
          }),
        });
      } else {
        response = await fetch(providerConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
      }
    } catch (error: unknown) {
      const networkError = new Error(error instanceof Error ? error.message : 'fetch failed');
      networkError.name = 'NetworkError';
      throw networkError;
    }

    if (!response.ok) {
      const errorBody = await this.safeReadErrorBody(response);
      const message = typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed with status ${response.status}`;
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    if (stream && response.body) {
      return this.readStreamedCompletion(response, onProgress);
    }

    const payload = await response.json();
    return this.extractContentFromPayload(payload);
  }

  private async safeReadErrorBody(response: Response): Promise<Record<string, unknown>> {
    try {
      const payload = await response.json();
      const nestedMessage = payload?.error?.message;

      if (
        typeof nestedMessage === 'string' &&
        typeof payload?.message !== 'string'
      ) {
        return {
          ...payload,
          message: nestedMessage,
        };
      }

      return payload;
    } catch {
      return {};
    }
  }

  private async readStreamedCompletion(
    response: Response,
    onProgress?: (chunk: string) => void
  ): Promise<string> {
    if (!response.body) {
      const payload = await response.json();
      return this.extractContentFromPayload(payload);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        for (const line of event.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) {
            continue;
          }

          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') {
            continue;
          }

          try {
            const payload = JSON.parse(data);
            const chunk = this.extractContentFromPayload(payload, true);
            if (chunk) {
              fullResponse += chunk;
              onProgress?.(chunk);
            }
          } catch {
            continue;
          }
        }
      }
    }

    if (!fullResponse.trim()) {
      const payload = await response.clone().json().catch(() => null);
      if (payload) {
        return this.extractContentFromPayload(payload);
      }
    }

    return fullResponse;
  }

  private extractContentFromPayload(payload: any, preferDelta = false): string {
    const choices = Array.isArray(payload?.choices) ? payload.choices : [];
    const firstChoice = choices[0];

    if (preferDelta) {
      const deltaContent = firstChoice?.delta?.content;
      if (typeof deltaContent === 'string') {
        return deltaContent;
      }
      if (Array.isArray(deltaContent)) {
        return deltaContent
          .map((item: any) => (typeof item?.text === 'string' ? item.text : ''))
          .join('');
      }
    }

    const messageContent = firstChoice?.message?.content;
    if (typeof messageContent === 'string') {
      return messageContent;
    }
    if (Array.isArray(messageContent)) {
      return messageContent
        .map((item: any) => (typeof item?.text === 'string' ? item.text : ''))
        .join('');
    }

    return '';
  }

  private buildAnalysisPrompt(pdfText: string, highlights: Highlight[]): string {
    const maxLength = 15000;
    const truncatedText = pdfText.length > maxLength
      ? `${pdfText.substring(0, maxLength)}\n\n[文本已截断..]`
      : pdfText;

    return `你是一位经验丰富的研究助手。请仔细阅读以下论文，并按指定 JSON 格式输出分析结果。

论文全文:
"""
${truncatedText}
"""

用户标记的重要证据:
${highlights.map((highlight) => `- [${highlight.priority}] ${highlight.text}`).join('\n')}

请输出:
{
  "summary": "3-5句总结论文核心贡献",
  "researchQuestion": "论文试图解决的研究问题",
  "methods": ["方法1", "方法2"],
  "findings": ["发现1", "发现2"],
  "limitations": ["限制1", "限制2"]
}

只输出 JSON，不要附加解释。`;
  }

  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AIError('PARSE_ERROR', 'AI响应格式无效');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        paperId: 0,
        summary: parsed.summary || '',
        researchQuestion: parsed.researchQuestion || '',
        methods: parsed.methods || [],
        findings: parsed.findings || [],
        limitations: parsed.limitations || [],
        tokenUsage: { input: 0, output: 0, total: 0 },
        estimatedCost: 0,
        createdAt: new Date().toISOString(),
        model: DEFAULT_AI_MODEL,
      };
    } catch {
      return {
        paperId: 0,
        summary: response,
        researchQuestion: '',
        methods: [],
        findings: [],
        limitations: [],
        tokenUsage: { input: 0, output: 0, total: 0 },
        estimatedCost: 0,
        createdAt: new Date().toISOString(),
        model: DEFAULT_AI_MODEL,
      };
    }
  }

  private handleAIError(error: unknown): AIError {
    const candidate = error as Error & { status?: number };
    const normalizedMessage = candidate.message?.toLowerCase() ?? '';

    if (candidate.status === 401) {
      return new AIError('INVALID_API_KEY', 'API Key无效，请检查设置');
    }
    if (candidate.status === 429) {
      return new AIError('RATE_LIMIT', '请求过于频繁，请稍后再试');
    }
    if (candidate.status === 400) {
      return new AIError('INVALID_REQUEST', '请求参数无效');
    }
    if (
      candidate.name === 'NetworkError' ||
      normalizedMessage.includes('network') ||
      normalizedMessage.includes('fetch failed') ||
      normalizedMessage.includes('failed to fetch')
    ) {
      return new AIError('NETWORK_ERROR', '网络连接失败，请检查网络');
    }
    if (candidate instanceof AIError) {
      return candidate;
    }

    return new AIError('UNKNOWN_ERROR', candidate.message || '未知错误');
  }

  async generateClipSummary(options: {
    paperId: number;
    pdfText: string;
    highlights: Highlight[];
    apiKey?: string;
    model?: string;
    onProgress?: (chunk: string) => void;
  }): Promise<{
    summary: string[];
    confidence: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
  }> {
    const { paperId, pdfText, highlights, apiKey, model, onProgress } = options;
    const cacheKey = `clip-summary-${paperId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!apiKey && !this.isConfigured()) {
      throw new AIError('API_KEY_MISSING', '请先在设置中配置API Key');
    }

    try {
      const maxLength = 3000;
      const truncatedText = pdfText.length > maxLength
        ? `${pdfText.substring(0, maxLength)}\n\n[文本已截断..]`
        : pdfText;
      const priorityOrder = { critical: 3, important: 2, interesting: 1, archived: 0 };
      const topHighlights = highlights
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        .slice(0, 5);

      const prompt = `请为以下论文生成 3 句话摘要，输出 JSON：
{
  "summary": ["第1句", "第2句", "第3句"],
  "confidence": 0.95
}

论文内容:
"""
${truncatedText}
"""

高亮:
${topHighlights.map((highlight) => `- [${highlight.priority}] ${highlight.text}`).join('\n')}
`;

      const startTime = performance.now();
      const fullResponse = await this.requestChatCompletion({
        prompt,
        maxTokens: 500,
        apiKey,
        model,
        onProgress,
        stream: true,
      });
      const duration = performance.now() - startTime;
      const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
        fullResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new AIError('PARSE_ERROR', 'AI响应格式无效，无法提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (!parsed.summary || !Array.isArray(parsed.summary) || parsed.summary.length !== 3) {
        throw new AIError('PARSE_ERROR', '摘要必须包含恰好3句话');
      }

      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(fullResponse.length / 4);
      const totalTokens = inputTokens + outputTokens;
      const cost = calculateCost(DEFAULT_AI_MODEL, {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      });

      if (duration > 5000) {
        console.warn(`Clip summary generation took ${duration.toFixed(0)}ms (threshold: 5000ms)`);
      }

      const result = {
        summary: parsed.summary,
        confidence: Math.round((parsed.confidence || 0.85) * 100),
        tokenUsage: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
        cost: parseFloat(cost.toFixed(4)),
      };

      await cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000);
      return result;
    } catch (error: unknown) {
      throw this.handleAIError(error);
    }
  }

  async extractStructuredInfo(options: {
    paperId: number;
    pdfText: string;
    highlights: Highlight[];
    apiKey?: string;
    model?: string;
    onProgress?: (chunk: string) => void;
  }): Promise<{
    researchQuestion: string;
    methodology: string[];
    findings: string[];
    conclusions: string;
    confidence: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
  }> {
    const { paperId, pdfText, highlights, apiKey, model, onProgress } = options;
    const cacheKey = `structured-info-${paperId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!apiKey && !this.isConfigured()) {
      throw new AIError('API_KEY_MISSING', '请先在设置中配置API Key');
    }

    try {
      const maxLength = 5000;
      const truncatedText = pdfText.length > maxLength
        ? `${pdfText.substring(0, maxLength)}\n\n[文本已截断..]`
        : pdfText;
      const priorityOrder = { critical: 3, important: 2, interesting: 1, archived: 0 };
      const topHighlights = highlights
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        .slice(0, 10);

      const prompt = `请提取以下论文的结构化信息，并输出 JSON：
{
  "researchQuestion": "研究问题",
  "methodology": ["方法1", "方法2"],
  "findings": ["发现1", "发现2"],
  "conclusions": "结论",
  "confidence": 0.92
}

论文内容:
"""
${truncatedText}
"""

高亮:
${topHighlights.map((highlight) => `- [${highlight.priority}] ${highlight.text}`).join('\n')}
`;

      const startTime = performance.now();
      const fullResponse = await this.requestChatCompletion({
        prompt,
        maxTokens: 2000,
        apiKey,
        model,
        onProgress,
        stream: true,
      });
      const duration = performance.now() - startTime;
      const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
        fullResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new AIError('PARSE_ERROR', 'AI响应格式无效，无法提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (!parsed.researchQuestion || !parsed.methodology || !parsed.findings || !parsed.conclusions) {
        throw new AIError('PARSE_ERROR', '结构化信息不完整');
      }

      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(fullResponse.length / 4);
      const totalTokens = inputTokens + outputTokens;
      const cost = calculateCost(DEFAULT_AI_MODEL, {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      });

      if (duration > 10000) {
        console.warn(`Structured extraction took ${duration.toFixed(0)}ms (threshold: 10000ms)`);
      }

      const result = {
        researchQuestion: parsed.researchQuestion,
        methodology: parsed.methodology || [],
        findings: parsed.findings || [],
        conclusions: parsed.conclusions,
        confidence: Math.round((parsed.confidence || 0.85) * 100),
        tokenUsage: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
        cost: parseFloat(cost.toFixed(4)),
      };

      await cacheService.set(cacheKey, result, 7 * 24 * 60 * 60 * 1000);
      return result;
    } catch (error: unknown) {
      throw this.handleAIError(error);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, message: '请先配置API Key' };
      }

      await this.requestChatCompletion({
        prompt: 'Hi',
        maxTokens: 10,
        stream: false,
      });

      return { success: true, message: '连接成功' };
    } catch (error: unknown) {
      const aiError = this.handleAIError(error);
      return { success: false, message: aiError.message };
    }
  }
}

export const aiService = new AIService();
