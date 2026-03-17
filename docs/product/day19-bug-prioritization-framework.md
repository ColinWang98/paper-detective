# Day 19 Bug Prioritization Framework - User Testing Perspective

**Document Owner**: product-manager-v2
**Purpose**: Prioritize integration testing bugs for Day 21-22 user testing
**Created**: 2026-02-11 (Day 19)

---

## Bug Severity Classification for User Testing

### P0 - CRITICAL (Blocks User Testing)
**Definition**: Bug that prevents user from completing any test task or causes data loss

**Examples**:
- Application crashes or freezes
- Intelligence Brief generation fails completely
- Export buttons don't work or generate empty files
- Navigation doesn't work (can't reach /brief page)
- PDF viewer doesn't load
- Highlights disappear after creation
- API returns 500 errors

**Action**: Fix BEFORE Day 21 user testing
**Timeline**: Fix within 4 hours (Day 19), max 8 hours (Day 20 morning)

---

### P1 - HIGH (Impacts User Testing, Workaround Exists)
**Definition**: Bug that significantly impacts user experience but doesn't block testing

**Examples**:
- Intelligence Brief generation takes >60 seconds (target: <30s)
- Export file has minor formatting issues
- UI elements overlap on certain screen sizes
- Progress indicator doesn't update smoothly
- Buttons have unclear labels
- Error messages are cryptic
- Loading states are missing

**Action**: Fix if time permits, otherwise document workaround
**Timeline**: Fix by end of Day 20, or document workaround for test sessions

---

### P2 - MEDIUM (Noticeable, Minimal Impact)
**Definition**: Bug that users notice but doesn't significantly impact testing

**Examples**:
- Minor visual inconsistencies (padding, alignment)
- Text typos in non-critical areas
- Animations are slightly jerky
- Non-optimal tab order
- Color contrast below optimal but still accessible
- Placeholder text still present

**Action**: Fix for Sprint 4.1 or Sprint 5
**Timeline**: Don't block user testing, note for post-test fixes

---

### P3 - LOW (Cosmetic, Hard to Notice)
**Definition**: Minor cosmetic issues that don't affect functionality

**Examples**:
- Pixel-level alignment issues
- Very minor text inconsistencies
- Console warnings (not errors)
- Non-critical accessibility warnings
- Code optimization opportunities

**Action**: Fix in future sprint
**Timeline**: Technical debt backlog

---

## User Testing Task Impact Assessment

For each bug found, assess impact on the 6 test tasks:

### Task 1: Upload PDF and Create Highlights
**Critical Path**:
- Upload button works
- PDF renders in viewer
- Highlight tool works (red, yellow, orange)
- Highlights appear in Detective Notebook

**P0 Bugs**: Upload fails, PDF doesn't render, highlights don't save
**P1 Bugs**: Highlight tool slow to respond, colors hard to distinguish

---

### Task 2: Generate and View Intelligence Brief
**Critical Path**:
- "Generate Intelligence Brief" button visible
- Generation progress shows
- Brief completes and displays
- All sections visible (case file, clip summary, structured info, cards)

**P0 Bugs**: Generation fails, brief doesn't display, sections missing
**P1 Bugs**: Generation >60s, progress unclear, sections hard to find

---

### Task 3: Find Information Using Search
**Critical Path**:
- Search input accessible
- Search executes
- Results display
- Filters work
- Results navigate to source

**P0 Bugs**: Search doesn't work, no results when expected, navigation fails
**P1 Bugs**: Search slow, results unclear, filters confusing

---

### Task 4: Export Notes as Markdown
**Critical Path**:
- Export button visible
- Markdown format selectable
- Download triggers
- File contains content

**P0 Bugs**: Export button doesn't work, download fails, empty file
**P1 Bugs**: Format selection unclear, file missing metadata

---

### Task 5: Organize Highlights into Groups
**Critical Path**:
- Detective Notebook accessible
- Create group works
- Drag-and-drop functions
- Groups persist

**P0 Bugs**: Notebook doesn't load, groups can't be created, drag-drop fails
**P1 Bugs**: Drag-drop awkward, UI unclear

---

### Task 6: Read AI Clue Cards and Navigate
**Critical Path**:
- Cards visible and readable
- Card types distinguishable
- "Go to Source" button works
- PDF navigates to correct location

**P0 Bugs**: Cards don't display, navigation fails, wrong location
**P1 Bugs**: Card types hard to distinguish, navigation slow

---

## Bug Triage Decision Matrix

| Bug | Affected Tasks | Users Affected | Workaround | Priority |
|-----|---------------|----------------|------------|----------|
| [Example] Brief gen fails | Task 2 | 100% | None | **P0** |
| [Example] Slow search | Task 3 | 50% | Wait longer | **P1** |
| [Example] Typos in header | All | 100% | Ignore | **P3** |

**Decision Rules**:
- Blocks ANY critical task → P0
- Affects >50% users, no workaround → P0
- Affects <50% users, has workaround → P1
- Cosmetic only → P2/P3

---

## Day 19 Bug Review Process

### During Integration Testing

1. **Log Bug**: test-architect-v2 documents in issue tracker
2. **Assess Severity**: product-manager-v2 applies P0/P1/P2/P3
3. **Estimate Fix**: senior-developer-v2 estimates time
4. **Make Decision**: team-lead decides fix vs. workaround

### End of Day 19 Review

**For Each P0 Bug**:
- [ ] Can fix in <4 hours? → Fix on Day 19
- [ ] Can fix in 4-8 hours? → Fix on Day 20 morning
- [ ] Takes >8 hours? → Escalate to team-lead for decision

**For Each P1 Bug**:
- [ ] Fix by end of Day 20? → Add to Day 20 tasks
- [ ] Or document workaround for user testing?

**For P2/P3 Bugs**:
- [ ] Add to technical debt backlog
- [ ] Don't affect Day 21-22 user testing

---

## User Testing Go/No-Go Criteria

### GO Criteria (Proceed with User Testing)
- [ ] 0 P0 bugs remaining
- [ ] All 6 test tasks completable
- [ ] No data loss or crashes
- [ ] Export features work (Markdown, BibTeX)
- [ ] Intelligence Brief generates successfully

### NO-GO Criteria (Postpone User Testing)
- [ ] Any P0 bug unfixed after Day 20
- [ ] Any critical task (1-6) blocked
- [ ] Data loss or crashes
- [ ] Export or Brief generation fails

### GO WITH LIMITATIONS (Proceed + Document)
- [ ] P1 bugs present with workarounds
- [ ] Minor performance issues (<10s impact)
- [ ] Non-critical features have issues

---

## Bug Reporting Template

```markdown
### Bug #[ID]: [Brief Description]

**Severity**: P0 / P1 / P2 / P3
**Affected Tasks**: [List tasks 1-6]
**Users Affected**: [% estimated]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]

**Workaround**: [If exists]
**Impact on User Testing**: [Low/Medium/High]

**Estimated Fix Time**: [Hours]
**Assigned To**: [Developer]

**Decision**: [Fix Day 19 / Fix Day 20 / Workaround / Postpone]
```

---

## Communication Protocol

**When P0 Bug Found**:
- test-architect-v2 → Immediately message team-lead and product-manager-v2
- product-manager-v2 → Assess user testing impact within 30 min
- senior-developer-v2 → Provide fix estimate within 30 min
- team-lead → Make fix vs. postpone decision

**When Bug Fixed**:
- senior-developer-v2 → Message team with fix details
- test-architect-v2 → Verify fix and update issue status
- product-manager-v2 → Update user testing materials if needed

---

## Day 20 Morning Checklist

Before recruitment launches at 9:00 AM:

- [ ] Review all P0 bugs from Day 19
- [ ] Confirm all P0 bugs fixed or have workaround
- [ ] Verify all 6 test tasks still work
- [ ] Test Intelligence Brief generation end-to-end
- [ ] Test Markdown export end-to-end
- [ ] Test BibTeX export end-to-end
- [ ] Make GO/NO-GO decision for user testing

**Decision Matrix**:
- All clear → Proceed with recruitment and user testing
- Minor issues → Proceed + document workarounds
- Critical issues → Halt recruitment, escalate to team-lead

---

## Contingency Plans

### Scenario A: P0 Bug Found Day 19 Afternoon

**If fixable <4 hours**:
- Fix on Day 19
- Proceed with Day 20 recruitment

**If fixable 4-8 hours**:
- senior-developer-v2 fixes Day 20 morning (8-10 AM)
- Delay recruitment to 10 AM
- Test sessions still possible Day 21-22

**If fixable >8 hours**:
- Assess impact on test tasks
- If Task 2 (Brief gen) affected → Postpone user testing to Day 23-24
- If other tasks affected → Consider modified testing (skip affected task)

### Scenario B: Multiple P1 Bugs Found Day 19

**Assessment**:
- Count bugs affecting each test task
- If any task has >2 P1 bugs → High risk for user testing
- Consider extending Day 20 to fix P1s

**Decision**:
- Fix critical P1s on Day 20
- Document workarounds for remaining P1s
- Proceed with user testing if tasks are completable

---

## Success Metrics

**Day 19 Goals**:
- Find and document all integration bugs
- Fix 100% of P0 bugs
- Fix 80% of P1 bugs
- Document workarounds for remaining bugs

**Day 20 Goals**:
- 0 P0 bugs remaining
- All 6 test tasks verified working
- User testing materials aligned with actual implementation
- Recruitment launches on schedule

**Day 21-22 Goals**:
- 5 successful user sessions
- All users complete all 6 tasks
- Collect valid SUS/NPS data
- Identify improvement opportunities

---

**Document Status**: ✅ READY FOR USE

**Owner**: product-manager-v2
**Stakeholders**: team-lead, test-architect-v2, senior-developer-v2

**Last Updated**: 2026-02-11 (Day 19)
**Next Review**: End of Day 19 bug triage

**Let's find and fix bugs before users find them! 🐛→🔧→✅**
