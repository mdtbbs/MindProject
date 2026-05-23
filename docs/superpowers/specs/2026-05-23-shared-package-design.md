# Shared Package Design

**Date:** 2026-05-23
**Status:** Approved

## Overview

Create a unified `@mindproject/shared` npm package to share React components, hooks, types, and CSS across MindFourm and EasyManager frontends. Consolidate `shared-styles/` to root directory for all three projects (including MindAuth).

## Goals

1. Eliminate code duplication across projects
2. Provide consistent UI/UX through shared components
3. Centralize CSS design system maintenance
4. Enable TypeScript type sharing

## Non-Goals

- Refactoring MindAuth to React (stays as pure HTML/JS SPA)
- Sharing backend code or utilities

## Architecture

```
G:\MindProject\
├── shared/                       # React shared package
│   ├── package.json              # name: @mindproject/shared
│   ├── tsconfig.json             # output to dist/
│   ├── src/
│   │   ├── index.ts              # unified exports
│   │   ├── components/
│   │   │   ├── index.ts
│   │   │   └── UnifiedHeader.tsx
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   └── useTheme.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── user.ts
│   │   │   └── server.ts
│   │   └── styles/
│   │   │   └── index.css         # imports from shared-styles
│   └── dist/                     # build output
│
├── shared-styles/                # CSS design system (root level)
│   ├── variables.css
│   ├── components.css
│   ├── utilities.css
│   └── theme-switch.js           # for MindAuth (pure JS)
```

## Components

### useTheme Hook

```typescript
export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

export function useTheme(): ThemeContextValue;
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element;
```

**Behavior:**
- Read initial theme from localStorage
- Set `data-theme` attribute and `.dark` class on document root
- Persist theme changes to localStorage
- Support both CSS variables (`data-theme`) and Tailwind (`dark` class)

### UnifiedHeader Component

```typescript
export interface UnifiedHeaderProps {
  // Display controls (all default false)
  showSearch?: boolean;
  showPostButton?: boolean;
  showMessages?: boolean;
  showNotifications?: boolean;
  showServerCount?: boolean;
  showMobileMenu?: boolean;

  // Content config
  siteName?: string;              // default "Mindustry"
  logoUrl?: string;

  // Data props (passed from parent)
  user?: User | null;
  isAuthenticated?: boolean;
  serverCount?: number;
  unreadMessageCount?: number;
  unreadNotificationCount?: number;

  // Event callbacks
  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onPostCreate?: () => void;
  onMobileMenuClick?: () => void;
}

export function UnifiedHeader(props: UnifiedHeaderProps): JSX.Element;
```

**Design decisions:**
- Data fetched by parent components, Header receives via props
- NotificationDropdown stays local in MindFourm (complex UI)
- MobileMenu content stays local in EasyManager

### Shared Types

```typescript
// user.ts
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  avatar_url?: string;
  bio?: string;
  mindauth_id?: string;
  created_at?: string;
}

// server.ts
export interface Server {
  id: number;
  name: string;
  owner_id: number;
  port: number;
  status: 'pending' | 'approved' | 'running' | 'stopped';
  version: string;
  container_id?: string;
  created_at: string;
}
```

## CSS Strategy

**Consolidation:**
- Move `shared-styles/` from each project to root `G:\MindProject\shared-styles\`
- Delete local copies from MindFourm/frontend, EasyManager/frontend, MindAuth

**Import patterns:**

| Project | CSS Import | Theme Mechanism |
|---------|------------|-----------------|
| MindFourm | `@import '../../shared-styles/variables.css'` in tailwind.config | `useTheme` hook |
| EasyManager | Same | `useTheme` hook |
| MindAuth | `<link href="../shared-styles/variables.css">` in HTML | `theme-switch.js` |

**Package CSS export:**
```css
/* shared/src/styles/index.css */
@import '../../shared-styles/variables.css';
@import '../../shared-styles/components.css';
@import '../../shared-styles/utilities.css';
```

React projects can use `import '@mindproject/shared/styles'` for all CSS.

## Refactoring Tasks

### shared package creation
1. Create `shared/` directory with package.json, tsconfig.json
2. Implement useTheme hook (merge two versions)
3. Implement UnifiedHeader component
4. Create type definitions
5. Create styles/index.css
6. Configure build script (`npm run build`)

### shared-styles consolidation
1. Copy one copy to `G:\MindProject\shared-styles\`
2. Delete from MindFourm/frontend/shared-styles
3. Delete from EasyManager/frontend/shared-styles
4. Delete from MindAuth/shared-styles

### MindFourm frontend
1. Update package.json dependency to new shared package
2. Delete local theme-toggle.tsx, use shared useTheme
3. Replace Header with UnifiedHeader (with appropriate props)
4. Update CSS imports in tailwind.config.js

### EasyManager frontend
1. Update package.json dependency
2. Delete local ThemeProvider.jsx, use shared useTheme
3. Replace Header with UnifiedHeader (with appropriate props)
4. Update CSS imports

### MindAuth
1. Update HTML to link root shared-styles
2. Update theme-switch.js path reference

## Build & Usage

**Build shared package:**
```bash
cd shared && npm run build
```

**Install in projects:**
```json
{
  "dependencies": {
    "@mindproject/shared": "file:../shared"
  }
}
```

**Usage example (MindFourm):**
```tsx
import { ThemeProvider, UnifiedHeader, useTheme } from '@mindproject/shared';
import '@mindproject/shared/styles';

// layout.tsx
<ThemeProvider>
  <UnifiedHeader
    showSearch
    showPostButton
    showMessages
    showNotifications
    siteName="MindBBS"
    user={user}
    isAuthenticated={isAuthenticated}
    unreadMessageCount={unreadMsgCount}
    onLogin={handleLogin}
    onLogout={handleLogout}
    onSearch={handleSearch}
  />
</ThemeProvider>
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing UI | Test all three frontends after refactoring |
| Type mismatches | Verify User type matches backend API responses |
| CSS path changes | Double-check import paths in all projects |

## Success Criteria

1. All three frontends display correctly with unified CSS
2. Theme toggle works consistently across all projects
3. Header renders with correct features per project
4. No duplicate CSS/style files in project directories
5. TypeScript types usable in both frontends