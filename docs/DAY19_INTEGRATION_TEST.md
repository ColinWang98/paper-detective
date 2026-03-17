# Day 19 Integration Testing - Manual Test Plan

**Date**: 2026-02-11
**Sprint**: 4 - Day 19
**Focus**: API Integration and End-to-End Workflow Validation
**Tester**: Senior Developer 1

---

## Executive Summary

Due to test environment configuration issues (Next.js Web API polyfills), manual integration testing is required to validate:
1. API endpoint functionality
2. Complete user workflows
3. Error handling scenarios
4. Edge cases

**Goal**: Verify production readiness for user testing (Day 20-22)

---

## Test Environment Setup

### Prerequisites
- [x] Next.js application built successfully
- [x] All 10 API routes compiled
- [x] TypeScript compilation: 0 errors
- [ ] API Key configured (for AI features)
- [ ] Test PDF files ready

### Test Data Required
1. **Sample PDF**: Academic paper (5-10 pages)
2. **API Key**: Valid Claude API key
3. **Test Highlights**: Pre-created highlight data

---

## Test Plan

### Phase 1: API Endpoint Validation

#### Test 1.1: Intelligence Brief Generation

**Endpoint**: `POST /api/ai/intelligence-brief`

**Request Format**:
```json
{
  "paperId": 1,
  "pdfText": "Sample academic paper text...",
  "highlights": [
    {
      "id": 1,
      "text": "Important finding",
      "priority": "critical"
    }
  ],
  "forceRegenerate": false
}
```

**Expected Response** (Success):
```json
{
  "success": true,
  "data": {
    "paperId": 1,
    "caseFile": {
      "caseNumber": 142,
      "title": "Paper Title",
      "researchQuestion": "What is the research question?",
      "coreMethod": "Research methodology",
      "keyFindings": ["Finding 1", "Finding 2"],
      "completenessScore": 85
    },
    "clipSummary": "Three-sentence summary.",
    "structuredInfo": {
      "researchQuestion": "Detailed question",
      "methods": ["Method 1"],
      "findings": ["Finding 1"],
      "limitations": []
    },
    "clueCards": [],
    "userHighlights": {},
    "tokenUsage": {
      "input": 5000,
      "output": 1000,
      "total": 6000
    },
    "cost": 0.05,
    "duration": 5000,
    "generatedAt": "2026-02-11T10:00:00Z",
    "model": "claude-sonnet-4-5-20250514"
  }
}
```

**Test Cases**:

| Test ID | Scenario | Input | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| 1.1.1 | Valid request | paperId=1, pdfText=valid, highlights=[] | 200 OK with brief data | ⏳ TODO |
| 1.1.2 | Missing paperId | paperId=undefined | 400 Bad Request | ⏳ TODO |
| 1.1.3 | Invalid paperId type | paperId="string" | 400 Bad Request | ⏳ TODO |
| 1.1.4 | Empty pdfText | pdfText="" | 400 Bad Request | ⏳ TODO |
| 1.1.5 | PDF too long | pdfText (500K+ chars) | 400 Bad Request | ⏳ TODO |
| 1.1.6 | No API key | N/A (service not configured) | 401 Unauthorized | ⏳ TODO |
| 1.1.7 | Invalid highlights | highlights="not array" | 400 Bad Request | ⏳ TODO |
| 1.1.8 | Force regenerate | forceRegenerate=true | Fresh brief generated | ⏳ TODO |

#### Test 1.2: Retrieve Cached Brief

**Endpoint**: `GET /api/ai/intelligence-brief?paperId=1`

**Expected Response**:
```json
{
  "success": true,
  "data": { /* brief object */ }
}
```

**Test Cases**:

| Test ID | Scenario | Input | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| 1.2.1 | Cached brief exists | paperId=1 | 200 OK with brief | ⏳ TODO |
| 1.2.2 | No cached brief | paperId=999 | 200 OK with null data | ⏳ TODO |
| 1.2.3 | Invalid paperId | paperId="invalid" | 400 Bad Request | ⏳ TODO |
| 1.2.4 | Missing paperId | (no query param) | 400 Bad Request | ⏳ TODO |

#### Test 1.3: Delete Cached Brief

**Endpoint**: `DELETE /api/ai/intelligence-brief?paperId=1`

**Expected Response**:
```json
{
  "success": true,
  "message": "Intelligence brief deleted successfully"
}
```

**Test Cases**:

| Test ID | Scenario | Input | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| 1.3.1 | Delete existing | paperId=1 | 200 OK | ⏳ TODO |
| 1.3.2 | Delete non-existent | paperId=999 | 200 OK (idempotent) | ⏳ TODO |
| 1.3.3 | Invalid paperId | paperId="invalid" | 400 Bad Request | ⏳ TODO |

---

### Phase 2: Export API Validation

#### Test 2.1: Markdown Export

**Endpoint**: `POST /api/export/markdown`

**Test Cases**:

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| 2.1.1 | Valid brief | Markdown formatted string | ⏳ TODO |
| 2.1.2 | No brief data | Error response | ⏳ TODO |
| 2.1.3 | Malformed data | Graceful error | ⏳ TODO |

#### Test 2.2: BibTeX Export

**Endpoint**: `POST /api/export/bibtex`

**Test Cases**:

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| 2.1.1 | Valid brief | BibTeX formatted string | ⏳ TODO |
| 2.1.2 | Missing authors | Default "Unknown Author" | ⏳ TODO |
| 2.1.3 | Missing year | Default "n.d." | ⏳ TODO |

---

### Phase 3: End-to-End Workflow Tests

#### Test 3.1: Complete User Journey

**Scenario**: User uploads PDF, generates brief, exports to Markdown

**Steps**:
1. User opens application
2. Uploads PDF file
3. Clicks "Generate Intelligence Brief"
4. Views generated brief
5. Clicks "Export as Markdown"
6. Verifies downloaded file

**Expected Results**:
- ✅ Each step completes without errors
- ✅ UI shows progress indicators
- ✅ Brief displays correctly
- ✅ Export file contains all sections
- ✅ File downloads successfully

**Status**: ⏳ TODO

#### Test 3.2: Error Recovery Workflow

**Scenario**: User experiences API error, recovers gracefully

**Steps**:
1. Generate brief without API key configured
2. Verify error message displays
3. Configure API key
4. Retry brief generation
5. Verify success

**Expected Results**:
- ✅ Clear error message shown
- ✅ Recovery path is obvious
- ✅ Retry succeeds
- ✅ No data corruption

**Status**: ⏳ TODO

---

### Phase 4: Edge Cases and Performance

#### Test 4.1: Large PDF Handling

**Scenario**: Upload and process large PDF (50+ pages)

**Test Cases**:

| Test ID | PDF Size | Expected Behavior | Status |
|---------|----------|-------------------|--------|
| 4.1.1 | 10 pages | < 30 seconds | ⏳ TODO |
| 4.1.2 | 25 pages | < 60 seconds | ⏳ TODO |
| 4.1.3 | 50+ pages | Progress shown, completes | ⏳ TODO |

#### Test 4.2: Concurrent Requests

**Scenario**: Multiple brief generations simultaneously

**Test Cases**:

| Test ID | Concurrent Requests | Expected Behavior | Status |
|---------|---------------------|-------------------|--------|
| 4.2.1 | 2 requests | Both complete successfully | ⏳ TODO |
| 4.2.2 | 5 requests | All complete, no data corruption | ⏳ TODO |

#### Test 4.3: Invalid Data Handling

**Test Cases**:

| Test ID | Invalid Input | Expected Behavior | Status |
|---------|---------------|-------------------|--------|
| 4.3.1 | Special characters in PDF | Text processed correctly | ⏳ TODO |
| 4.3.2 | Unicode/multilingual text | Proper encoding | ⏳ TODO |
| 4.3.3 | Malformed JSON | Graceful error, no crash | ⏳ TODO |

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Brief generation time | < 30 seconds | - | ⏳ TODO |
| API response time | < 200ms | - | ⏳ TODO |
| Export generation | < 1 second | - | ⏳ TODO |
| Memory usage | < 500MB | - | ⏳ TODO |

---

## Test Execution Log

### Session 1: 2026-02-11 Morning

**Tester**: Senior Developer 1
**Environment**: Development
**API Key**: [Configured/Not Configured]

**Results**:
- Test 1.1.1: ⏳ Pending
- Test 1.1.2: ⏳ Pending
- [... more test results ...]

**Issues Found**:
1. [Issue description]
2. [Issue description]

**Notes**:
- [Additional observations]

---

## Completion Criteria

Integration testing is complete when:
- [ ] All P0 test cases executed
- [ ] Critical bugs identified and documented
- [ ] Performance baselines established
- [ ] User testing readiness confirmed

---

## Next Steps

After integration testing:
1. Fix any critical bugs found
2. Document workarounds if needed
3. Update user testing preparation
4. Report findings to team

---

**Document Status**: In Progress
**Last Updated**: 2026-02-11 10:00 AM
**Next Review**: After test execution
