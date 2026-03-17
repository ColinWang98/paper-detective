import type { Highlight } from '@/types';
import type { AIAnalysis, AIErrorCode } from '@/types/ai.types';

import { getAPIKey, hasAPIKey } from './apiKeyManager';
import { BIGMODEL_API_URL, DEFAULT_AI_MODEL } from './aiProvider';
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
}

interface StructuredDataOptions {
  prompt: string;
  maxTokens: number;
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
    const response = await this.requestChatCompletion({
      prompt: options.prompt,
      maxTokens: options.maxTokens,
      stream: false,
    });

    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    const rawJson = jsonMatch?.[1] ?? jsonMatch?.[0];

    if (!rawJson) {
      throw new AIError('PARSE_ERROR', 'Structured AI response did not contain valid JSON');
    }

    return JSON.parse(rawJson) as T;
  }

  private async requestChatCompletion(options: ChatCompletionOptions): Promise<string> {
    const { prompt, maxTokens, onProgress, stream = Boolean(onProgress) } = options;
    const apiKey = getAPIKey();

    if (!apiKey) {
      throw new AIError('API_KEY_MISSING', '请先在设置中配置API Key');
    }

    const response = await fetch(BIGMODEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_AI_MODEL,
        max_tokens: maxTokens,
        temperature: 0.2,
        stream,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

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
      return await response.json();
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

    if (candidate.status === 401) {
      return new AIError('INVALID_API_KEY', 'API Key无效，请检查设置');
    }
    if (candidate.status === 429) {
      return new AIError('RATE_LIMIT', '请求过于频繁，请稍后再试');
    }
    if (candidate.status === 400) {
      return new AIError('INVALID_REQUEST', '请求参数无效');
    }
    if (candidate.name === 'NetworkError' || candidate.message?.toLowerCase().includes('network')) {
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
    const { paperId, pdfText, highlights, onProgress } = options;
    const cacheKey = `clip-summary-${paperId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.isConfigured()) {
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
    const { paperId, pdfText, highlights, onProgress } = options;
    const cacheKey = `structured-info-${paperId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.isConfigured()) {
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
