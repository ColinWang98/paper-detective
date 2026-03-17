/**
 * Next.js Server Mocks
 * Mocks Next.js server components for API route testing
 */

export class NextRequest {
  public url: string;
  public method: string;
  public headers: Headers;
  public body: string | null;
  private _bodyUsed: boolean = false;

  constructor(input: string | URL, init: RequestInit = {}) {
    this.url = typeof input === 'string' ? input : input.href;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body ? String(init.body) : null;
  }

  async json(): Promise<any> {
    this._bodyUsed = true;
    return JSON.parse(this.body || '{}');
  }

  async text(): Promise<string> {
    this._bodyUsed = true;
    return this.body || '';
  }

  get bodyUsed(): boolean {
    return this._bodyUsed;
  }

  clone(): NextRequest {
    return new NextRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    });
  }
}

export class NextResponse {
  public status: number;
  public headers: Headers;
  public body: string | null;

  constructor(body: string | null, init: ResponseInit = {}) {
    this.status = init.status || 200;
    this.headers = new Headers(init.headers);
    this.body = body;
  }

  static json(data: any, init: ResponseInit = {}): NextResponse {
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        'Content-Type': 'application/json',
      },
    });
  }

  async json(): Promise<any> {
    return JSON.parse(this.body || '{}');
  }
}
