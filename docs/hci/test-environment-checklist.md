# Test Environment Checklist - User Testing

**Document Owner**: product-manager-v2
**Purpose**: Ensure test environment is ready for user testing sessions
**Created**: 2026-02-11 (Day 19)
**Usage**: Day 20-22 (before and during testing)

---

## Pre-Test Environment Setup (Day 20)

### Deployment Verification

**Application Access**:
- [ ] Application is deployed and accessible
- [ ] URL is known and working: _______________
- [ ] SSL certificate valid (if HTTPS)
- [ ] Application loads without errors

**Environment Type**: [ ] Development (localhost) | [ ] Staging | [ ] Production

**If Local Testing**:
- [ ] Development server running: `npm run dev`
- [ ] Port accessible: http://localhost:3000
- [ ] No firewall blocking connections
- [ ] Hot reload disabled during testing (prevent distractions)

**If Remote Testing**:
- [ ] Deployed to staging/production
- [ ] URL shared with facilitators
- [ ] Test account credentials prepared (if needed)
- [ ] Network connectivity verified

---

### Test PDF Preparation

**Required File**: medium-10pages.pdf (or similar academic paper)

**Status**:
- [ ] Test PDF exists and is accessible
- [ ] PDF location: _______________
- [ ] PDF size: _____ MB (target: <5MB for quick upload)
- [ ] PDF is academic paper (realistic test scenario)
- [ ] PDF has multiple pages (for testing navigation)
- [ ] PDF is readable (not corrupted)

**Alternative Options**:
- [ ] URL to download PDF during session: _______________
- [ ] Backup PDF available if needed
- [ ] PDF works in application (test upload beforehand)

**Test**:
- [ ] Successfully uploaded PDF to application
- [ ] PDF renders correctly in viewer
- [ ] All pages accessible
- [ ] No rendering issues

---

### API Configuration

**OpenAI API (or alternative)**:
- [ ] API key configured and valid
- [ ] API quota sufficient for testing (5 participants × Brief generation)
- [ ] API endpoint accessible
- [ ] Cost tracking enabled (monitor spend)

**Estimated Costs**:
- Per Brief generation: $0.006-0.010
- Total for 5 sessions: ~$0.03-0.05
- Budget allocation: $_____

**Backup Plan**:
- [ ] Demo data available if API fails
- [ ] Offline mode ready (if applicable)
- [ ] Fallback to cached responses

---

### Browser Compatibility

**Target Browser**: [ ] Chrome | [ ] Firefox | [ ] Edge | [ ] Safari

**Verification**:
- [ ] Application works in target browser
- [ ] No console errors
- [ ] All features functional
- [ ] Responsive design works

**If Testing Across Browsers**:
- Chrome: [ ] Tested
- Firefox: [ ] Tested
- Safari: [ ] Tested (if Mac users)
- Edge: [ ] Tested

---

### Recording Setup

**Screen Recording**:
- [ ] Screen recording software installed: _______________
- [ ] Audio recording working
- [ ] Video quality adequate (720p minimum)
- [ ] Storage space available (estimate: 500MB per session)
- [ ] Backup recording method available

**Test Recording**:
- [ ] Record a test session (5 minutes)
- [ ] Verify audio clear
- [ ] Verify screen visible
- [ ] Verify file saves correctly

**Data Privacy**:
- [ ] Participant consent form includes recording permission
- [ ] Secure storage for recordings planned
- [ ] Data retention policy communicated
- [ ] Deletion timeline: recordings deleted after _____ days

---

## Day-of-Test Checklist (Before Each Session)

### 30 Minutes Before Session

**Environment Check**:
- [ ] Application URL accessible
- [ ] Test PDF ready to upload
- [ ] Browser open and cleared cache (fresh session)
- [ ] Recording software ready
- [ ] Timer/stopwatch available
- [ ] Note-taking template open

**Room Setup** (if in-person):
- [ ] Quiet room reserved
- [ ] Comfortable seating
- [ ] Computer/display ready
- [ ] Refreshments available (water, coffee)
- [ ] Consent forms printed

**Remote Setup** (if Zoom/Google Meet):
- [ ] Meeting link tested
- [ ] Screen sharing working
- [ ] Audio clear
- [ ] Recording enabled
- [ ] Backup link ready

---

### 5 Minutes Before Session

**Final Checks**:
- [ ] Application loaded and working
- [ ] No browser errors
- [ ] Recording started
- [ ] Note-taking template ready
- [ ] Consent form ready
- [ ] Facilitator script reviewed
- [ ] Calm and focused

---

## During Session: Environment Monitoring

### Technical Issues Watchlist

**Application Issues**:
- [ ] Application crashes → Restart and resume
- [ ] Pages won't load → Check internet connection
- [ ] Features not working → Note as bug, offer workaround
- [ ] Slow performance → Document, note impact on session

**API Issues**:
- [ ] Brief generation fails → Note as critical bug
- [ ] Generation very slow (>60s) → Document, continue session
- [ ] API quota exceeded → Use demo data

**Browser Issues**:
- [ ] Browser crashes → Restart, apologize to participant
- [ ] Features not working in browser → Document as bug
- [ ] Display issues → Adjust zoom, document

**Recording Issues**:
- [ ] Recording stops → Restart immediately, note gap
- [ ] Audio unclear → Continue, rely on notes
- [ ] Video frozen → Continue, rely on notes

---

## After Session: Environment Reset

### Between Sessions (15-minute break)

**Data Cleanup**:
- [ ] Clear application state (reset to fresh state)
- [ ] Delete uploaded test PDF (if applicable)
- [ ] Clear highlights and generated Briefs
- [ ] Reset browser cache (if needed)

**Environment Check**:
- [ ] Application still working
- [ ] No errors from previous session
- [ ] Ready for next participant

**Data Backup**:
- [ ] Save recording with participant ID
- [ ] Upload to secure storage
- [ ] Backup notes to cloud/storage
- [ ] Verify files not corrupted

---

## Environment Troubleshooting

### Common Issues and Solutions

**Application Won't Load**:
1. Check internet connection
2. Clear browser cache
3. Try different browser
4. Check deployment status
5. Restart development server (if local)
6. Contact team-lead if unresolved

**PDF Won't Upload**:
1. Check PDF file size (<10MB)
2. Verify PDF format (not corrupted)
3. Try different PDF
4. Check console for errors
5. Note as bug, skip task if blocking

**Brief Generation Fails**:
1. Check API key configuration
2. Verify API quota not exceeded
3. Check internet connection
4. Note error message
5. Offer to skip task or use demo data

**Recording Fails**:
1. Check storage space
2. Restart recording software
3. Test audio/video separately
4. Continue with detailed notes
5. Note technical issue in report

**Browser Crashes**:
1. Restart browser
2. Clear cache
3. Disable extensions
4. Apologize to participant
5. Resume from where you left off

---

## Environment Specifications

### Recommended Setup

**Hardware**:
- Computer: Modern laptop or desktop (last 5 years)
- RAM: 8GB minimum
- Storage: 5GB free space
- Internet: Stable broadband connection

**Software**:
- Browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Recording: OBS Studio, Loom, or similar
- Notes: Google Docs, Word, or similar

**Environment**:
- Quiet room (if in-person)
- Stable internet (minimum 10 Mbps)
- Backup power source (laptop charged)
- Backup internet (mobile hotspot)

---

## Facilitator Quick Reference

### Session Start (5 min before)

1. Open application URL
2. Load note-taking template
3. Start recording software
4. Open test PDF location
5. Welcome participant

### Session End (immediately after)

1. Stop recording
2. Save recording with participant ID
3. Upload to secure storage
4. Reset application state
5. Prepare for next session

### Critical Checks

**Before Starting**: Is app working? Is PDF ready? Is recording running?
**During Session**: Is participant comfortable? Is app still working?
**After Session**: Is data saved? Is environment reset?

---

## Environment Status Log

**Date**: _______
**Facilitator**: _______

**Before First Session**:
- Application URL: [ ] Working | [ ] Not working
- Test PDF: [ ] Accessible | [ ] Not accessible
- API: [ ] Working | [ ] Not working
- Recording: [ ] Working | [ ] Not working
- **Overall Status**: [ ] GO | [ ] NO-GO

**Between Sessions**:
- Session 1 → 2: Environment reset? [ ] Yes | [ ] No
- Session 2 → 3: Environment reset? [ ] Yes | [ ] No
- Session 3 → 4: Environment reset? [ ] Yes | [ ] No
- Session 4 → 5: Environment reset? [ ] Yes | [ ] No

**Issues Encountered**:
-

**Resolutions**:
-

---

## Sign-Off

**Environment Setup Completed By**: _______________
**Date**: _______
**Time**: _______

**Verification**:
- [ ] All checklist items complete
- [ ] Test run successful
- [ ] Ready for user testing

**Approved By**: _______________
**Date**: _______

---

**Document Status**: ✅ READY FOR USE

**Owner**: product-manager-v2
**Reviewer**: hci-professor, test-architect-v2
**Last Updated**: 2026-02-11 (Day 19)
**Next Review**: Day 20 (before first session)

**Test environment ready!** 🖥️✅
