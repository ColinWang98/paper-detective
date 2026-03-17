# NPS (Net Promoter Score) Collection Guide

**Purpose**: Best practices for collecting, analyzing, and acting on NPS data
**Created**: 2026-02-11
**For**: Paper Detective Sprint 4 User Testing (Day 21-22)
**Target**: 5 participants
**NPS Target**: ≥ 7 (Good) or ≥ 0 (Acceptable)

---

## 📊 NPS Overview

**What is NPS?**
- **Full Name**: Net Promoter Score
- **Developer**: Fred Reichheld (Bain & Company, 2003)
- **Purpose**: Measure customer loyalty and advocacy
- **Question**: "How likely are you to recommend [product] to a colleague or friend?"
- **Scale**: 0-10 (11-point scale)
- **Time to Complete**: ~30 seconds

**Why NPS for Paper Detective?**
- ✅ Simple, single-question metric
- ✅ Predicts growth and retention
- ✅ Industry standard for SaaS products
- ✅ Correlates with word-of-mouth potential
- ✅ Quick trend tracking over time
- ✅ Identifies at-risk users (detractors)

---

## 📝 The NPS Question

### Exact Phrasing

**Primary Question**:
> "On a scale of 0 to 10, how likely are you to recommend Paper Detective to a colleague or friend?"

**Visual Scale**:
```
0 [Not at all likely]  1  2  3  4  5  6  7  8  9  10 [Extremely likely]
```

**Critical Follow-Up** (Open-ended):
> "Why did you give this rating?"

---

## 🔢 Score Classification

### The Three Categories

| Score Range | Category | Color | Meaning | Expected Behavior |
|-------------|----------|-------|---------|-------------------|
| **9-10** | **Promoters** | 🟢 Green | Loyal enthusiasts | Actively recommend, sustain growth |
| **7-8** | **Passives** | 🟡 Yellow | Satisfied but unenthusiastic | Vulnerable to competitors, neutral |
| **0-6** | **Detractors** | 🔴 Red | Unhappy customers | Damage brand, hinder growth |

### Paper Detective Target

| Metric | Target | Rationale |
|--------|--------|-----------|
| Individual NPS | ≥ 7 | At least "Passive" satisfied |
| Average NPS (5 participants) | ≥ 7 | Good (Passive or better) |
| Stretch Goal | ≥ 9 | Excellent (Promoter territory) |

**Acceptable Minimum**: ≥ 0 (Equal promoters and detractors)

---

## 🧮 NPS Calculation Formula

### Step 1: Categorize Responses

Count participants in each category:
- **Promoters (9-10)**: Count = ____
- **Passives (7-8)**: Count = ____
- **Detractors (0-6)**: Count = ____

### Step 2: Calculate Percentages

```
% Promoters = (Promoters / Total Respondents) × 100
% Detractors = (Detractors / Total Respondents) × 100
```

### Step 3: Compute NPS

```
NPS = % Promoters - % Detractors
```

**Range**: -100 to +100

---

## 📊 Example Calculation

### Scenario: 5 Participants

| Participant | Score | Category |
|-------------|-------|----------|
| P1 (Grad Student) | 9 | Promoter |
| P2 (PhD Student) | 7 | Passive |
| P3 (Researcher) | 8 | Passive |
| P4 (Master's) | 10 | Promoter |
| P5 (Postdoc) | 6 | Detractor |

**Calculations**:
- Promoters: 2 out of 5 = 40%
- Passives: 2 out of 5 = 40%
- Detractors: 1 out of 5 = 20%

**NPS** = 40% - 20% = **+20**

**Interpretation**: +20 = Good, above average for academic tools

---

## 📈 NPS Score Interpretation

### NPS Scale Benchmarks

| NPS Score | Rating | Description | Academic Tool Context |
|-----------|--------|-------------|----------------------|
| **+70 and above** | Excellent | World-class loyalty | Best-in-class research tools |
| **+50 to +69** | Great | Strong loyalty | Highly recommended tools |
| **+30 to +49** | Good | Solid loyalty | Respected tools |
| **+10 to +29** | OK | Moderate loyalty | Average academic tools |
| **-10 to +9** | Marginal | Mixed feelings | Below average, risky |
| **-29 to -11** | Poor | Detractors exceed promoters | Significant issues |
| **-30 and below** | Terrible | Major problems | Unsustainable |

**Paper Detective Target**: +10 to +30 (Good range for academic tools)

### Industry Benchmarks by Sector

| Industry | Average NPS | Top Quartile |
|----------|-------------|--------------|
| SaaS Software | +30 | +60 |
| Productivity Tools | +25 | +50 |
| Academic/Education | +20 | +45 |
| **Paper Detective Goal** | **≥ +10** | **≥ +30** |

---

## 🔍 The Critical Follow-Up Question

### Why It Matters

The **"Why did you give this rating?"** question is MORE important than the score itself. It provides:

1. **Diagnostic insights**: Why they scored it that way
2. **Actionable feedback**: What to fix/improve
3. **Qualitative depth**: Context for the number
4. **Feature validation**: What matters most

### Best Practices for Follow-Up

**DO:**
- ✅ Ask the question every time
- ✅ Use open-ended phrasing
- ✅ Allow silence for reflection
- ✅ Probe for specifics: "Can you give me an example?"
- ✅ Record exact quotes (verbatim)

**DON'T:**
- ❌ Skip the follow-up
- ❌ Re-phrase the question (changes answers)
- ❌ Influence their response
- ❌ Accept one-word answers
- ❌ Rush their response

### Follow-Up Question Examples

**For Promoters (9-10)**:
- "What specifically did you love most?"
- "What would make it even better?"
- "What would you tell a colleague about it?"

**For Passives (7-8)**:
- "What would need to change for you to give a 9 or 10?"
- "What held you back from a higher score?"
- "What was missing or underwhelming?"

**For Detractors (0-6)**:
- "What frustrated you most?"
- "What would need to be fixed for you to recommend it?"
- "What were you expecting that you didn't get?"

---

## 📋 NPS Data Collection Template

### Per-Participant Template

```
SESSION: NPS DATA COLLECTION
===========================================
Date: ___________  Participant ID: _______

NPS QUESTION:
"On a scale of 0-10, how likely are you to recommend
Paper Detective to a colleague or friend?"

Response: ____ / 10

Category: [ ] Promoter (9-10)
         [ ] Passive (7-8)
         [ ] Detractor (0-6)

FOLLOW-UP QUESTION:
"Why did you give this rating?"

Verbatim Response:
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

KEY THEMES (Code after session):
- Positive: _________________________________
- Negative: _________________________________
- Suggestions: _____________________________
- Missing Features: _________________________

CONTEXT:
- Task completion: ____ / 6 tasks
- SUS Score: _______ / 100
- Overall mood: [ ] Positive [ ] Neutral [ ] Frustrated
- Would use in research? [ ] Yes [ ] Maybe [ ] No

FACILITATOR NOTES:
- Spontaneous praise mentioned: _______________
- Spontaneous criticism mentioned: ____________
- Comparison to other tools: ___________________
- Surprising comments: ________________________
```

---

## 📊 Group-Level Analysis

### Aggregate NPS Calculation Sheet

```
PAPER DETECTIVE SPRINT 4 - NPS SUMMARY
===========================================
Date: ___________  Facilitator: ___________

INDIVIDUAL RESPONSES:
Participant | Score | Category | Key Reason (1-2 words)
-----------|-------|----------|------------------------
P1         |  ___  |    ___   | __________________
P2         |  ___  |    ___   | __________________
P3         |  ___  |    ___   | __________________
P4         |  ___  |    ___   | __________________
P5         |  ___  |    ___   | __________________

CATEGORY COUNTS:
Promoters (9-10): _____ out of 5 = _____%
Passives (7-8):   _____ out of 5 = _____%
Detractors (0-6): _____ out of 5 = _____%

FINAL NPS CALCULATION:
NPS = % Promoters - % Detractors
NPS = _____% - _____% = _____

NPS SCORE: _____ (-100 to +100)

RATING: [ ] Excellent (+70+)
       [ ] Great (+50 to +69)
       [ ] Good (+30 to +49)
       [ ] OK (+10 to +29)
       [ ] Marginal (-10 to +9)
       [ ] Poor (-29 to -11)
       [ ] Terrible (-30 and below)

TARGET MET? [ ] YES (≥ +10)  [ ] NO (< +10)
```

---

## 🎯 Analyzing Qualitative Responses

### Thematic Analysis Method

**Step 1: Transcribe all responses**
- Write down verbatim what each participant said

**Step 2: Identify key themes**
- Group similar responses together
- Look for patterns across participants

**Step 3: Code by sentiment**
- Positive themes (what they loved)
- Negative themes (what frustrated them)
- Suggestions (what they want added)

**Step 4: Prioritize by frequency**
- Count how many participants mentioned each theme
- Themes mentioned by ≥ 2 participants = high priority

### Common NPS Themes for Academic Tools

**Positive Promoter Themes**:
- "Saves me time reading papers"
- "AI-generated briefs are incredibly useful"
- "Easy to use and intuitive"
- "Better than [current tool]"
- "Helps me organize my research"

**Negative Detractor Themes**:
- "Too slow to generate brief"
- "Missed important points"
- "Can't upload my PDFs"
- "Not accurate enough"
- "Prefer my current workflow"

**Passive Neutral Themes**:
- "Useful but not essential"
- "Nice to have but wouldn't pay"
- "Good for quick scans, not deep research"
- "Needs more features"

---

## 🚨 Interpreting Different NPS Scenarios

### Scenario A: High NPS (≥ +30) with 5 Participants

**Example**: 3 Promoters, 2 Passives, 0 Detractors
**NPS**: +60

**Interpretation**: Excellent! Strong positive reception.

**Actions**:
- Celebrate success! 🎉
- Document what worked (promoter quotes)
- Identify what would convert Passives to Promoters
- Use promoter quotes in marketing/case studies
- Plan for scale and growth

**Next Steps**:
- Maintain quality as you add features
- Monitor NPS trend over time
- Share results with stakeholders

---

### Scenario B: Medium NPS (+10 to +29) with 5 Participants

**Example**: 2 Promoters, 2 Passives, 1 Detractor
**NPS**: +20

**Interpretation**: Good, but room for improvement.

**Actions**:
- Analyze the Detractor deeply (what blocked them?)
- Interview Passives (what would make them Promoters?)
- Address common themes mentioned by Detractor/Passives
- Prioritize fixes that could convert them

**Next Steps**:
- Fix the top 3 issues mentioned
- Re-test after fixes (if time permits)
- Document improvements for Sprint 5

---

### Scenario C: Low NPS (< +10) with 5 Participants

**Example**: 1 Promoter, 1 Passive, 3 Detractors
**NPS**: -20

**Interpretation**: Marginal to Poor. Significant issues.

**Actions**:
- URGENT: Analyze all Detractor feedback
- IMMEDIATE: Fix critical bugs mentioned
- Interview all Detractors for deeper insights
- Check if tasks failed during testing (confounds NPS)

**Next Steps**:
- Emergency fixes on Day 23-24
- Consider re-testing after fixes
- Re-evaluate feature scope if needed

---

### Scenario D: Mixed NPS (Wide Variance) with 5 Participants

**Example**: Scores are 10, 9, 6, 3, 1 (very spread out)
**NPS**: 0 (but high variance)

**Interpretation**: Polarizing product. Love-hate relationship.

**Actions**:
- Investigate why scores are so different
- Check if different user segments have different needs
- May be targeting wrong users
- May have inconsistent experience

**Next Steps**:
- Segment analysis by user type (grad student vs. faculty)
- Check if technical issues caused low scores
- May need to focus on specific user segment

---

## ⚠️ Common NPS Mistakes to Avoid

### Mistake #1: Skipping the Follow-Up Question
**Problem**: Only collecting the score, not the "why"
**Impact**: No actionable insights
**Solution**: ALWAYS ask "Why did you give this rating?"

### Mistake #2: Leading the Witness
**Problem**: "You liked it, right? So what score...?"
**Impact**: Inflated scores, dishonest feedback
**Solution**: Neutral tone, no facial expressions, no leading questions

### Mistake #3: Not Recording Exact Quotes
**Problem**: Summarizing instead of transcribing
**Impact**: Lost nuance, bias introduced
**Solution**: Write down verbatim or record audio

### Mistake #4: Confusing SUS and NPS
**Problem**: Mixing up usability (SUS) with loyalty (NPS)
**Impact**: Wrong metrics for wrong goals
**Solution**:
- SUS = usability (easy to use?)
- NPS = loyalty (will you recommend?)

### Mistake #5: Only Collecting NPS, Not Acting
**Problem**: Collecting data but not making changes
**Impact**: Wasted time, participant frustration
**Solution**: Commit to addressing top 3 issues immediately

---

## 🔗 NPS and SUS: Using Both Together

### Correlation Analysis

**Typical Relationship**:
- High SUS (≥ 80) → Usually High NPS (≥ +30)
- Medium SUS (70-79) → Usually Medium NPS (+10 to +29)
- Low SUS (< 70) → Usually Low NPS (< +10)

### What to Do When Scores Diverge

**Scenario: High SUS, Low NPS**
- SUS = 85 (Excellent usability)
- NPS = 0 (Mixed loyalty)

**Interpretation**: Easy to use, but not valuable enough

**Actions**:
- Add more features/value
- Improve AI accuracy
- Better positioning/marketing
- Focus on usefulness, not just usability

---

**Scenario: Low SUS, High NPS**
- SUS = 65 (Poor usability)
- NPS = +40 (Great loyalty)

**Interpretation**: Valuable but frustrating to use

**Actions**:
- CRITICAL: Fix usability issues immediately
- Users love the concept but hate the experience
- High risk of churn if not fixed
- P1 priority on UX improvements

---

## 📋 Administering NPS: Best Practices

### Timing
**When**: After SUS questionnaire, before interview
**Duration**: 30 seconds (score) + 2 minutes (follow-up)
**Context**: "Now one more question about recommending..."

### Instructions

**Verbal Script**:
> "On a scale of 0 to 10, how likely are you to recommend Paper Detective to a colleague or friend? Please select the number that best reflects your opinion."

**Follow-Up Prompt**:
> "Thank you. Can you tell me why you gave that rating?"

### Probing for Depth

If they give a short answer:
- "Can you tell me more about that?"
- "What specifically led you to that score?"
- "Is there anything else that influenced your rating?"

If they mention features:
- "Which feature was most important to your rating?"
- "How would that feature change your score if it were better/worse?"

---

## 🎯 Paper Detective NPS Targets

### Sprint 4 Targets (Day 21-22 Testing)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Individual NPS | ≥ 7 | At least Passive satisfaction |
| Average NPS (5 participants) | ≥ +10 | Good, above average |
| Stretch Goal | ≥ +30 | Great loyalty |

### Success Criteria

✅ **PASS**: Average NPS ≥ +10 (Good)
⚠️ **MARGINAL**: Average NPS 0 to +9 (Mixed)
❌ **FAIL**: Average NPS < 0 (More detractors than promoters)

---

## 📊 NPS Data Collection Sheet (Excel/Google Sheets)

### Column Headers

```
| Participant ID | Date | NPS Score | Category | Follow-Up Response | Key Themes | SUS Score | Task Completion |
|----------------|------|-----------|----------|--------------------|------------|-----------|-----------------|
| P1             |      |           |          |                    |            |           |                 |
| P2             |      |           |          |                    |            |           |                 |
| P3             |      |           |          |                    |            |           |                 |
| P4             |      |           |          |                    |            |           |                 |
| P5             |      |           |          |                    |            |           |                 |
```

### Formulas

**NPS Calculation** (in a summary cell):
```
= (COUNTIF(D2:D6,"Promoter") - COUNTIF(D2:D6,"Detractor")) / COUNTA(D2:D6) * 100
```

**Average Score**:
```
= AVERAGE(C2:C6)
```

---

## 🚀 Next Steps After Data Collection

### Day 23-24: Analysis and Action

**Morning (Day 23)**:
1. Calculate NPS for all 5 participants
2. Transcribe all follow-up responses
3. Identify common themes (≥ 2 mentions)
4. Cross-reference with SUS scores and task completion

**Afternoon (Day 23)**:
1. Create affinity diagram of qualitative feedback
2. Prioritize issues by frequency and impact
3. Identify quick wins vs. long-term improvements

**Day 24**:
1. Present findings to team
2. Plan Sprint 5 improvements based on NPS
3. Create action items for top 3 issues

---

## 📚 Additional Resources

**Academic Sources**:
- Reichheld, F. (2003). The One Number You Need to Grow.
- Keiningham, T., et al. (2007). A Longitudinal Examination of Net Promoter.

**Online Tools**:
- Delighted (NPS survey tool)
- SurveyMonkey (NPS templates)
- Typeform (NPS collection)

**Benchmark Databases**:
- CustomerGauge NPS Benchmark
- Temkin Group NPS Benchmarks

---

**Last Updated**: 2026-02-11
**Prepared by**: HCI Professor
**Purpose**: Paper Detective Sprint 4 User Testing
**Status**: ✅ Ready for use on Day 21-22

**Next**: Facilitator Training Guide
