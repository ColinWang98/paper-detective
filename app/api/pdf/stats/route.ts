/**
 * PDF Statistics API Route
 * POST /api/pdf/stats
 *
 * Returns PDF statistics without full text extraction
 * Useful for quick validation and size estimation
 */

import { NextRequest, NextResponse } from 'next/server';

import { pdfTextExtractor } from '@/services/pdfTextExtractor';

/**
 * POST /api/pdf/stats
 * Get PDF statistics
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data with file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required field: file' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type: expected PDF' },
        { status: 400 }
      );
    }

    // Get PDF statistics
    const stats = await pdfTextExtractor.getPDFStats(file);

    // Return successful statistics
    return NextResponse.json({
      success: true,
      data: {
        totalPages: stats.totalPages,
        fileSize: stats.estimatedSize,
        fileSizeFormatted: formatFileSize(stats.estimatedSize),
        hasText: stats.hasText,
      },
    });

  } catch (error: any) {
    console.error('PDF stats error:', error);

    return NextResponse.json(
      { error: 'UNKNOWN_ERROR', message: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Format file size for human readability
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
