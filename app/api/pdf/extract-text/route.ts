/**
 * PDF Text Extraction API Route (Updated with Unified Error Handling)
 * POST /api/pdf/extract-text
 *
 * Extracts text and position data from PDF files
 * Supports batch processing and coordinate extraction
 */

import { NextRequest } from 'next/server';

import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  PDFError,
} from '@/lib/apiErrorHandler';
import { wrapPDFError } from '@/lib/errorHandler';
import { pdfTextExtractor, type ExtractionOptions } from '@/services/pdfTextExtractor';

/**
 * POST /api/pdf/extract-text
 * Extracts text from PDF file
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 解析form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new ValidationError('Invalid form data');
  }

  // 获取文件
  const file = formData.get('file') as File;
  if (!file) {
    throw ValidationError.required('file');
  }

  // 验证文件类型
  if (file.type !== 'application/pdf') {
    throw PDFError.invalidFileType('application/pdf');
  }

  // 解析提取选项
  const options: ExtractionOptions = {
    includeCoordinates: formData.get('includeCoordinates') === 'true',
    normalizeWhitespace: formData.get('normalizeWhitespace') !== 'false',
    preserveLineBreaks: formData.get('preserveLineBreaks') !== 'false',
    maxPages: parseIntParam(formData.get('maxPages') as string),
    pageSize: parseIntParam(formData.get('pageSize') as string) ?? 10,
  };

  // 执行提取
  try {
    const result = await pdfTextExtractor.extractTextFromPDF(file, options);

    return createSuccessResponse({
      fullText: result.fullText,
      totalPages: result.totalPages,
      totalChars: result.totalChars,
      totalWords: result.totalWords,
      pages: result.pages.map(p => ({
        pageNumber: p.pageNumber,
        text: p.text,
        charCount: p.charCount,
        wordCount: p.wordCount,
        textCoordinates: options.includeCoordinates ? p.textCoordinates : undefined,
      })),
      metadata: result.metadata,
    });
  } catch (error) {
    // 包装PDF错误
    throw wrapPDFError(error, file.name);
  }
});

/**
 * GET /api/pdf/extract-text
 * Get PDF text extraction service status
 */
export const GET = withErrorHandler(async () => {
  return createSuccessResponse({
    service: 'PDF Text Extraction',
    version: '1.0.0',
    features: [
      'Text extraction',
      'Position coordinates',
      'Metadata extraction',
      'Batch processing',
      'Search functionality',
    ],
    supportedFormats: ['application/pdf'],
  });
});

/**
 * 辅助函数：解析整数参数
 */
function parseIntParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}
