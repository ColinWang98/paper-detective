# Brief Versioning - Database Schema Design

**Document Owner:** architect
**Created:** 2026-02-11
**Status:** 🚀 IN DESIGN

---

## Overview

Design a database schema to support:
1. **Brief Versioning** - Store multiple versions of briefs
2. **Editing History** - Track all changes with metadata
3. **Version Comparison** - Enable diff between versions
4. **Storage Efficiency** - Handle growth without performance degradation

---

## Current State Analysis

### Existing Schema (Sprint 4)

```typescript
interface IntelligenceBrief {
  id: number;
  paperId: number;
  caseFile: CaseFileInfo;
  clipSummary: string;  // Summary text
  structuredInfo: StructuredInfo;  // Research questions, methods, findings
  clueCards: AIClueCard[];
  userHighlights: UserHighlightsAnalysis;
  metadata: BriefMetadata;
  createdAt: string;
  updatedAt: string;
}
```

**Storage:** IndexedDB (via Dexie.js)
**Location:** `lib/store.ts` using `dbHelpers`

### Limitations
- ❌ No version history
- ❌ No edit tracking
- ❌ Single version per brief
- ❌ No comparison capability

---

## Proposed Schema

### 1. Brief Version Table

```typescript
interface BriefVersion {
  id: number;                    // Unique version ID
  briefId: number;               // Parent brief ID
  versionNumber: number;           // Sequential version (1, 2, 3...)
  status: 'draft' | 'published' | 'archived';  // Version status

  // Content
  caseFile: CaseFileInfo;
  clipSummary: string;
  structuredInfo: StructuredInfo;
  clueCards: AIClueCard[];
  userHighlights: UserHighlightsAnalysis;

  // Metadata
  createdAt: string;              // When this version was created
  createdBy: 'ai' | 'user';     // Who created this version
  editedAt?: string;              // Last edit time (if user-created)
  editCount?: number;             // Number of edits (for user versions)

  // Editor state (for draft versions)
  editorState?: {
    selection?: { start: number; end: number };
    scrollPosition?: number;
    unsavedChanges?: boolean;
  };
}
```

### 2. Brief Parent Table (Updated)

```typescript
interface IntelligenceBrief {
  id: number;
  paperId: number;

  // Version tracking
  currentVersionId: number;       // Points to active version
  totalVersions: number;           // Count of all versions
  latestPublishedVersion?: number;  // Latest non-draft version

  // Quick access
  hasUnpublishedEdits: boolean;  // User has drafts not published

  // Original brief (first AI-generated version)
  originalBrief: {
    caseFile: CaseFileInfo;
    clipSummary: string;
    structuredInfo: StructuredInfo;
    clueCards: AIClueCard[];
    createdAt: string;
  };

  createdAt: string;
  updatedAt: string;
}
```

### 3. Version Diff Table

```typescript
interface BriefVersionDiff {
  id: number;
  fromVersionId: number;
  toVersionId: number;

  // Computed diff
  changes: VersionChange[];
  summary: string;               // Human-readable summary
  changeCount: number;           // Number of changed sections

  createdAt: string;
}
```

```typescript
interface VersionChange {
  type: 'added' | 'deleted' | 'modified' | 'moved';
  section: 'caseFile' | 'clipSummary' | 'structuredInfo' | 'clueCards' | 'userHighlights';
  fieldPath?: string;             // For nested changes (e.g., 'clueCards.0.title')
  oldValue?: any;
  newValue?: any;
}
```

---

## Storage Strategy

### Option A: Enhanced IndexedDB (Recommended for MVP)

**Pros:**
- ✅ No migration needed
- ✅ Client-side only (no server dependency)
- ✅ Fast implementation (2-3 days)
- ✅ Works offline

**Cons:**
- ❌ Limited storage (quota: ~50-100MB per origin)
- ❌ No cross-device sync
- ⚠️ Performance concerns with large version history

**Mitigation:**
- Implement version limits (max 10 versions per brief)
- Compress old version data
- Archive strategy (move old versions to cold storage)

### Option B: Hybrid (IndexedDB + Cloud)

**Pros:**
- ✅ Cross-device sync
- ✅ Unlimited storage potential
- ✅ Backup capability

**Cons:**
- ❌ Server cost and complexity
- ❌ Requires authentication
- ❌ Longer implementation (5-7 days)

**Recommendation:** Start with Option A, plan Option B for future

---

## Database Operations

### Version Creation

```typescript
// When user edits a brief, create new version
async function createBriefVersion(
  briefId: number,
  content: Partial<BriefVersion>,
  status: 'draft' | 'published'
): Promise<number> {
  // 1. Validate content
  // 2. Increment version number
  // 3. Store version
  // 4. Update parent brief
  // 5. Generate diff from previous version
}
```

### Version Retrieval

```typescript
// Get specific version
async function getVersion(briefId: number, versionId: number): Promise<BriefVersion>

// Get version list
async function getVersionHistory(briefId: number): Promise<BriefVersion[]>

// Compare two versions
async function compareVersions(
  briefId: number,
  versionId1: number,
  versionId2: number
): Promise<BriefVersionDiff>
```

### Version Publishing

```typescript
// Promote draft to published
async function publishVersion(briefId: number, versionId: number): Promise<void> {
  // 1. Validate version
  // 2. Update status to 'published'
  // 3. Update parent brief.currentVersionId
  // 4. Archive old published version if needed
}
```

### Version Deletion

```typescript
// Delete specific version
async function deleteVersion(briefId: number, versionId: number): Promise<void> {
  // 1. Prevent deleting current version
  // 2. Delete version record
  // 3. Cleanup orphaned diffs
}
```

---

## Migration Plan

### Phase 1: Schema Migration (Day 2)

**Tasks:**
1. Add new tables to IndexedDB
2. Create indexes for performance
3. Migrate existing briefs to new schema
4. Verify data integrity

**Indexes:**
```typescript
// Brief versions
- index: 'briefId_versionNumber', unique: true
- index: 'briefId_createdAt'
- index: 'status_createdAt'

// Version diffs
- index: 'briefId_fromVersionId_toVersionId', unique: true
- index: 'briefId_createdAt'
```

### Phase 2: API Migration (Day 2-3)

**Tasks:**
1. Add version CRUD endpoints to `/api/brief/`
2. Add comparison endpoint
3. Update existing brief retrieval to support versions
4. Add migration script for existing data

---

## Performance Considerations

### Storage Optimization

1. **Version Limits**
   - Max 10 active versions per brief
   - Auto-archive versions older than 5th
   - Compress archived version data

2. **Lazy Loading**
   - Load version list on-demand (not all at once)
   - Paginate version history (20 per page)
   - Cache current version in memory

3. **Diff Computation**
   - Compute diffs on-demand (not pre-compute)
   - Cache recent diffs (last 5 comparisons)
   - Use efficient diff algorithm (JSON-diff)

### Estimated Storage Growth

**Assumptions:**
- Average brief size: 50KB (JSON)
- Average versions per brief: 5
- Total briefs: 100 user papers

**Calculation:**
```
Base storage: 100 briefs × 50KB = 5MB
Version overhead: 100 × 5 versions × 50KB = 25MB
Diff storage: ~20% = 10MB
Total estimated: 40MB
```

**Status:** ✅ Well within IndexedDB limits

---

## Data Integrity

### Constraints

1. **Parent-Child Integrity**
   - Brief cannot be deleted if versions exist
   - Versions must belong to valid brief
   - Cascade delete versions when brief deleted

2. **Version Numbering**
   - Sequential, no gaps (1, 2, 3...)
   - Published versions only
   - Drafts don't increment counter

3. **Status Transitions**
   ```
   draft → published (publish)
   published → archived (auto-archive old)
   archived → deleted (if not current)
   ```

### Validation Rules

1. **Version Content**
   - All required fields present
   - Data size < 1MB per version
   - Valid JSON structure

2. **Diff Accuracy**
   - All changes tracked
   - Old/new values correct
   - Change type accurate

---

## Implementation Priority

### P0 (Must Have)
- [ ] Brief version storage
- [ ] Version creation/retrieval APIs
- [ ] Basic version history UI
- [ ] Data migration script

### P1 (Should Have)
- [ ] Version diff computation
- [ ] Side-by-side comparison UI
- [ ] Version search/filtering
- [ ] Performance optimization (pagination, caching)

### P2 (Nice to Have)
- [ ] Version merge capability
- [ ] Conflict resolution
- [ ] Advanced diff visualization
- [ ] Version tagging/labeling

---

## Open Questions

### For Product Manager

1. **Version Limits:** Should we limit to 10 versions total or 10 published versions + unlimited drafts?
2. **Auto-Archive:** When should versions auto-archive (age-based or count-based)?
3. **Storage Strategy:** Confirm IndexedDB-only vs. hybrid approach?
4. **Migration Disruption:** Can we tolerate app downtime during migration?

### For UX Designer

1. **Version History Layout:** Timeline view vs. list view?
2. **Comparison Interface:** Side-by-side or unified diff view?
3. **Edit Indicators:** How to show which version is currently being edited?
4. **Undo/Redo:** Should we support undo/redo within the editor?

---

## Summary

**Recommended Approach:**

1. **Phase 1 (Day 2-3):** Implement core versioning
   - Enhanced IndexedDB schema
   - Basic CRUD operations
   - Simple version list UI

2. **Phase 2 (Day 4-5):** Add comparison features
   - Diff computation
   - Side-by-side comparison UI
   - Advanced filtering

3. **Phase 3 (Day 6-7):** Polish and optimize
   - Performance optimization
   - Advanced features (merge, tags)
   - Comprehensive testing

**Estimated Total Effort:** 5-7 days

---

**Status:** ✅ DESIGN COMPLETE - Ready for review

**Next Steps:** Product manager review, then begin implementation
