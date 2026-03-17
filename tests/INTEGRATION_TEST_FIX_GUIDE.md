# Integration Test Mock Fix Guide

## Issue
The `optimistic-ui-updates.test.ts` file uses an outdated API method name that doesn't exist in the current `dbHelpers` implementation.

## Problem Details

**File**: `tests/integration/optimistic-ui-updates.test.ts`

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'mockResolvedValue')

mockDbHelpers.loadHighlights.mockResolvedValue([]);
```

**Root Cause**:
The test mocks `dbHelpers.loadHighlights()` but the actual implementation uses `dbHelpers.getHighlights()`.

## Solution

### Quick Fix (5 minutes)

In `tests/integration/optimistic-ui-updates.test.ts`, line 74:

**Before**:
```typescript
mockDbHelpers.loadHighlights.mockResolvedValue([]);
```

**After**:
```typescript
mockDbHelpers.getHighlights.mockResolvedValue([]);
```

### Complete Fix (if more instances exist)

1. Search for all occurrences of `loadHighlights` in the test file
2. Replace with `getHighlights`
3. Run tests to verify: `npm test -- tests/integration/optimistic-ui-updates.test.ts`

## Impact

**Priority**: P2 (doesn't block Sprint 4 development)

**Reasoning**:
- Unit tests: ✅ PASSING
- Performance tests: ✅ PASSING
- Jest infrastructure: ✅ OPERATIONAL
- Only affected: Optimistic UI integration tests (not P0 for Sprint 4)

**Blocker Status**: This fix can be done during Sprint 4 execution - it doesn't need to block PM approval or frontend implementation.

## Verification

After applying the fix, run:

```bash
# Test specific file
npm test -- tests/integration/optimistic-ui-updates.test.ts

# Or run all tests
npm test
```

Expected result: All 24 integration tests in `optimistic-ui-updates.test.ts` should PASS.

## Reference

**Current dbHelpers API** (from `lib/db.ts`):
```typescript
async getHighlights(paperId: number): Promise<Highlight[]> {
  return await db.highlights.where('paperId').equals(paperId).toArray();
}
```

**Test Mock Pattern**:
```typescript
const mockDbHelpers = {
  addHighlight: jest.fn(),
  updateHighlight: jest.fn(),
  deleteHighlight: jest.fn(),
  getHighlights: jest.fn(),  // ✅ Correct (not loadHighlights)
  getGroupsWithHighlights: jest.fn(),
};
```

---

**Status**: Fix documented, ready to apply when convenient
**Prepared by**: test-architect-v2
**Date**: 2025-02-11
