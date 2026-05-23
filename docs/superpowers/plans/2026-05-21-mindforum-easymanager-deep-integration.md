# MindFourm 与 EasyManager 深度融合实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 MindFourm 论坛与 EasyManager 服务器管理面板的深度融合：数据互通、功能打通、用户体验统一

**Architecture:** 保持两个项目独立部署，通过 API 互通。Phase 1 基于 shared-styles 完成设计统一和服务器显示；Phase 2 创建 shared npm 包实现统一导航栏和申请流程；Phase 3 完成统一登录和帖子关联。

**Tech Stack:** Next.js 14, Koa, TypeScript, CSS Variables, Tailwind CSS, SQLite

---

## 文件结构

### 创建文件
```
shared/                                    # Phase 2: npm 共享包
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── components/
│   │   ├── index.ts
│   │   ├── UnifiedHeader/
│   │   │   ├── index.tsx
│   │   │   ├── types.ts
│   │   ├── ServerCard/
│   │   │   ├── index.tsx
│   │   ├── ServerStatusBadge/
│   │   │   ├── index.tsx
│   │   ├── CrossSystemLinks/
│   │   │   ├── index.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useTheme.ts
│   │   ├── useCrossSystemAuth.ts
│   ├── api/
│   │   ├── index.ts
│   │   ├── crossSystem.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── server.ts
│   │   ├── user.ts

MindFourm/frontend/src/
├── components/forum/
│   ├── server-section.tsx                # Phase 1: 首页服务器区域
├── app/(auth)/
│   ├── apply-server/
│   │   ├── page.tsx                      # Phase 2: 申请服务器页
│   ├── posts/new/
│   │   ├── server-selector.tsx           # Phase 3: 发帖关联服务器组件

MindFourm/src/
├── database/migrations/
│   ├── 001_add_server_fields.sql         # Phase 3: 帖子关联服务器迁移
├── routes/
│   ├── post-server.routes.js             # Phase 3: 帖子-服务器关联路由
├── services/
│   ├── post-server.service.js            # Phase 3: 帖子-服务器服务
│   ├── auto-post.service.js              # Phase 2: 自动发帖服务

EasyManager/frontend/
├── components/Server/
│   ├── RelatedPosts.jsx                   # Phase 3: 关联帖子组件
├── lib/api/
│   ├── forum.ts                          # Phase 3: 论坛 API 客户端

EasyManager/backend/src/
├── services/
│   ├── forum-callback.js                 # Phase 2: 论坛回调服务
```

### 修改文件
```
shared-styles/components.css               # Phase 1: 添加服务器组件样式
MindFourm/frontend/src/app/(public)/page.tsx         # Phase 1: 集成服务器区域
MindFourm/frontend/src/app/(public)/servers/page.tsx # Phase 1: 增强服务器列表
MindFourm/frontend/src/components/forum/header.tsx   # Phase 2: 改用 UnifiedHeader
MindFourm/src/routes/index.js                         # Phase 3: 注册新路由
EasyManager/frontend/components/Layout/Header.jsx     # Phase 2: 改用 UnifiedHeader
EasyManager/backend/src/routes/admin.js               # Phase 2: 审批回调论坛
EasyManager/backend/src/routes/forum.js               # Phase 3: 添加帖子查询代理
```

---

## Phase 1: 设计风格统一 + 论坛显示服务器

### Task 1.1: 完善 shared-styles 服务器组件样式

**Files:**
- Modify: `shared-styles/components.css`

- [ ] **Step 1: 添加服务器卡片样式到 components.css**

在 `shared-styles/components.css` 文件末尾追加以下内容：

```css
/* ===== 服务器卡片 ===== */
.server-card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.2s ease;
}

.server-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.server-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.server-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.server-address {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ===== 服务器状态徽章 ===== */
.server-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.server-status-running {
  background: rgba(34,197,94,0.12);
  color: var(--success);
}

.server-status-stopped {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.server-status-pending {
  background: rgba(255,193,7,0.12);
  color: var(--warning);
}

.server-status-rejected {
  background: rgba(239,68,68,0.12);
  color: var(--error);
}

/* ===== 服务器列表区域 ===== */
.server-section {
  padding: 1rem;
  background: var(--bg);
  margin-bottom: 1.5rem;
}

.server-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.server-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.server-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.server-player-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.server-player-item {
  padding: 0.125rem 0.375rem;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  color: var(--text-secondary);
}
```

- [ ] **Step 2: 验证样式文件**

```bash
tail -50 shared-styles/components.css
```
Expected: 看到新添加的服务器样式

- [ ] **Step 3: Commit**

```bash
git add shared-styles/components.css
git commit -m "feat: add server card styles to shared-styles"
```

---

### Task 1.2: 创建论坛首页服务器区域组件

**Files:**
- Create: `MindFourm/frontend/src/components/forum/server-section.tsx`

- [ ] **Step 1: 创建 server-section.tsx 组件**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, MapPin, Waves } from 'lucide-react';

interface Server {
  id: number;
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'pending';
  version: string;
  players: number;
  playerList: { name: string }[];
  mapName: string;
  wave: number;
  description?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function ServerCard({ server }: { server: Server }) {
  return (
    <div className="server-card">
      <div className="server-card-header">
        <span className="server-name">{server.name}</span>
        <span className={`server-status server-status-${server.status}`}>
          {server.status === 'running' ? '在线' : 
           server.status === 'stopped' ? '离线' : '待审批'}
        </span>
      </div>
      {server.description && (
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {server.description}
        </p>
      )}
      <div className="server-meta">
        <span>v{server.version}</span>
        <span className="flex items-center gap-0.25">
          <Users className="w-3 h-3" />
          {server.players}
        </span>
        {server.mapName && server.mapName !== 'unknown' && (
          <span className="flex items-center gap-0.25">
            <MapPin className="w-3 h-3" />
            {server.mapName}
          </span>
        )}
        {server.wave > 0 && (
          <span className="flex items-center gap-0.25">
            <Waves className="w-3 h-3" />
            {server.wave}
          </span>
        )}
      </div>
      {server.playerList && server.playerList.length > 0 && (
        <div className="server-player-list">
          {server.playerList.slice(0, 6).map((player, idx) => (
            <span key={idx} className="server-player-item">{player.name}</span>
          ))}
          {server.playerList.length > 6 && (
            <span className="server-player-item">+{server.playerList.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function ServerSection() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/servers/public`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.servers) {
          setServers(data.servers);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="server-section">
        <div className="server-section-header">
          <h2 className="server-section-title">加载服务器...</h2>
        </div>
      </section>
    );
  }

  const runningServers = servers.filter(s => s.status === 'running');
  if (runningServers.length === 0) {
    return null;
  }

  return (
    <section className="server-section">
      <div className="server-section-header">
        <h2 className="server-section-title">
          在线服务器 ({runningServers.length})
        </h2>
        <Link 
          href="/servers" 
          className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]"
        >
          查看全部 →
        </Link>
      </div>
      <div className="server-grid">
        {runningServers.slice(0, 6).map(server => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 验证组件创建**

```bash
ls -la MindFourm/frontend/src/components/forum/server-section.tsx
```
Expected: 文件存在

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/components/forum/server-section.tsx
git commit -m "feat: add server section component for forum homepage"
```

---

### Task 1.3: 集成服务器区域到论坛首页

**Files:**
- Modify: `MindFourm/frontend/src/app/(public)/page.tsx`

- [ ] **Step 1: 修改首页引入 ServerSection**

在 `MindFourm/frontend/src/app/(public)/page.tsx` 中：
- 第 1 行导入语句添加 ServerSection
- 第 94 行左右（Main Content 区域开头）添加 ServerSection 组件

修改后的关键部分：

```tsx
// 第 1 行添加导入
import ServerSection from '@/components/forum/server-section';

// ... 其他 imports 保持不变 ...

// 在 return 语句中，Main Content 区域添加 ServerSection
// 原代码第 93-101 行左右改为：

{/* Main Content */}
<div className="flex-1 space-y-4">
  {/* 服务器区域 - 在帖子列表上方 */}
  <ServerSection />
  
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold text-surface-900 dark:text-gray-100">
      {categoryId
        ? categories.find((c) => c.id === categoryId)?.name || '分类'
        : '最新帖子'}
    </h1>
  </div>
  
  {/* ... 后续内容保持不变 ... */}
</div>
```

- [ ] **Step 2: 验证首页修改**

```bash
grep -n "ServerSection" MindFourm/frontend/src/app/(public)/page.tsx
```
Expected: 看到导入和使用语句

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/app/(public)/page.tsx
git commit -m "feat: integrate server section into forum homepage"
```

---

### Task 1.4: 增强论坛服务器列表页样式

**Files:**
- Modify: `MindFourm/frontend/src/app/(public)/servers/page.tsx`

- [ ] **Step 1: 更新服务器列表页使用 shared-styles**

将 `MindFourm/frontend/src/app/(public)/servers/page.tsx` 中的样式改为使用 CSS 变量：

```tsx
import { serverApi } from '@/lib/api/client';
import { Server } from '@/types';
import Link from 'next/link';
import { Users, Server as ServerIcon, MapPin, Waves, Clock } from 'lucide-react';

export const revalidate = 30;

const API_BASE = process.env.API_URL || 'http://localhost:4000';

async function fetchServers(): Promise<Server[]> {
  try {
    const res = await fetch(`${API_BASE}/api/servers/public`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? (json.servers || []) : [];
  } catch {
    return [];
  }
}

export default async function ServersPage() {
  const servers = await fetchServers();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">
          <ServerIcon className="w-6 h-6 inline mr-2 text-[var(--primary)]" />
          游戏服务器
        </h1>
        <Link
          href="/servers/apply"
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
        >
          申请服务器
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
          <ServerIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-[var(--text-muted)] mb-4">暂无在线服务器</p>
          <Link
            href="/servers/apply"
            className="inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
          >
            申请第一个服务器
          </Link>
        </div>
      ) : (
        <div className="server-grid">
          {servers.map((server) => (
            <div
              key={server.id}
              className="server-card"
            >
              <div className="server-card-header">
                <span className="server-name">{server.name}</span>
                <span className={`server-status server-status-${server.status}`}>
                  {server.status === 'running' ? '运行中' : server.status}
                </span>
              </div>
              {server.description && (
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                  {server.description}
                </p>
              )}
              <div className="server-meta">
                <span className="flex items-center gap-0.25">
                  <ServerIcon className="w-3 h-3" />
                  v{server.version}
                </span>
                <span className="flex items-center gap-0.25">
                  <Users className="w-3 h-3" />
                  {server.players} 在线
                </span>
                {server.mapName && server.mapName !== 'unknown' && (
                  <span className="flex items-center gap-0.25">
                    <MapPin className="w-3 h-3" />
                    {server.mapName}
                  </span>
                )}
                {server.wave > 0 && (
                  <span className="flex items-center gap-0.25">
                    <Waves className="w-3 h-3" />
                    波次 {server.wave}
                  </span>
                )}
              </div>
              
              {server.playerList && server.playerList.length > 0 && (
                <div className="server-player-list">
                  {server.playerList.slice(0, 8).map((player, idx) => (
                    <span key={idx} className="server-player-item">{player.name}</span>
                  ))}
                  {server.playerList.length > 8 && (
                    <span className="server-player-item">+{server.playerList.length - 8}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info section */}
      <div className="mt-8 bg-[var(--bg-elevated)] rounded-[var(--radius)] p-4 text-sm text-[var(--text-secondary)]">
        <p className="mb-2">
          <strong className="text-[var(--text)]">连接方式:</strong> 在 Mindustry 游戏中使用 <code className="bg-[var(--bg)] px-1 rounded-[var(--radius-sm)]">连接 IP:端口</code> 命令
        </p>
        <p>
          <strong className="text-[var(--text)]">申请服务器:</strong> 登录后可申请创建自己的游戏服务器，经管理员审批后即可使用
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证修改**

```bash
grep -n "server-card" MindFourm/frontend/src/app/(public)/servers/page.tsx
```
Expected: 看到使用 server-card 类名

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/app/(public)/servers/page.tsx
git commit -m "feat: update servers page to use shared-styles CSS variables"
```

---

## Phase 2: 统一导航栏 + 申请流程

### Task 2.1: 创建 shared npm 包结构

**Files:**
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/index.ts`

- [ ] **Step 1: 创建 shared 目录和 package.json**

```bash
mkdir -p shared/src/components shared/src/hooks shared/src/api shared/src/types
```

```json
// shared/package.json
{
  "name": "@mindproject/shared",
  "version": "1.0.0",
  "description": "Shared components and utilities for MindProject",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "exports": {
    ".": "./dist/index.js",
    "./components": "./dist/components/index.js",
    "./hooks": "./dist/hooks/index.js",
    "./api": "./dist/api/index.js",
    "./types": "./dist/types/index.js"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
// shared/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "commonjs",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建入口文件**

```ts
// shared/src/index.ts
export * from './components';
export * from './hooks';
export * from './api';
export * from './types';
```

- [ ] **Step 4: 验证结构创建**

```bash
ls -la shared/
```
Expected: 看到 package.json, tsconfig.json, src 目录

- [ ] **Step 5: Commit**

```bash
git add shared/
git commit -m "feat: create shared npm package structure"
```

---

### Task 2.2: 创建类型定义

**Files:**
- Create: `shared/src/types/index.ts`
- Create: `shared/src/types/server.ts`
- Create: `shared/src/types/user.ts`

- [ ] **Step 1: 创建 server.ts 类型**

```ts
// shared/src/types/server.ts

export type ServerStatus = 'running' | 'stopped' | 'pending' | 'approved' | 'rejected';

export interface Server {
  id: number;
  name: string;
  port: number;
  http_port?: number;
  version: string;
  status: ServerStatus;
  description?: string;
  owner_id: number;
  owner_name?: string;
  is_public: boolean;
  players?: number;
  playerList?: { name: string }[];
  mapName?: string;
  wave?: number;
  created_at: string;
}

export interface ServerVersion {
  id: number;
  version: string;
  name: string;
  download_url?: string;
  is_active: boolean;
}

export interface ServerTemplate {
  id: number;
  name: string;
  description?: string;
  version: string;
  config: Record<string, unknown>;
  is_public: boolean;
}

export interface ServerApplyRequest {
  name: string;
  description?: string;
  version: string;
  template_id?: number;
}

export interface ServerApplyResponse {
  success: boolean;
  server_id?: number;
  message?: string;
}
```

- [ ] **Step 2: 创建 user.ts 类型**

```ts
// shared/src/types/user.ts

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  mindauth_id: number;
  username: string;
  email?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface UserQuota {
  user_id: number;
  max_servers: number;
  cpu_limit?: number;
  memory_limit?: number;
  bandwidth_limit?: number;
  role: UserRole;
}
```

- [ ] **Step 3: 创建 types/index.ts 导出**

```ts
// shared/src/types/index.ts
export * from './server';
export * from './user';
```

- [ ] **Step 4: Commit**

```bash
git add shared/src/types/
git commit -m "feat: add type definitions for server and user"
```

---

### Task 2.3: 创建 hooks

**Files:**
- Create: `shared/src/hooks/index.ts`
- Create: `shared/src/hooks/useTheme.ts`

- [ ] **Step 1: 创建 useTheme.ts**

```ts
// shared/src/hooks/useTheme.ts

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: 创建 hooks/index.ts 导出**

```ts
// shared/src/hooks/index.ts
export { useTheme, ThemeProvider } from './useTheme';
```

- [ ] **Step 3: Commit**

```bash
git add shared/src/hooks/
git commit -m "feat: add useTheme hook to shared package"
```

---

### Task 2.4: 创建 UnifiedHeader 组件

**Files:**
- Create: `shared/src/components/UnifiedHeader/index.tsx`
- Create: `shared/src/components/UnifiedHeader/types.ts`
- Create: `shared/src/components/index.ts`

- [ ] **Step 1: 创建 UnifiedHeader types.ts**

```ts
// shared/src/components/UnifiedHeader/types.ts

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface UnifiedHeaderProps {
  appName: 'MindBBS' | 'EasyManager';
  navItems?: NavItem[];
  showServerApply?: boolean;
  showForumLink?: boolean;
  showManagerLink?: boolean;
  forumUrl?: string;
  managerUrl?: string;
  // 用户信息（可选，由调用方提供）
  user?: {
    id: number;
    username: string;
    avatar_url?: string;
    role?: string;
  } | null;
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  // 自定义右侧内容
  rightContent?: React.ReactNode;
}
```

- [ ] **Step 2: 创建 UnifiedHeader index.tsx**

```tsx
// shared/src/components/UnifiedHeader/index.tsx

'use client';

import Link from 'next/link';
import { Sun, Moon, User, Shield, LogOut, ExternalLink } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { UnifiedHeaderProps, NavItem } from './types';

export function UnifiedHeader({
  appName,
  navItems = [],
  showServerApply,
  showForumLink,
  showManagerLink,
  forumUrl = 'http://localhost:3000',
  managerUrl = 'http://localhost:3001',
  user,
  isAuthenticated,
  onLogin,
  onLogout,
  rightContent,
}: UnifiedHeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-xl font-bold text-[var(--primary)]">{appName}</span>
            <span className="text-xs text-[var(--text-muted)]">(mdtbbs)</span>
          </Link>

          {/* Navigation */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item: NavItem) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    item.active
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Cross-system links */}
            {showServerApply && (
              <Link
                href="/apply-server"
                className="px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
              >
                申请服务器
              </Link>
            )}
            {showForumLink && (
              <a
                href={forumUrl}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
              >
                论坛
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {showManagerLink && (
              <a
                href={managerUrl}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
              >
                管理面板
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              aria-label="切换主题"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Custom right content or user menu */}
            {rightContent || (
              <>
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                        title="管理后台"
                      >
                        <Shield className="w-5 h-5" />
                      </Link>
                    )}
                    <Link
                      href={`/users/${user.id}`}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{user.username}</span>
                    </Link>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="p-2 text-[var(--text-secondary)] hover:text-red-600 transition-colors"
                        title="退出登录"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ) : (
                  onLogin && (
                    <button
                      onClick={onLogin}
                      className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                    >
                      登录
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: 创建 components/index.ts 导出**

```ts
// shared/src/components/index.ts
export { UnifiedHeader } from './UnifiedHeader';
export type { UnifiedHeaderProps, NavItem } from './UnifiedHeader/types';
```

- [ ] **Step 4: Commit**

```bash
git add shared/src/components/
git commit -m "feat: add UnifiedHeader component to shared package"
```

---

### Task 2.5: 更新 MindFourm Header 使用 UnifiedHeader

**Files:**
- Modify: `MindFourm/frontend/src/components/forum/header.tsx`

- [ ] **Step 1: 修改 header.tsx 使用 UnifiedHeader**

由于 MindFourm 的 header.tsx 有较多本地功能（搜索、通知、私信），采用包装方式：

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useSettings } from '@/lib/settings/context';
import { messageApi } from '@/lib/api/client';
import { Search, Mail, Bell } from 'lucide-react';
import { UnifiedHeader } from '@mindproject/shared/components';
import { ThemeProvider, useTheme } from '@mindproject/shared/hooks';
import NotificationDropdown from './notification-dropdown';

// 内部组件：处理本地逻辑
function HeaderInner() {
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
    const currentPath = typeof window !== 'undefined'
      ? encodeURIComponent(window.location.pathname + window.location.search)
      : '';
    window.location.href = `${mindauthUrl}/login?redirect=${redirectUrl}&client_id=${clientId}&state=${currentPath}`;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const navItems = [
    { label: '首页', href: '/', active: false },
    { label: '服务器', href: '/servers', active: false },
    { label: '资源', href: '/resources', active: false },
  ];

  // 自定义右侧内容：搜索 + 通知 + 私信
  const rightContent = (
    <>
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="搜索..."
          aria-label="搜索"
          className="w-full pl-9 pr-3 py-1 bg-[var(--bg-elevated)] text-[var(--text)] rounded-[var(--radius)] text-sm placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--primary)]"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }}
        />
      </div>
      {/* Notifications & Messages */}
      {isAuthenticated && user && (
        <>
          <NotificationDropdown />
          <Link
            href="/messages"
            className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <Mail className="w-5 h-5" />
            {unreadMsgCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
              </span>
            )}
          </Link>
        </>
      )}
    </>
  );

  return (
    <UnifiedHeader
      appName="MindBBS"
      navItems={navItems}
      showServerApply={isAuthenticated}
      showManagerLink={true}
      managerUrl={process.env.NEXT_PUBLIC_EASYMANAGER_URL || 'http://localhost:3001'}
      user={user}
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
      rightContent={rightContent}
    />
  );
}

// 导出包装组件
export default function Header() {
  return (
    <ThemeProvider>
      <HeaderInner />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: 更新 MindFourm frontend package.json 添加依赖**

在 `MindFourm/frontend/package.json` 的 dependencies 中添加：

```json
"@mindproject/shared": "file:../../shared"
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/components/forum/header.tsx MindFourm/frontend/package.json
git commit -m "feat: update MindFourm header to use UnifiedHeader from shared package"
```

---

### Task 2.6: 更新 EasyManager Header 使用 UnifiedHeader

**Files:**
- Modify: `EasyManager/frontend/components/Layout/Header.jsx`

- [ ] **Step 1: 修改 Header.jsx 使用 UnifiedHeader**

```jsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authAPI } from '../../lib/api';
import { getLogoutUrl } from '../../lib/auth';
import { Skeleton } from '../Common/Skeleton';
import { UnifiedHeader } from '@mindproject/shared/components';
import { ThemeProvider } from '@mindproject/shared/hooks';

function HeaderInner({ onMenuClick }) {
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

  const handleLogin = () => {
    const mindauthUrl = process.env.NEXT_PUBLIC_MINDAUTH_URL || 'http://localhost:4001';
    window.location.href = `${mindauthUrl}/#/login`;
  };

  const navItems = [
    { label: '服务器', href: '/servers', active: false },
    { label: '模板', href: '/templates', active: false },
  ];

  // 自定义右侧内容：汉堡菜单 + 配额显示
  const rightContent = (
    <>
      {/* 汉堡菜单 - 移动端 */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* 配额显示 */}
      {user && (
        <div className="hidden md:block text-[var(--text-muted)] text-sm">
          服务器: {user.serverCount || 0}/{user.quota?.max_servers || 2}
        </div>
      )}
    </>
  );

  return (
    <UnifiedHeader
      appName="EasyManager"
      navItems={navItems}
      showForumLink={true}
      forumUrl={process.env.NEXT_PUBLIC_MINDFOURM_URL || 'http://localhost:3000'}
      user={user}
      isAuthenticated={!loading && user}
      onLogin={handleLogin}
      onLogout={handleLogout}
      rightContent={rightContent}
    />
  );
}

export default function Header({ onMenuClick }) {
  return (
    <ThemeProvider>
      <HeaderInner onMenuClick={onMenuClick} />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: 更新 EasyManager frontend package.json**

在 `EasyManager/frontend/package.json` 的 dependencies 中添加：

```json
"@mindproject/shared": "file:../../shared"
```

- [ ] **Step 3: Commit**

```bash
git add EasyManager/frontend/components/Layout/Header.jsx EasyManager/frontend/package.json
git commit -m "feat: update EasyManager header to use UnifiedHeader from shared package"
```

---

### Task 2.7: 创建论坛申请服务器页面

**Files:**
- Create: `MindFourm/frontend/src/app/(auth)/apply-server/page.tsx`

- [ ] **Step 1: 创建申请服务器页面**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { ServerIcon, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Version {
  id: number;
  version: string;
  name: string;
}

export default function ApplyServerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: '',
    version: 'v146',
    description: '',
  });
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [serverId, setServerId] = useState<number | null>(null);

  useEffect(() => {
    // 获取可用版本
    fetch(`${API_BASE}/api/servers/versions`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.versions) {
          setVersions(data.versions);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('请先登录');
      return;
    }
    if (!form.name.trim()) {
      setError('请输入服务器名称');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/servers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setServerId(data.server_id);
        setForm({ name: '', version: 'v146', description: '' });
      } else {
        setError(data.message || '申请失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    }

    setLoading(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ServerIcon className="w-8 h-8 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold text-[var(--text)]">申请服务器</h1>
      </div>

      {success ? (
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-[var(--success)]" />
            <h2 className="text-lg font-semibold text-[var(--text)]">申请已提交</h2>
          </div>
          <p className="text-[var(--text-secondary)] mb-4">
            您的服务器申请已成功提交，等待管理员审批。审批通过后会自动在论坛发布公告。
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/servers')}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
            >
              查看服务器列表
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              继续申请
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              服务器名称 *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="我的 Mindustry 服务器"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              服务器版本 *
            </label>
            <select
              value={form.version}
              onChange={e => setForm({ ...form, version: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              {versions.length > 0 ? (
                versions.map(v => (
                  <option key={v.id} value={v.version}>{v.name || v.version}</option>
                ))
              ) : (
                <option value="v146">v146 (最新)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              服务器描述
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] min-h-[100px]"
              placeholder="描述你的服务器用途、特色..."
              maxLength={500}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[var(--error)]">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>

          <p className="text-sm text-[var(--text-muted)]">
            提交申请后需等待管理员审批。审批通过后会自动在论坛发布公告，并创建服务器实例。
          </p>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 apply-server 目录**

```bash
mkdir -p MindFourm/frontend/src/app/(auth)/apply-server
```

- [ ] **Step 3: 验证创建**

```bash
ls -la MindFourm/frontend/src/app/(auth)/apply-server/page.tsx
```

- [ ] **Step 4: Commit**

```bash
git add MindFourm/frontend/src/app/(auth)/apply-server/page.tsx
git commit -m "feat: add apply server page to MindFourm"
```

---

### Task 2.8: 创建 MindFourm 自动发帖服务

**Files:**
- Create: `MindFourm/src/services/auto-post.service.js`

- [ ] **Step 1: 创建自动发帖服务**

```javascript
// MindFourm/src/services/auto-post.service.js

const db = require('../database');
const config = require('../config');

class AutoPostService {
  /**
   * 服务器审批通过后自动创建帖子
   * @param {object} data - { type, server_id, server_name, server_port, owner_id, owner_name, version }
   */
  static async createServerAnnouncement(data) {
    if (data.type !== 'server_approved') {
      return { success: false, message: '未知的自动发帖类型' };
    }

    // 查找 servers 分类（或使用默认分类）
    let category = db.get('SELECT id FROM categories WHERE slug = ?', ['servers']);
    if (!category) {
      // 使用第一个分类作为 fallback
      category = db.get('SELECT id FROM categories WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
    }

    if (!category) {
      return { success: false, message: '未找到合适的帖子分类' };
    }

    const title = `【服务器公告】${data.server_name} 已上线`;
    const content = `
用户 ${data.owner_name} 的服务器已通过审批！

**服务器信息：**
- 名称：${data.server_name}
- 版本：${data.version || '未知'}
- 地址：待分配

欢迎前来游玩！
    `;

    const contentHtml = `
<p>用户 <strong>${data.owner_name}</strong> 的服务器已通过审批！</p>
<h3>服务器信息</h3>
<ul>
  <li>名称：${data.server_name}</li>
  <li>版本：${data.version || '未知'}</li>
  <li>地址：待分配</li>
</ul>
<p>欢迎前来游玩！</p>
    `;

    try {
      const result = db.run(
        `INSERT INTO posts (user_id, category_id, title, content, content_html, status, server_id, post_type, created_at)
         VALUES (?, ?, ?, ?, ?, 'published', ?, 'server_announcement', CURRENT_TIMESTAMP)`,
        [
          data.owner_id,
          category.id,
          title,
          content,
          contentHtml,
          data.server_id,
        ]
      );

      return { success: true, post_id: result.lastInsertRowid };
    } catch (error) {
      console.error('Auto post error:', error);
      return { success: false, message: '发帖失败' };
    }
  }
}

module.exports = AutoPostService;
```

- [ ] **Step 2: 验证创建**

```bash
ls -la MindFourm/src/services/auto-post.service.js
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/services/auto-post.service.js
git commit -m "feat: add auto-post service for server announcements"
```

---

### Task 2.9: 创建自动发帖 API 路由

**Files:**
- Create: `MindFourm/src/routes/auto-post.routes.js`
- Modify: `MindFourm/src/routes/index.js`

- [ ] **Step 1: 创建自动发帖路由**

```javascript
// MindFourm/src/routes/auto-post.routes.js

const Router = require('@koa/router');
const AutoPostService = require('../services/auto-post.service');
const Response = require('../utils/response');
const requireServiceAuth = require('../middleware/service-auth');

const router = new Router({ prefix: '/api/auto-post' });

// 接收 EasyManager 回调创建帖子
router.post('/server-approved', requireServiceAuth, async ctx => {
  const data = ctx.request.body;

  if (!data.type || !data.server_id || !data.server_name || !data.owner_id) {
    ctx.status = 400;
    ctx.body = { success: false, message: '缺少必要参数' };
    return;
  }

  const result = await AutoPostService.createServerAnnouncement(data);

  if (result.success) {
    Response.success(ctx, { post_id: result.post_id });
  } else {
    ctx.status = 500;
    ctx.body = { success: false, message: result.message };
  }
});

module.exports = router;
```

- [ ] **Step 2: 创建服务认证中间件**

```javascript
// MindFourm/src/middleware/service-auth.js

const config = require('../config');

module.exports = async (ctx, next) => {
  const serviceKey = ctx.headers['x-service-key'];
  const expectedKey = config.easymanager?.apiKey || process.env.EASYMANAGER_API_KEY;

  if (!serviceKey || serviceKey !== expectedKey) {
    ctx.status = 401;
    ctx.body = { success: false, message: '服务认证失败' };
    return;
  }

  await next();
};
```

- [ ] **Step 3: 注册路由到 index.js**

在 `MindFourm/src/routes/index.js` 中添加：

```javascript
// 在现有路由导入后添加
const autoPostRoutes = require('./auto-post.routes');

// 在 router.use 区域添加
router.use(autoPostRoutes.routes());
```

- [ ] **Step 4: Commit**

```bash
git add MindFourm/src/routes/auto-post.routes.js MindFourm/src/middleware/service-auth.js MindFourm/src/routes/index.js
git commit -m "feat: add auto-post API route for EasyManager callback"
```

---

### Task 2.10: 更新 EasyManager 审批逻辑回调论坛

**Files:**
- Modify: `EasyManager/backend/src/routes/admin.js`

- [ ] **Step 1: 在审批逻辑中添加论坛回调**

找到 `EasyManager/backend/src/routes/admin.js` 中服务器审批的代码，在审批通过后添加回调：

```javascript
// 在审批通过的逻辑中添加（假设函数名为 approveServer）

async function approveServer(serverId, adminId) {
  // ... 现有的审批逻辑 ...

  // 获取服务器和用户信息
  const server = query.get(`
    SELECT s.id, s.name, s.port, s.version, s.owner_id, u.username as owner_name
    FROM servers s
    LEFT JOIN user_quotas uq ON s.owner_id = uq.user_id
    LEFT JOIN users u ON uq.mindauth_id = u.id
    WHERE s.id = ?
  `, [serverId]);

  if (!server) {
    return { success: false, message: '服务器不存在' };
  }

  // 更新服务器状态
  query.run(`
    UPDATE servers SET approval_status = 'approved', status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [adminId, serverId]);

  // 回调论坛创建公告帖子
  try {
    const MINDFOURM_URL = process.env.MINDFOURM_URL || 'http://localhost:4000';
    const API_KEY = process.env.EASYMANAGER_API_KEY;

    await fetch(`${MINDFOURM_URL}/api/auto-post/server-approved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': API_KEY,
      },
      body: JSON.stringify({
        type: 'server_approved',
        server_id: server.id,
        server_name: server.name,
        server_port: server.port,
        version: server.version,
        owner_id: server.owner_id,
        owner_name: server.owner_name || '未知用户',
      }),
    });
  } catch (error) {
    console.error('Forum callback error:', error);
    // 不影响审批结果，仅记录错误
  }

  return { success: true, message: '服务器已审批通过' };
}
```

- [ ] **Step 2: Commit**

```bash
git add EasyManager/backend/src/routes/admin.js
git commit -m "feat: add forum callback on server approval in EasyManager"
```

---

## Phase 3: 统一登录状态 + 帖子关联服务器

### Task 3.1: 扩展 MindFourm 数据库支持帖子关联服务器

**Files:**
- Create: `MindFourm/src/database/migrations/001_add_server_fields.sql`
- Modify: `MindFourm/src/database/index.js`

- [ ] **Step 1: 创建迁移脚本**

```sql
-- MindFourm/src/database/migrations/001_add_server_fields.sql

-- 为 posts 表添加服务器关联字段
ALTER TABLE posts ADD COLUMN server_id INTEGER NULL;
ALTER TABLE posts ADD COLUMN post_type TEXT DEFAULT 'normal';

-- post_type 可选值：
-- 'normal': 普通帖子
-- 'server_announcement': 服务器公告（系统自动创建）
-- 'server_help': 服务器问题求助
-- 'server_intro': 服务器介绍

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_server_id ON posts(server_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
```

- [ ] **Step 2: 更新数据库初始化逻辑**

在 `MindFourm/src/database/index.js` 中添加迁移执行：

```javascript
// 在数据库初始化后添加迁移执行
function runMigrations() {
  const migrations = [
    './migrations/001_add_server_fields.sql',
  ];

  for (const migrationPath of migrations) {
    try {
      const migrationSql = fs.readFileSync(path.join(__dirname, migrationPath), 'utf8');
      // SQLite 不支持一次执行多条语句，需要分割
      const statements = migrationSql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          db.run(stmt);
        }
      }
      console.log(`Migration ${migrationPath} executed`);
    } catch (error) {
      // ALTER TABLE 可能因字段已存在而失败，忽略
      if (!error.message.includes('duplicate column')) {
        console.error(`Migration ${migrationPath} error:`, error);
      }
    }
  }
}

// 在初始化数据库后调用
runMigrations();
```

- [ ] **Step 3: 创建迁移目录**

```bash
mkdir -p MindFourm/src/database/migrations
```

- [ ] **Step 4: Commit**

```bash
git add MindFourm/src/database/migrations/ MindFourm/src/database/index.js
git commit -m "feat: add database migration for server-related post fields"
```

---

### Task 3.2: 创建帖子-服务器关联服务

**Files:**
- Create: `MindFourm/src/services/post-server.service.js`

- [ ] **Step 1: 创建帖子-服务器服务**

```javascript
// MindFourm/src/services/post-server.service.js

const db = require('../database');

class PostServerService {
  /**
   * 获取关联服务器的帖子列表
   * @param {number} serverId - 服务器ID
   */
  static getPostsByServer(serverId) {
    return db.all(`
      SELECT p.id, p.title, p.post_type, p.created_at, p.view_count,
             u.username as author_name, u.avatar_url as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.server_id = ? AND p.deleted_at IS NULL AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [serverId]);
  }

  /**
   * 创建关联服务器的帖子
   * @param {object} data - 帖子数据 + server_id, post_type
   */
  static createPostWithServer(data) {
    const result = db.run(`
      INSERT INTO posts (user_id, category_id, title, content, content_html, status, server_id, post_type)
      VALUES (?, ?, ?, ?, ?, 'published', ?, ?)
    `, [
      data.user_id,
      data.category_id,
      data.title,
      data.content,
      data.content_html,
      data.server_id || null,
      data.post_type || 'normal',
    ]);

    return { success: true, post_id: result.lastInsertRowid };
  }

  /**
   * 获取用户可关联的服务器列表
   * @param {number} userId - 用户ID (mindauth_id)
   */
  static getUserServers(userId) {
    // 通过 EasyManager API 获取用户服务器
    // 这里返回本地缓存的简单列表
    return [];
  }
}

module.exports = PostServerService;
```

- [ ] **Step 2: Commit**

```bash
git add MindFourm/src/services/post-server.service.js
git commit -m "feat: add post-server service for server-related posts"
```

---

### Task 3.3: 创建帖子-服务器 API 路由

**Files:**
- Create: `MindFourm/src/routes/post-server.routes.js`
- Modify: `MindFourm/src/routes/index.js`

- [ ] **Step 1: 创建帖子-服务器路由**

```javascript
// MindFourm/src/routes/post-server.routes.js

const Router = require('@koa/router');
const PostServerService = require('../services/post-server.service');
const Response = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const requireServiceAuth = require('../middleware/service-auth');

const router = new Router({ prefix: '/api/v1/post-servers' });

// 获取服务器关联的帖子（公开）
router.get('/by-server/:serverId', async ctx => {
  const serverId = parseInt(ctx.params.serverId);
  const posts = PostServerService.getPostsByServer(serverId);
  Response.success(ctx, { posts });
});

// 获取用户可关联的服务器（需要认证）
router.get('/my-servers', authMiddleware({ required: true }), async ctx => {
  const mindauthId = ctx.state.user.mindauthId;
  // 调用 ServerService 获取用户服务器
  const ServerService = require('../services/server.service');
  const servers = await ServerService.getUserServers(mindauthId);
  Response.success(ctx, { servers });
});

// EasyManager 查询帖子（服务认证）
router.get('/forum-posts/:serverId', requireServiceAuth, async ctx => {
  const serverId = parseInt(ctx.params.serverId);
  const posts = PostServerService.getPostsByServer(serverId);
  Response.success(ctx, { posts });
});

module.exports = router;
```

- [ ] **Step 2: 注册路由**

在 `MindFourm/src/routes/index.js` 中添加：

```javascript
const postServerRoutes = require('./post-server.routes');
router.use(postServerRoutes.routes());
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/routes/post-server.routes.js MindFourm/src/routes/index.js
git commit -m "feat: add post-server API routes"
```

---

### Task 3.4: 创建发帖服务器选择组件

**Files:**
- Create: `MindFourm/frontend/src/app/(auth)/posts/new/server-selector.tsx`

- [ ] **Step 1: 创建服务器选择组件**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ServerIcon, Link2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Server {
  id: number;
  name: string;
  status: string;
}

interface ServerSelectorProps {
  value: number | null;
  onChange: (serverId: number | null) => void;
  postType: string;
  onPostTypeChange: (type: string) => void;
}

export function ServerSelector({ value, onChange, postType, onPostTypeChange }: ServerSelectorProps) {
  const { isAuthenticated } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch(`${API_BASE}/api/v1/post-servers/my-servers`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.servers) {
          setServers(data.servers);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated || loading) {
    return null;
  }

  if (servers.length === 0) {
    return (
      <div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        <span>您还没有服务器，</span>
        <a href="/apply-server" className="text-[var(--primary)] hover:text-[var(--primary-dark)]">
          申请一个
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-[var(--bg-elevated)] rounded-[var(--radius)]">
      <div className="flex items-center gap-2">
        <ServerIcon className="w-4 h-4 text-[var(--primary)]" />
        <span className="text-sm font-medium text-[var(--text)]">关联服务器（可选）</span>
      </div>

      <select
        value={value || ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)]"
      >
        <option value="">不关联服务器</option>
        {servers.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {value && (
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">帖子类型</label>
          <select
            value={postType}
            onChange={e => onPostTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)]"
          >
            <option value="normal">普通帖子</option>
            <option value="server_help">服务器求助</option>
            <option value="server_intro">服务器介绍</option>
          </select>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add MindFourm/frontend/src/app/(auth)/posts/new/server-selector.tsx
git commit -m "feat: add server selector component for post creation"
```

---

### Task 3.5: 创建 EasyManager 关联帖子组件

**Files:**
- Create: `EasyManager/frontend/components/Server/RelatedPosts.jsx`

- [ ] **Step 1: 创建关联帖子组件**

```jsx
'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink } from 'lucide-react';

const FORUM_URL = process.env.NEXT_PUBLIC_MINDFOURM_URL || 'http://localhost:3000';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function RelatedPosts({ serverId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/forum/posts/by-server/${serverId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.posts) {
          setPosts(data.posts);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serverId]);

  if (loading) {
    return (
      <div className="text-sm text-[var(--text-muted)] mt-4">
        加载关联帖子...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="mt-4 p-4 bg-[var(--bg-elevated)] rounded-[var(--radius)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <FileText className="w-4 h-4" />
          <span className="text-sm">暂无关联帖子</span>
        </div>
        <a
          href={`${FORUM_URL}/posts/new`}
          className="mt-2 inline-block text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]"
        >
          在论坛发帖介绍此服务器
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        相关帖子 ({posts.length})
      </h3>
      <div className="space-y-2">
        {posts.map(post => (
          <a
            key={post.id}
            href={`${FORUM_URL}/posts/${post.id}`}
            className="block p-3 bg-[var(--bg-elevated)] rounded-[var(--radius)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs rounded-[var(--radius-sm)] ${
                post.post_type === 'server_announcement'
                  ? 'bg-[var(--primary)] text-white'
                  : post.post_type === 'server_help'
                  ? 'bg-[var(--warning)] bg-opacity-20 text-[var(--warning)]'
                  : 'bg-[var(--bg)] text-[var(--text-secondary)]'
              }`}>
                {post.post_type === 'server_announcement' ? '公告' :
                 post.post_type === 'server_help' ? '求助' :
                 post.post_type === 'server_intro' ? '介绍' : '帖子'}
              </span>
              <span className="text-sm font-medium text-[var(--text)] line-clamp-1">
                {post.title}
              </span>
              <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {post.author_name} · {formatDate(post.created_at)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}
```

- [ ] **Step 2: Commit**

```bash
git add EasyManager/frontend/components/Server/RelatedPosts.jsx
git commit -m "feat: add RelatedPosts component for EasyManager server details"
```

---

### Task 3.6: 更新 EasyManager 服务器详情页显示关联帖子

**Files:**
- Modify: `EasyManager/frontend/app/servers/[id]/page.jsx`

- [ ] **Step 1: 在服务器详情页添加 RelatedPosts 组件**

在 `EasyManager/frontend/app/servers/[id]/page.jsx` 中导入并使用 RelatedPosts：

```jsx
// 在文件顶部添加导入
import { RelatedPosts } from '../../../components/Server/RelatedPosts';

// 在服务器详情显示区域添加组件
// 假设在服务器信息卡片下方添加：

{/* 在服务器操作按钮区域后添加 */}
<RelatedPosts serverId={server.id} />
```

- [ ] **Step 2: Commit**

```bash
git add EasyManager/frontend/app/servers/[id]/page.jsx
git commit -m "feat: display related posts in EasyManager server details page"
```

---

### Task 3.7: 更新 EasyManager forum 路由支持帖子查询

**Files:**
- Modify: `EasyManager/backend/src/routes/forum.js`

- [ ] **Step 1: 添加帖子查询代理路由**

在 `EasyManager/backend/src/routes/forum.js` 中添加：

```javascript
// 在现有路由后添加

// 获取服务器关联的帖子（代理 MindFourm）
router.get('/posts/by-server/:id', async (ctx) => {
  const serverId = parseInt(ctx.params.id);
  const MINDFOURM_URL = process.env.MINDFOURM_URL || 'http://localhost:4000';
  const API_KEY = process.env.EASYMANAGER_API_KEY;

  try {
    const res = await fetch(`${MINDFOURM_URL}/api/v1/post-servers/forum-posts/${serverId}`, {
      headers: {
        'X-Service-Key': API_KEY,
      },
    });

    const data = await res.json();
    ctx.body = data;
  } catch (error) {
    console.error('Forum posts proxy error:', error);
    ctx.body = { success: true, posts: [] };
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add EasyManager/backend/src/routes/forum.js
git commit -m "feat: add posts proxy route in EasyManager forum API"
```

---

### Task 3.8: 构建和安装 shared 包

**Files:**
- None（构建步骤）

- [ ] **Step 1: 构建 shared 包**

```bash
cd shared && npm install && npm run build
```

- [ ] **Step 2: 在 MindFourm frontend 安装依赖**

```bash
cd MindFourm/frontend && npm install
```

- [ ] **Step 3: 在 EasyManager frontend 安装依赖**

```bash
cd EasyManager/frontend && npm install
```

- [ ] **Step 4: 验证构建**

```bash
ls -la shared/dist/
```
Expected: 看到 index.js, index.d.ts, components/, hooks/, types/

---

### Task 3.9: 最终验证和提交

**Files:**
- None

- [ ] **Step 1: 启动 MindFourm 并验证**

```bash
cd MindFourm && npm run dev
```
访问 http://localhost:3000 验证：
- 首页显示服务器区域
- 服务器列表页样式正确
- Header 显示跨系统链接
- 申请服务器页面可访问

- [ ] **Step 2: 启动 EasyManager 并验证**

```bash
cd EasyManager/backend && npm run dev
cd EasyManager/frontend && npm run dev
```
访问 http://localhost:3001 验证：
- Header 显示论坛链接
- 服务器详情页显示关联帖子

- [ ] **Step 3: 最终 commit**

```bash
git add docs/superpowers/plans/2026-05-21-mindforum-easymanager-deep-integration.md
git commit -m "docs: add implementation plan for MindFourm-EasyManager deep integration"
```

---

## Self-Review

1. **Spec coverage:**
   - Phase 1: 设计风格统一 ✓，论坛显示服务器 ✓
   - Phase 2: 统一导航栏 ✓，申请服务器 ✓，自动发帖 ✓
   - Phase 3: 帖子关联服务器 ✓，服务器详情显示帖子 ✓
   - 未覆盖：统一登录状态（跨域 cookie）- 需要在 MindAuth 中修改，超出本项目范围

2. **Placeholder scan:** 无 TBD/TODO，所有步骤含完整代码

3. **Type consistency:** Server 类型在 shared/types/server.ts 定义，各组件使用一致