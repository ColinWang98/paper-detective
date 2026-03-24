import { POST } from '@/app/api/ai/provider-proxy/route';
import { NextRequest } from '@/tests/__mocks__/next';

function makeRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init) as unknown as Parameters<typeof POST>[0];
}

class MockResponse {
  public status: number;
  public ok: boolean;
  public headers: Headers;
  public body: null;

  constructor(
    private readonly payload: string,
    init: { status?: number; headers?: Record<string, string> } = {}
  ) {
    this.status = init.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(init.headers);
    this.body = null;
  }

  async text(): Promise<string> {
    return this.payload;
  }

  async json(): Promise<unknown> {
    return JSON.parse(this.payload);
  }
}

describe('/api/ai/provider-proxy', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    (global as typeof globalThis & { Response?: unknown }).Response = MockResponse as unknown as typeof Response;
  });

  it('proxies OpenRouter requests to the upstream endpoint', async () => {
    fetchMock.mockResolvedValue(
      new MockResponse(JSON.stringify({ choices: [{ message: { content: 'Hi' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request = makeRequest('http://localhost:3000/api/ai/provider-proxy', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'openrouter',
        apiKey: 'sk-or-v1-' + 'a'.repeat(32),
        model: 'minimax/minimax-m2.5:free',
        max_tokens: 10,
        stream: false,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.choices[0].message.content).toBe('Hi');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${'sk-or-v1-' + 'a'.repeat(32)}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Paper Detective',
        }),
      })
    );
  });

  it('proxies DeepSeek requests to the upstream endpoint without OpenRouter headers', async () => {
    fetchMock.mockResolvedValue(
      new MockResponse(JSON.stringify({ choices: [{ message: { content: 'Hi from DeepSeek' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const request = makeRequest('http://localhost:3000/api/ai/provider-proxy', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'deepseek',
        apiKey: 'sk-' + 'b'.repeat(32),
        model: 'deepseek-chat',
        max_tokens: 10,
        stream: false,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.choices[0].message.content).toBe('Hi from DeepSeek');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${'sk-' + 'b'.repeat(32)}`,
        }),
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'HTTP-Referer': expect.anything(),
          'X-Title': expect.anything(),
        }),
      })
    );
  });

  it('maps upstream rate limits to 429 responses', async () => {
    fetchMock.mockResolvedValue(
      new MockResponse(
        JSON.stringify({
          error: {
            message: 'Rate limited',
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request = makeRequest('http://localhost:3000/api/ai/provider-proxy', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'openrouter',
        apiKey: 'sk-or-v1-' + 'a'.repeat(32),
        model: 'minimax/minimax-m2.5:free',
        max_tokens: 10,
        stream: false,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error).toEqual({
      code: 'RATE_LIMIT',
      message: 'Rate limited',
    });
  });
});
