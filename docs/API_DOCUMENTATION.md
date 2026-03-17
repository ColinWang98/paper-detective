# Paper Detective API Documentation

## Overview

Complete API documentation for the Paper Detective application. All endpoints are built with Next.js 15 Route Handlers and support TypeScript type safety.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, API endpoints require the Claude API key to be configured in the application settings. Future versions may implement proper authentication.

## AI Analysis Endpoints

### 1. Analyze Paper

Perform comprehensive AI analysis of a paper.

**Endpoint**: `POST /api/ai/analyze`

**Request Body**:
```typescript
{
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    paperId: number;
    summary: string;
    researchQuestion: string;
    methods: string[];
    findings: string[];
    limitations: string[];
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    estimatedCost: number;
    createdAt: string;
    model: string;
  };
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad request (missing fields)
- `401` - API key not configured
- `429` - Rate limit exceeded
- `500` - Server error

**Example**:
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": 1,
    "pdfText": "This is a sample paper...",
    "highlights": []
  }'
```

### 2. Generate Clip Summary

Generate a 3-sentence clip summary optimized for quick reading.

**Endpoint**: `POST /api/ai/clip-summary`

**Request Body**:
```typescript
{
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    summary: string[];  // 3 sentences
    confidence: number;  // 0-100
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/ai/clip-summary \
  -H "Content-Type: application/json" \
  -d '{
    "paperId": 1,
    "pdfText": "This is a sample paper..."
  }'
```

### 3. Extract Structured Information

Extract structured information (question, methods, findings, conclusions).

**Endpoint**: `POST /api/ai/structured-info`

**Request Body**:
```typescript
{
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    researchQuestion: string;
    methodology: string[];
    findings: string[];
    conclusions: string;
    confidence: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
  };
}
```

### 4. Generate AI Clue Cards

Generate AI-powered clue cards (question, method, finding, limitation).

**Endpoint**: `POST /api/ai/clue-cards`

**Request Body**:
```typescript
{
  paperId: number;
  pdfText: string;
  highlights?: Highlight[];
  cardTypes?: ('question' | 'method' | 'finding' | 'limitation')[];
}
```

**Response**:
```typescript
{
  success: true;
  data: {
    cards: AIClueCard[];
    summary: {
      total: number;
      byType: Record<string, number>;
      avgConfidence: number;
    };
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
    duration: number;
  };
}
```

**GET /api/ai/clue-cards?paperId={id}**

Retrieve existing clue cards for a paper.

**Response**:
```typescript
{
  success: true;
  data: {
    cards: AIClueCard[];
    stats: {
      total: number;
      byType: Record<string, number>;
      bySource: Record<string, number>;
      avgConfidence: number;
    };
  };
}
```

## PDF Processing Endpoints

### 5. Extract Text from PDF

Extract text and position data from PDF files.

**Endpoint**: `POST /api/pdf/extract-text`

**Request**: `multipart/form-data`
```
file: File (PDF)
includeCoordinates?: boolean (default: true)
normalizeWhitespace?: boolean (default: true)
preserveLineBreaks?: boolean (default: true)
maxPages?: number
pageSize?: number (default: 10)
```

**Response**:
```typescript
{
  success: true;
  data: {
    fullText: string;
    totalPages: number;
    totalChars: number;
    totalWords: number;
    pages: Array<{
      pageNumber: number;
      text: string;
      charCount: number;
      wordCount: number;
      textCoordinates?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        pageNumber: number;
      }>;
    }>;
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
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/pdf/extract-text \
  -F "file=@paper.pdf" \
  -F "includeCoordinates=true" \
  -F "maxPages=10"
```

### 6. Get PDF Statistics

Get PDF statistics without full text extraction.

**Endpoint**: `POST /api/pdf/stats`

**Request**: `multipart/form-data`
```
file: File (PDF)
```

**Response**:
```typescript
{
  success: true;
  data: {
    totalPages: number;
    fileSize: number;
    fileSizeFormatted: string;
    hasText: boolean;
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/pdf/stats \
  -F "file=@paper.pdf"
```

## Error Responses

All endpoints follow a consistent error response format:

```typescript
{
  error: string;  // Error code
  message: string;  // Human-readable message
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `API_KEY_MISSING` | API key not configured | 401 |
| `INVALID_API_KEY` | API key is invalid | 401 |
| `RATE_LIMIT` | Rate limit exceeded | 429 |
| `NETWORK_ERROR` | Network connection failed | 503 |
| `PARSE_ERROR` | Failed to parse response | 500 |
| `INVALID_PDF` | Invalid PDF file | 400 |
| `CORRUPTED_PDF` | PDF file is corrupted | 400 |
| `PASSWORD_PROTECTED` | PDF is password protected | 400 |
| `UNKNOWN_ERROR` | Unknown error | 500 |

## Rate Limiting

Current implementation relies on Anthropic's rate limits:
- **Claude Sonnet 4.5**: 5 requests per second
- **Daily limit**: Based on API account tier

## Cost Estimation

Typical costs per paper (using Claude Sonnet 4.5):
- **Full Analysis**: $0.006-$0.010
- **Clip Summary**: $0.001-$0.002
- **Structured Info**: $0.003-$0.005
- **Clue Cards**: $0.005-$0.008

## TypeScript Types

```typescript
interface Highlight {
  id?: number;
  text: string;
  color: 'red' | 'yellow' | 'orange' | 'gray';
  priority: 'critical' | 'important' | 'interesting' | 'archived';
  timestamp: string;
  createdAt: string;
  pageNumber?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  paperId?: number;
}

interface AIClueCard {
  id?: number;
  paperId: number;
  type: 'question' | 'method' | 'finding' | 'limitation';
  source: 'clip-summary' | 'structured-info' | 'custom-insight' | 'ai-generated';
  title: string;
  content: string;
  pageNumber?: number;
  highlightIds?: number[];
  confidence: number;
  position?: number;
  isExpanded?: boolean;
  createdAt: string;
  updatedAt?: string;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
}
```

## Usage Examples

### React Component Example

```typescript
import { useState } from 'react';

export function AnalyzePaperButton({ paperId, pdfText }: { paperId: number; pdfText: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, pdfText }),
      });

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAnalyze} disabled={loading}>
      {loading ? 'Analyzing...' : 'Analyze Paper'}
    </button>
  );
}
```

### File Upload Example

```typescript
async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('includeCoordinates', 'true');

  const response = await fetch('/api/pdf/extract-text', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.data;
}
```

## Best Practices

1. **Error Handling**: Always check for `error` field in responses
2. **Progress Updates**: Use streaming responses for long-running operations
3. **Caching**: Implement client-side caching for repeated requests
4. **File Size**: Limit PDF uploads to <50MB for optimal performance
5. **Rate Limiting**: Implement exponential backoff for rate limit errors

## Testing

### Manual Testing

```bash
# Test analyze endpoint
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"paperId":1,"pdfText":"test"}'

# Test PDF extraction
echo "test" > test.txt
curl -X POST http://localhost:3000/api/pdf/stats \
  -F "file=@test.txt"
```

### Automated Testing

See test files:
- `tests/unit/services/aiService.test.ts`
- `tests/unit/services/aiClueCardService.test.ts`
- `tests/integration/api-tests.spec.ts`

## Future Enhancements

- [ ] WebSocket support for real-time streaming
- [ ] Batch processing for multiple papers
- [ ] Export endpoints (PDF, JSON, CSV)
- [ ] User authentication and authorization
- [ ] Request caching and deduplication
- [ ] Advanced search and filtering

## Support

For issues or questions:
- GitHub Issues: [project-url]
- Documentation: [docs-url]
- API Status: [status-page-url]

---

**Version**: 1.0.0
**Last Updated**: 2026-02-10
**Maintainer**: Paper Detective Team
