/**
 * Intelligence Brief API Route
 * POST /api/ai/intelligence-brief
 *
 * Generates comprehensive intelligence brief combining:
 * - Clip AI 3-sentence summary
 * - Structured information extraction
 * - AI clue cards (question/method/finding/limitation)
 * - User highlights analysis
 * - Case file metadata
 *
 * Story 2.2.2: Intelligence Briefing (B-mode)
 */

import { NextRequest } from 'next/server';

import {
  withErrorHandler,
  success,
  ValidationError,
  AIError,
} from '@/lib/api/response';
import { intelligenceBriefService } from '@/services/intelligenceBriefService';
import type { Highlight } from '@/types';
import type { AIModel, GenerateBriefOptions } from '@/types/ai.types';

const MAX_PDF_LENGTH = 500000; // 500K characters

interface BriefRequestBody {
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
  forceRegenerate?: boolean;
  apiKey?: string;
  model?: AIModel;
}

/**
 * Validate request body
 */
function validateBriefBody(body: unknown): asserts body is BriefRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be an object');
  }

  const b = body as Record<string, unknown>;

  if (typeof b.paperId !== 'number') {
    throw ValidationError.forField('paperId', 'paperId must be a number');
  }

  if (typeof b.pdfText !== 'string' || b.pdfText.trim() === '') {
    throw ValidationError.forField('pdfText', 'pdfText is required and must be a non-empty string');
  }

  if (b.pdfText.length > MAX_PDF_LENGTH) {
    throw ValidationError.forField(
      'pdfText',
      `PDF text too long: maximum ${MAX_PDF_LENGTH} characters`
    );
  }

  if (b.highlights !== undefined && !Array.isArray(b.highlights)) {
    throw ValidationError.forField('highlights', 'highlights must be an array');
  }
}

/**
 * POST /api/ai/intelligence-brief
 * Generates comprehensive intelligence brief for a paper
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  validateBriefBody(body);

  const { paperId, pdfText, highlights = [], forceRegenerate = false, apiKey, model } = body as BriefRequestBody;

  // Generate intelligence brief
  const options: GenerateBriefOptions = {
    paperId,
    pdfText,
    highlights,
    forceRegenerate,
    apiKey,
    model,
    onProgress: () => {
      // TODO: Implement server-sent events for streaming progress
    },
  };

  const result = await intelligenceBriefService.generateBrief(options);

  // Return successful response
  if (result.stage === 'error') {
    throw new AIError(
      result.error || 'Brief generation failed',
      'BRIEF_GENERATION_ERROR',
      500
    );
  }

  return success(result.brief);
});

/**
 * GET /api/ai/intelligence-brief?paperId=123
 * Retrieves cached intelligence brief for a paper
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get('paperId');

  // Validate paperId
  if (!paperId) {
    throw ValidationError.forField('paperId', 'Missing required query parameter: paperId');
  }

  const paperIdNum = parseInt(paperId, 10);
  if (isNaN(paperIdNum)) {
    throw ValidationError.forField('paperId', 'paperId must be a valid number');
  }

  // Get cached brief
  const brief = await intelligenceBriefService.getBrief(paperIdNum);

  return success(brief);
});

/**
 * DELETE /api/ai/intelligence-brief?paperId=123
 * Deletes cached intelligence brief for a paper
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get('paperId');

  // Validate paperId
  if (!paperId) {
    throw ValidationError.forField('paperId', 'Missing required query parameter: paperId');
  }

  const paperIdNum = parseInt(paperId, 10);
  if (isNaN(paperIdNum)) {
    throw ValidationError.forField('paperId', 'paperId must be a valid number');
  }

  // Delete cached brief
  await intelligenceBriefService.deleteBrief(paperIdNum);

  return success({
    message: 'Intelligence brief deleted successfully',
  });
});
