# E2E Test Execution Guide

**For**: Task #49 - Test end-to-end highlight workflow
**Created by**: test-architect-2
**Date**: 2026-02-10

---

## Quick Start Guide

### Prerequisites
✅ Development server confirmed running (localhost:3002)
✅ All compilation errors fixed
✅ Production build successful

### Missing Components
⚠️ Test PDF files (need to be added to `tests/fixtures/pdfs/`)
⚠️ Manual browser testing required

---

## How to Execute E2E Tests

### Option 1: Quick Manual Test (15 minutes)

1. **Start the application**:
   ```bash
   npm run dev
   # Server runs on http://localhost:3002
   ```

2. **Open browser**:
   - Navigate to http://localhost:3002
   - Open DevTools (F12)
   - Go to Console tab

3. **Basic workflow test**:
   - Upload any PDF file from your computer
   - Select some text
   - Click "添加到收集箱"
   - Choose a priority color
   - Click "确定"
   - Check if highlight appears
   - Check if it shows in the Detective Notebook

4. **Verify persistence**:
   - Refresh the page (F5)
   - Check if highlight still exists
   - Open DevTools > Application > IndexedDB
   - Verify data is stored

### Option 2: Comprehensive Test (1-2 hours)

Follow the detailed test scenarios in `E2E_HIGHLIGHT_WORKFLOW_TEST_REPORT.md`:
1. Upload and Read Workflow
2. Create Highlights Workflow
3. Organize Highlights Workflow
4. Coordinate Accuracy Testing
5. HCI Requirements Validation

---

## Test Checklist (Quick Version)

### Critical Path (Must Pass)
- [ ] PDF uploads successfully
- [ ] Text can be selected
- [ ] Popup appears with "添加到收集箱"
- [ ] All 4 priority colors work
- [ ] Highlight appears on PDF
- [ ] Highlight appears in Notebook
- [ ] Data persists after refresh
- [ ] No console errors

### Performance Checks (Optional)
- [ ] Highlight creation feels instant (<200ms)
- [ ] Page navigation is smooth
- [ ] Zoom controls work without lag

---

## Test Data Preparation

### Required: Add Test PDFs

Create the following test files in `tests/fixtures/pdfs/`:

**1. Simple PDF** (`simple-1page.pdf`)
- 1-3 pages
- Plain text
- For basic functionality testing

**2. Medium PDF** (`medium-10pages.pdf`)
- 10-15 pages
- Mixed content
- For performance testing

**3. Large PDF** (`large-20pages.pdf`)
- 20+ pages
- Complex layout
- For stress testing

**How to create test PDFs**:
- Use any academic paper from your collection
- Or create sample PDFs with text editors
- Or download public domain papers from arXiv

---

## Expected Test Results

### What Should Work

**Text Selection**:
- Text highlights when you drag across it
- Selection is visible and clear

**Popup Menu**:
- Appears immediately after text selection
- Shows "添加到收集箱" button
- Shows 4 color options (Red, Yellow, Orange, Gray)

**Highlight Creation**:
- Clicking "确定" creates highlight instantly
- Highlight overlay appears on PDF
- Color matches selected priority

**Notebook Integration**:
- Highlight appears in "📥 收集箱" immediately
- Can drag highlights to custom groups
- Groups persist across refresh

**Data Persistence**:
- All data saved to IndexedDB
- Survives page refresh
- Survives browser restart

---

## Common Issues & Troubleshooting

### Issue: PDF doesn't upload
**Check**:
- File is a valid PDF
- File size is reasonable (<50MB)
- No console errors

### Issue: Text selection doesn't work
**Check**:
- PDF has text layer (not scanned images)
- Zoom level is appropriate
- DevTools console for errors

### Issue: Highlight doesn't appear
**Check**:
- Clicked "确定" button
- No console errors
- Check IndexedDB for data

### Issue: Data doesn't persist
**Check**:
- IndexedDB is enabled in browser
- No privacy mode blocking storage
- Check DevTools > Application > IndexedDB

---

## Recording Results

### Pass/Fail Criteria

**PASS**: All critical path items work
- PDF uploads ✅
- Highlights create ✅
- Data persists ✅
- No console errors ✅

**FAIL**: Any critical item fails
- Document what failed
- Record console errors
- Note steps to reproduce

### How to Report

1. **Update** `E2E_HIGHLIGHT_WORKFLOW_TEST_REPORT.md`
2. **Record** actual results in "Test Execution Log" section
3. **Note** any issues found
4. **Create** bug tickets for issues

---

## Next Steps After Testing

### If Tests Pass ✅
- Mark Task #49 as complete
- Proceed to next development tasks
- Deploy to staging for user testing

### If Tests Fail ❌
- Document all failures
- Create bug tickets
- Prioritize fixes
- Re-test after fixes

---

## Automated Testing (Future)

Once Jest and Playwright are installed:

1. **Install dependencies**:
   ```bash
   npm install --save-dev @playwright/test
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   ```

2. **Run automated tests**:
   ```bash
   npm run test:e2e
   ```

3. **View test report**:
   ```bash
   npm run test:e2e:report
   ```

---

## Questions?

Contact **test-architect-2** for:
- Test scenario clarification
- Bug reproduction help
- Test framework setup
- Result interpretation

---

**Status**: Ready for manual testing execution
**Server**: http://localhost:3002
**Test Report**: `tests/E2E_HIGHLIGHT_WORKFLOW_TEST_REPORT.md`
