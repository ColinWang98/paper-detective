import { NextRequest, NextResponse } from 'next/server';

import { caseSetupService } from '@/services/caseSetupService';

interface CaseSetupRequestBody {
  paperId: number;
  pdfText: string;
  forceRegenerate?: boolean;
  apiKey?: string;
  model?: string;
}

function parseBody(body: unknown): CaseSetupRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be an object');
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.paperId !== 'number') {
    throw new Error('paperId must be a number');
  }

  if (typeof payload.pdfText !== 'string' || payload.pdfText.trim() === '') {
    throw new Error('pdfText is required and must be a non-empty string');
  }

  return {
    paperId: payload.paperId,
    pdfText: payload.pdfText,
    forceRegenerate: typeof payload.forceRegenerate === 'boolean' ? payload.forceRegenerate : false,
    apiKey: typeof payload.apiKey === 'string' ? payload.apiKey : undefined,
    model: typeof payload.model === 'string' ? payload.model : undefined,
  };
}

function mapErrorToResponse(error: unknown): NextResponse {
  const candidate = error as Error & { code?: string; status?: number };
  const message = candidate.message || 'Unknown error occurred';
  const code = candidate.code;

  if (code === 'API_KEY_MISSING') {
    return NextResponse.json(
      { success: false, error: { code, message } },
      { status: 401 }
    );
  }

  if (code === 'INVALID_API_KEY') {
    return NextResponse.json(
      { success: false, error: { code, message } },
      { status: 401 }
    );
  }

  if (code === 'RATE_LIMIT' || candidate.status === 429) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT', message } },
      { status: 429 }
    );
  }

  if (code === 'NETWORK_ERROR') {
    return NextResponse.json(
      { success: false, error: { code: 'NETWORK_ERROR', message } },
      { status: 503 }
    );
  }

  if (code === 'PARSE_ERROR') {
    return NextResponse.json(
      { success: false, error: { code: 'PARSE_ERROR', message } },
      { status: 502 }
    );
  }

  if (
    message.includes('paperId must be a number') ||
    message.includes('paperId must be a valid number') ||
    message.includes('pdfText is required') ||
    message.includes('Request body must be an object') ||
    message.includes('Missing required query parameter: paperId')
  ) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message } },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message } },
    { status: 500 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = parseBody(await request.json());
    const caseSetup = await caseSetupService.generateCaseSetup(body);

    return NextResponse.json({
      success: true,
      data: caseSetup,
    });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      throw new Error('Missing required query parameter: paperId');
    }

    const paperIdNumber = Number.parseInt(paperId, 10);
    if (Number.isNaN(paperIdNumber)) {
      throw new Error('paperId must be a valid number');
    }

    const caseSetup = await caseSetupService.getCaseSetup(paperIdNumber);

    return NextResponse.json({
      success: true,
      data: caseSetup,
    });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
