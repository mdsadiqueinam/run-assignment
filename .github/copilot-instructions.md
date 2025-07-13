# GitHub Copilot Instructions

## Auto-Import Configuration

This project uses `unplugin-auto-import` to automatically import commonly used modules. **DO NOT** manually import the following:

### Automatically Imported Libraries:
- `react` - All React hooks and components (useState, useEffect, useCallback, etc.)
- `react-router` - All React Router hooks and components (useNavigate, useLocation, Link, etc.)
- `ahooks` - All ahooks utilities (useLocalStorageState, useTheme, etc.)

### Automatically Imported Directories:
- `app/components` - All custom components
- `app/hooks` - All custom hooks
- `app/utils` - All utility functions

## Examples of What NOT to Import:

```typescript
// ❌ Don't do this - these are auto-imported
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLocalStorageState } from 'ahooks';
import { useCurrentSession } from './useCurrentSession';
import MyComponent from '../components/MyComponent';

// ✅ Do this instead - just use them directly
export function MyHook() {
  const [state, setState] = useState(); // React auto-imported
  const navigate = useNavigate(); // React Router auto-imported
  const [stored] = useLocalStorageState('key'); // ahooks auto-imported
  const { session } = useCurrentSession(); // Custom hook auto-imported
  
  return <MyComponent />; // Custom component auto-imported
}
```

## What You Still Need to Import:

- External libraries not listed above (axios, lodash, etc.)
- Node.js modules
- Type-only imports (`import type { ... }`)
- Relative imports from outside the auto-import directories

## File Structure Context:

```
app/
├── components/     # Auto-imported
├── hooks/         # Auto-imported  
├── utils/         # Auto-imported
├── routes/        # Not auto-imported (use relative imports)
└── ...
```

When suggesting code, assume all React hooks, React Router hooks, ahooks utilities, and custom components/hooks/utils are available without imports.
