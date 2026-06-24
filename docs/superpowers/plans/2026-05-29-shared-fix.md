# Shared Packages 修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善 Shared Packages 类型定义和配置 Monorepo 工作区，为三个服务提供统一的类型支持和依赖管理。

**Architecture:** 先扩展类型定义，再配置工作区。简单直接，无复杂依赖。

**Tech Stack:** TypeScript, npm workspaces

---

## 文件结构

```
MindProject/
├── package.json              # 新增: 根工作区配置
├── tsconfig.base.json        # 新增: 共享 TS 配置
├── shared/
│   └── src/
│   │   ├── types/
│   │   │   ├── user.ts       # 扩展: UserQuota, UserProfile
│   │   │   ├── server.ts     # 扩展: ServerStats, ServerTemplate
│   │   │   ├── notification.ts # 新增: Notification 类型
│   │   │   ├── post.ts       # 新增: Post, Reply 类型
│   │   │   └── api.ts        # 新增: API 响应类型
│   │   └── index.ts          # 修改: 导出所有类型
```

---

## Task 1: 扩展 User 类型定义

**Files:**
- Modify: `shared/src/types/user.ts`

- [ ] **Step 1: 读取当前 user.ts**

Run: `cat shared/src/types/user.ts`
Expected: 找到基础 User 类型

- [ ] **Step 2: 扩展类型定义**

```typescript
export type UserRole = 'guest' | 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  username: string | null;
  email: string | null;
  role: UserRole;
  avatar_url?: string | null;
  bio?: string | null;
  mindauth_id?: number;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 新增: 用户配额
export interface UserQuota {
  user_id: number;
  max_servers: number;
  total_cpu_limit: number;
  total_memory_limit: number;
  total_bandwidth_limit: number;
  role: UserRole;
}

// 新增: 用户扩展信息
export interface UserProfile extends User {
  post_count?: number;
  reply_count?: number;
  bookmark_count?: number;
  medals?: Medal[];
  titles?: Title[];
}
```

- [ ] **Step 3: Commit**

```bash
git add shared/src/types/user.ts
git commit -m "feat(shared): extend User types with Quota and Profile"
```

---

## Task 2: 扩展 Server 类型定义

**Files:**
- Modify: `shared/src/types/server.ts`

- [ ] **Step 1: 扩展类型**

```typescript
export type ServerStatus = 'pending' | 'approved' | 'running' | 'stopped' | 'deleted';

export interface Server {
  id: number;
  name: string;
  owner_id: number;
  port: number;
  status: ServerStatus;
  version: string;
  container_id?: string;
  cpu_limit?: number;
  memory_limit?: number;
  bandwidth_limit?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

// 新增: 服务器实时状态
export interface ServerStats {
  server_id: number;
  cpu_usage: number;
  memory_usage: number;
  bandwidth_usage: number;
  player_count: number;
  status: ServerStatus;
  timestamp?: number;
}

// 新增: 服务器模板
export interface ServerTemplate {
  id: number;
  name: string;
  description?: string;
  default_config: Record<string, unknown>;
  default_plugins?: string[];
  is_active: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/src/types/server.ts
git commit -m "feat(shared): extend Server types with Stats and Template"
```

---

## Task 3: 新增 Notification 类型

**Files:**
- Create: `shared/src/types/notification.ts`

- [ ] **Step 1: 创建 notification.ts**

```typescript
export type NotificationType = 'reply' | 'mention' | 'message' | 'system';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  actor_id: number;
  post_id?: number;
  reply_id?: number;
  message_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface NotificationList {
  notifications: Notification[];
  unread_count: number;
  has_more: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/src/types/notification.ts
git commit -m "feat(shared): add Notification type definitions"
```

---

## Task 4: 新增 Post 类型

**Files:**
- Create: `shared/src/types/post.ts`

- [ ] **Step 1: 创建 post.ts**

```typescript
export type PostStatus = 'draft' | 'published' | 'archived' | 'deleted';

export interface Post {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  content: string;
  content_html?: string;
  status: PostStatus;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  user?: import('./user').User;
  category?: { id: number; name: string; slug: string };
  reply_count?: number;
}

export interface Reply {
  id: number;
  post_id: number;
  user_id: number;
  parent_reply_id?: number;
  content: string;
  content_html?: string;
  status: PostStatus;
  created_at: string;
  user?: import('./user').User;
  children?: Reply[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  post_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  post_count?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/src/types/post.ts
git commit -m "feat(shared): add Post, Reply, Category, Tag type definitions"
```

---

## Task 5: 新增 API 响应类型

**Files:**
- Create: `shared/src/types/api.ts`

- [ ] **Step 1: 创建 api.ts**

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface CursorResponse<T> {
  success: boolean;
  data: T[];
  cursor?: string;
  has_more: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  status?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/src/types/api.ts
git commit -m "feat(shared): add API response type definitions"
```

---

## Task 6: 更新 index.ts 导出

**Files:**
- Modify: `shared/src/index.ts`

- [ ] **Step 1: 导出所有类型**

```typescript
// 类型导出
export * from './types/user';
export * from './types/server';
export * from './types/notification';
export * from './types/post';
export * from './types/api';

// 组件导出 (保持原有)
export { UnifiedHeader } from './components/UnifiedHeader';
export { UserCard } from './components/UserCard';
export { ServerCard } from './components/ServerCard';
export { Medal } from './components/Medal';
export { Title } from './components/Title';
export { AdminSidebar } from './components/AdminSidebar';
export { LoginLayout } from './components/LoginLayout';

// Hooks 导出 (保持原有)
export { useTheme, ThemeProvider } from './hooks/useTheme';
```

- [ ] **Step 2: Commit**

```bash
git add shared/src/index.ts
git commit -m "feat(shared): export all types from index"
```

---

## Task 7: 构建验证

- [ ] **Step 1: 构建 shared 包**

Run: `cd shared && npm run build`
Expected: TypeScript 编译成功，无类型错误

- [ ] **Step 2: 验证类型导出**

```typescript
// 在前端项目中测试导入
import { User, Post, ServerStats, ApiResponse } from '@mindproject/shared';

const user: User = { id: 1, username: 'test', role: 'user' };
const response: ApiResponse<Post> = { success: true, data: post };
```

- [ ] **Step 3: Commit 构建产物**

```bash
git add shared/dist/
git commit -m "build(shared): rebuild with extended types"
```

---

## Task 8: 配置 Monorepo 工作区

**Files:**
- Create: `package.json` (根目录)
- Create: `tsconfig.base.json` (根目录)

- [ ] **Step 1: 创建根 package.json**

```json
{
  "name": "mindproject",
  "private": true,
  "version": "1.0.0",
  "description": "Mindustry community platform monorepo",
  "workspaces": [
    "MindAuth",
    "MindFourm",
    "MindFourm/frontend",
    "EasyManager/backend",
    "EasyManager/frontend",
    "shared"
  ],
  "scripts": {
    "build:shared": "npm run build --workspace=shared",
    "dev:auth": "npm run dev --workspace=MindAuth",
    "dev:forum-api": "npm run dev --workspace=MindFourm",
    "dev:forum-ui": "npm run dev --workspace=MindFourm/frontend",
    "dev:manager-api": "npm run dev --workspace=EasyManager/backend",
    "dev:manager-ui": "npm run dev --workspace=EasyManager/frontend",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 3: 修改各前端 package.json 引用**

```json
// MindFourm/frontend/package.json
{
  "dependencies": {
    "@mindproject/shared": "*"  // workspace 引用
  }
}

// EasyManager/frontend/package.json
{
  "dependencies": {
    "@mindproject/shared": "*"  // workspace 引用
  }
}
```

- [ ] **Step 4: 初始化工作区**

Run: `cd G:\MindProject && npm install`
Expected: npm 安装所有工作区依赖

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.base.json MindFourm/frontend/package.json EasyManager/frontend/package.json
git commit -m "feat(mindproject): configure npm workspaces for monorepo"
```

---

## 最终验证清单

- [ ] shared 包构建成功
- [ ] 类型导出完整
- [ ] 各前端可导入 shared 类型
- [ ] npm workspaces 配置生效
- [ ] `npm install` 安装所有工作区

---

## 执行顺序建议

Shared Packages 应在其他三个服务修复完成后执行，因为它需要：
1. 类型定义完善后才能在各服务中使用
2. 工作区配置后才能统一管理依赖

建议在 **Phase 3 架构模块** 时执行此计划。