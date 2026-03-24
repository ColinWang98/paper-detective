import { NextRequest, NextResponse } from 'next/server';

const BIGMODEL_PARSE_SYNC_URL = 'https://open.bigmodel.cn/api/paas/v4/files/parser/sync';

function toUpperFileType(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext === 'PDF' ? 'PDF' : 'PDF';
}

function extractTextFromResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const obj = payload as Record<string, unknown>;
  if (typeof obj.content === 'string' && obj.content.trim().length > 0) {
    return obj.content.trim();
  }

  const data = obj.data;
  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    if (typeof dataObj.content === 'string' && dataObj.content.trim().length > 0) {
      return dataObj.content.trim();
    }
  }

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const apiKey = form.get('apiKey');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'file is required' } },
        { status: 400 }
      );
    }

    if (typeof apiKey !== 'string' || apiKey.trim() === '') {
      return NextResponse.json(
        { success: false, error: { code: 'API_KEY_MISSING', message: 'BigModel API Key is required' } },
        { status: 401 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append('file', file, file.name);
    upstreamForm.append('tool_type', 'prime-sync');
    upstreamForm.append('file_type', toUpperFileType(file.name));

    const response = await fetch(BIGMODEL_PARSE_SYNC_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ||
        (payload as { error?: { message?: string } } | null)?.error?.message ||
        response.statusText ||
        'BigModel parse-sync failed';

      return NextResponse.json(
        { success: false, error: { code: response.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM_ERROR', message } },
        { status: response.status }
      );
    }

    const text = extractTextFromResponse(payload);
    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PARSE_ERROR', message: 'BigModel parse-sync returned empty content' },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        text,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown parse-sync error';
    return NextResponse.json(
      { success: false, error: { code: 'NETWORK_ERROR', message } },
      { status: 503 }
    );
  }
}

