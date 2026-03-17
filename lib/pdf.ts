// PDF utility functions using PDF.js
// Dynamic import to avoid webpack bundling issues with ES modules

import { getPdfWorkerSrc } from './pdfWorker';

let pdfjsLib: any = null;

async function getPDFLib() {
  if (!pdfjsLib && typeof window !== 'undefined') {
    const pdfjs = await import('pdfjs-dist');
    pdfjsLib = pdfjs;
    pdfjsLib.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc(pdfjsLib.version);
  }
  return pdfjsLib;
}

// Type definitions for PDF.js text content items
// PDF.js types are incomplete/inaccurate, so we define our own
type TextContentItem = {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  transform?: number[];
  fontName?: string;
  hasEOL?: boolean;
};

export interface PDFTextContent {
  pageNumber: number;
  text: string;
  items: TextContentItem[];
}

// Type for PDF.js metadata info object
// PDF.js does not export a complete type for this, so we define it here
type PDFMetadataInfo = {
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: Date;
  ModDate?: Date;
  [key: string]: unknown;
};

// Type guard to check if an item has a string content property
function hasStringProperty(item: unknown): item is { str: string } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'str' in item &&
    typeof (item as { str: unknown }).str === 'string'
  );
}

// Type guard for PDF metadata info
function isMetadataInfo(info: unknown): info is PDFMetadataInfo {
  return (
    typeof info === 'object' &&
    info !== null
  );
}

/**
 * Extract full text from a PDF file
 */
export async function extractPDFText(file: File): Promise<string> {
  const lib = await getPDFLib();
  if (!lib) {
    throw new Error('PDF.js library not available');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Type assertion: PDF.js returns items with 'str' property for text items
    // We filter to ensure we only process items with the str property
    const pageText = (textContent.items as unknown[])
      .filter(hasStringProperty)
      .map((item) => item.str)
      .join(' ');

    fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
  }

  return fullText;
}

/**
 * Extract text from specific page range
 */
export async function extractPDFTextRange(
  file: File,
  startPage: number,
  endPage: number
): Promise<PDFTextContent[]> {
  const lib = await getPDFLib();
  if (!lib) {
    throw new Error('PDF.js library not available');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

  const results: PDFTextContent[] = [];

  for (let pageNum = startPage; pageNum <= endPage && pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Type assertion: PDF.js returns items with 'str' property for text items
    // We filter to ensure we only process items with the str property
    const textItems = (textContent.items as unknown[]).filter(hasStringProperty) as TextContentItem[];

    const pageText = textItems.map((item) => item.str).join(' ');

    results.push({
      pageNumber: pageNum,
      text: pageText,
      items: textItems,
    });
  }

  return results;
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(file: File): Promise<{
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  pageCount: number;
}> {
  const lib = await getPDFLib();
  if (!lib) {
    throw new Error('PDF.js library not available');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const metadata = await pdf.getMetadata();

  // PDF.js metadata.info is not fully typed, use type guard for safety
  const info = metadata.info as unknown;
  const safeInfo = isMetadataInfo(info) ? info : null;

  return {
    title: safeInfo?.Title,
    author: safeInfo?.Author,
    subject: safeInfo?.Subject,
    keywords: safeInfo?.Keywords,
    creator: safeInfo?.Creator,
    producer: safeInfo?.Producer,
    pageCount: pdf.numPages,
  };
}

/**
 * Get page dimensions
 */
export async function getPageDimensions(file: File, pageNumber: number): Promise<{
  width: number;
  height: number;
  rotation: number;
}> {
  const lib = await getPDFLib();
  if (!lib) {
    throw new Error('PDF.js library not available');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.0 });

  return {
    width: viewport.width,
    height: viewport.height,
    rotation: viewport.rotation,
  };
}

/**
 * Convert PDF coordinates to viewport coordinates
 */
export function pdfToViewport(
  pdfRect: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number; scale: number }
): { x: number; y: number; width: number; height: number } {
  return {
    x: pdfRect.x * viewport.scale,
    y: viewport.height - (pdfRect.y + pdfRect.height) * viewport.scale,
    width: pdfRect.width * viewport.scale,
    height: pdfRect.height * viewport.scale,
  };
}

/**
 * Convert viewport coordinates to PDF coordinates
 */
export function viewportToPdf(
  viewportRect: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number; scale: number }
): { x: number; y: number; width: number; height: number } {
  return {
    x: viewportRect.x / viewport.scale,
    y: (viewport.height - viewportRect.y - viewportRect.height) / viewport.scale,
    width: viewportRect.width / viewport.scale,
    height: viewportRect.height / viewport.scale,
  };
}
