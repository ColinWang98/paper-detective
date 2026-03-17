# Quick Code Review Guide - Sprint 4
**For Developers: Fast Reference Before Submitting Code**

**Version**: 1.0.0
**Last Updated**: 2026-02-10

---

## 🚀 5-Minute Pre-Submission Checklist

### 1. TypeScript Safety (30 seconds)
```bash
npm run type-check
```
- [ ] No TypeScript errors
- [ ] No `any` types (unless in error handler with comment)
- [ ] All functions have return types
- [ ] All params have types

### 2. Linting (30 seconds)
```bash
npm run lint
```
- [ ] No ESLint errors
- [ ] Auto-fix with `npm run lint:fix` if needed

### 3. Formatting (10 seconds)
```bash
npm run format
```
- [ ] Code formatted with Prettier
- [ ] No trailing whitespace
- [ ] Consistent quotes/semicolons

### 4. Build (1 minute)
```bash
npm run build
```
- [ ] Production build succeeds
- [ ] No bundle size warnings

### 5. Manual Testing (2 minutes)
- [ ] Feature works in browser
- [ ] No console errors
- [ ] Error states handled
- [ ] Responsive design works

---

## 🚨 Top 10 Common Mistakes to Avoid

### 1. Using `any` Type
❌ **Don't**:
```typescript
const data: any = await response.json();
```

✅ **Do**:
```typescript
interface Response {
  data: unknown;
}
const data = await response.json() as Response;
```

### 2. Missing Return Types
❌ **Don't**:
```typescript
async function getData() {
  return await fetch(url);
}
```

✅ **Do**:
```typescript
async function getData(): Promise<Response> {
  return await fetch(url);
}
```

### 3. Silent Error Catching
❌ **Don't**:
```typescript
try {
  await riskyOp();
} catch (e) {
  // Silent
}
```

✅ **Do**:
```typescript
try {
  await riskyOp();
} catch (error) {
  console.error('Op failed:', error);
  showToast('Could not complete operation');
}
```

### 4. Inline Objects in JSX
❌ **Don't**:
```typescript
<div style={{ color: 'red', margin: 10 }}>
```

✅ **Do**:
```typescript
const cardStyle = { color: 'red', margin: 10 };
<div style={cardStyle}>
```

### 5. useEffect Missing Dependencies
❌ **Don't**:
```typescript
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId
```

✅ **Do**:
```typescript
useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]); // Or useCallback for fetchData
```

### 6. Direct State Mutation
❌ **Don't**:
```typescript
const [items, setItems] = useState([]);
items.push newItem);
```

✅ **Do**:
```typescript
const [items, setItems] = useState([]);
setItems([...items, newItem]);
```

### 7. Not Handling Null/Undefined
❌ **Don't**:
```typescript
const user = getUser();
console.log(user.name); // Crash if null
```

✅ **Do**:
```typescript
const user = getUser();
if (!user) {
  throw new Error('User not found');
}
console.log(user.name);
```

### 8. Long Functions (>50 lines)
❌ **Don't**:
```typescript
function processEverything() {
  // 100 lines of code
}
```

✅ **Do**:
```typescript
function processEverything() {
  const data = fetchData();
  const processed = processData(data);
  return saveData(processed);
}
```

### 9. Magic Numbers
❌ **Don't**:
```typescript
if (count > 10) { // What is 10?
```

✅ **Do**:
```typescript
const MAX_CARDS = 10;
if (count > MAX_CARDS) {
```

### 10. Inconsistent Naming
❌ **Don't**:
```typescript
const userData = getUser();
const user_info = getUserInfo();
const UserInfo = getUserData();
```

✅ **Do**:
```typescript
const userData = getUser();
const userInfo = getUserInfo();
const userProfile = getUserProfile();
```

---

## 📝 PR Template

Copy this for every PR:

```markdown
## Description
Brief description of changes (1-2 sentences)

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Edge cases covered (empty states, errors)
- [ ] Tested on Chrome/Firefox/Safari

## Code Quality Checks
- [ ] `npm run type-check` passed
- [ ] `npm run lint` passed
- [ ] `npm run format` applied
- [ ] `npm run build` successful
- [ ] No console errors in browser

## Screenshots (if UI changes)
Attach before/after screenshots

## Additional Notes
Any additional context for the reviewer
```

---

## 🔧 VS Code Setup

### Recommended Extensions
Install these extensions:
1. ESLint
2. Prettier
3. Error Lens
4. TypeScript Importer
5. GitLens

### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

---

## ⚡ Quick Commands

```bash
# Fix all linting errors automatically
npm run lint:fix

# Format all files
npm run format

# Type check without building
npm run type-check

# Production build check
npm run build

# Check format without changing
npm run format:check
```

---

## 🎯 Quality Checklist by File Type

### Components (`*.tsx`)
- [ ] Props interface defined
- [ ] No `any` types
- [ ] Event handlers use `useCallback`
- [ ] Expensive values use `useMemo`
- [ ] Component exported with proper name
- [ ] Default props documented

### Hooks (`*.ts`)
- [ ] Hook function starts with `use`
- [ ] Dependencies array correct
- [ ] Cleanup function returned if needed
- [ ] Error handling in place
- [ ] Return type defined

### Services (`*.ts`)
- [ ] Class-based or singleton pattern
- [ ] Error handling with try-catch
- [ ] Logging for debugging
- [ ] Type-safe parameters
- [ ] JSDoc comments for public methods

### API Routes (`route.ts`)
- [ ] Request body validated
- [ ] Response type defined
- [ ] Error handling for all paths
- [ ] Status codes correct
- [ ] CORS headers if needed

### Types (`*.ts`)
- [ ] Export interface/type
- [ ] No circular dependencies
- [ ] TSDoc comments for complex types
- [ ] Proper use of `unknown` vs `any`

---

## 📊 When to Ask for Review

### Get Review Early (Don't Wait Until Done)
- Architecture decisions
- Complex algorithms
- Security-related code
- Performance-critical code
- Breaking changes

### Self-Review First
- Code runs without errors
- All tests pass
- Code is formatted
- Documentation updated

### Final Review Before Merge
- All checklist items complete
- At least one team member approval
- CI/CD checks passing
- No merge conflicts

---

## 🆘 Quick Help

### ESLint Errors
```bash
# Auto-fix most issues
npm run lint:fix

# Check specific file
npx eslint path/to/file.ts
```

### TypeScript Errors
```bash
# Check for errors
npm run type-check

# Watch mode
npx tsc --noEmit --watch
```

### Format Issues
```bash
# Fix all formatting
npm run format

# Check specific file
npx prettier --check path/to/file.ts
```

---

## 💡 Pro Tips

1. **Commit Often**: Small, focused commits are easier to review
2. **Write Tests First**: TDD leads to better design
3. **Document as You Code**: Don't wait until the end
4. **Review Your Own Code**: Self-review before submitting
5. **Ask Questions**: Team chat is faster than guessing

---

## 📞 Need Help?

- **Team Chat**: Ask questions in the Paper Detective v2 team
- **Code Reviewer**: @code-reviewer-v2 available for pair programming
- **Documentation**: Check `docs/TECHNICAL_DOCUMENTATION.md`

---

**Remember**: Code quality is everyone's responsibility. Quality code = happy team! 🚀

**Last Updated**: 2026-02-10
**Maintainer**: code-reviewer-v2
