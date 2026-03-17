# User Testing Materials - Sprint 4

**Created**: 2026-02-10
**Prepared by**: test-architect-v2 with hci-researcher-v2
**Purpose**: Materials for conducting usability testing with 5-8 participants

---

## 📋 Testing Protocol Overview

**Session Length**: 30-45 minutes
**Participants**: 5-8 graduate students or researchers
**Location**: Remote (Zoom/Google Meet) or In-person
**Compensation**: $20 gift card (optional)

**Testing Goals**:
1. Validate Intelligence Brief feature usefulness
2. Assess Export functionality usability
3. Evaluate Advanced Search intuitiveness
4. Measure overall satisfaction (NPS, SUS)

---

## 📝 Session Agenda

### Part 1: Introduction (5 minutes)

**Script**:
> "Welcome and thank you for participating in this usability test for Paper Detective, a research tool for academic literature reading.
>
> The purpose of this test is to evaluate how easy-to-use and useful our tool is for researchers like yourself. We're testing the tool, not you, so there are no wrong answers.
>
> The session will take about 30-40 minutes. I'll ask you to complete a few tasks while thinking out loud. After that, I'll ask you some questions about your experience.
>
> Do you have any questions before we begin?"

**Consent Form**:
- [ ] Participant agrees to be recorded (screen + audio)
- [ ] Participant understands they can stop at any time
- [ ] Participant agrees to data use for research purposes

---

### Part 2: Pre-Test Questionnaire (2 minutes)

**Background Questions**:
1. What is your field of study?
   - [ ] Computer Science
   - [ ] HCI / User Experience
   - [ ] Psychology
   - [ ] Other: _______

2. What is your current academic level?
   - [ ] Undergraduate
   - [ ] Master's Student
   - [ ] PhD Student
   - [ ] Postdoc / Faculty

3. How often do you read academic papers?
   - [ ] Daily (5+ papers/week)
   - [ ] Weekly (2-4 papers/week)
   - [ ] Monthly (1-4 papers/month)
   - [ ] Rarely (less than 1 paper/month)

4. What tools do you currently use for reading papers? (Select all that apply)
   - [ ] PDF viewer (Adobe, Preview, etc.)
   - [ ] Zotero / Mendeley / EndNote
   - [ ] Notion / Obsidian
   - [ ] Highlighting on paper
   - [ ] Other: _______

---

### Part 3: Task Scenarios (20 minutes)

**Instruction to Participant**:
> "I'll now ask you to complete 6 tasks using Paper Detective. Please think out loud as you complete each task - tell me what you're looking for, what you're thinking, and what you expect to happen.
>
> If you get stuck, I'll help you after 30 seconds. Ready?"

---

#### Task 1: Upload PDF and Create Highlights (5 minutes)

**Scenario**: "You're starting a new literature review on AI tools for academic research. Upload the provided PDF and create 3 highlights."

**Instructions to Participant**:
1. Upload the test PDF (`medium-10pages.pdf`)
2. Create a red highlight on the first page
3. Create a yellow highlight on the second page
4. Create an orange highlight on the third page

**Success Criteria**:
- [ ] Successfully uploads PDF
- [ ] Creates 3 highlights with different colors
- [ ] All highlights appear in Detective Notebook

**Observation Points**:
- Time to complete task
- Confusion points
- Error recovery
- Comments about highlighting UI

---

#### Task 2: Generate and View Intelligence Brief (3 minutes)

**Scenario**: "You want to get a quick overview of this paper without reading it in detail. Generate and view the Intelligence Brief."

**Instructions to Participant**:
1. Find and click the "Generate Intelligence Brief" button
2. Wait for generation to complete
3. Review the brief content

**Success Criteria**:
- [ ] Finds generation button easily
- [ ] Understands progress indicator
- [ ] Reviews all sections of brief

**Observation Points**:
- Time to find button
- Understanding of brief sections
- Perceived usefulness of brief
- Comments on completeness

---

#### Task 3: Find Information Using Search (4 minutes)

**Scenario**: "You remember reading something about 'user testing' in this paper. Use Advanced Search to find it."

**Instructions to Participant**:
1. Open Advanced Search
2. Search for "user testing"
3. Filter results to show only "Findings" cards
4. Sort by confidence level

**Success Criteria**:
- [ ] Finds search functionality
- [ ] Successfully applies filters
- [ ] Navigates to search result

**Observation Points**:
- Search query formulation
- Filter usage
- Sort preference
- Result relevance perception

---

#### Task 4: Export Notes as Markdown (2 minutes)

**Scenario**: "You want to share your highlights with a colleague. Export your notes as a Markdown file."

**Instructions to Participant**:
1. Find export functionality
2. Select "Markdown" format
3. Download the file
4. Verify the download

**Success Criteria**:
- [ ] Finds export option
- [ ] Selects correct format
- [ ] Successfully downloads file

**Observation Points**:
- Time to find export
- Format selection confidence
- Download success perception

---

#### Task 5: Organize Highlights into Groups (3 minutes)

**Scenario**: "You want to organize your highlights by theme. Create two groups: 'Methods' and 'Findings'."

**Instructions to Participant**:
1. Go to Detective Notebook
2. Create a new group called "Methods"
3. Create a new group called "Findings"
4. Drag relevant highlights to each group

**Success Criteria**:
- [ ] Creates two groups
- [ ] Successfully drags highlights to groups
- [ ] All highlights organized

**Observation Points**:
- Drag-and-drop intuitiveness
- Group creation ease
- Organization strategy

---

#### Task 6: Read AI Clue Cards and Navigate (3 minutes)

**Scenario**: "You want to learn more about the research methods mentioned in the AI clue cards. Read a methods card and navigate to the source."

**Instructions to Participant**:
1. Find a Methods-type AI clue card
2. Click on the card to see details
3. Click the "Go to Source" button
4. Verify PDF navigates to correct location

**Success Criteria**:
- [ ] Finds methods card
- [ ] Clicks through to details
- [ ] Successfully navigates to PDF source

**Observation Points**:
- Card type identification
- Navigation expectation
- Source location accuracy

---

### Part 4: Post-Test Questionnaire (5 minutes)

#### System Usability Scale (SUS)

**Please rate your agreement with each statement (1 = Strongly Disagree, 5 = Strongly Agree)**:

1. [ ] I think that I would like to use this system frequently.
2. [ ] I found the system unnecessarily complex.
3. [ ] I thought the system was easy to use.
4. [ ] I think that I would need the support of a technical person to use this system.
5. [ ] I found the various functions in this system were well integrated.
6. [ ] There was too much inconsistency in this system.
7. [ ] I would imagine that most people would learn to use this system very quickly.
8. [ ] I found the system very cumbersome to use.
9. [ ] I felt very confident using the system.
10. [ ] I needed to learn a lot of things before I could get going with this system.

**Scoring**: Calculate using SUS formula (target: ≥70/100)

---

#### Net Promoter Score (NPS)

**On a scale of 0-10, how likely are you to recommend Paper Detective to a colleague or friend?**

```
0 [Not at all likely]  1  2  3  4  5  6  7  8  9  10 [Extremely likely]
```

**Follow-up Question**: Why did you give this rating?

**Scoring**:
- Promoters (9-10): Count
- Passives (7-8): Count
- Detractors (0-6): Count
- NPS = (% Promoters - % Detractors)

**Target**: NPS ≥ 7

---

#### Feature Ratings

**Please rate the usefulness of each feature (1 = Not Useful, 5 = Very Useful)**:

- [ ] PDF Highlighting (4 colors)
- [ ] Detective Notebook (drag-and-drop groups)
- [ ] AI Clip Summary (3-sentence overview)
- [ ] AI Clue Cards (12-20 cards per paper)
- [ ] Intelligence Brief (comprehensive analysis)
- [ ] Advanced Search
- [ ] Export to Markdown
- [ ] Export to BibTeX

---

#### Open-Ended Questions

1. **What did you like most about Paper Detective?**
   _______________________________

2. **What did you like least or find most frustrating?**
   _______________________________

3. **What features would you like to see added?**
   _______________________________

4. **How would you improve the Intelligence Brief feature?**
   _______________________________

5. **Any other comments or suggestions?**
   _______________________________

---

### Part 5: Semi-Structured Interview (10 minutes)

**Key Questions**:

1. **Walk me through your experience with the Intelligence Brief.**
   - Was it easy to understand?
   - Was the information useful?
   - What would make it more useful?

2. **Tell me about the Export functionality.**
   - Was it what you expected?
   - What formats would you prefer?
   - How would you use this in your workflow?

3. **How did the Search feature compare to your current tools?**
   - What worked well?
   - What was missing?

4. **Would you use Paper Detective in your research? Why or why not?**
   - What would prevent you from using it?
   - What would encourage you to use it?

5. **If you could change one thing about Paper Detective, what would it be?**

---

## 📊 Data Collection Template

**Session ID**: _______
**Date**: _______
**Participant ID**: _______
**Facilitator**: _______

### Quantitative Data

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Task 1 Completion | <5 min | _____ min | [ ] |
| Task 2 Completion | <3 min | _____ min | [ ] |
| Task 3 Completion | <4 min | _____ min | [ ] |
| Task 4 Completion | <2 min | _____ min | [ ] |
| Task 5 Completion | <3 min | _____ min | [ ] |
| Task 6 Completion | <3 min | _____ min | [ ] |
| Overall Completion | 6/6 tasks | ___/6 | [ ] |
| SUS Score | ≥70 | _____ | [ ] |
| NPS | ≥7 | _____ | [ ] |

### Qualitative Notes

**Positive Feedback**:
-
-
-

**Negative Feedback**:
-
-
-

**Confusion Points**:
-
-
-

**Feature Requests**:
-
-
-

**Critical Issues** (bugs that blocked user):
-
-

---

## 🛠️ Facilitator Checklist

**Before Session**:
- [ ] Test environment is set up and working
- [ ] Test PDF is accessible
- [ ] Screen recording is ready
- [ ] Consent forms are printed
- [ ] Questionnaires are ready

**During Session**:
- [ ] Participant signs consent form
- [ ] Pre-test questionnaire completed
- [ ] All 6 tasks attempted
- [ ] Think-aloud protocol followed
- [ ] Notes taken for each task
- [ ] Post-test questionnaire completed
- [ ] Interview questions asked

**After Session**:
- [ ] Thank participant
- [ ] Provide compensation (if applicable)
- [ ] Save screen recording
- [ ] Transcribe notes
- [ ] Calculate SUS and NPS scores
- [ ] Identify critical issues

---

## 📈 Analysis Plan

**Quantitative Analysis**:
1. Calculate task completion rates
2. Calculate average time-on-task
3. Calculate SUS score (using standard formula)
4. Calculate NPS (% promoters - % detractors)
5. Compare against targets

**Qualitative Analysis**:
1. Identify common pain points
2. Identify common praise points
3. Categorize feature requests
4. Identify critical bugs
5. Generate recommendations

**Prioritization Framework**:
- **Must Fix**: Blocks user workflow, mentioned by >30% participants
- **Should Fix**: Annoying but workaround exists, mentioned by >20% participants
- **Could Fix**: Nice to have, mentioned by >10% participants
- **Won't Fix**: Out of scope, low priority

---

## 🚨 Critical Issue Escalation

If a participant encounters a **critical bug** that completely blocks them:

1. **Document immediately**: Note the steps, error message, and context
2. **Photograph/Record**: Capture screen if possible
3. **Assist participant**: Help them work around the issue
4. **Notify team**: Post to team channel immediately
5. **Flag for fix**: Mark as P0 critical bug

**Examples of Critical Bugs**:
- App crashes or freezes
- Data loss (highlights disappear)
- Export generates empty/corrupted file
- Search returns no results when it should
- Navigation doesn't work

---

**Last Updated**: 2026-02-10 by test-architect-v2
**Status**: Ready for use
**Next**: Schedule participants with hci-researcher-v2
