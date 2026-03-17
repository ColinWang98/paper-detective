# Toast Notification System - Usage Guide

## Overview
Accessible toast notification system using Framer Motion for smooth animations.

## Features
- ✅ Auto-dismiss after 3 seconds (configurable)
- ✅ Stack multiple toasts
- ✅ ARIA live region for screen readers
- ✅ Keyboard accessible (ESC to dismiss)
- ✅ Three types: success, error, info

## Usage

### 1. Add ToastContainer to your app

In `app/layout.tsx` or `app/page.tsx`:

```tsx
'use client';

import { useToast } from '@/components/Toast';
import ToastContainer from '@/components/Toast';

export default function App() {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      <YourAppContent />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
```

### 2. Use toast in components

```tsx
'use client';

import { useToast } from '@/components/Toast';

export default function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('操作成功！', 'success');
  };

  const handleError = () => {
    showToast('出错了，请重试', 'error');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### 3. Integration with RealPDFViewer

In `RealPDFViewer.tsx`, add toast notifications for highlight creation:

```tsx
import { useToast } from '@/components/Toast';

export default function RealPDFViewer() {
  const { showToast } = useToast();

  const createHighlight = async () => {
    try {
      await addHighlight(highlightData);
      showToast('已添加到收集箱', 'success');
    } catch (error) {
      showToast('添加失败，请重试', 'error');
    }
  };
}
```

### 4. Integration with DetectiveNotebook

Add toast for drag-and-drop operations:

```tsx
import { useToast } from '@/components/Toast';

const handleDragEnd = async (event: DragEndEvent) => {
  try {
    await moveHighlightToGroup(activeIdNum, overIdNum);
    const groupName = groups.find(g => g.id === overIdNum)?.name;
    showToast(`已移动到 "${groupName}"`, 'success');
  } catch (error) {
    showToast('移动失败', 'error');
  }
};
```

## Accessibility

- Uses `role="alert"` and `aria-live="polite"` for screen readers
- All buttons have proper `aria-label` attributes
- Keyboard accessible (Tab to navigate, Enter/Space to dismiss)
- Focus management for multiple toasts

## Animation

- Entry: Slide in from left (300ms)
- Exit: Fade and slide to right (300ms)
- Stacking: Newest toast appears at bottom
- Mode: "popLayout" for smooth layout transitions

## Customization

To change duration:

```tsx
showToast('Message', 'success', 5000); // 5 seconds
```

To add custom toast types, extend `ToastType` and update `toastIcons`/`toastStyles` in `Toast.tsx`.

## Testing

```tsx
// Test toast appearance
const { showToast } = useToast();
showToast('Test message', 'info');

// Test auto-dismiss (wait 3 seconds)

// Test manual dismiss
const { dismissToast } = useToast();
dismissToast(toastId);

// Test multiple toasts
showToast('First', 'info');
showToast('Second', 'success');
showToast('Third', 'error');
```
