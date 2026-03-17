/**
 * Clip Summary API Route
 * POST /api/ai/clip-summary
 *
 * Generates a 3-sentence clip summary of a paper
 * Optimized for quick reading and card display
 */

import { NextRequest } from 'next/server';

import {
  withErrorHandler,
  success,
  ValidationError,
  AuthenticationError,
  wrapAIError,
} from '@/lib/api/response';
import { aiService } from '@/services/aiService';
import type { Highlight } from '@/types';

interface ClipSummaryRequestBody {
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
}

/**
 * Validate request body
 */
function validateClipSummaryBody(body: unknown): asserts body is ClipSummaryRequestBody {
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

  if (b.highlights !== undefined && !Array.isArray(b.highlights)) {
    throw ValidationError.forField('highlights', 'highlights must be an array');
  }
}

/**
 * POST /api/ai/clip-summary
 * Generates a 3-sentence clip summary
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  validateClipSummaryBody(body);

  const { paperId, pdfText, highlights = [] } = body;

  // Check if API is configured
  if (!aiService.isConfigured()) {
    throw AuthenticationError.apiKeyMissing();
  }

  // Generate clip summary
  try {
    const result = await aiService.generateClipSummary({
      paperId,
      pdfText,
      highlights,
    });

    return success(result);
  } catch (error) {
    throw wrapAIError(error);
  }
});
