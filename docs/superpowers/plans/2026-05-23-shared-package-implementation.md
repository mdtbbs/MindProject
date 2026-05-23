# Shared Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create unified `@mindproject/shared` package and refactor three frontends to use shared components, hooks, types, and CSS.

**Architecture:** TypeScript package with build output (`dist/`), React components (UnifiedHeader, useTheme), shared types (User, Server), consolidated CSS in root `shared-styles/`.

**Tech Stack:** TypeScript, React, Next.js 14, CSS Variables, Tailwind

---

## File Structure

```
G:\MindProject\
├── shared/                       # NEW
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
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
│   │   │   └── index.css
│
├── shared-styles/                # NEW (consolidated)
│   ├── variables.css
│   ├── components.css
│   ├── utilities.css
│   └── theme-switch.js
│
├── MindFourm/frontend/           # MODIFY
│   ├── package.json              # update dependency
│   ├── src/app/layout.tsx        # import shared ThemeProvider
│   ├── src/app/(public)/layout.tsx # use UnifiedHeader
│   ├── tailwind.config.js        # update CSS import
│   └── DELETE: shared-styles/
│   └── DELETE: src/components/forum/theme-toggle.tsx
│
├── EasyManager/frontend/         # MODIFY
│   ├── package.json              # update dependency
│   ├── app/layout.jsx            # import shared ThemeProvider
│   ├── app/Providers.jsx         # remove local ThemeProvider
│   ├── components/Layout/Header.jsx # replace with UnifiedHeader
│   ├── tailwind.config.js        # update CSS import
│   └── DELETE: shared-styles/
│   └── DELETE: components/Common/ThemeProvider.jsx
│
├── MindAuth/public/              # MODIFY
│   └── index.html                # update CSS/JS paths
│   └── DELETE: shared-styles/
```

---

### Task 1: Create shared package structure

**Files:**
- Create: `G:\MindProject\shared\package.json`
- Create: `G:\MindProject\shared\tsconfig.json`
- Create: `G:\MindProject\shared\src\index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@mindproject/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    },
    "./styles": "./dist/styles/index.css",
    "./components": {
      "types": "./dist/components/index.d.ts",
      "import": "./dist/components/index.js"
    },
    "./hooks": {
      "types": "./dist/hooks/index.d.ts",
      "import": "./dist/hooks/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create src/index.ts (placeholder)**

```typescript
// @mindproject/shared - Unified components, hooks, and types
// Exports will be added as components are implemented
export * from './types';
export * from './hooks';
export * from './components';
```

- [ ] **Step 4: Install dependencies**

Run: `cd "G:\MindProject\shared" && npm install`

Expected: npm installs TypeScript and React types

- [ ] **Step 5: Commit**

```bash
git add shared/package.json shared/tsconfig.json shared/src/index.ts
git commit -m "feat(shared): create package structure with TypeScript config"
```

---

### Task 2: Implement shared types

**Files:**
- Create: `G:\MindProject\shared\src\types\user.ts`
- Create: `G:\MindProject\shared\src\types\server.ts`
- Create: `G:\MindProject\shared\src\types\index.ts`

- [ ] **Step 1: Create user.ts**

```typescript
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
```

- [ ] **Step 2: Create server.ts**

```typescript
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

- [ ] **Step 3: Create types/index.ts**

```typescript
export * from './user';
export * from './server';
```

- [ ] **Step 4: Verify build**

Run: `cd "G:\MindProject\shared" && npm run build`

Expected: TypeScript compiles without errors, creates `dist/types/`

- [ ] **Step 5: Commit**

```bash
git add shared/src/types/
git commit -m "feat(shared): add User and Server type definitions"
```

---

### Task 3: Implement useTheme hook

**Files:**
- Create: `G:\MindProject\shared\src\hooks\useTheme.ts`
- Create: `G:\MindProject\shared\src\hooks\index.ts`

- [ ] **Step 1: Create useTheme.ts**

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getInitialTheme();
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: Create hooks/index.ts**

```typescript
export * from './useTheme';
```

- [ ] **Step 3: Build and verify**

Run: `cd "G:\MindProject\shared" && npm run build`

Expected: TypeScript compiles, creates `dist/hooks/`

- [ ] **Step 4: Commit**

```bash
git add shared/src/hooks/
git commit -m "feat(shared): add useTheme hook and ThemeProvider"
```

---

### Task 4: Implement UnifiedHeader component

**Files:**
- Create: `G:\MindProject\shared\src\components\UnifiedHeader.tsx`
- Create: `G:\MindProject\shared\src\components\index.ts`

- [ ] **Step 1: Create UnifiedHeader.tsx**

```typescript
'use client';

import Link from 'next/link';
import { User } from '../types';
import { useTheme } from '../hooks/useTheme';
import { Search, User as UserIcon, LogOut, Shield, Moon, Sun, Mail, Bell, Plus, Menu } from 'lucide-react';

export interface UnifiedHeaderProps {
  showSearch?: boolean;
  showPostButton?: boolean;
  showMessages?: boolean;
  showNotifications?: boolean;
  showServerCount?: boolean;
  showMobileMenu?: boolean;

  siteName?: string;
  logoUrl?: string;

  user?: User | null;
  isAuthenticated?: boolean;
  serverCount?: number;
  unreadMessageCount?: number;
  unreadNotificationCount?: number;

  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onPostCreate?: () => void;
  onMobileMenuClick?: () => void;

  // Slots for custom content
  notificationDropdownSlot?: React.ReactNode;
  mobileMenuSlot?: React.ReactNode;
}

export function UnifiedHeader({
  showSearch = false,
  showPostButton = false,
  showMessages = false,
  showNotifications = false,
  showServerCount = false,
  showMobileMenu = false,
  siteName = 'Mindustry',
  logoUrl,
  user,
  isAuthenticated = false,
  serverCount = 0,
  unreadMessageCount = 0,
  unreadNotificationCount = 0,
  onLogin,
  onRegister,
  onLogout,
  onSearch,
  onPostCreate,
  onMobileMenuClick,
  notificationDropdownSlot,
  mobileMenuSlot,
}: UnifiedHeaderProps) {
  const { theme, toggle: toggleTheme } = useTheme();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch((e.target as HTMLInputElement).value);
    }
  };

  return (
    <header className="bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 object-contain" />
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-[var(--primary)]">{siteName}</span>
                <span className="text-xs text-[var(--text-muted)]">(mdtbbs)</span>
              </div>
            )}
          </Link>

          {/* Search */}
          {showSearch && (
            <div className="flex-1 max-w-lg mx-2 sm:mx-4 md:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="搜索..."
                  aria-label="搜索"
                  className="w-full pl-10 pr-4 py-1.5 sm:py-2 bg-[var(--bg-elevated)] text-[var(--text)] rounded-[var(--radius)] border-0 focus:ring-2 focus:ring-[var(--primary)] text-sm placeholder:text-[var(--text-muted)]"
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            </div>
          )}

          {/* Right Menu */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              aria-label="切换主题"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Button */}
            {showMobileMenu && onMobileMenuClick && (
              <button
                onClick={onMobileMenuClick}
                className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                aria-label="菜单"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                {showNotifications && (
                  notificationDropdownSlot || (
                    <Link
                      href="/notifications"
                      className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                      title="通知"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                        </span>
                      )}
                    </Link>
                  )
                )}

                {/* Messages */}
                {showMessages && (
                  <Link
                    href="/messages"
                    className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    title="私信"
                  >
                    <Mail className="w-5 h-5" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Server Count (EasyManager) */}
                {showServerCount && (
                  <div className="hidden md:block text-[var(--text-muted)] text-sm">
                    服务器: {serverCount}
                  </div>
                )}

                {/* Post Button */}
                {showPostButton && onPostCreate && (
                  <Link
                    href="/posts/new"
                    className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    发帖
                  </Link>
                )}

                {/* Admin Link */}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    title="管理后台"
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}

                {/* User Profile */}
                <Link
                  href={`/users/${user.id}`}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>

                {/* Logout */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-600 transition-colors"
                    title="退出登录"
                    aria-label="退出登录"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                {onRegister && (
                  <button
                    onClick={onRegister}
                    className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    注册
                  </button>
                )}
                {onLogin && (
                  <button
                    onClick={onLogin}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    登录
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Menu Content (if provided) */}
      {mobileMenuSlot}
    </header>
  );
}
```

- [ ] **Step 2: Create components/index.ts**

```typescript
export * from './UnifiedHeader';
```

- [ ] **Step 3: Build and verify**

Run: `cd "G:\MindProject\shared" && npm run build`

Expected: TypeScript compiles, creates `dist/components/`

Note: lucide-react is a peer dependency - projects must have it installed

- [ ] **Step 4: Commit**

```bash
git add shared/src/components/
git commit -m "feat(shared): add UnifiedHeader component with configurable props"
```

---

### Task 5: Create CSS export file

**Files:**
- Create: `G:\MindProject\shared\src\styles\index.css`

- [ ] **Step 1: Create styles/index.css**

```css
/* @mindproject/shared/styles - Unified CSS imports */
/* This file imports from the root shared-styles directory */

@import '../../shared-styles/variables.css';
@import '../../shared-styles/components.css';
@import '../../shared-styles/utilities.css';
```

- [ ] **Step 2: Build and verify**

Run: `cd "G:\MindProject\shared" && npm run build`

Expected: CSS file copied to `dist/styles/index.css`

- [ ] **Step 3: Commit**

```bash
git add shared/src/styles/
git commit -m "feat(shared): add CSS export file for shared-styles"
```

---

### Task 6: Consolidate shared-styles to root directory

**Files:**
- Create: `G:\MindProject\shared-styles\variables.css` (copy from MindFourm)
- Create: `G:\MindProject\shared-styles\components.css` (copy from MindFourm)
- Create: `G:\MindProject\shared-styles\utilities.css` (copy from MindFourm)
- Create: `G:\MindProject\shared-styles\theme-switch.js` (copy from MindFourm)

- [ ] **Step 1: Copy CSS files to root**

Run: 
```bash
mkdir -p "G:/MindProject/shared-styles"
cp "G:/MindProject/MindFourm/frontend/shared-styles/variables.css" "G:/MindProject/shared-styles/"
cp "G:/MindProject/MindFourm/frontend/shared-styles/components.css" "G:/MindProject/shared-styles/"
cp "G:/MindProject/MindFourm/frontend/shared-styles/utilities.css" "G:/MindProject/shared-styles/"
cp "G:/MindProject/MindFourm/frontend/shared-styles/theme-switch.js" "G:/MindProject/shared-styles/"
```

Expected: Files copied successfully

- [ ] **Step 2: Verify files exist**

Run: `ls -la "G:/MindProject/shared-styles/"`

Expected: 4 files present

- [ ] **Step 3: Commit**

```bash
git add shared-styles/
git commit -m "feat: consolidate shared-styles to root directory"
```

---

### Task 7: Delete duplicate shared-styles from projects

**Files:**
- Delete: `G:\MindProject\MindFourm\frontend\shared-styles\`
- Delete: `G:\MindProject\EasyManager\frontend\shared-styles\`
- Delete: `G:\MindProject\MindAuth\shared-styles\`

- [ ] **Step 1: Delete MindFourm shared-styles**

Run: `rm -rf "G:/MindProject/MindFourm/frontend/shared-styles"`

- [ ] **Step 2: Delete EasyManager shared-styles**

Run: `rm -rf "G:/MindProject/EasyManager/frontend/shared-styles"`

- [ ] **Step 3: Delete MindAuth shared-styles**

Run: `rm -rf "G:/MindProject/MindAuth/shared-styles"`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove duplicate shared-styles from individual projects"
```

---

### Task 8: Update MindFourm frontend - dependencies and layout

**Files:**
- Modify: `G:\MindProject\MindFourm\frontend\package.json`
- Modify: `G:\MindProject\MindFourm\frontend\src\app\layout.tsx`
- Modify: `G:\MindProject\MindFourm\frontend\tailwind.config.js`

- [ ] **Step 1: Update package.json dependency**

Find line 11-12:
```json
"@mindproject/shared": "file:../../shared",
```

Replace with:
```json
"@mindproject/shared": "file:../../shared",
```

(Already exists - verify path is correct to root shared folder)

- [ ] **Step 2: Update layout.tsx - import shared ThemeProvider**

Find line 7:
```typescript
import { ThemeProvider } from '@/components/forum/theme-toggle';
```

Replace with:
```typescript
import { ThemeProvider } from '@mindproject/shared';
```

- [ ] **Step 3: Rebuild shared package**

Run: `cd "G:\MindProject\shared" && npm run build`

- [ ] **Step 4: Reinstall MindFourm dependencies**

Run: `cd "G:\MindProject\MindFourm\frontend" && npm install`

Expected: symlink to shared package updated

- [ ] **Step 5: Commit**

```bash
git add MindFourm/frontend/package.json MindFourm/frontend/src/app/layout.tsx
git commit -m "refactor(mindforum): use shared ThemeProvider"
```

---

### Task 9: Update MindFourm frontend - replace Header with UnifiedHeader

**Files:**
- Modify: `G:\MindProject\MindFourm\frontend\src\app\(public)\layout.tsx`
- Delete: `G:\MindProject\MindFourm\frontend\src\components\forum\theme-toggle.tsx`
- Modify: `G:\MindProject\MindFourm\frontend\src\components\forum\header.tsx`

- [ ] **Step 1: Update (public)/layout.tsx**

Replace entire file:
```typescript
'use client';

import { useAuth } from '@/lib/auth/context';
import { useSettings } from '@/lib/settings/context';
import { UnifiedHeader } from '@mindproject/shared';
import { useTheme } from '@mindproject/shared';
import { messageApi } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationDropdown from '@/components/forum/notification-dropdown';
import Footer from '@/components/forum/footer';
import AnnouncementBanner from '@/components/forum/announcement-banner';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const settings = useSettings();
  const router = useRouter();
  const mindauthUrl = process.env.NEXT_PUBLIC_MINDAUTH_URL || 'http://localhost:4001';
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    messageApi.unreadCount()
      .then((res) => setUnreadMsgCount(res.count))
      .catch(() => {});
    const interval = setInterval(() => {
      messageApi.unreadCount()
        .then((res) => setUnreadMsgCount(res.count))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const redirectUrl = encodeURIComponent(`${apiBase}/api/auth/callback`);
    const clientId = process.env.NEXT_PUBLIC_MINDAUTH_CLIENT_ID || '';
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${mindauthUrl}/login?redirect=${redirectUrl}&client_id=${clientId}&state=${currentPath}`;
  };

  const handleRegister = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const redirectUrl = encodeURIComponent(`${apiBase}/api/auth/callback`);
    const clientId = process.env.NEXT_PUBLIC_MINDAUTH_CLIENT_ID || '';
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${mindauthUrl}/register?redirect=${redirectUrl}&client_id=${clientId}&state=${currentPath}`;
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader
        showSearch
        showPostButton
        showMessages
        showNotifications
        siteName={settings.site_name || 'MindBBS'}
        logoUrl={settings.site_logo_url}
        user={user}
        isAuthenticated={isAuthenticated}
        unreadMessageCount={unreadMsgCount}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onSearch={handleSearch}
        notificationDropdownSlot={<NotificationDropdown />}
      />
      <AnnouncementBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Delete local theme-toggle.tsx**

Run: `rm "G:/MindProject/MindFourm/frontend/src/components/forum/theme-toggle.tsx"`

- [ ] **Step 3: Delete or update local header.tsx (keep for reference or delete)**

Run: `rm "G:/MindProject/MindFourm/frontend/src/components/forum/header.tsx"`

- [ ] **Step 4: Commit**

```bash
git add MindFourm/frontend/src/app/(public)/layout.tsx
git add -A MindFourm/frontend/src/components/forum/
git commit -m "refactor(mindforum): replace Header with UnifiedHeader, remove local theme-toggle"
```

---

### Task 10: Update EasyManager frontend - dependencies and layout

**Files:**
- Modify: `G:\MindProject\EasyManager\frontend\package.json`
- Modify: `G:\MindProject\EasyManager\frontend\app\Providers.jsx`
- Modify: `G:\MindProject\EasyManager\frontend\tailwind.config.js`

- [ ] **Step 1: Update package.json dependency**

Verify/update line 11:
```json
"@mindproject/shared": "file:../../shared",
```

- [ ] **Step 2: Update Providers.jsx**

Replace file:
```jsx
'use client';

import { ThemeProvider } from '@mindproject/shared';
import { ToastProvider, ToastContainer } from '../lib/ToastContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Delete local ThemeProvider.jsx**

Run: `rm "G:/MindProject/EasyManager/frontend/components/Common/ThemeProvider.jsx"`

- [ ] **Step 4: Reinstall dependencies**

Run: `cd "G:\MindProject\EasyManager\frontend" && npm install`

- [ ] **Step 5: Commit**

```bash
git add EasyManager/frontend/package.json EasyManager/frontend/app/Providers.jsx
git add -A EasyManager/frontend/components/Common/
git commit -m "refactor(easymanager): use shared ThemeProvider, remove local ThemeProvider"
```

---

### Task 11: Update EasyManager frontend - replace Header

**Files:**
- Modify: `G:\MindProject\EasyManager\frontend\components\Layout\Header.jsx`
- Modify: `G:\MindProject\EasyManager\frontend\app\admin\layout.jsx` (if uses Header)

- [ ] **Step 1: Create new Header wrapper using UnifiedHeader**

Replace `components/Layout/Header.jsx`:
```jsx
'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '../../lib/api';
import { getLogoutUrl } from '../../lib/auth';
import { Skeleton } from '../Common/Skeleton';
import { UnifiedHeader } from '@mindproject/shared';

export default function Header({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.user().then(result => {
      if (result.success) {
        setUser(result.user);
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    window.location.href = getLogoutUrl();
  };

  if (loading) {
    return (
      <header className="bg-[var(--bg)] border-b border-[var(--border)] backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center space-x-4">
            <Skeleton variant="text" className="w-20 h-4" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="avatar" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <UnifiedHeader
      showServerCount
      showMobileMenu
      siteName="EasyManager"
      user={user}
      isAuthenticated={!!user}
      serverCount={user?.serverCount || 0}
      onLogout={handleLogout}
      onMobileMenuClick={onMenuClick}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add EasyManager/frontend/components/Layout/Header.jsx
git commit -m "refactor(easymanager): replace Header with UnifiedHeader wrapper"
```

---

### Task 12: Update MindAuth - CSS and JS paths

**Files:**
- Modify: `G:\MindProject\MindAuth\public\index.html`

- [ ] **Step 1: Update CSS paths in index.html**

Find lines 8-11:
```html
<link rel="stylesheet" href="../shared-styles/variables.css">
<link rel="stylesheet" href="../shared-styles/components.css">
<link rel="stylesheet" href="../shared-styles/utilities.css">
```

Replace with:
```html
<link rel="stylesheet" href="../../shared-styles/variables.css">
<link rel="stylesheet" href="../../shared-styles/components.css">
<link rel="stylesheet" href="../../shared-styles/utilities.css">
```

- [ ] **Step 2: Update theme-switch.js path**

Find line 21:
```html
<script src="../shared-styles/theme-switch.js"></script>
```

Replace with:
```html
<script src="../../shared-styles/theme-switch.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add MindAuth/public/index.html
git commit -m "refactor(mindauth): update CSS/JS paths to root shared-styles"
```

---

### Task 13: Test and verify all frontends

- [ ] **Step 1: Start MindAuth**

Run: `cd "G:\MindProject\MindAuth" && npm run dev`

Expected: Server starts on port 4001, CSS loads correctly

- [ ] **Step 2: Verify MindAuth in browser**

Open: `http://localhost:4001`

Check: 
- CSS variables applied (orange primary color)
- Theme toggle button works
- No 404 errors for CSS files

- [ ] **Step 3: Start MindFourm frontend**

Run: `cd "G:\MindProject\MindFourm\frontend" && npm run dev`

Expected: Server starts on port 3000

- [ ] **Step 4: Verify MindFourm in browser**

Open: `http://localhost:3000`

Check:
- UnifiedHeader renders correctly
- Theme toggle works
- Search box visible
- No import errors for @mindproject/shared

- [ ] **Step 5: Start EasyManager frontend**

Run: `cd "G:\MindProject\EasyManager\frontend" && npm run dev`

Expected: Server starts on port 3001

- [ ] **Step 6: Verify EasyManager in browser**

Open: `http://localhost:3001`

Check:
- UnifiedHeader renders with server count
- Theme toggle works
- Mobile menu button visible
- No import errors

- [ ] **Step 7: Final commit (if any fixes needed)**

If fixes were required during testing:
```bash
git add -A
git commit -m "fix: resolve shared package integration issues"
```

---

## Success Criteria Checklist

- [ ] All three frontends start without errors
- [ ] CSS variables consistent across all projects
- [ ] Theme toggle works in all projects
- [ ] MindFourm Header shows: search, post button, messages, notifications
- [ ] EasyManager Header shows: server count, mobile menu
- [ ] No duplicate shared-styles directories in projects
- [ ] TypeScript types export correctly from @mindproject/shared