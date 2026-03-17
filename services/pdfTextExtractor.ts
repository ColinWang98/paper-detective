/**
 * PDF Text Extractor Service
 * Extracts text and position data from PDF files for AI analysis and highlighting
 *
 * Features:
 * - Text extraction with position data
 * - Page-by-page extraction
 * - Character-level boundaries for precise highlighting
 * - Performance optimization for large files
 * - Error handling for corrupted PDFs
 */

import * as pdfjsLib from 'pdfjs-dist';

import { getPdfWorkerSrc } from '@/lib/pdfWorker';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc(pdfjsLib.version);
}

/**
 * Text coordinate data for highlighting
 */
export interface TextCoordinate {
  x: number;           // X position in PDF coordinates
  y: number;           // Y position in PDF coordinates
  width: number;       // Width of text element
  height: number;      // Height of text element
  text: string;        // Actual text content
  pageNumber: number;  // Page number (1-based)
}

/**
 * Page text data
 */
export interface PageTextData {
  pageNumber: number;
  text: string;
  textCoordinates: TextCoordinate[];
  charCount: number;
  wordCount: number;
}

/**
 * Complete PDF text data
 */
export interface PDFTextData {
  pages: PageTextData[];
  fullText: string;
  totalPages: number;
  totalChars: number;
  totalWords: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

/**
 * PDF text extraction options
 */
export interface ExtractionOptions {
  includeCoordinates?: boolean;    // Include text position data
  normalizeWhitespace?: boolean;    // Normalize multiple spaces
  preserveLineBreaks?: boolean;     // Preserve line breaks
  maxPages?: number;               // Limit pages to extract (for large files)
  pageSize?: number;               // Process pages in batches
}

/**
 * PDF Text Extractor Service
 */
class PDFTextExtractor {
  private readonly DEFAULT_OPTIONS: ExtractionOptions = {
    includeCoordinates: true,
    normalizeWhitespace: true,
    preserveLineBreaks: true,
    maxPages: undefined,
    pageSize: 10, // Process 10 pages at a time
  };

  /**
   * Extract text data from PDF file
   */
  async extractTextFromPDF(
    file: File | ArrayBuffer,
    options: ExtractionOptions = {}
  ): Promise<PDFTextData> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Load PDF document
      const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;

      // Extract metadata
      const metadata = await this.extractMetadata(pdfDocument);

      // Determine page range
      const totalPages = pdfDocument.numPages;
      const maxPages = opts.maxPages ?? totalPages;
      const pagesToExtract = Math.min(totalPages, maxPages);

      // Extract pages in batches
      const pages: PageTextData[] = [];
      for (let i = 1; i <= pagesToExtract; i += opts.pageSize!) {
        const batchEnd = Math.min(i + opts.pageSize! - 1, pagesToExtract);
        const batch = await this.extractPageBatch(pdfDocument, i, batchEnd, opts);
        pages.push(...batch);
      }

      // Calculate totals
      const fullText = pages.map(p => p.text).join('\n\n');
      const totalChars = pages.reduce((sum, p) => sum + p.charCount, 0);
      const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);

      return {
        pages,
        fullText,
        totalPages: pagesToExtract,
        totalChars,
        totalWords,
        metadata,
      };
    } catch (error: any) {
      throw new Error(`PDF text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from a single page
   */
  async extractPageText(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    options: ExtractionOptions = {}
  ): Promise<PageTextData> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      // Extract text items with coordinates
      const textCoordinates: TextCoordinate[] = [];
      let pageText = '';

      for (const item of textContent.items) {
        if ('str' in item && item.str) {
          const transform = item.transform;
          const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);

          // PDF.js coordinates are in bottom-up origin, convert to top-left
          const x = transform[4];
          const y = viewport.height - transform[5] - fontSize;
          const width = item.width;
          const height = fontSize;

          if (opts.includeCoordinates) {
            textCoordinates.push({
              x,
              y,
              width,
              height,
              text: item.str,
              pageNumber,
            });
          }

          // Add space between items if needed
          if (item.hasEOL) {
            pageText += `${item.str  }\n`;
          } else if (item.width > 0.1) {
            pageText += `${item.str  } `;
          } else {
            pageText += item.str;
          }
        }
      }

      // Normalize whitespace if requested
      if (opts.normalizeWhitespace) {
        pageText = this.normalizeWhitespace(pageText, opts.preserveLineBreaks ?? false);
      }

      // Calculate statistics
      const charCount = pageText.length;
      const wordCount = pageText.split(/\s+/).filter(w => w.length > 0).length;

      return {
        pageNumber,
        text: pageText.trim(),
        textCoordinates,
        charCount,
        wordCount,
      };
    } catch (error: any) {
      throw new Error(`Failed to extract page ${pageNumber}: ${error.message}`);
    }
  }

  /**
   * Extract a batch of pages
   */
  private async extractPageBatch(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    startPage: number,
    endPage: number,
    options: ExtractionOptions
  ): Promise<PageTextData[]> {
    const promises: Promise<PageTextData>[] = [];

    for (let i = startPage; i <= endPage; i++) {
      promises.push(this.extractPageText(pdfDocument, i, options));
    }

    return Promise.all(promises);
  }

  /**
   * Extract metadata from PDF document
   */
  private async extractMetadata(
    pdfDocument: pdfjsLib.PDFDocumentProxy
  ): Promise<PDFTextData['metadata']> {
    try {
      const metadata = await pdfDocument.getMetadata();
      const info = metadata.info as any;

      return {
        title: info.Title || info.title,
        author: info.Author || info.author,
        subject: info.Subject || info.subject,
        keywords: info.Keywords || info.keywords,
        creator: info.Creator || info.creator,
        producer: info.Producer || info.producer,
        creationDate: info.CreationDate || info.creationDate
          ? new Date(info.CreationDate || info.creationDate)
          : undefined,
        modificationDate: info.ModDate || info.modDate
          ? new Date(info.ModDate || info.modDate)
          : undefined,
      };
    } catch (error) {
      // Metadata extraction is non-critical, return undefined on error
      console.warn('Failed to extract PDF metadata:', error);
      return undefined;
    }
  }

  /**
   * Normalize whitespace in text
   */
  private normalizeWhitespace(text: string, preserveLineBreaks: boolean): string {
    let normalized = text;

    // Normalize multiple spaces to single space
    normalized = normalized.replace(/[ \t]+/g, ' ');

    // Normalize line breaks
    if (preserveLineBreaks) {
      // Preserve single line breaks, collapse multiple
      normalized = normalized.replace(/\n{3,}/g, '\n\n');
    } else {
      // Remove all line breaks
      normalized = normalized.replace(/\n+/g, ' ');
    }

    // Remove leading/trailing whitespace
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * Extract all pages from PDF file
   */
  async extractAllPages(
    file: File | ArrayBuffer,
    options: ExtractionOptions = {}
  ): Promise<PageTextData[]> {
    const pdfData = await this.extractTextFromPDF(file, options);
    return pdfData.pages;
  }

  /**
   * Get text coordinates for a specific page
   */
  async getTextCoordinates(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
  ): Promise<TextCoordinate[]> {
    const pageData = await this.extractPageText(pdfDocument, pageNumber, {
      includeCoordinates: true,
    });

    return pageData.textCoordinates;
  }

  /**
   * Search for text in PDF and return coordinates
   */
  async searchTextCoordinates(
    file: File | ArrayBuffer,
    searchText: string,
    options: ExtractionOptions = {}
  ): Promise<Array<TextCoordinate & { match: string }>> {
    const pdfData = await this.extractTextFromPDF(file, {
      ...options,
      includeCoordinates: true,
    });

    const results: Array<TextCoordinate & { match: string }> = [];
    const searchLower = searchText.toLowerCase();

    for (const page of pdfData.pages) {
      for (const coord of page.textCoordinates) {
        if (coord.text.toLowerCase().includes(searchLower)) {
          results.push({
            ...coord,
            match: coord.text,
          });
        }
      }
    }

    return results;
  }

  /**
   * Extract text from specific page range
   */
  async extractPageRange(
    file: File | ArrayBuffer,
    startPage: number,
    endPage: number,
    options: ExtractionOptions = {}
  ): Promise<PDFTextData> {
    return this.extractTextFromPDF(file, {
      ...options,
      maxPages: endPage,
    });
  }

  /**
   * Get PDF statistics without full extraction
   */
  async getPDFStats(file: File | ArrayBuffer): Promise<{
    totalPages: number;
    estimatedSize: number;
    hasText: boolean;
  }> {
    try {
      const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;

      // Check first page for text content
      const firstPage = await pdfDocument.getPage(1);
      const textContent = await firstPage.getTextContent();
      const hasText = textContent.items.some(item => 'str' in item && item.str.length > 0);

      return {
        totalPages: pdfDocument.numPages,
        estimatedSize: arrayBuffer.byteLength,
        hasText,
      };
    } catch (error: any) {
      throw new Error(`Failed to get PDF stats: ${error.message}`);
    }
  }
}

// Export singleton instance
export const pdfTextExtractor = new PDFTextExtractor();
