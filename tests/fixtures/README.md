# Test Fixtures Directory

**Purpose**: Sample data for testing Sprint 4 features

---

## Directory Structure

```
fixtures/
├── papers/              # Sample PDF files for testing
│   ├── simple-1page.pdf
│   ├── medium-10pages.pdf
│   ├── large-50pages.pdf
│   └── special-chars.pdf
├── highlights/          # Sample highlight data
│   ├── single-highlight.json
│   ├── multiple-highlights.json
│   └── all-types.json
└── exports/             # Expected export outputs
    ├── expected-markdown.md
    └── expected-bibtex.bib
```

---

## Required Fixtures

### 1. Papers (To be added)

**simple-1page.pdf**
- Purpose: Basic functionality testing
- Content: Single page with simple text
- Size: <50KB

**medium-10pages.pdf**
- Purpose: Performance testing
- Content: 10 pages academic paper
- Size: ~200KB

**large-50pages.pdf**
- Purpose: Stress testing
- Content: 50 pages dissertation
- Size: ~1MB

**special-chars.pdf**
- Purpose: Encoding testing
- Content: Math symbols, unicode, non-English characters
- Size: ~100KB

### 2. Highlights

**single-highlight.json**
```json
{
  "paperId": 1,
  "highlights": [
    {
      "id": "hl-001",
      "text": "Sample highlight text",
      "color": "red",
      "pageNumber": 1,
      "position": { "x": 100, "y": 200, "width": 300, "height": 20 }
    }
  ]
}
```

**multiple-highlights.json**
```json
{
  "paperId": 1,
  "highlights": [
    { "id": "hl-001", "text": "First highlight", "color": "red", "pageNumber": 1 },
    { "id": "hl-002", "text": "Second highlight", "color": "yellow", "pageNumber": 2 },
    { "id": "hl-003", "text": "Third highlight", "color": "orange", "pageNumber": 3 }
  ]
}
```

**all-types.json**
```json
{
  "paperId": 1,
  "highlights": [
    { "id": "hl-001", "text": "Red priority", "color": "red", "pageNumber": 1 },
    { "id": "hl-002", "text": "Yellow priority", "color": "yellow", "pageNumber": 1 },
    { "id": "hl-003", "text": "Orange priority", "color": "orange", "pageNumber": 2 },
    { "id": "hl-004", "text": "Gray priority", "color": "gray", "pageNumber": 2 }
  ]
}
```

### 3. Expected Exports

**expected-markdown.md**
```markdown
# Case File #1: Paper Title

## Research Question
Test research question

## Methods
- Method 1
- Method 2

## Findings
- Finding 1
- Finding 2

## Limitations
- Limitation 1

## User Highlights
### Red Priority
- Highlight 1

### Yellow Priority
- Highlight 2
```

**expected-bibtex.bib**
```bibtex
@article{paper2024,
  title={Paper Title},
  author={Author Name},
  journal={Journal Name},
  year={2024},
  volume={1},
  pages={1--10}
}
```

---

## How to Add Fixtures

### Adding PDF Papers

1. Use academic papers from your collection
2. Or download public domain papers from arXiv
3. Place in `fixtures/papers/` directory
4. Update this README with metadata

### Adding Highlight Data

1. Export real highlights from the app
2. Anonymize sensitive information
3. Save as JSON in `fixtures/highlights/`
4. Update this README

### Adding Expected Exports

1. Manually create expected output
2. Or export from a trusted version of the app
3. Place in `fixtures/exports/`
4. Use for comparison in tests

---

## Usage in Tests

```typescript
// Load fixture in test
import singleHighlight from '../fixtures/highlights/single-highlight.json';

test('should export single highlight', () => {
  const result = exportAsMarkdown(singleHighlight);
  expect(result).toMatchSnapshot();
});
```

---

## Maintenance

- **Keep fixtures small**: Prefer minimal data over complete papers
- **Version control**: Commit fixture JSON, not PDF binaries (use Git LFS if needed)
- **Update frequently**: Add new edge cases as they're discovered
- **Document origin**: Note where fixtures came from

---

**Last Updated**: 2026-02-10 by test-architect-v2
**Status**: Ready for population
