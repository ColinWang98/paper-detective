import { NextRequest, NextResponse } from 'next/server';

import { questionEvaluationService } from '@/services/questionEvaluationService';
import type { EvidenceSubmission, InvestigationTask } from '@/types';

interface QuestionEvaluateRequestBody {
  task: InvestigationTask;
  evidence: EvidenceSubmission[];
  judgment?: string;
  apiKey?: string;
  model?: string;
}

function parseBody(body: unknown): QuestionEvaluateRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be an object');
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.task !== 'object' || payload.task === null) {
    throw new Error('task is required');
  }

  if (!Array.isArray(payload.evidence)) {
    throw new Error('evidence must be an array');
  }

  return {
    task: payload.task as InvestigationTask,
    evidence: payload.evidence as EvidenceSubmission[],
    judgment: typeof payload.judgment === 'string' ? payload.judgment : undefined,
    apiKey: typeof payload.apiKey === 'string' ? payload.apiKey : undefined,
    model: typeof payload.model === 'string' ? payload.model : undefined,
  };
}

function mapErrorToResponse(error: unknown): NextResponse {
  const candidate = error as Error & { code?: string; status?: number };
  const message = candidate.message || 'Unknown error occurred';
  const code = candidate.code;

  if (
    message.includes('Request body must be an object') ||
    message.includes('task is required') ||
    message.includes('evidence must be an array')
  ) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message } },
      { status: 400 }
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

  if (code === 'INVALID_API_KEY' || code === 'API_KEY_MISSING') {
    return NextResponse.json(
      { success: false, error: { code, message } },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: code ?? 'UNKNOWN_ERROR', message } },
    { status: 500 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = parseBody(await request.json());
    const result = await questionEvaluationService.evaluateQuestion(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
