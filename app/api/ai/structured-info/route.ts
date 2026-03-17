/**
 * Structured Info API Route
 * POST /api/ai/structured-info
 *
 * Extracts structured information from a paper:
 * - Research question
 * - Methodology
 * - Findings
 * - Conclusions
 */

import { NextRequest, NextResponse } from 'next/server';

import { aiService } from '@/services/aiService';
import type { Highlight } from '@/types';

/**
 * POST /api/ai/structured-info
 * Extracts structured information from a paper
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    const { paperId, pdfText, highlights } = body;

    // Validate required fields
    if (!paperId || !pdfText) {
      return NextResponse.json(
        { error: 'Missing required fields: paperId, pdfText' },
        { status: 400 }
      );
    }

    // Check if API is configured
    if (!aiService.isConfigured()) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: '请先在设置中配置API Key' },
        { status: 401 }
      );
    }

    // Extract structured information
    const result = await aiService.extractStructuredInfo({
      paperId,
      pdfText,
      highlights: highlights as Highlight[] || [],
    });

    // Return successful extraction
    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: unknown) {
    // Handle specific error types
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (errorCode === 'API_KEY_MISSING') {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: errorMessage },
        { status: 401 }
      );
    }

    if (errorCode === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'RATE_LIMIT', message: errorMessage },
        { status: 429 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'UNKNOWN_ERROR', message: errorMessage },
      { status: 500 }
    );
  }
}
