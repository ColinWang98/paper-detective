import { NextRequest } from 'next/server';

import { ValidationError, success, withErrorHandler } from '@/lib/api/response';
import { caseSetupService } from '@/services/caseSetupService';

interface CaseSetupRequestBody {
  paperId: number;
  pdfText: string;
  forceRegenerate?: boolean;
}

function validateBody(body: unknown): asserts body is CaseSetupRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be an object');
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.paperId !== 'number') {
    throw ValidationError.forField('paperId', 'paperId must be a number');
  }

  if (typeof payload.pdfText !== 'string' || payload.pdfText.trim() === '') {
    throw ValidationError.forField('pdfText', 'pdfText is required and must be a non-empty string');
  }
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  validateBody(body);

  const caseSetup = await caseSetupService.generateCaseSetup({
    paperId: body.paperId,
    pdfText: body.pdfText,
    forceRegenerate: body.forceRegenerate ?? false,
  });

  return success(caseSetup);
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get('paperId');

  if (!paperId) {
    throw ValidationError.forField('paperId', 'Missing required query parameter: paperId');
  }

  const paperIdNumber = Number.parseInt(paperId, 10);
  if (Number.isNaN(paperIdNumber)) {
    throw ValidationError.forField('paperId', 'paperId must be a valid number');
  }

  const caseSetup = await caseSetupService.getCaseSetup(paperIdNumber);
  return success(caseSetup);
});
