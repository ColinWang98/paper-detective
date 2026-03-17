# Facilitator Training Guide - User Testing Sessions

**Document Owner**: product-manager-v2
**Purpose**: Train facilitators for Sprint 4 user testing sessions
**Created**: 2026-02-11 (Day 19)
**Audience**: Test facilitators (hci-researcher-v2, test-architect-v2, product-manager-v2)

---

## Facilitator Role Overview

### Primary Responsibilities

**Before Session**:
- Prepare test environment
- Review test protocol
- Set up recording equipment
- Have consent forms ready

**During Session**:
- Welcome participant and build rapport
- Explain testing process (it's the tool being tested, not you)
- Guide participant through tasks
- Encourage think-aloud protocol
- Take detailed notes
- Ask follow-up questions

**After Session**:
- Thank participant and provide compensation
- Save recordings and notes
- Calculate SUS/NPS scores
- Flag critical bugs immediately

---

## Session Structure (30-45 minutes)

### Part 1: Introduction (5 minutes)

**Objectives**:
- Build rapport
- Set expectations
- Obtain consent

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
2. What is your current academic level?
3. How often do you read academic papers?
4. What tools do you currently use for reading papers?

**Purpose**: Understand participant context

---

### Part 3: Task Scenarios (20 minutes)

**Instruction to Participant**:
> "I'll now ask you to complete 6 tasks using Paper Detective. Please think out loud as you complete each task - tell me what you're looking for, what you're thinking, and what you expect to happen.
>
> If you get stuck, I'll help you after 30 seconds. Ready?"

**Facilitator Guidelines**:
- **Neutral tone**: Don't lead the participant
- **Think-aloud**: Remind them to verbalize thoughts
- **Timing**: Record how long each task takes
- **Note-taking**: Document pain points, confusion, successes
- **Intervention**: Wait 30 seconds before helping

**Critical Rule**: DO NOT help unless explicitly asked or 30 seconds of struggle

---

### Part 4: Post-Test Questionnaire (5 minutes)

**System Usability Scale (SUS)**: 10 questions
**Net Promoter Score (NPS)**: 0-10 rating + follow-up
**Feature Ratings**: Usefulness of each feature

**Facilitator Guidelines**:
- Let participant complete questionnaire independently
- Be available for clarification
- Record exact scores

---

### Part 5: Semi-Structured Interview (10 minutes)

**Key Questions**:
1. "Walk me through your experience with the Intelligence Brief."
2. "Tell me about the Export functionality."
3. "How did the Search feature compare to your current tools?"
4. "Would you use Paper Detective in your research? Why or why not?"
5. "If you could change one thing, what would it be?"

**Facilitator Guidelines**:
- Ask open-ended questions
- Probe for specifics ("Can you give me an example?")
- Allow silence for thinking
- Don't defend the product
- Capture exact quotes

---

## Facilitator Skills

### Think-Aloud Protocol

**What to Say**:
- "Please think out loud as you complete this task"
- "Tell me what you're looking for"
- "What do you expect to happen when you click this?"
- "What are you thinking right now?"

**What NOT to Say**:
- "Click the X button" (leading)
- "That's right!" (confirming)
- "Most people do it this way" (pressuring)

### Neutral Probing

**Open-Ended Questions**:
- "What did you expect to happen?"
- "What was confusing about that?"
- "Can you tell me more about...?"
- "How would you improve this?"

**Closed Questions to Avoid**:
- "Did you like that feature?" (yes/no bias)
- "Was it easy to use?" (leading)
- "Do you understand?" (pressure to say yes)

### When Participant Struggles

**30-Second Rule**:
- Count to 30 mentally
- Observe their approach
- Note what's blocking them
- Then intervene

**Intervention Script**:
> "I see you've been working on this for a bit. Would you like me to help, or would you prefer to continue trying?"

**If They Accept Help**:
- Provide minimal hint
- Document where they got stuck
- Note what would have helped

### When Participant Asks Questions

**During Tasks**:
- "What do you think would happen?" (redirect)
- "Give it a try and see" (encourage)
- "Remember, we're testing the tool, not you" (reassure)

**After Tasks**:
- Answer fully
- Clarify misconceptions
- Thank them for the feedback

---

## Note-Taking Framework

### Observation Template

**Task #X: [Task Name]**

**Duration**: _____ minutes (target: _____)

**Completion**: [ ] Completed independently | [ ] Completed with help | [ ] Failed

**What Went Well**:
-
-

**Pain Points/Confusion**:
-
-

**Quotes**:
- "..." (exact participant words)

**Severity**: [ ] P0 (blocked) | [ ] P1 (frustrated) | [ ] P2 (minor)

**Facilitator Notes**:
-

---

## Critical Bug Escalation

### During Session: If Critical Bug Found

**Examples**:
- App crashes or freezes
- Data loss (highlights disappear)
- Export generates empty/corrupted file
- Navigation doesn't work

**Actions**:
1. **Immediately**: Document the bug (steps to reproduce)
2. **Quickly**: Take screenshot or photo if possible
3. **Help participant**: Work around the issue
4. **After session**: Notify team immediately (message team-lead)

**Bug Report Format**:
```
CRITICAL BUG FOUND - Session #[X]

Description: [What happened]
Steps: [How to reproduce]
Impact: [Which task blocked]
Participant: [ID]
Time: [Timestamp]
Screenshot: [Attached]

ACTION NEEDED: [Fix before next session or document workaround]
```

---

## Data Collection Checklist

### Before Session

- [ ] Test environment is set up and working
- [ ] Test PDF is accessible (medium-10pages.pdf)
- [ ] Screen recording is ready
- [ ] Consent forms are printed/digital
- [ ] Questionnaires are ready
- [ ] Timer is available

### During Session

- [ ] Participant signs consent form
- [ ] Pre-test questionnaire completed
- [ ] Task 1: Upload PDF and create highlights
- [ ] Task 2: Generate Intelligence Brief
- [ ] Task 3: Use search (if available)
- [ ] Task 4: Export as Markdown
- [ ] Task 5: Organize highlights into groups
- [ ] Task 6: Read AI cards and navigate
- [ ] All tasks attempted
- [ ] Think-aloud protocol followed
- [ ] Notes taken for each task
- [ ] Post-test questionnaire completed
- [ ] Interview questions asked

### After Session

- [ ] Thank participant
- [ ] Provide compensation ($20 gift card)
- [ ] Save screen recording
- [ ] Transcribe notes
- [ ] Calculate SUS score (target: ≥70)
- [ ] Calculate NPS score (target: ≥+30)
- [ ] Identify critical issues
- [ ] Send bug report if needed

---

## Facilitator Do's and Don'ts

### DO ✅

- [ ] Build rapport at the beginning
- [ ] Explain it's the tool being tested, not them
- [ ] Encourage think-aloud throughout
- [ ] Wait 30 seconds before helping
- [ ] Take detailed notes
- [ ] Ask open-ended questions
- [ ] Remain neutral
- [ ] Thank them profusely
- [ ] Provide compensation promptly

### DON'T ❌

- [ ] Lead them to answers
- [ ] Say "right" or "wrong" to their actions
- [ ] Defend the product
- [ ] Interrupt their think-aloud
- [ ] Help too quickly
- [ ] Skip taking notes
- [ ] Ask leading questions
- [ ] Make them feel incompetent
- [ ] Forget to compensate

---

## Managing Difficult Situations

### Participant is Silent (Not Thinking Aloud)

**Gentle Reminders**:
- "Remember to think out loud as you work"
- "What are you looking at right now?"
- "What's going through your mind?"

**If Still Silent**:
- Accept they may not be verbal thinkers
- Take notes on their actions and facial expressions
- Ask more questions in the interview

### Participant is Frustrated

**Acknowledge and Validate**:
- "I can see this is frustrating"
- "Thank you for your patience"
- "This is exactly the kind of feedback we're looking for"

**Reassure**:
- "Remember, we're testing the tool, not you"
- "You're helping us identify issues"

**If Too Frustrated**:
- Offer to skip to next task
- Ask what caused the frustration
- Document the pain point thoroughly

### Participant Asks "Is This Right?"

**Redirect**:
- "There's no right or wrong way"
- "Do what feels natural to you"
- "We're interested in how you would approach it"

**If Insistent**:
- "Give it a try and see what happens"
- "Remember, you can't break anything"

### Technical Difficulties

**Stay Calm**:
- Apologize for the technical issue
- Explain it's not their fault
- Offer to reschedule if needed

**Document**:
- What went wrong
- Impact on session
- Whether data is still usable

---

## Time Management

### Session Timeline (30-45 minutes)

| Part | Duration | Target |
|------|----------|--------|
| Introduction | 5 min | Build rapport, consent |
| Pre-test questionnaire | 2 min | Background info |
| Task scenarios | 20 min | 6 tasks (~3 min each) |
| Post-test questionnaire | 5 min | SUS, NPS, ratings |
| Interview | 10 min | Qualitative insights |
| Wrap-up | 3 min | Thank you, compensation |

**Total**: ~45 minutes

### If Running Behind

**Priority**:
1. Complete as many tasks as possible
2. At minimum: Tasks 1, 2, 4 (core flow)
3. Shorten interview if needed
4. Always collect SUS and NPS

---

## Facilitator Preparation Checklist

### Day Before Session

- [ ] Review user testing materials thoroughly
- [ ] Practice the 6 tasks yourself
- [ ] Prepare test environment (URL, PDF)
- [ ] Test recording equipment
- [ ] Print consent forms
- [ ] Prepare questionnaires (digital or print)
- [ ] Have gift cards ready

### 1 Hour Before Session

- [ ] Open test environment and verify it works
- [ ] Open recording software
- [ ] Have note-taking template ready
- [ ] Get water/coffee for yourself and participant
- [ ] Check room is quiet and private

### Immediately Before Session

- [ ] Welcome participant warmly
- [ ] Offer refreshments
- [ ] Check participant is comfortable
- [ ] Start recording
- [ ] Begin introduction script

---

## After Session: Data Processing

### Immediate (Within 1 Hour)

- [ ] Save recording with participant ID
- [ ] Calculate SUS score
- [ ] Calculate NPS score
- [ ] Note critical bugs (if any)
- [ ] Send bug report to team (if needed)

### End of Day

- [ ] Transcribe key quotes
- [ ] Summarize findings
- [ ] Identify patterns across participants
- [ ] Update facilitator notes

### End of Testing (After All Sessions)

- [ ] Compile all SUS scores (calculate average)
- [ ] Compile all NPS scores (calculate overall NPS)
- [ ] Identify common themes
- [ ] Generate recommendations
- [ ] Create final report

---

## Facilitator Self-Reflection

### After Each Session, Ask Yourself:

1. **Did I remain neutral?** (Did I lead or influence?)
2. **Did I capture enough detail?** (Can I recreate the session?)
3. **Did I miss anything important?** (Review notes)
4. **What should I do differently next time?**

### Continuous Improvement

**After Session 1**: What surprised you?
**After Session 2**: What patterns are emerging?
**After Session 3**: What should you probe more?
**After Session 4**: What's missing from the data?
**After Session 5**: What are the key insights?

---

**Document Status**: ✅ READY FOR USE

**Owner**: product-manager-v2
**Reviewer**: hci-professor
**Last Updated**: 2026-02-11 (Day 19)
**Training Date**: Day 20 (before recruitment)

**Ready to facilitate excellent user testing sessions!** 🎯✅
