# NPS Collection Guide - User Testing

**Document Owner**: product-manager-v2
**Purpose**: Guide for collecting and analyzing Net Promoter Score (NPS) data
**Created**: 2026-02-11 (Day 19)
**Target**: Sprint 4 User Testing (Day 21-22)

---

## What is NPS?

**Net Promoter Score** measures customer loyalty and satisfaction by asking:

**"On a scale of 0-10, how likely are you to recommend Paper Detective to a colleague or friend?"**

---

## NPS Scale Breakdown

### Response Categories

**Promoters (9-10)**: Loyal enthusiasts
- Characteristics: Highly satisfied, will recommend, will return
- Target percentage: >50%

**Passives (7-8)**: Satisfied but unenthusiastic
- Characteristics: Satisfied, vulnerable to competitors, neutral
- Target percentage: <40%

**Detractors (0-6)**: Unhappy customers
- Characteristics: Unhappy, can damage brand through negative word-of-mouth
- Target percentage: <10%

---

## NPS Calculation Formula

```
NPS = (% of Promoters) - (% of Detractors)

Example:
- 50% Promoters (3 out of 6 responses are 9-10)
- 17% Detractors (1 out of 6 responses are 0-6)
- NPS = 50 - 17 = +33
```

### NPS Score Interpretation

| Score Range | Classification | Meaning |
|-------------|----------------|---------|
| +70 to +100 | Excellent | World-class loyalty |
| +50 to +69 | Great | Strong loyalty |
| +30 to +49 | Good | Decent loyalty |
| +10 to +29 | Okay | Moderate loyalty |
| -10 to +9 | Poor | Weak loyalty |
| -100 to -11 | Terrible | Critical issues |

**Sprint 4 Target**: NPS ≥ +30 (Good range for MVP)

---

## NPS Question Script

### Standard NPS Question

**Ask at the end of each session**:

> "On a scale of 0 to 10, how likely are you to recommend Paper Detective to a colleague or friend?"

**Visual Scale** (show to participant):

```
0  1  2  3  4  5  6  7  8  9  10
|------------------------------|
Not at all likely      Extremely likely
```

### Follow-Up Question (Critical!)

**Always ask**: "Why did you give this rating?"

**Promoters (9-10)**:
- "What did you like most?"
- "What would make you give it a 10?"

**Passives (7-8)**:
- "What would make it more likely you'd recommend?"
- "What's missing?"

**Detractors (0-6)**:
- "What disappointed you?"
- "What would need to change for you to recommend?"

---

## Data Collection Template

### Session NPS Record

**Session ID**: _______
**Participant ID**: _______
**Date**: _______
**Facilitator**: _______

**NPS Score**: _____ / 10

**Category**: [ ] Promoter (9-10) | [ ] Passive (7-8) | [ ] Detractor (0-6)

**Follow-up Response**:
_____________________________
_____________________________
_____________________________

**Key Themes Identified**:
-
-
-

**Actionable Insights**:
-
-
-

---

## Across All Sessions

### NPS Summary Table

| Participant | Score | Category | Key Feedback |
|-------------|-------|----------|--------------|
| P1 | ___/10 | [ ] [ ] [ ] | |
| P2 | ___/10 | [ ] [ ] [ ] | |
| P3 | ___/10 | [ ] [ ] [ ] | |
| P4 | ___/10 | [ ] [ ] [ ] | |
| P5 | ___/10 | [ ] [ ] [ ] | |

### NPS Calculation

**Promoters (9-10)**: ___ / 5 = ___%
**Passives (7-8)**: ___ / 5 = ___%
**Detractors (0-6)**: ___ / 5 = ___%

**NPS Score**: ___% - ___% = ___

**Target**: ≥ +30
**Status**: [ ] Above Target | [ ] Met Target | [ ] Below Target

---

## Common Response Patterns

### Promoters (9-10) - What to Look For

**Common Reasons for High Scores**:
- Time-saving (AI analysis)
- Better than current tools
- Easy to use
- Helpful features (highlights, exports)

**Capture**: Specific features mentioned, use cases, comparison to alternatives

### Passives (7-8) - What to Look For

**Common Reasons for Neutral Scores**:
- Good but needs improvement
- Missing key features
- Performance concerns
- Uncertainty about value

**Capture**: Specific improvements suggested, missing features, hesitations

### Detractors (0-6) - What to Look For

**Common Reasons for Low Scores**:
- Technical issues (bugs, crashes)
- Confusing UX
- Missing critical features
- Better alternatives exist

**Capture**: Specific pain points, failed expectations, comparison to competitors

---

## NPS Analysis Framework

### Quantitative Analysis

1. **Calculate NPS**: (% Promoters) - (% Detractors)
2. **Compare to Target**: Is NPS ≥ +30?
3. **Distribution**: Are scores clustered or spread?
4. **Trends**: Any patterns across participants?

### Qualitative Analysis

1. **Positive Themes**: What do Promoters love?
2. **Pain Points**: What frustrates Detractors?
3. **Improvement Ideas**: What do Passives want?
4. **Feature Requests**: What's missing?

### Actionable Insights

**For Each NPS Category**:

**Promoters**: Leverage for marketing, testimonials, referrals
**Passives**: Address improvement suggestions to convert to Promoters
**Detractors**: Fix critical issues, address pain points

---

## Facilitator Tips

### Best Practices

**DO**:
- [ ] Ask NPS question at the END of session (after they've used the tool)
- [ ] Show visual scale (0-10) for clarity
- [ ] ALWAYS ask follow-up "Why?" question
- [ ] Allow silence for participant to think
- [ ] Record exact quotes when possible
- [ ] Probe for specifics ("What feature?", "How so?")

**DON'T**:
- [ ] Ask NPS at the beginning (no experience yet)
- [ ] Influence their answer ("We hope you liked it!")
- [ ] Skip the follow-up question
- [ ] Accept one-word answers
- [ ] Judge their answer negatively

### If Score is Unexpectedly Low

**Acknowledge and Probe**:
- "Thank you for your honesty. Can you tell me more about what disappointed you?"
- "What specifically didn't meet your expectations?"
- "What would need to change for you to recommend it?"

**Goal**: Understand the WHY, not defend the product

---

## Reporting NPS Results

### Session Report Format

```markdown
## NPS Results

**Overall NPS**: +XX (Target: ≥+30)

**Score Distribution**:
- Promoters (9-10): X/X (XX%)
- Passives (7-8): X/X (XX%)
- Detractors (0-6): X/X (XX%)

**Key Insights**:
1. [What Promoters loved]
2. [What Passives want improved]
3. [What frustrated Detractors]

**Actionable Recommendations**:
1. [Leverage Promoters for...]
2. [Address Passives' concerns by...]
3. [Fix Detractors' issues by...]

**Qualitative Quotes**:
- "..." (Promoter)
- "..." (Passive)
- "..." (Detractor)
```

---

## NPS vs. SUS Correlation

**Compare NPS with SUS (System Usability Scale)**:

| Participant | NPS | SUS | Correlation |
|-------------|-----|-----|-------------|
| P1 | ___/10 | ___/100 | [ ] Consistent | [ ] Inconsistent |
| P2 | ___/10 | ___/100 | [ ] Consistent | [ ] Inconsistent |
| P3 | ___/10 | ___/100 | [ ] Consistent | [ ] Inconsistent |
| P4 | ___/10 | ___/100 | [ ] Consistent | [ ] Inconsistent |
| P5 | ___/10 | ___/100 | [ ] Consistent | [ ] Inconsistent |

**Analysis**:
- High NPS + High SUS = Excellent usability and satisfaction
- Low NPS + High SUS = Good UX, but missing features/value
- High NPS + Low SUS = Loyal despite usability issues (interesting!)
- Low NPS + Low SUS = Critical issues (both UX and value)

---

## Contingency Planning

### If NPS is Below Target (<+30)

**Assessment**:
1. How far below target?
2. Are scores improving or declining across sessions?
3. What are common Detractor themes?

**Actions**:
- If 0-20 below target: Address key issues, retest later
- If >20 below target: Major pivot may be needed
- If all Detractors: Stop testing, address issues, replan

### If NPS is Above Target (>+50)

**Celebrate but Learn**:
- What's working exceptionally well?
- Leverage Promoters for testimonials
- Consider increasing sample size
- Document success factors

---

**Document Status**: ✅ READY FOR USE

**Owner**: product-manager-v2
**Reviewer**: hci-professor
**Last Updated**: 2026-02-11 (Day 19)
**Next Review**: After Day 21-22 testing

**Let's collect valuable NPS data!** 📊✅
