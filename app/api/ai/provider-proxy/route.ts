import { NextRequest, NextResponse } from 'next/server';

import type { AIProvider } from '@/services/aiProvider';
import { getProviderConfig } from '@/services/aiProvider';

interface ProviderProxyRequestBody {
  provider: AIProvider;
  apiKey: string;
  model: string;
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

function parseBody(body: unknown): ProviderProxyRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be an object');
  }

  const payload = body as Record<string, unknown>;

  if (payload.provider !== 'openrouter' && payload.provider !== 'deepseek') {
    throw new Error('provider is required');
  }

  if (typeof payload.apiKey !== 'string' || !payload.apiKey.trim()) {
    throw new Error('apiKey is required');
  }

  if (typeof payload.model !== 'string' || !payload.model.trim()) {
    throw new Error('model is required');
  }

  if (typeof payload.max_tokens !== 'number' || Number.isNaN(payload.max_tokens)) {
    throw new Error('max_tokens must be a number');
  }

  if (!Array.isArray(payload.messages)) {
    throw new Error('messages must be an array');
  }

  return {
    provider: payload.provider,
    apiKey: payload.apiKey,
    model: payload.model,
    max_tokens: payload.max_tokens,
    temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.2,
    stream: Boolean(payload.stream),
    messages: payload.messages as ProviderProxyRequestBody['messages'],
  };
}

function mapErrorToResponse(error: unknown): NextResponse {
  const candidate = error as Error & { status?: number };
  const message = candidate.message || 'Unknown error occurred';

  if (
    message.includes('Request body must be an object') ||
    message.includes('provider is required') ||
    message.includes('apiKey is required') ||
    message.includes('model is required') ||
    message.includes('max_tokens must be a number') ||
    message.includes('messages must be an array')
  ) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message } },
      { status: 400 }
    );
  }

  if (candidate.status === 401) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_API_KEY', message } },
      { status: 401 }
    );
  }

  if (candidate.status === 429) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT', message } },
      { status: 429 }
    );
  }

  if (candidate.name === 'NetworkError') {
    return NextResponse.json(
      { success: false, error: { code: 'NETWORK_ERROR', message } },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message } },
    { status: 500 }
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = parseBody(await request.json());

    if (body.provider !== 'openrouter' && body.provider !== 'deepseek') {
      return NextResponse.json(
        { success: false, error: { code: 'UNSUPPORTED_PROVIDER', message: 'Only OpenRouter and DeepSeek are proxied' } },
        { status: 400 }
      );
    }

    const config = getProviderConfig(body.provider);

    let upstream: Response;
    try {
      upstream = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${body.apiKey}`,
          ...(body.provider === 'openrouter'
            ? {
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Paper Detective',
              }
            : {}),
        },
        body: JSON.stringify({
          model: body.model,
          max_tokens: body.max_tokens,
          temperature: body.temperature ?? 0.2,
          stream: body.stream ?? false,
          messages: body.messages,
        }),
      });
    } catch (error: unknown) {
      const networkError = new Error(error instanceof Error ? error.message : 'fetch failed');
      networkError.name = 'NetworkError';
      throw networkError;
    }

    if (!upstream.ok) {
      let message = `Request failed with status ${upstream.status}`;

      try {
        const payload = await upstream.json();
        const maybeMessage = payload?.error?.message ?? payload?.message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
          message = maybeMessage;
        }
      } catch {
        // Ignore parse failures and keep status-based message.
      }

      const error = new Error(message);
      (error as Error & { status?: number }).status = upstream.status;
      throw error;
    }

    if (body.stream) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const payload = await upstream.text();
    return new Response(payload, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
