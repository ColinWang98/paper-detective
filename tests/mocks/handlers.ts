/**
 * MSW (Mock Service Worker) API Handlers
 *
 * Provides mock API responses for testing
 * Usage: Import in test files and use with server.use()
 */

import { http } from 'msw';
import { mockIntelligenceBrief } from '../fixtures/intelligence-brief';

// Base API URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Intelligence Brief API handlers
export const intelligenceBriefHandlers = [
  // GET /api/ai/intelligence-brief?paperId=123
  http.get(`${API_BASE}/ai/intelligence-brief`, ({ request }) => {
    const url = new URL(request.url);
    const paperId = url.searchParams.get('paperId');

    if (!paperId) {
      return Response.json({ error: 'Missing paperId parameter' }, { status: 400 });
    }

    // Return cached brief for paper 123
    if (paperId === '123') {
      return Response.json(mockIntelligenceBrief);
    }

    // Return 404 for non-existent papers
    return Response.json({ error: 'Intelligence brief not found' }, { status: 404 });
  }),

  // POST /api/ai/intelligence-brief/generate
  http.post(`${API_BASE}/ai/intelligence-brief/generate`, async ({ request }) => {
    const body = await request.json() as { paperId?: string };

    if (!body.paperId) {
      return Response.json({ error: 'Missing paperId' }, { status: 400 });
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return generated brief
    return Response.json(mockIntelligenceBrief);
  }),

  // DELETE /api/ai/intelligence-brief?paperId=123
  http.delete(`${API_BASE}/ai/intelligence-brief`, ({ request }) => {
    const url = new URL(request.url);
    const paperId = url.searchParams.get('paperId');

    if (!paperId) {
      return Response.json({ error: 'Missing paperId parameter' }, { status: 400 });
    }

    return Response.json({ success: true, message: 'Intelligence brief deleted' });
  }),

  // GET /api/ai/intelligence-brief/export?paperId=123&format=markdown
  http.get(`${API_BASE}/ai/intelligence-brief/export`, ({ request }) => {
    const url = new URL(request.url);
    const paperId = url.searchParams.get('paperId');
    const format = url.searchParams.get('format');

    if (!paperId || !format) {
      return Response.json({ error: 'Missing paperId or format parameter' }, { status: 400 });
    }

    if (format === 'markdown') {
      return new Response(
        `# Intelligence Brief for Paper ${paperId}\n\n## Summary\n\nThis is a test brief.`,
        {
          headers: { 'Content-Type': 'text/markdown' }
        }
      );
    }

    if (format === 'bibtex') {
      return new Response(
        `@article{paper${paperId},\n  title={Test Paper},\n  year={2026}\n}`,
        {
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }

    return Response.json({ error: 'Invalid format parameter' }, { status: 400 });
  }),
];

// AI Clip Summary API handlers
export const clipSummaryHandlers = [
  // POST /api/ai/clip-summary
  http.post(`${API_BASE}/ai/clip-summary`, async ({ request }) => {
    const body = await request.json() as { pdfText?: string };

    if (!body.pdfText) {
      return Response.json({ error: 'Missing pdfText' }, { status: 400 });
    }

    // Simulate streaming delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return Response.json({
      summary: 'This is a three-sentence summary of the paper. It covers the key points concisely. The main findings are summarized effectively.',
      tokenUsage: { input: 1000, output: 100, total: 1100 },
      cost: 0.001,
      duration: 1.5,
    });
  }),
];

// AI Clue Cards API handlers
export const clueCardsHandlers = [
  // POST /api/ai/clue-cards/generate
  http.post(`${API_BASE}/ai/clue-cards/generate`, async ({ request }) => {
    const body = await request.json() as { paperId?: string };

    if (!body.paperId) {
      return Response.json({ error: 'Missing paperId' }, { status: 400 });
    }

    // Simulate streaming delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return Response.json({
      cards: [
        {
          id: 'card-1',
          type: 'research-question',
          content: 'What is the core research question?',
          confidence: 92,
          sourceLocation: { pageNumber: 1 },
        },
        {
          id: 'card-2',
          type: 'methodology',
          content: 'Novel deep learning architecture',
          confidence: 88,
          sourceLocation: { pageNumber: 3 },
        },
        {
          id: 'card-3',
          type: 'findings',
          content: '40% improvement in efficiency',
          confidence: 85,
          sourceLocation: { pageNumber: 7 },
        },
      ],
      tokenUsage: { input: 2000, output: 300, total: 2300 },
      cost: 0.002,
      duration: 2.3,
    });
  }),

  // GET /api/ai/clue-cards?paperId=123
  http.get(`${API_BASE}/ai/clue-cards`, ({ request }) => {
    const url = new URL(request.url);
    const paperId = url.searchParams.get('paperId');

    if (!paperId) {
      return Response.json({ error: 'Missing paperId parameter' }, { status: 400 });
    }

    return Response.json({
      cards: [
        {
          id: 'card-1',
          type: 'research-question',
          content: 'What is the core research question?',
          confidence: 92,
          sourceLocation: { pageNumber: 1 },
        },
      ],
    });
  }),
];

// Combined handlers for all APIs
export const allHandlers = [
  ...intelligenceBriefHandlers,
  ...clipSummaryHandlers,
  ...clueCardsHandlers,
];
