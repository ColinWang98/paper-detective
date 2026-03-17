/**
 * AI Clue Cards API Route
 * POST /api/ai/clue-cards
 *
 * Generates AI-powered clue cards from paper analysis
 * Cards: question, method, finding, limitation
 */

import { NextRequest } from 'next/server';

import {
  withErrorHandler,
  success,
  ValidationError,
  AuthenticationError,
} from '@/lib/api/response';
import { aiClueCardServiceEnhanced } from '@/services/aiClueCardService.enhanced';
import { aiService } from '@/services/aiService';
import type { ClueCardType, Highlight } from '@/types';

const VALID_CARD_TYPES: readonly ClueCardType[] = ['question', 'method', 'finding', 'limitation'];

interface ClueCardsRequestBody {
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
  cardTypes?: ClueCardType[];
}

/**
 * Validate request body
 */
function validateClueCardsBody(body: unknown): asserts body is ClueCardsRequestBody {
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

  if (b.cardTypes !== undefined) {
    if (!Array.isArray(b.cardTypes)) {
      throw ValidationError.forField('cardTypes', 'cardTypes must be an array');
    }
    const invalidTypes = b.cardTypes.filter(
      (t): t is string => typeof t !== 'string' || !VALID_CARD_TYPES.includes(t as ClueCardType)
    );
    if (invalidTypes.length > 0) {
      throw ValidationError.forField(
        'cardTypes',
        `Invalid card types: ${invalidTypes.join(', ')}. Valid types: ${VALID_CARD_TYPES.join(', ')}`
      );
    }
  }
}

/**
 * POST /api/ai/clue-cards
 * Generates AI clue cards from a paper
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json();
  validateClueCardsBody(body);

  const { paperId, pdfText, highlights = [], cardTypes } = body;

  // Check if API is configured
  if (!aiService.isConfigured()) {
    throw AuthenticationError.apiKeyMissing();
  }

  // Generate clue cards
  const result = await aiClueCardServiceEnhanced.generateClueCards({
    paperId,
    pdfText,
    highlights,
    cardTypes,
    onProgress: () => {
      // Progress callback for monitoring (no-op here, could be used for streaming)
    },
  });

  return success(result);
});

/**
 * GET /api/ai/clue-cards?paperId={id}
 * Retrieves existing clue cards for a paper
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get('paperId');

  if (!paperId) {
    throw ValidationError.forField('paperId', 'Missing required query parameter: paperId');
  }

  const paperIdNum = parseInt(paperId, 10);
  if (isNaN(paperIdNum)) {
    throw ValidationError.forField('paperId', 'paperId must be a valid number');
  }

  // Retrieve clue cards
  const cards = await aiClueCardServiceEnhanced.getClueCards(paperIdNum);

  // Get statistics
  const stats = await aiClueCardServiceEnhanced.getClueCardsStats(paperIdNum);

  return success({
    cards,
    stats,
  });
});
