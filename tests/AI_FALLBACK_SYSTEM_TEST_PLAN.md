# AI Fallback System Test Plan

**Test Architect**: test-architect-2
**Related Task**: Task #19 (Claude API Fallback Solution)
**Date**: 2026-02-10

---

## Executive Summary

**Objective**: Validate the 4-level AI fallback system implemented by senior-developer-2

**System Overview**:
- Level 1: Claude API (normal operation)
- Level 2: Retry with exponential backoff
- Level 3: Rule-based analysis (keyword + regex matching)
- Level 4: Pre-generated demo data

**Key Benefits**:
- 100% reliability - always returns results
- Cost optimization - rule-based is free
- Performance - <1s vs 10s for API calls

---

## Test Strategy

### Phase 1: Unit Testing (Individual Components)

#### 1.1 Rule-Based Analysis Tests

**Test Case 1.1.1: Keyword Matching**
- **Input**: PDF text containing research keywords
- **Expected**: Correct card type identification
- **Assertions**:
  - Questions identified when "research question", "investigate", "examine" present
  - Methods identified when "method", "approach", "algorithm" present
  - Findings identified when "result", "finding", "shows" present
  - Limitations identified when "limitation", "constraint", "future work" present

**Test Case 1.1.2: Regex Pattern Matching**
- **Input**: Text with variations of result statements
- **Expected**: Pattern matches correctly
- **Test Data**:
  - "The results show that..." (finding)
  - "Our method achieves..." (finding)
  - "A significant improvement was..." (finding)
  - "However, our study has limitations..." (limitation)

**Test Case 1.1.3: Confidence Scoring**
- **Input**: Cards with different match qualities
- **Expected**: Appropriate confidence scores (0-100)
- **Assertions**:
  - Multiple keyword matches > single match
  - Regex matches > keyword only
  - Context-aware scoring

#### 1.2 Retry Logic Tests

**Test Case 1.2.1: Exponential Backoff**
- **Input**: API failure on first attempt
- **Expected**: Retry with 1s, 2s, 4s delays
- **Assertions**:
  - First retry: 1000ms delay
  - Second retry: 2000ms delay
  - Third retry: 4000ms delay
  - Max retries: 3

**Test Case 1.2.2: Retry Success**
- **Input**: API fails twice, succeeds on third try
- **Expected**: Returns valid result after retries
- **Assertions**:
  - Total time: ~7s (1s + 2s + 4s delays)
  - Result is valid
  - Method reported as 'retry'

#### 1.3 Demo Data Tests

**Test Case 1.3.1: Demo Card Generation**
- **Input**: Request when all other levels fail
- **Expected**: Returns pre-generated demo cards
- **Assertions**:
  - 4 cards generated (one per type)
  - All required fields present
  - Confidence scores set appropriately
  - Source marked as 'demo-data'

---

### Phase 2: Integration Testing (Fallback Flow)

#### 2.1 Normal Operation (Level 1)

**Test Case 2.1.1: Successful API Call**
- **Setup**: Valid API key, network available
- **Action**: Generate clue cards
- **Expected**:
  - Claude API called
  - Returns AI-generated cards
  - Source: 'ai-generated'
  - Confidence: >80
  - Response time: <10s

**Test Case 2.1.2: API Key Missing**
- **Setup**: No API key configured
- **Action**: Generate clue cards
- **Expected**:
  - Skips Level 1
  - Proceeds to Level 3 (rule-based)
  - Returns rule-based cards
  - Source: 'rule-based'

#### 2.2 Retry Level (Level 2)

**Test Case 2.2.1: API Rate Limit**
- **Setup**: Mock rate limit response (429)
- **Action**: Generate clue cards
- **Expected**:
  - Detects rate limit error
  - Initiates retry with backoff
  - Retries up to 3 times
  - Falls back to Level 3 if all retries fail

**Test Case 2.2.2: Network Timeout**
- **Setup**: Mock network timeout
- **Action**: Generate clue cards
- **Expected**:
  - Detects timeout error
  - Retries with exponential backoff
  - Falls back to Level 3 if all retries fail

#### 2.3 Rule-Based Level (Level 3)

**Test Case 2.3.1: Keyword Extraction Success**
- **Setup**: API unavailable, PDF with clear structure
- **Action**: Generate clue cards
- **Expected**:
  - Extracts cards based on keywords
  - Returns 2-10 cards
  - Source: 'rule-based'
  - Confidence: 50-70 (lower than AI)
  - Response time: <1s

**Test Case 2.3.2: Low Quality Text**
- **Setup**: API unavailable, PDF with poor structure
- **Action**: Generate clue cards
- **Expected**:
  - Extracts minimal cards (1-3)
  - Falls back to Level 4 if <2 cards

#### 2.4 Demo Data Level (Level 4)

**Test Case 2.4.1: Complete Failure**
- **Setup**: API down, rule-based fails
- **Action**: Generate clue cards
- **Expected**:
  - Returns 4 demo cards (one per type)
  - Source: 'demo-data'
  - Confidence: ~50 (baseline)
  - Clearly marked as demo data
  - Never shows as user-generated

---

### Phase 3: Performance Testing

#### 3.1 Response Time Tests

**Test Case 3.1.1: Level 1 Performance**
- **Target**: <10s for AI generation
- **Measurement**: Time from request to response
- **Acceptance**: 95% of requests under 10s

**Test Case 3.1.2: Level 2 Performance**
- **Target**: <7s for retry with backoff
- **Measurement**: Time including retries
- **Acceptance**: All retries complete in <7s

**Test Case 3.1.3: Level 3 Performance**
- **Target**: <1s for rule-based
- **Measurement**: Time for keyword extraction
- **Acceptance**: 100% of requests under 1s

**Test Case 3.1.4: Level 4 Performance**
- **Target**: <100ms for demo data
- **Measurement**: Time to return demo cards
- **Acceptance**: 100% of requests under 100ms

#### 3.2 Cost Tracking Tests

**Test Case 3.2.1: Cost per Level**
- **Level 1**: ~$0.005-0.008 (Claude API)
- **Level 2**: ~$0.01-0.02 (multiple API calls)
- **Level 3**: $0.00 (rule-based, free)
- **Level 4**: $0.00 (demo data, free)

**Test Case 3.2.2: Cost Optimization**
- **Scenario**: 100 papers, 50% API failures
- **Expected Cost**: ~$0.25-0.40 (vs $0.50-0.80 without fallback)
- **Savings**: 50% cost reduction

---

### Phase 4: Error Handling Tests

#### 4.1 API Error Scenarios

**Test Case 4.1.1: Invalid API Key**
- **Error**: 401 Unauthorized
- **Expected**: Skip to Level 3 immediately
- **Message**: "API key invalid, using rule-based analysis"

**Test Case 4.1.2: Rate Limit (429)**
- **Error**: Too many requests
- **Expected**: Retry with backoff, then Level 3
- **Message**: "Rate limited, retrying..."

**Test Case 4.1.3: Network Error**
- **Error**: Connection timeout
- **Expected**: Retry with backoff, then Level 3
- **Message**: "Network error, retrying..."

**Test Case 4.1.4: Parse Error**
- **Error**: Invalid JSON response
- **Expected**: Retry once, then Level 3
- **Message**: "Parse error, falling back..."

#### 4.2 Edge Cases

**Test Case 4.2.1: Empty PDF Text**
- **Input**: Empty string
- **Expected**: Returns demo cards (Level 4)
- **Message**: "No text available, using demo cards"

**Test Case 4.2.2: Very Long PDF**
- **Input**: 100+ pages
- **Expected**: Rule-based handles efficiently
- **Performance**: Still <1s for Level 3

**Test Case 4.2.3: Special Characters**
- **Input**: Text with unicode, math symbols
- **Expected**: Regex patterns still work
- **Result**: Cards generated correctly

---

### Phase 5: User Experience Tests

#### 5.1 Transparency Tests

**Test Case 5.1.1: Method Reporting**
- **Assertion**: Each card reports its source
- **Fields**:
  - `source`: 'ai-generated' | 'retry' | 'rule-based' | 'demo-data'
  - `confidence`: 0-100 score
  - `fallbackReason`: Explanation if not Level 1

**Test Case 5.1.2: User Notification**
- **When**: Not using primary Claude API
- **Expected**: Clear indicator to user
- **Message**: "Using rule-based analysis (API unavailable)"

#### 5.2 Quality Degradation Tests

**Test Case 5.2.1: Confidence Scores by Level**
- **Level 1** (AI): 80-95 confidence
- **Level 2** (Retry): 80-95 confidence
- **Level 3** (Rule): 50-70 confidence
- **Level 4** (Demo): 50 confidence

**Test Case 5.2.2: User Understanding**
- **Goal**: User knows result quality
- **Implementation**:
  - Confidence badges on cards
  - Source indicator
  - "AI-generated" vs "Rule-based" vs "Demo" labels

---

## Test Execution Plan

### Manual Testing Checklist

**Setup**:
- [ ] Start development server
- [ ] Open browser DevTools
- [ ] Navigate to application
- [ ] Open Network tab

**Test Scenarios**:

**Scenario 1: Normal Operation**
- [ ] Upload PDF with API key set
- [ ] Generate clue cards
- [ ] Verify source is 'ai-generated'
- [ ] Check response time <10s
- [ ] Verify confidence >80

**Scenario 2: API Key Missing**
- [ ] Remove API key from settings
- [ ] Upload PDF
- [ ] Generate clue cards
- [ ] Verify source is 'rule-based'
- [ ] Check response time <1s
- [ ] Verify confidence 50-70

**Scenario 3: Rate Limit Simulation**
- [ ] Mock rate limit response
- [ ] Generate clue cards
- [ ] Verify retry attempts
- [ ] Check exponential backoff timing
- [ ] Verify fallback to rule-based

**Scenario 4: Demo Data**
- [ ] Provide empty PDF text
- [ ] Generate clue cards
- [ ] Verify 4 demo cards returned
- [ ] Check all types present
- [ ] Verify source is 'demo-data'

---

## Acceptance Criteria

### Functional Requirements
- ✅ All 4 levels work correctly
- ✅ Fallback chain is automatic
- ✅ No user action required
- ✅ Always returns results (100% reliability)

### Performance Requirements
- ✅ Level 1: <10s (95th percentile)
- ✅ Level 2: <7s total retry time
- ✅ Level 3: <1s rule-based
- ✅ Level 4: <100ms demo data

### Cost Requirements
- ✅ Level 3 & 4: $0.00 (free)
- ✅ Overall: 50% cost reduction vs API-only

### Quality Requirements
- ✅ Confidence scores accurately reflect source
- ✅ Users are informed of fallback level
- ✅ Demo data clearly marked
- ✅ No confusion about data quality

---

## Test Results Template

### Test Execution Log

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

**Phase 1: Unit Tests**
- Rule-Based Analysis: [Pass/Fail]
- Retry Logic: [Pass/Fail]
- Demo Data: [Pass/Fail]

**Phase 2: Integration Tests**
- Normal Operation: [Pass/Fail]
- Retry Level: [Pass/Fail]
- Rule-Based Level: [Pass/Fail]
- Demo Data Level: [Pass/Fail]

**Phase 3: Performance Tests**
- Response Times: [Pass/Fail]
- Cost Tracking: [Pass/Fail]

**Phase 4: Error Handling**
- API Errors: [Pass/Fail]
- Edge Cases: [Pass/Fail]

**Phase 5: User Experience**
- Transparency: [Pass/Fail]
- Quality Degradation: [Pass/Fail]

**Overall Result**: [PASS/FAIL]

**Issues Found**:
1. [Description]
2. [Description]

**Recommendations**:
- [Improvement 1]
- [Improvement 2]

---

## Sign-off

**Test Architect**: test-architect-2
**Date Created**: 2026-02-10
**Status**: ✅ Test plan complete, ready for execution

**Notes**:
- Comprehensive test coverage for all 4 fallback levels
- Performance targets aligned with system requirements
- Cost validation included
- User experience considered
- Ready for manual or automated testing execution
