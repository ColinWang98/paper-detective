/**
 * Export Intelligence Brief as BibTeX
 * POST /api/export/bibtex
 *
 * Generates BibTeX citation from intelligence brief metadata
 * for academic workflow integration
 *
 * Story 2.2.2: Intelligence Briefing - BibTeX Export
 */

import { NextRequest } from 'next/server';

import {
  withErrorHandler,
  success,
  ValidationError,
} from '@/lib/api/response';
import type { IntelligenceBrief } from '@/types/ai.types';

/**
 * POST /api/export/bibtex
 * Converts intelligence brief to BibTeX citation format
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  const body = await request.json();
  const { brief, citationKey } = body;

  // Validate brief object
  if (!brief || typeof brief !== 'object') {
    throw ValidationError.forField('brief', 'Invalid brief: must provide IntelligenceBrief object');
  }

  // Validate required fields
  if (!brief.caseFile || !brief.caseFile.title) {
    throw ValidationError.forField('brief.caseFile.title', 'Invalid brief: missing caseFile.title');
  }

  // Generate BibTeX
  const validatedCitationKey = typeof citationKey === 'string'
    ? citationKey
    : generateCitationKey(brief as IntelligenceBrief);

  const bibtex = generateBibTeX(
    brief as IntelligenceBrief,
    validatedCitationKey
  );

  // Return BibTeX content
  return success({
    bibtex,
    citationKey: validatedCitationKey,
    filename: `brief-${brief.caseFile.caseNumber}-${brief.paperId}.bib`,
    contentType: 'application/x-bibtex',
  });
});

/**
 * Generate BibTeX from intelligence brief
 */
function generateBibTeX(brief: IntelligenceBrief, citationKey: string): string {
  const lines: string[] = [];

  // Start entry
  lines.push(`@${getEntryType(brief.caseFile)}{${citationKey},`);

  // Required fields
  lines.push(`  title = {${escapeBraces(brief.caseFile.title)}},`);

  // Authors (required for most entry types)
  if (brief.caseFile.authors && brief.caseFile.authors.length > 0) {
    lines.push(`  author = {${formatAuthors(brief.caseFile.authors)}},`);
  }

  // Year (extract from publicationDate if available)
  if (brief.caseFile.publicationDate) {
    const year = extractYear(brief.caseFile.publicationDate);
    if (year) {
      lines.push(`  year = {${year}},`);
    }
  }

  // Optional fields
  if (brief.caseFile.researchQuestion) {
    lines.push(`  abstract = {${escapeBraces(brief.caseFile.researchQuestion)}},`);
  }

  if (brief.caseFile.coreMethod) {
    lines.push(`  keywords = {${escapeBraces(brief.caseFile.coreMethod)}},`);
  }

  if (brief.caseFile.tags && brief.caseFile.tags.length > 0) {
    lines.push(`  keywords = {${brief.caseFile.tags.join(', ')}}`);
  }

  if (brief.generatedAt) {
    lines.push(`  note = {Generated: ${brief.generatedAt}, Case: #${brief.caseFile.caseNumber}},`);
  }

  // Research note with key findings
  if (brief.caseFile.keyFindings && brief.caseFile.keyFindings.length > 0) {
    const findingsText = brief.caseFile.keyFindings.slice(0, 3).join('; ');
    lines.push(`  note = {Key findings: ${escapeBraces(findingsText)}},`);
  }

  // Completeness score as annotation
  if (brief.caseFile.completenessScore) {
    lines.push(`  annotation = {Completeness: ${brief.caseFile.completenessScore}/100},`);
  }

  // End entry
  lines.push('}\n');

  return lines.join('\n');
}

/**
 * Determine BibTeX entry type based on available metadata
 */
function getEntryType(_caseFile: IntelligenceBrief['caseFile']): string {
  // Default to article for academic papers
  return 'article';
}

/**
 * Generate citation key from brief metadata
 * Format: FirstAuthorLastName:Year:Keyword
 * Example: smith2024research
 */
function generateCitationKey(brief: IntelligenceBrief): string {
  const { caseFile, paperId } = brief;
  const parts: string[] = [];

  // First author's last name (or first word of title if no authors)
  if (caseFile.authors && caseFile.authors.length > 0) {
    const firstAuthor = caseFile.authors[0];
    const lastName = extractLastName(firstAuthor);
    parts.push(lastName.toLowerCase());
  } else {
    // Use first word of title
    const firstWord = caseFile.title.split(/\s+/)[0] || 'unknown';
    parts.push(firstWord.toLowerCase());
  }

  // Year from publication date
  if (caseFile.publicationDate) {
    const year = extractYear(caseFile.publicationDate);
    if (year) {
      parts.push(year);
    }
  }

  // Case number as unique identifier
  parts.push(`case${caseFile.caseNumber}`);

  // Paper ID for uniqueness
  parts.push(`p${paperId}`);

  return parts.join(':');
}

/**
 * Extract last name from author name
 * Assumes "FirstName LastName" or "LastName, FirstName" format
 */
function extractLastName(authorName: string): string {
  // Check for "LastName, FirstName" format
  if (authorName.includes(',')) {
    return authorName.split(',')[0].trim();
  }

  // Otherwise, assume "FirstName LastName" format
  const parts = authorName.trim().split(/\s+/);
  return parts[parts.length - 1] || authorName;
}

/**
 * Format author names for BibTeX
 * Converts "FirstName LastName" to "LastName, FirstName"
 */
function formatAuthors(authors: string[]): string {
  return authors.map(author => {
    // Already in "LastName, FirstName" format
    if (author.includes(',')) {
      return author.trim();
    }

    // Convert "FirstName LastName" to "LastName, FirstName"
    const parts = author.trim().split(/\s+/);
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1];
      const firstNames = parts.slice(0, -1).join(' ');
      return `${lastName}, ${firstNames}`;
    }

    return author;
  }).join(' and ');
}

/**
 * Extract year from publication date string
 * Supports formats: "2024", "2024-01-15", "January 2024"
 */
function extractYear(dateString: string): string | null {
  // Try to extract 4-digit year
  const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : null;
}

/**
 * Escape special characters in BibTeX
 */
function escapeBraces(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')  // Backslash
    .replace(/&/g, '\\&')                   // Ampersand
    .replace(/%/g, '\\%')                   // Percent
    .replace(/\$/g, '\\$')                  // Dollar
    .replace(/#/g, '\\#')                   // Hash
    .replace(/_/g, '\\_')                   // Underscore
    .replace(/\{/g, '\\{')                  // Left brace
    .replace(/\}/g, '\\}')                  // Right brace
    .replace(/~/g, '\\textasciitilde{}')    // Tilde
    .replace(/\^/g, '\\textasciicircum{}'); // Caret
}

/**
 * GET /api/export/bibtex (health check)
 */
export const GET = withErrorHandler(async () => {
  return success({
    status: 'ok',
    service: 'bibtex-export',
    version: '1.0.0',
  });
});
