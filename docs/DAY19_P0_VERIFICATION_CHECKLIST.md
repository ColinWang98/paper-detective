# P0 Functional Verification Checklist

**Date:** 2026-02-11 13:00
**Priority:** P0 - CRITICAL
**Team:** senior-dev-1 + senior-dev-2 + product-manager
**Estimated:** 30-45 minutes

---

## 🎯 Objective

Verify actual user-facing functionality works correctly (not test infrastructure).

**GO/NO-GO Impact:** This verification determines Day 20 recruitment decision.

---

## 🚀 Execution Steps

### Step 1: Start Development Server

```bash
cd paper-detective
npm run dev
```

**Expected Output:** Server starts on http://localhost:3000

**Status:** ⏳ Pending

---

### Step 2: Open Application

**URL:** http://localhost:3000

**Expected:** Application loads without errors

**Status:** ⏳ Pending

---

## 📋 9 Critical Verification Points

### ✅ Verification Point #1: PDF Upload and Processing

**Steps:**
1. Click "Upload PDF" button
2. Select a valid PDF file
3. Wait for upload and processing

**Expected Results:**
- [ ] File uploads successfully
- [ ] PDF renders in viewer
- [ ] No error messages
- [ ] File name displays correctly

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #2: Highlight Creation

**Steps:**
1. Select text in PDF
2. Click "Add Highlight" button
3. Verify highlight appears

**Expected Results:**
- [ ] Highlight creates successfully
- [ ] Highlight color displays
- [ ] Highlight persists on scroll
- [ ] Multiple highlights can be created

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #3: Intelligence Brief Generation

**Steps:**
1. Open PDF with highlights
2. Click "Generate Brief" button
3. Wait for generation (20-30 seconds)
4. Verify brief displays

**Expected Results:**
- [ ] Generation starts with loading indicator
- [ ] Brief generates successfully
- [ ] Brief displays correctly
- [ ] All sections present (summary, key insights, evidence cards)
- [ ] No crashes or errors

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #4: Markdown Export

**Steps:**
1. Open generated brief
2. Click "Export as Markdown" button
3. Verify file downloads

**Expected Results:**
- [ ] Export button clickable
- [ ] .md file downloads
- [ ] File contains proper markdown formatting
- [ ] File includes all brief sections
- [ ] No crashes or errors

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #5: BibTeX Export

**Steps:**
1. Open generated brief
2. Click "Export as BibTeX" button
3. Verify file downloads

**Expected Results:**
- [ ] Export button clickable
- [ ] .bib file downloads
- [ ] File contains valid BibTeX format
- [ ] Citation key generated correctly
- [ ] No crashes or errors

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #6: Error Handling (Missing API Key)

**Steps:**
1. Configure app without OpenAI API key
2. Attempt to generate brief
3. Verify error handling

**Expected Results:**
- [ ] Error message displays
- [ ] Message is clear and helpful
- [ ] No crashes
- [ ] User can retry after configuring key

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #7: Invalid PDF Handling

**Steps:**
1. Attempt to upload invalid/corrupted PDF
2. Verify error handling

**Expected Results:**
- [ ] Error message displays
- [ ] Message explains the issue
- [ ] No crashes
- [ ] User can try another file

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #8: All 6 User Test Tasks Completable

**User Test Tasks:**
1. Upload PDF and create highlights
2. Generate Intelligence Brief
3. Review brief sections
4. Export as Markdown
5. Export as BibTeX
6. Navigate between sections

**Steps:**
1. Walk through each task
2. Verify all can be completed
3. Document any blockers

**Expected Results:**
- [ ] All 6 tasks can be completed
- [ ] No blockers found
- [ ] User flows work end-to-end

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

### ✅ Verification Point #9: Application Responsiveness

**Checks:**
1. UI responds to clicks
2. Loading states display
3. No hangs or freezes
4. Smooth scrolling
5. Responsive to window resize

**Expected Results:**
- [ ] UI responsive throughout
- [ ] Loading indicators show
- [ ] No hangs/freezes
- [ ] Smooth performance

**Actual Results:**
```
[Tester notes here]
```

**Status:** ⏳ Pending

**Issues Found:** None / [Describe]

---

## 📊 Summary Results

### Verification Summary

**Total Verification Points:** 9
**Passed:** 0/9 (to be filled)
**Failed:** 0/9 (to be filled)
**P0 Bugs Found:** 0 (to be filled)

### Issues Identified

**P0 Bugs (Block User Testing):**
- None / [List]

**P1 Bugs (UX Issues):**
- None / [List]

**P2 Bugs (Code Quality):**
- Test failures: 291/495 (known, P2)
- ESLint errors: 69 (known, P2)

---

## 🎯 GO/NO-GO Assessment

### For product-manager

**GO Criteria (All Must Be YES):**
- [ ] All 9 verification points pass
- [ ] 0 P0 bugs found
- [ ] All 6 user test tasks can complete

**Assessment:**
- If all YES → ✅ **GO** for Day 20 recruitment
- If any NO → Assess impact, decide fix vs. workaround

**Decision:** [Pending verification results]

**Rationale:** [To be filled]

---

## 📝 Notes

**Tester Observations:**
```
[General notes about the verification process]
```

**Environment:**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari/Edge]
- Node version: [Run `node --version`]
- npm version: [Run `npm --version`]

**Time Started:** [To be filled]
**Time Completed:** [To be filled]
**Total Duration:** [To be filled]

---

## 🚀 Next Steps

### After Verification Complete

**If All Pass (GO):**
1. Document results in `docs/DAY19_INTEGRATION_TEST.md`
2. product-manager confirms GO decision
3. Day 20 recruitment proceeds

**If Issues Found (Assess):**
1. Document all issues with severity
2. product-manager assesses impact
3. Decide: fix now, workaround, or defer

---

**Document Version:** 1.0
**Created:** 2026-02-11 13:00
**Created By:** planner
**For:** senior-dev-1, senior-dev-2, product-manager

---

**Start verification immediately!** Focus on user-facing functionality, not test infrastructure. 🚀
