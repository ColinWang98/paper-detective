# SUS (System Usability Scale) Scoring Guide

**Purpose**: Comprehensive guide for calculating and interpreting SUS scores from user testing
**Created**: 2026-02-11
**For**: Paper Detective Sprint 4 User Testing (Day 21-22)
**Target**: 5 participants × 10 questions = 50 responses

---

## 📊 SUS Overview

**What is SUS?**
- **Full Name**: System Usability Scale
- **Developer**: John Brooke (1986)
- **Purpose**: Quick, reliable measure of perceived usability
- **Length**: 10 items, 5-point Likert scale
- **Time to Complete**: ~2 minutes
- **Industry Standard**: Most widely used usability metric

**Why SUS for Paper Detective?**
- ✅ Validated and reliable (Cronbach's α > 0.85)
- ✅ Technology-agnostic (works for any system)
- ✅ Quick to administer and score
- ✅ Provides single comparable score (0-100)
- ✅ Industry benchmarks available
- ✅ No licensing required (public domain)

---

## 📝 The 10 SUS Questions

**Administer to participants in this exact order:**

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. There was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**Response Scale**:
```
1 = Strongly Disagree
2 = Disagree
3 = Neutral
4 = Agree
5 = Strongly Agree
```

---

## 🧮 SUS Scoring Formula

### Step 1: Understand Odd vs. Even Questions

**Odd Questions (1, 3, 5, 7, 9)**: POSITIVELY worded
- Higher score = better usability

**Even Questions (2, 4, 6, 8, 10)**: NEGATIVELY worded
- Lower score = better usability (must be reversed)

### Step 2: Calculate Score Contribution Per Question

**For ODD questions (1, 3, 5, 7, 9)**:
```
Score Contribution = (Item Score - 1) × 2.5
```

**For EVEN questions (2, 4, 6, 8, 10)**:
```
Score Contribution = (5 - Item Score) × 2.5
```

### Step 3: Sum All Contributions

```
Total SUS Score = Sum of all 10 score contributions
```

**Final Score Range**: 0 to 100

---

## 📊 Example Calculation

### Participant Example: "Graduate Student A"

**Responses**:
1. 4 (Agree) - "I think that I would like to use this system frequently."
2. 2 (Disagree) - "I found the system unnecessarily complex."
3. 4 (Agree) - "I thought the system was easy to use."
4. 1 (Strongly Disagree) - "I think that I would need the support of a technical person..."
5. 4 (Agree) - "I found the various functions in this system were well integrated."
6. 2 (Disagree) - "There was too much inconsistency in this system."
7. 5 (Strongly Agree) - "I would imagine that most people would learn to use this system very quickly."
8. 2 (Disagree) - "I found the system very cumbersome to use."
9. 4 (Agree) - "I felt very confident using the system."
10. 2 (Disagree) - "I needed to learn a lot of things before I could get going."

**Calculations**:

| Question | Response | Calculation | Contribution |
|----------|----------|-------------|--------------|
| 1 (Odd) | 4 | (4-1) × 2.5 | 7.5 |
| 2 (Even) | 2 | (5-2) × 2.5 | 7.5 |
| 3 (Odd) | 4 | (4-1) × 2.5 | 7.5 |
| 4 (Even) | 1 | (5-1) × 2.5 | 10.0 |
| 5 (Odd) | 4 | (4-1) × 2.5 | 7.5 |
| 6 (Even) | 2 | (5-2) × 2.5 | 7.5 |
| 7 (Odd) | 5 | (5-1) × 2.5 | 10.0 |
| 8 (Even) | 2 | (5-2) × 2.5 | 7.5 |
| 9 (Odd) | 4 | (4-1) × 2.5 | 7.5 |
| 10 (Even) | 2 | (5-2) × 2.5 | 7.5 |

**Total SUS Score**: 7.5 + 7.5 + 7.5 + 10.0 + 7.5 + 7.5 + 10.0 + 7.5 + 7.5 + 7.5 = **80.0**

**Interpretation**: 80.0 = Excellent (Grade A)

---

## 📈 Score Interpretation Scale

### Sauro-Lewis Rating Scale (Academic Standard)

| Score Range | Grade | Adjective | Percentile | Meaning |
|-------------|-------|-----------|------------|---------|
| 84-100 | A+ | Excellent | 96-100 | Best-in-class usability |
| 80-83 | A | Excellent | 90-95 | Superior usability |
| 74-79 | B | Good | 80-89 | Good usability, minor issues |
| 70-73 | C | OK | 70-79 | Marginal usability, needs work |
| 65-69 | D | Poor | 50-69 | Poor usability, major issues |
| 0-64 | F | Awful | 0-49 | Unacceptable usability |

**Paper Detective Target**: ≥ 70 (C or higher)

### Bangor et al. Rating Scale (Industry Standard)

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 85+ | Best Imaginable | The best possible usability |
| 80-84 | Excellent | Outstanding usability |
| 75-79 | Good | Very good usability |
| 70-74 | Okay | Acceptable usability |
| 65-69 | Poor | Below average usability |
| 60-64 | Awful | Poor usability |
| < 60 | Worst Imaginable | The worst possible usability |

**Paper Detective Target**: ≥ 70 ("Okay" or higher)

---

## 🎯 Industry Benchmarks

### Average SUS Scores by Product Category

| Product Type | Average SUS | Percentile |
|--------------|-------------|------------|
| E-commerce sites | 66 | 50th |
| Websites (general) | 62 | 40th |
| Intranets | 69 | 60th |
| Web applications | 72 | 70th |
| Desktop applications | 74 | 75th |
| Mobile apps | 76 | 80th |
| **Paper Detective Target** | **≥ 70** | **≥ 70th percentile** |

### SUS Score Distribution

- **50th percentile (median)**: 68
- **75th percentile**: 78
- **90th percentile**: 85
- **95th percentile**: 88

**Paper Detective Goal**: Beat 90th percentile (≥ 85) = A+ excellence

---

## 🧮 Quick Reference Calculation Sheet

### For Manual Calculation (Per Participant)

```
Participant ID: _______

STEP 1: Record Responses
Q1: ___   Q2: ___   Q3: ___   Q4: ___   Q5: ___
Q6: ___   Q7: ___   Q8: ___   Q9: ___   Q10: ___

STEP 2: Convert Odd Questions (1,3,5,7,9)
Q1: (___ - 1) × 2.5 = _______
Q3: (___ - 1) × 2.5 = _______
Q5: (___ - 1) × 2.5 = _______
Q7: (___ - 1) × 2.5 = _______
Q9: (___ - 1) × 2.5 = _______

STEP 3: Convert Even Questions (2,4,6,8,10)
Q2: (5 - ___) × 2.5 = _______
Q4: (5 - ___) × 2.5 = _______
Q6: (5 - ___) × 2.5 = _______
Q8: (5 - ___) × 2.5 = _______
Q10: (5 - ___) × 2.5 = _______

STEP 4: Sum All Contributions
Total SUS Score = _______ (0-100 scale)

STEP 5: Interpret Score
Grade: _____ (A+/A/B/C/D/F)
Rating: _____ (Excellent/Good/OK/Poor/Awful)
```

---

## 📊 Group-Level Analysis (5 Participants)

### Calculating Average SUS

**Step 1**: Calculate individual SUS scores for all 5 participants

**Step 2**: Sum all individual scores

**Step 3**: Divide by 5

```
Average SUS = (SUS_P1 + SUS_P2 + SUS_P3 + SUS_P4 + SUS_P5) / 5
```

### Example: 5 Participants

| Participant | SUS Score | Grade |
|-------------|-----------|-------|
| P1 (Grad Student) | 80.0 | A |
| P2 (PhD Student) | 75.0 | B |
| P3 (Researcher) | 85.0 | A+ |
| P4 (Master's) | 72.5 | C |
| P5 (Postdoc) | 77.5 | B |
| **Average** | **78.0** | **B** |

**Interpretation**: 78.0 = Good, above average, 75th percentile

---

## 🔍 Individual Question Analysis

### Beyond the Total Score: Diagnostic Value

SUS provides more than just a total score. Individual question patterns reveal specific issues:

**If Q1 (Frequency of Use) is LOW (≤ 3)**:
- Issue: Perceived usefulness is low
- Action: Interview participants about what would make it indispensable

**If Q2 (Complexity) is HIGH (≥ 4)**:
- Issue: System feels too complex
- Action: Simplify UI, reduce cognitive load

**If Q4 (Need Technical Support) is HIGH (≥ 4)**:
- Issue: Not intuitive enough
- Action: Improve onboarding, add tooltips

**If Q6 (Inconsistency) is HIGH (≥ 4)**:
- Issue: Inconsistent patterns
- Action: Audit UI consistency, standardize interactions

**If Q8 (Cumbersome) is HIGH (≥ 4)**:
- Issue: Workflow is awkward
- Action: Streamline task flows

**If Q10 (Learning Curve) is HIGH (≥ 4)**:
- Issue: Hard to get started
- Action: Improve first-run experience

---

## ⚠️ Common SUS Mistakes to Avoid

### Mistake #1: Not Reversing Even Questions
**Problem**: Treating all 10 questions the same way
**Impact**: Inflated or deflated scores (errors of 20-30 points)
**Solution**: Always reverse-score Q2, Q4, Q6, Q8, Q10

### Mistake #2: Wrong Formula
**Problem**: Using simple average instead of SUS formula
**Impact**: Wrong score distribution
**Solution**: Always use (score-1)×2.5 for odd, (5-score)×2.5 for even

### Mistake #3: Mixing Up Questions
**Problem**: Presenting questions out of order
**Impact**: Confuses participants, affects responses
**Solution**: Always present in exact order 1-10

### Mistake #4: Wrong Response Scale
**Problem**: Using 0-4 or 1-7 scale
**Impact**: Breaks the formula, invalid scores
**Solution**: Always use 1-5 scale (Strongly Disagree to Strongly Agree)

### Mistake #5: Not Clarifying "System"
**Problem**: Participants unsure what "the system" refers to
**Impact**: Inconsistent responses
**Solution**: Always say "Paper Detective" instead of "this system"

---

## 📋 Administering SUS: Best Practices

### Timing
**When**: After all tasks are complete, before interview
**Duration**: 2 minutes
**Context**: "Now I'd like you to complete a short questionnaire about your experience..."

### Instructions

**Verbal Script**:
> "Please read each statement and select the response that best reflects your opinion. There are no right or wrong answers - we're interested in your honest opinion."

**Written Format**: Paper or digital (Google Form, Typeform, etc.)

### Avoiding Bias
- Don't explain what statements mean (unless asked)
- Don't influence responses with facial expressions
- Don't rush participants
- Don't skip questions (all 10 are required)

---

## 🎯 Paper Detective SUS Targets

### Sprint 4 Targets (Day 21-22 Testing)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Individual SUS | ≥ 70 | Marginal acceptability (C grade) |
| Average SUS (5 participants) | ≥ 75 | Good usability (B grade) |
| Historical HCI Score | 98.6/100 | Sets high bar |
| Realistic Target | 75-85 | Good to Excellent |

### Success Criteria

✅ **PASS**: Average SUS ≥ 70
⚠️ **MARGINAL**: Average SUS 65-69
❌ **FAIL**: Average SUS < 65

### If Score is Below Target (70)

**Immediate Actions**:
1. Analyze individual question patterns
2. Correlate low-scoring questions with task failures
3. Interview participants about pain points
4. Prioritize fixes for Day 23-24

**Common Fixes**:
- Q2 low: Simplify UI
- Q4 low: Improve onboarding
- Q6 low: Fix inconsistencies
- Q8 low: Streamline workflows
- Q10 low: Enhance first-run experience

---

## 📊 SUS Data Collection Template

### For Paper Detective Sprint 4

```
SESSION LOG
===========================================
Date: ___________  Facilitator: ___________
Participant ID: _______  Time: ___________

PRE-TEST CONTEXT:
- Background: [ ] Grad Student [ ] PhD [ ] Faculty [ ] Other
- Paper Reading Frequency: [ ] Daily [ ] Weekly [ ] Monthly [ ] Rarely
- Current Tools: _________________________

SUS RESPONSES:
Q1: ___  Q2: ___  Q3: ___  Q4: ___  Q5: ___
Q6: ___  Q7: ___  Q8: ___  Q9: ___  Q10: ___

CALCULATIONS:
Odd Qs (1,3,5,7,9):
  Q1: ___  Q3: ___  Q5: ___  Q7: ___  Q9: ___
  Subtotal: _______

Even Qs (2,4,6,8,10):
  Q2: ___  Q4: ___  Q6: ___  Q8: ___  Q10: ___
  Subtotal: _______

TOTAL SUS SCORE: _______ / 100

GRADE: _____ (A+/A/B/C/D/F)
RATING: _____ (Excellent/Good/OK/Poor/Awful)

OBSERVATIONS:
- Participant mood during test: [ ] Positive [ ] Neutral [ ] Frustrated
- Task completion: ____ / 6 tasks
- Major issues noted: _________________________
- Positive comments: _________________________
- Negative comments: _________________________

POST-TEST NPS: ____ / 10
```

---

## 🔧 Digital SUS Calculator (Optional)

### Spreadsheet Formula (Excel/Google Sheets)

**Setup**:
- Responses in cells B2 to B11 (Q1 to Q10)
- Use this formula:

```
=(((B2-1)+(B4-1)+(B6-1)+(B8-1)+(B10-1))*2.5) + (((5-B3)+(5-B5)+(5-B7)+(5-B9)+(5-B11))*2.5)
```

### Python Script (For Automated Scoring)

```python
def calculate_sus(responses):
    """
    Calculate SUS score from list of 10 responses.
    responses: List of 10 integers (1-5)
    returns: SUS score (0-100)
    """
    if len(responses) != 10:
        raise ValueError("Exactly 10 responses required")

    # Odd questions: 1, 3, 5, 7, 9 (index 0, 2, 4, 6, 8)
    odd_sum = sum((responses[i] - 1) for i in [0, 2, 4, 6, 8])

    # Even questions: 2, 4, 6, 8, 10 (index 1, 3, 5, 7, 9)
    even_sum = sum((5 - responses[i]) for i in [1, 3, 5, 7, 9])

    sus_score = (odd_sum + even_sum) * 2.5
    return round(sus_score, 1)

# Example usage:
participant_responses = [4, 2, 4, 1, 4, 2, 5, 2, 4, 2]
sus = calculate_sus(participant_responses)
print(f"SUS Score: {sus}")  # Output: SUS Score: 80.0
```

---

## 📈 Interpreting Results: What to Do Next

### Score ≥ 80 (Excellent, A Grade)
**Actions**:
- Celebrate! World-class usability
- Document what worked well
- Use as baseline for future features
- Consider publishing case study

### Score 70-79 (Good to OK, B-C Grade)
**Actions**:
- Acceptable usability
- Identify specific weak questions
- Target improvements for Sprint 5
- Focus on lowest-scoring questions

### Score < 70 (Poor to Awful, D-F Grade)
**Actions**:
- Critical usability issues
- Immediately analyze task failures
- Prioritize fixes for Day 23-24
- Consider re-testing after fixes

---

## 📚 Additional Resources

**Academic Sources**:
- Brooke, J. (1996). SUS: A quick and dirty usability scale.
- Sauro, J., & Lewis, J. R. (2016). Quantifying the User Experience.

**Online Calculators**:
- Usability.gov SUS Calculator
- MeasuringU SUS Calculator

**Benchmark Databases**:
- Usability.gov SUS Database ( 5000+ scores)
- MeasuringU SUS Database (10,000+ scores)

---

**Last Updated**: 2026-02-11
**Prepared by**: HCI Professor
**Purpose**: Paper Detective Sprint 4 User Testing
**Status**: ✅ Ready for use on Day 21-22

**Next**: NPS Collection Guide
