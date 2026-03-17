# Data Analysis Framework

**Purpose**: Framework for analyzing user testing data from Day 21-22
**For**: Paper Detective Sprint 4
**Analysis Dates**: Day 23-24
**Deliverable**: Comprehensive user testing report

---

## 📊 Analysis Overview

### Data Types Collected

**Quantitative Data** (Numbers):
- SUS scores (0-100 scale, 5 participants)
- NPS scores (0-10 scale, converted to -100 to +100)
- Task completion times (6 tasks × 5 participants = 30 data points)
- Task completion rates (% success per task)
- Error counts per task

**Qualitative Data** (Words):
- Think-aloud verbal protocol quotes
- Interview responses
- NPS follow-up explanations
- Facilitator observations
- Critical issue descriptions

### Analysis Goals

1. **Assess usability**: Is Paper Detective usable enough? (SUS ≥ 70)
2. **Measure loyalty**: Will users recommend it? (NPS ≥ +10)
3. **Identify problems**: What blocks or frustrates users?
4. **Generate insights**: What should we improve in Sprint 5?
5. **Inform decisions**: GO/NO-GO for production deployment

---

## 🧮 Part 1: Quantitative Analysis

### Step 1: SUS Score Analysis

**Individual Scores**:
```
Participant | SUS Score | Grade | Rating
-----------|-----------|-------|--------
P1         |  _____    |   _   |   ___
P2         |  _____    |   _   |   ___
P3         |  _____    |   _   |   ___
P4         |  _____    |   _   |   ___
P5         |  _____    |   _   |   ___

AVERAGE    |  _____    |   _   |   ___
MEDIAN     |  _____    |       |
MIN        |  _____    |       |
MAX        |  _____    |       |
STD DEV    |  _____    |       |
```

**Interpretation Framework**:
- **≥ 80**: Excellent (A grade) - World-class usability
- **70-79**: Good (B-C grade) - Acceptable, minor issues
- **65-69**: Marginal (D grade) - Needs improvement
- **< 65**: Poor (F grade) - Major usability problems

**Success Criterion**:
- ✅ **PASS**: Average SUS ≥ 70
- ⚠️ **MARGINAL**: Average SUS 65-69
- ❌ **FAIL**: Average SUS < 65

---

### Step 2: NPS Score Analysis

**Individual Scores**:
```
Participant | NPS (0-10) | Category | Why (Key reason)
-----------|------------|----------|------------------
P1         |    ____    |    ___   | _______________
P2         |    ____    |    ___   | _______________
P3         |    ____    |    ___   | _______________
P4         |    ____    |    ___   | _______________
P5         |    ____    |    ___   | _______________

PROMOTERS (9-10): _____ out of 5 = _____%
PASSIVES (7-8):   _____ out of 5 = _____%
DETRACTORS (0-6): _____ out of 5 = _____%

NPS = % Promoters - % Detractors = _____
```

**Interpretation Framework**:
- **≥ +50**: Excellent - Strong loyalty
- **+30 to +49**: Good - Solid loyalty
- **+10 to +29**: OK - Moderate loyalty
- **-10 to +9**: Marginal - Mixed feelings
- **< -10**: Poor - Major issues

**Success Criterion**:
- ✅ **PASS**: NPS ≥ +10
- ⚠️ **MARGINAL**: NPS 0 to +9
- ❌ **FAIL**: NPS < 0

---

### Step 3: Task Completion Analysis

**Completion Rates**:
```
Task | Target Time | Avg Time | Status | Success Rate | Met Target?
-----|-------------|----------|--------|--------------|------------
1. Upload PDF       | <5 min  | ___:___ |   ___  |    _____%   |     [ ]
2. Generate Brief   | <3 min  | ___:___ |   ___  |    _____%   |     [ ]
3. Advanced Search  | <4 min  | ___:___ |   ___  |    _____%   |     [ ]
4. Export Markdown  | <2 min  | ___:___ |   ___  |    _____%   |     [ ]
5. Organize         | <3 min  | ___:___ |   ___  |    _____%   |     [ ]
6. AI Clue Cards    | <3 min  | ___:___ |   ___  |    _____%   |     [ ]

OVERALL:            | <20 min | ___:___ |   ___  |    _____%   |     [ ]
```

**Interpretation**:
- **≥ 80% completion**: Good workflow
- **60-79% completion**: Moderate issues
- **< 60% completion**: Major usability problems

**Priority Framework**:
- **Tasks with < 60% success**: P0 fixes (blocking users)
- **Tasks 60-79% success**: P1 fixes (should improve)
- **Tasks ≥ 80% success**: P2 (nice to have improvements)

---

### Step 4: Time Analysis

**Efficiency Metrics**:
```
Task | Target | P1  | P2  | P3  | P4  | P5  | Average | % Over Target
-----|--------|-----|-----|-----|-----|-----|---------|---------------
1    | <5 min |     |     |     |     |     |  ___:___ |     _____%
2    | <3 min |     |     |     |     |     |  ___:___ |     _____%
3    | <4 min |     |     |     |     |     |  ___:___ |     _____%
4    | <2 min |     |     |     |     |     |  ___:___ |     _____%
5    | <3 min |     |     |     |     |     |  ___:___ |     _____%
6    | <3 min |     |     |     |     |     |  ___:___ |     _____%
```

**Interpretation**:
- **≤ Target time**: Efficient/intuitive
- **100-150% of target**: Acceptable
- **150-200% of target**: Slow, needs improvement
- **> 200% of target**: Very slow, major issues

---

### Step 5: Error Analysis

**Error Frequency**:
```
Task | P1 Errors | P2 Errors | P3 Errors | P4 Errors | P5 Errors | Avg Errors
-----|-----------|-----------|-----------|-----------|-----------|-----------
1    |     __    |     __    |     __    |     __    |     __    |     ____
2    |     __    |     __    |     __    |     __    |     __    |     ____
3    |     __    |     __    |     __    |     __    |     __    |     ____
4    |     __    |     __    |     __    |     __    |     __    |     ____
5    |     __    |     __    |     __    |     __    |     __    |     ____
6    |     __    |     __    |     __    |     __    |     __    |     ____

TOTAL ERRORS: _____ (avg _____ per participant)
```

**Interpretation**:
- **0-1 errors per task**: Excellent
- **2-3 errors per task**: Acceptable
- **4+ errors per task**: Problematic

---

## 📝 Part 2: Qualitative Analysis

### Step 1: Affinity Mapping

**What is Affinity Mapping?**
- Organizing qualitative data into themes
- Grouping similar feedback together
- Identifying patterns across participants

**Process**:
1. **Transcribe** all quotes and notes
2. **Write each observation** on a sticky note (physical or virtual)
3. **Group similar notes** together
4. **Name each group** with a theme label
5. **Prioritize** groups by frequency

---

### Step 2: Theme Identification

**Positive Themes** (What users loved):
```
Theme Name | Count | Example Quote | Frequency
----------|-------|---------------|___________
__________ |  ___  | _____________ |    _____%
__________ |  ___  | _____________ |    _____%
__________ |  ___  | _____________ |    _____%
```

**Negative Themes** (What frustrated users):
```
Theme Name | Count | Example Quote | Frequency
----------|-------|---------------|___________
__________ |  ___  | _____________ |    _____%
__________ |  ___  | _____________ |    _____%
__________ |  ___  | _____________ |    _____%
```

**Suggestion Themes** (What users want):
```
Theme Name | Count | Example Quote | Frequency
----------|-------|---------------|___________
__________ |  ___  | _____________ |    _____%
__________ |  ___  | _____________ |    _____%
__________ |  ___  | _____________ |    _____%
```

---

### Step 3: Critical Issue Extraction

**Definition**: Issues that blocked participants from completing tasks

**Format**:
```
🚨 CRITICAL ISSUE #____
-----------------------
Task: _____
Participants Affected: _____ out of 5 (_____%)
Description: _______________________________
_____________________________________________
Example Quote: "__________________________"
Impact: [ ] Blocks workflow
        [ ] Causes frustration
        [ ] Leads to errors
        [ ] Abandonment

Priority: [ ] P0 (fix immediately)
          [ ] P1 (fix soon)
          [ ] P2 (improve later)

Recommended Fix: __________________________
_____________________________________________
```

**Priority Rules**:
- **P0**: Mentioned by ≥ 3 participants (60%+) OR blocks task completion
- **P1**: Mentioned by 2 participants (40%) OR causes major frustration
- **P2**: Mentioned by 1 participant (20%) OR nice-to-have improvement

---

### Step 4: Feature Usage Insights

**Which features did users understand and use?**
- [ ] PDF highlighting: _____ participants understood
- [ ] Detective Notebook: _____ participants used successfully
- [ ] Intelligence Brief: _____ participants found useful
- [ ] Advanced Search: _____ participants used effectively
- [ ] Export (Markdown): _____ participants completed
- [ ] Export (BibTeX): _____ participants tried
- [ ] AI Clue Cards: _____ participants understood

**Which features were confusing or unused?**
- Feature: __________________ - Confusion level: _____/5
- Feature: __________________ - Confusion level: _____/5
- Feature: __________________ - Confusion level: _____/5

---

## 🔍 Part 3: Cross-Analysis

### SUS vs. NPS Correlation

**Scenario Analysis**:

| SUS Score | NPS Score | Interpretation | Action |
|-----------|-----------|----------------|--------|
| High (≥80) | High (≥+30) | Excellent | Celebrate, maintain quality |
| High (≥80) | Low (<+10) | Easy but not valuable | Add features, improve value |
| Low (<70) | High (≥+30) | Valuable but frustrating | Fix UX urgently |
| Low (<70) | Low (<+10) | Poor overall | Major rework needed |

---

### Task Success vs. SUS Correlation

**Hypothesis**: Higher task completion → Higher SUS score

**Check correlation**:
```
Participant | Tasks Completed (out of 6) | SUS Score | Correlation?
-----------|---------------------------|-----------|-------------
P1         |            _____           |    _____  |
P2         |            _____           |    _____  |
P3         |            _____           |    _____  |
P4         |            _____           |    _____  |
P5         |            _____           |    _____  |
```

**If strong positive correlation** (r > 0.7):
- Task completion is driving SUS
- Improve tasks → Improve SUS

**If weak correlation** (r < 0.5):
- Other factors influencing SUS (aesthetics, perceived value, etc.)
- Need deeper analysis

---

### Frustration vs. Task Time Correlation

**Hypothesis**: Longer tasks → More frustration

**Check correlation**:
```
Task | Avg Time | Avg Frustration (1-3) | Correlation?
-----|----------|----------------------|-------------
1    |  ___:___ |          ___         |
2    |  ___:___ |          ___         |
3    |  ___:___ |          ___         |
4    |  ___:___ |          ___         |
5    |  ___:___ |          ___         |
6    |  ___:___ |          ___         |
```

**Action**:
- Identify tasks that are both slow AND frustrating
- These are high-priority targets for optimization

---

## 📊 Part 4: Report Generation

### Report Structure

**1. Executive Summary** (1 page)
- Key findings (3-5 bullets)
- SUS score and interpretation
- NPS score and interpretation
- Overall recommendation (GO/NO-GO)

**2. Quantitative Results** (2-3 pages)
- SUS analysis with individual scores
- NPS analysis with breakdown
- Task completion summary
- Time and error analysis

**3. Qualitative Results** (3-4 pages)
- Positive themes (what worked)
- Negative themes (what didn't)
- Critical issues (P0, P1, P2)
- Participant quotes (illustrative)

**4. Recommendations** (2-3 pages)
- Prioritized fix list (P0, P1, P2)
- Sprint 5 improvements
- Quick wins vs. long-term investments
- Data supporting each recommendation

**5. Appendix** (5+ pages)
- Individual participant profiles
- Full transcript of quotes
- Raw data tables
- Methodology details

---

### Presentation Format

**For Team Meeting** (Day 24):

**Slide 1: Overview**
- 5 participants, 6 tasks, 30-45 min sessions
- Data collected: SUS, NPS, task metrics, qualitative feedback

**Slide 2: Key Metrics**
- SUS: ___/100 (Grade: _) [target: ≥70]
- NPS: ___ [target: ≥+10]
- Task completion: ___% [target: ≥80%]
- Overall: ✅ PASS / ⚠️ MARGINAL / ❌ FAIL

**Slide 3: What Worked** (Top 3 positive themes)
1. _____________________
2. _____________________
3. _____________________

**Slide 4: What Needs Work** (Top 3 issues)
1. _____________________ (P_)
2. _____________________ (P_)
3. _____________________ (P_)

**Slide 5: Recommendations** (Prioritized)
- P0: Fix _________ immediately
- P1: Improve _________
- P2: Consider _________ for Sprint 5

**Slide 6: Next Steps**
- Day 24: Implement P0 fixes
- Sprint 5: Address P1 and P2 issues
- Future: Re-test after improvements

---

## 🎯 Part 5: Action Planning

### Prioritization Matrix

**Impact vs. Effort Matrix**:

```
           HIGH IMPACT
                ^
                |
    Quick Wins  |  Major Projects
 (High, Low)    |  (High, High)
    DO NOW      |  PLAN CAREFULLY
----------------+------------------> HIGH EFFORT
                |
    Fill-ins    |  Thankless Tasks
  (Low, Low)    |  (Low, High)
   SKIP/DEFER   |    AVOID
                |
           LOW IMPACT
```

**Place each issue in the matrix**:
- **Quick Wins (Do Now)**: P0 fixes, high impact, low effort
- **Major Projects (Plan Carefully)**: High impact, high effort
- **Fill-ins (Skip/Defer)**: Low impact, low effort
- **Thankless Tasks (Avoid)**: Low impact, high effort

---

### Sprint 5 Recommendations Template

**For Each Issue**:
```
Issue: _________________________________
Source: Task ___ (mentioned by ___/5 participants)
Priority: P___ (0/1/2)

Impact:
- Currently: _________________________
- If fixed: __________________________

Effort Estimate:
- Design: ___ hours
- Development: ___ hours
- Testing: ___ hours
- Total: ___ hours

Recommended for Sprint 5? [ ] YES  [ ] NO

If YES:
- Assign to: _______________________
- Due by: __________________________
- Success criteria: _________________
```

---

## ✅ Analysis Checklist

### Day 23 Morning (Quantitative)

- [ ] Calculate SUS scores for all 5 participants
- [ ] Calculate average SUS and interpret
- [ ] Calculate NPS score and interpret
- [ ] Calculate task completion rates
- [ ] Calculate average task times
- [ ] Count errors per task
- [ ] Identify tasks below targets

### Day 23 Afternoon (Qualitative)

- [ ] Transcribe all quotes and notes
- [ ] Create affinity diagram (virtual or physical)
- [ ] Identify themes (positive, negative, suggestions)
- [ ] Extract critical issues (P0, P1, P2)
- [ ] Count theme frequencies
- [ ] Select illustrative quotes

### Day 24 Morning (Cross-Analysis)

- [ ] Correlate SUS vs. NPS
- [ ] Correlate task success vs. SUS
- [ ] Correlate time vs. frustration
- [ ] Identify outlier participants
- [ ] Synthesize quantitative + qualitative insights

### Day 24 Afternoon (Report & Presentation)

- [ ] Draft executive summary
- [ ] Create findings slides
- [ ] Prioritize recommendations
- [ ] Create Sprint 5 action items
- [ ] Present findings to team
- [ ] Archive data and materials

---

**Last Updated**: 2026-02-11
**Prepared by**: HCI Professor
**Purpose**: Paper Detective Sprint 4 User Testing
**Status**: ✅ Ready for Day 23-24 analysis

**Next**: Test Environment Checklist (final deliverable)
