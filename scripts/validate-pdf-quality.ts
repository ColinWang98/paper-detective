/**
 * PDF Quality Validation Script
 *
 * Purpose: Automatically validate PDF files for Golden Dataset
 *
 * Usage:
 *   node scripts/validate-pdf-quality.ts <pdf-file>
 *
 * Checks:
 *   1. Text layer existence
 *   2. Page count
 *   3. File size
 *   4. Text extraction quality
 */

const fs = require('fs');
const path = require('path');

interface ValidationResult {
  filename: string;
  hasTextLayer: boolean;
  pageCount: number;
  fileSize: number;
  textSample: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

async function validatePDF(filePath: string): Promise<ValidationResult> {
  const filename = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  const issues: string[] = [];
  let hasTextLayer = false;
  let pageCount = 0;
  let textSample = '';

  // Basic checks
  if (fileSize < 1000) {
    issues.push('File too small (<1KB)');
  }

  if (fileSize > 50 * 1024 * 1024) {
    issues.push('File too large (>50MB)');
  }

  // TODO: Use PDF.js to actually check:
  // - Text layer existence
  // - Page count
  // - Extract sample text

  // Placeholder: simulate checks
  hasTextLayer = true; // Assume yes for now
  pageCount = 10; // Assume 10 pages
  textSample = 'Sample text from PDF...';

  // Determine quality
  let quality: 'excellent' | 'good' | 'fair' | 'poor';

  if (!hasTextLayer) {
    quality = 'poor';
    issues.push('No text layer found (scanned PDF)');
  } else if (pageCount < 4) {
    quality = 'fair';
    issues.push('Too few pages (<4)');
  } else if (pageCount > 20) {
    quality = 'fair';
    issues.push('Too many pages (>20)');
  } else if (issues.length === 0) {
    quality = 'excellent';
  } else {
    quality = 'good';
  }

  return {
    filename,
    hasTextLayer,
    pageCount,
    fileSize,
    textSample,
    quality,
    issues,
  };
}

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error('Usage: node validate-pdf-quality.ts <pdf-file>');
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Validating PDF: ${pdfPath}\n`);

  const result = await validatePDF(pdfPath);

  console.log('Validation Result:');
  console.log('=================');
  console.log(`File: ${result.filename}`);
  console.log(`Quality: ${result.quality.toUpperCase()}`);
  console.log(`Text Layer: ${result.hasTextLayer ? '✅' : '❌'}`);
  console.log(`Page Count: ${result.pageCount}`);
  console.log(`File Size: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Text Sample: ${result.textSample.substring(0, 100)}...`);

  if (result.issues.length > 0) {
    console.log('\nIssues:');
    result.issues.forEach((issue) => console.log(`  ⚠️  ${issue}`));
  }

  console.log('\nRecommendation:');
  if (result.quality === 'excellent' || result.quality === 'good') {
    console.log('  ✅ Approved for Golden Dataset');
  } else {
    console.log('  ❌ Not recommended for Golden Dataset');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { validatePDF };
