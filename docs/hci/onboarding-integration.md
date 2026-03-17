# Onboarding Component Integration Guide

## Overview
3-step walkthrough for new users explaining the Paper Detective metaphor and core features.

## Features
- ✅ Shows only once (localStorage flag)
- ✅ Can be skipped
- ✅ Progressive disclosure (step-by-step)
- ✅ Progress indicators
- ✅ Can be triggered again from Settings
- ✅ Fully accessible (ARIA attributes)
- ✅ Framer Motion animations

## Integration Steps

### Step 1: Add to Main App

In `app/page.tsx`:

```tsx
'use client';

import RealPDFViewer from "@/components/RealPDFViewer";
import DetectiveNotebook from "@/components/DetectiveNotebook";
import Header from "@/components/Header";
import Onboarding from "@/components/Onboarding";

export default function Home() {
  return (
    <div className="min-h-screen vintage-paper">
      <Onboarding /> {/* Add this line */}
      <Header caseNumber={142} />

      <div className="container mx-auto px-4 py-6">
        {/* rest of your app */}
      </div>
    </div>
  );
}
```

### Step 2: Add "Show Tutorial Again" in Settings

In your Settings component (or create one):

```tsx
import { useOnboarding } from '@/components/Onboarding';

export default function Settings() {
  const { showOnboarding, hasSeenOnboarding } = useOnboarding();

  return (
    <div>
      <h2>设置</h2>

      <section>
        <h3>帮助</h3>
        <button onClick={showOnboarding}>
          显示新手教程
        </button>
      </section>
    </div>
  );
}
```

### Step 3: Customize (Optional)

You can customize the onboarding by modifying `components/Onboarding.tsx`:

```tsx
// Change steps
const steps = [
  {
    title: 'Your Custom Title',
    icon: '🎯',
    content: (
      <div>Your custom content</div>
    ),
  },
  // ... more steps
];

// Change storage key
localStorage.setItem('your-custom-key', 'true');
```

## Testing

### Test First-Time Experience
```bash
# Clear localStorage to simulate first-time user
localStorage.clear()
# Refresh page - onboarding should appear
```

### Test Skip
1. Click "跳过教程" button
2. Onboarding should close
3. Refresh page - onboarding should NOT appear

### Test Show Again
```tsx
// In browser console:
localStorage.removeItem('paper-detective-onboarding');
// Refresh page - onboarding appears again
```

## Accessibility

### Keyboard Navigation
- Tab: Navigate between buttons
- Enter/Space: Activate buttons
- ESC: Close onboarding (same as skip)

### Screen Reader Support
- `role="dialog"` for modal
- `aria-modal="true"` for focus trap
- `aria-labelledby` for title
- Progress indicators have labels

### Focus Management
Ideally, add focus trap when onboarding is open:

```tsx
import { useEffect } from 'react';

useEffect(() => {
  if (isVisible) {
    // Trap focus within onboarding
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          (lastElement as HTMLElement)?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          (firstElement as HTMLElement)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }
}, [isVisible]);
```

## Translations

To add translations, create a structure like:

```tsx
const i18n = {
  en: {
    title: 'Welcome to Paper Detective',
    skip: 'Skip tutorial',
    // ...
  },
  zh: {
    title: '欢迎来到 Paper Detective',
    skip: '跳过教程',
    // ...
  },
};
```

## Analytics Tracking (Optional)

To track onboarding completion:

```tsx
const handleComplete = () => {
  // Track completion event
  analytics.track('onboarding_completed');

  localStorage.setItem('paper-detective-onboarding', 'true');
  setIsVisible(false);
  onComplete?.();
};

const handleSkip = () => {
  // Track skip event
  analytics.track('onboarding_skipped', { step: currentStep });

  localStorage.setItem('paper-detective-onboarding', 'true');
  setIsVisible(false);
  onSkip?.();
};
```

## Troubleshooting

### Onboarding doesn't appear
- Check localStorage: `localStorage.getItem('paper-detective-onboarding')`
- Clear localStorage if needed
- Check browser console for errors

### Onboarding appears every time
- Check if localStorage is working
- Verify the key name matches
- Check for private browsing mode (localStorage may be disabled)

### Styles not working
- Ensure Tailwind CSS classes are applied
- Check for CSS conflicts
- Verify z-index (should be 50)

## Future Enhancements

Potential improvements:
1. Interactive tutorials (highlight actual elements)
2. Video walkthrough
3. Context-sensitive help (tooltips during first use)
4. Completion progress tracking
5. A/B testing different onboarding flows

## References

- HCI Research: Progressive Disclosure
- NN/G: Onboarding Best Practices
- ARIA Authoring Practices Guide (modals)
