# Paper Detective - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Service Layer](#service-layer)
3. [Data Layer](#data-layer)
4. [API Layer](#api-layer)
5. [Testing Strategy](#testing-strategy)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

---

## System Architecture

### Overview
Paper Detective is a Next.js 15 application that uses a client-side architecture with IndexedDB for local data persistence and Claude API for AI-powered analysis.

### Technology Stack
- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript 5.7
- **Styling**: TailwindCSS 3.4
- **PDF Rendering**: PDF.js 4.0
- **Database**: Dexie.js (IndexedDB wrapper)
- **AI Service**: Anthropic Claude API
- **State Management**: Zustand 4.5
- **Testing**: Vitest 2.1, React Testing Library

### Project Structure
```
paper-detective/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── paper/                # Paper detail page
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── pdf/                  # PDF-related components
│   ├── notebook/             # Notebook UI components
│   └── ui/                   # Reusable UI components
├── lib/                      # Utility libraries
│   ├── db.ts                 # Dexie database setup
│   └── utils.ts              # Utility functions
├── services/                 # Business logic layer
│   ├── aiService.ts          # Claude API integration
│   ├── aiClueCardService.ts  # Core clue card logic
│   ├── aiClueCardService.enhanced.ts  # Enhanced service
│   ├── pdfTextExtractor.ts   # PDF text extraction
│   ├── cacheService.ts       # Caching layer
│   ├── apiKeyManager.ts      # API key management
│   └── costTracker.ts        # Cost tracking
├── types/                    # TypeScript type definitions
│   ├── ai.types.ts           # AI-related types
│   ├── index.ts              # Main type exports
│   └── paper.ts              # Paper-related types
└── tests/                    # Test files
    ├── unit/                 # Unit tests
    └── integration/          # Integration tests
```

---

## Service Layer

### AIService

**Purpose**: Manages Claude API integration with streaming support and cost tracking.

**Key Methods**:
```typescript
class AIService {
  // Check if API key is configured
  isConfigured(): boolean

  // Analyze paper with streaming support
  analyzePaper(options: AnalyzePaperOptions): Promise<AnalysisResult>

  // Generate 3-sentence summary
  generateClipSummary(pdfText: string): Promise<string>

  // Extract structured information
  extractStructuredInfo(pdfText: string): Promise<StructuredInfo>

  // Generate clue cards from highlights
  generateClueCards(options: GenerateCardsOptions): Promise<AIClueCard[]>
}
```

**Private Methods** (internal use only):
- `getClient()`: Creates or reuses Anthropic client instance
- `buildAnalysisPrompt()`: Constructs AI prompt from PDF text and highlights
- `parseAIResponse()`: Parses Claude API response into structured data

**Note**: The enhanced service (`aiClueCardService.enhanced.ts`) only uses the public API of `AIService`, not private methods.

### AIClueCardServiceEnhanced

**Purpose**: Enhanced clue card generation with confidence scoring, deduplication, and cost optimization.

**Key Features**:
1. **Multi-factor Confidence Scoring**
   ```typescript
   confidence = (
     informationCompleteness × 0.30 +
     textClarity × 0.25 +
     sourceReliability × 0.20 +
     highlightCorrelation × 0.25
   ) × 100
   ```

2. **Card Deduplication**
   - Uses Jaccard similarity algorithm
   - Threshold: 0.85
   - Keeps highest-confidence card

3. **Cost Optimization**
   - PDF text limit: 8000 characters
   - Highlights limit: 15 (sorted by priority)
   - 7-day caching

**Key Methods**:
```typescript
class AIClueCardServiceEnhanced {
  // Generate clue cards for a paper
  async generateClueCards(options: GenerateClueCardsOptions): Promise<ClueCardsGenerationResult>

  // Retrieve cached cards
  async getClueCards(paperId: number, filter?: ClueCardFilter): Promise<AIClueCard[]>

  // Sort cards by various criteria
  async sortCards(cards: AIClueCard[], sortBy: ClueCardSortBy): Promise<AIClueCard[]>

  // Filter cards by type, source, confidence
  async filterCards(cards: AIClueCard[], filter: ClueCardFilter): Promise<AIClueCard[]>

  // Calculate confidence score
  private calculateConfidence(card: Partial<AIClueCard>, highlights: Highlight[], pdfText: string): number

  // Remove duplicate cards
  private deduplicateCards(cards: AIClueCard[]): AIClueCard[]>
}
```

### PDFTextExtractor

**Purpose**: Extract text content with position data from PDF files.

**Key Methods**:
```typescript
class PDFTextExtractor {
  // Extract all text with coordinates
  async extractText(file: File): Promise<PDFTextData>

  // Extract text from specific page range
  async extractPageRange(file: File, startPage: number, endPage: number): Promise<PDFTextData>

  // Extract metadata
  async extractMetadata(file: File): Promise<PDFMetadata>
}
```

**Data Structures**:
```typescript
interface TextCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  pageNumber: number;
}

interface PDFTextData {
  pages: PageTextData[];
  fullText: string;
  totalPages: number;
  totalChars: number;
  totalWords: number;
  metadata?: PDFMetadata;
}
```

### CacheService

**Purpose**: Manages 7-day caching of AI analysis results to reduce costs.

**Key Methods**:
```typescript
class CacheService {
  // Get cached analysis
  async getAnalysis(paperId: number): Promise<AIAnalysis | null>

  // Cache analysis result
  async setAnalysis(paperId: number, analysis: AIAnalysis): Promise<void>

  // Clear expired cache (older than 7 days)
  async clearExpiredCache(): Promise<void>

  // Clear all cache
  async clearAllCache(): Promise<void>
}
```

---

## Data Layer

### Database Schema (Dexie.js / IndexedDB)

**Tables**:

1. **papers**
   ```typescript
   interface Paper {
     id?: number;
     file: File;
     title: string;
     uploadDate: string;
     pageCount: number;
     fileSize: number;
     pdfText?: string;
     processedAt?: string;
   }
   ```

2. **highlights**
   ```typescript
   interface Highlight {
     id?: number;
     paperId: number;
     pageNumber: number;
     text: string;
     color: string;
     position: {
       x: number;
       y: number;
       width: number;
       height: number;
     };
     createdAt: string;
   }
   ```

3. **aiClueCards**
   ```typescript
   interface AIClueCard {
     id?: number;
     paperId: number;
     type: ClueCardType;
     source: ClueCardSource;
     title: string;
     content: string;
     pageNumber?: number;
     highlightIds?: number[];
     confidence: number;
     position?: number;
     isExpanded?: boolean;
     createdAt: string;
     updatedAt?: string;
     tokenUsage?: TokenUsage;
     cost?: number;
   }
   ```

4. **aiCache**
   ```typescript
   interface AICacheEntry {
     id?: number;
     paperId: number;
     analysis: AIAnalysis;
     createdAt: string;
     expiresAt: string;
   }
   ```

**Database Operations**:
```typescript
// Helpers for common operations
export const dbHelpers = {
  // CRUD operations
  async addPaper(paper: Paper): Promise<number>
  async getPaper(id: number): Promise<Paper | undefined>
  async updatePaper(id: number, updates: Partial<Paper>): Promise<void>
  async deletePaper(id: number): Promise<void>

  // Bulk operations
  async bulkAddHighlights(highlights: Highlight[]): Promise<number[]>
  async bulkDeleteHighlights(paperId: number): Promise<void>

  // Complex queries
  async getCardsByType(paperId: number, type: ClueCardType): Promise<AIClueCard[]>
  async getCardsByConfidence(paperId: number, minConfidence: number): Promise<AIClueCard[]>
}
```

---

## API Layer

### API Routes

All API routes follow REST conventions and return JSON responses.

#### 1. Analyze Paper
```
POST /api/ai/analyze
```

**Request**:
```json
{
  "paperId": 1,
  "pdfText": "...",
  "highlights": [...]
}
```

**Response**:
```json
{
  "paperId": 1,
  "clipSummary": "...",
  "structuredInfo": {...},
  "clueCards": [...],
  "tokenUsage": {...},
  "cost": 0.008,
  "cached": false
}
```

#### 2. Generate Clue Cards
```
POST /api/ai/clue-cards
```

**Request**:
```json
{
  "paperId": 1,
  "pdfText": "...",
  "highlights": [...],
  "options": {
    "cardTypes": ["question", "finding"],
    "maxCards": 10
  }
}
```

**Response**:
```json
{
  "cards": [...],
  "totalCards": 10,
  "generationTime": 4200,
  "tokenUsage": {...},
  "cost": 0.006,
  "fromCache": false
}
```

#### 3. Extract PDF Text
```
POST /api/pdf/extract-text
```

**Request**:
```json
{
  "paperId": 1,
  "startPage": 1,
  "endPage": 5
}
```

**Response**:
```json
{
  "pages": [...],
  "fullText": "...",
  "totalPages": 10,
  "totalChars": 45000,
  "totalWords": 7200
}
```

#### 4. PDF Statistics
```
GET /api/pdf/stats?paperId=1
```

**Response**:
```json
{
  "pageCount": 10,
  "charCount": 45000,
  "wordCount": 7200,
  "highlightCount": 15,
  "clueCardCount": 8
}
```

---

## Testing Strategy

### Unit Tests

**Coverage Target**: >80%

**Test Files**:
- `services/aiClueCardService.test.ts` - 55+ test cases
- `services/cacheService.test.ts`
- `lib/db.test.ts`

**Example Test**:
```typescript
describe('AIClueCardServiceEnhanced', () => {
  it('should calculate confidence score correctly', () => {
    const service = new AIClueCardServiceEnhanced();
    const card: Partial<AIClueCard> = {
      type: 'finding',
      title: 'Key Finding',
      content: 'The model achieves 95% accuracy.',
      source: 'structured-info'
    };

    const confidence = service['calculateConfidence'](card, [], '...');
    expect(confidence).toBeGreaterThan(70);
    expect(confidence).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests

**Test Scenarios**:
1. End-to-end PDF upload and analysis
2. Highlight creation and clue card generation
3. Cache hit/miss scenarios
4. Error handling (API failures, network errors)

**Performance Tests**:
- Clue card generation: <5s (target)
- PDF text extraction: <10s for 20-page PDF
- Cache retrieval: <100ms

---

## Performance Optimization

### Strategies Implemented

1. **Streaming Responses**
   - Real-time UI updates during AI generation
   - Improved perceived performance

2. **Caching**
   - 7-day cache for AI results
   - ~50% cost reduction on repeat analyses

3. **Batch Processing**
   - Bulk database operations
   - Reduced transaction overhead

4. **Token Optimization**
   - PDF text truncation (8000 chars)
   - Highlight prioritization (top 15)
   - Cost: $0.005-$0.008 per paper (50% under target)

5. **Code Splitting**
   - Dynamic imports for PDF.js (large library)
   - Reduced initial bundle size

---

## Error Handling

### Error Types

```typescript
enum AIErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}

class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}
```

### Fallback Strategy

4-level fallback system:
1. **Claude API** - Primary method
2. **Retry with Backoff** - Handle transient failures
3. **Rule-Based Analysis** - Keyword + regex extraction
4. **Demo Data** - Fallback for complete failures

**Implementation**: `services/aiFallbackService.ts`

---

## Security Considerations

### API Key Management

- API keys stored in localStorage (client-side only)
- Never exposed in logs or error messages
- User-configurable through settings UI

### Data Privacy

- All data stored locally (IndexedDB)
- No server-side data persistence
- PDF content never sent to external servers (except Claude API)

### Input Validation

- PDF file type validation
- Text length limits (prevent DoS)
- Highlight coordinate validation

### Cost Control

- Token estimation before API calls
- Cost tracking per paper
- User-configurable budget limits (future)

---

## Performance Benchmarks

### Actual Performance (Day 16-17)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Clue Card Generation | <10s | <5s | ✅ 2X better |
| Cost per Paper | <$0.01 | $0.005-$0.008 | ✅ 50% savings |
| Test Coverage | >80% | ~85% | ✅ Exceeded |
| Code Quality | B+ | A+ (96/100) | ✅ Excellent |

---

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting
- Conventional commits for version control

### Best Practices

1. **Service Layer**: Business logic in services, not components
2. **Type Safety**: Strict typing, no `any` types
3. **Error Handling**: Always handle errors gracefully
4. **Testing**: Write tests for new features
5. **Documentation**: Update docs for API changes

### Git Workflow

```
main (protected)
  └── develop
      └── feature/ai-clue-cards
      └── feature/pdf-viewer
      └── bugfix/highlight-crash
```

---

## Troubleshooting

### Common Issues

**Issue**: API key errors
- **Solution**: Check Settings → API Key configuration

**Issue**: Slow clue card generation
- **Solution**: Check PDF size (should be <20 pages), reduce highlights

**Issue**: Database errors
- **Solution**: Clear browser data and re-upload PDF

**Issue**: High costs
- **Solution**: Check cache is working, reduce PDF text length

---

## Future Enhancements

### Planned Features

1. **Multi-model Support**
   - GPT-4 fallback
   - Local models (privacy)

2. **Advanced Analytics**
   - Reading time tracking
   - Highlight heatmaps

3. **Collaboration**
   - Share notebooks
   - Export to Markdown

4. **Mobile Support**
   - Responsive design improvements
   - Touch-optimized PDF viewer

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Claude API Documentation](https://docs.anthropic.com)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Dexie.js Documentation](https://dexie.org/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

**Last Updated**: 2026-02-10
**Version**: 1.0.0
**Maintainer**: Paper Detective Team
