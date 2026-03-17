/**
 * AI Analysis API Route
 * POST /api/ai/analyze
 *
 * Performs comprehensive AI analysis of a paper using Claude API
 * Returns structured analysis with streaming support
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

interface AnalyzeRequestBody {
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
}

/**
 * Validate request body
 */
function validateAnalyzeBody(body: unknown): asserts body is AnalyzeRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be an object');
  }

  const b = body as Record<string, unknown>;

  // Validate paperId
  if (typeof b.paperId !== 'number') {
    throw ValidationError.forField('paperId', 'paperId must be a number');
  }

  // Validate pdfText
  if (typeof b.pdfText !== 'string' || b.pdfText.trim() === '') {
    throw ValidationError.forField('pdfText', 'pdfText is required and must be a non-empty string');
  }

  // Validate highlights (if provided)
  if (b.highlights !== undefined && !Array.isArray(b.highlights)) {
    throw ValidationError.forField('highlights', 'highlights must be an array');
  }
}

/**
 * POST /api/ai/analyze
 * Analyzes a paper and returns comprehensive AI analysis
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  const body = await request.json();
  
  // Validate request body
  validateAnalyzeBody(body);
  
  const { paperId, pdfText, highlights = [] } = body;

  // Check if API is configured
  if (!aiService.isConfigured()) {
    throw AuthenticationError.apiKeyMissing();
  }

  // Perform analysis
  try {
    const result = await aiService.analyzePaper({
      paperId,
      pdfText,
      highlights,
    });

    return success(result);
  } catch (error) {
    // Wrap AI errors
    throw wrapAIError(error);
  }
});

/**
 * GET /api/ai/analyze
 * Check if AI analysis service is available
 */
export const GET = withErrorHandler(async () => {
  const isConfigured = aiService.isConfigured();

  return success({
    configured: isConfigured,
    service: 'AI Analysis',
    version: '1.0.0',
  });
});
