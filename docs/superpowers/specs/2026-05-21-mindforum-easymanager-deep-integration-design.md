---
name: mindforum-easymanager-deep-integration
description: MindFourm 论坛与 EasyManager 服务器管理面板深度融合设计规格
---

# MindFourm 与 EasyManager 深度融合设计规格

## 背景

MindFourm（论坛系统）和 EasyManager（Mindustry 服务器管理面板）已有基础集成：
- 共同使用 MindAuth OAuth 认证
- EasyManager 提供 `/api/forum/*` 路由供论坛获取服务器数据
- 已有 `shared-styles` 目录用于统一设计风格

本次深度融合目标是：
1. **数据互通增强**：论坛显示服务器状态，论坛内申请服务器
2. **功能流程打通**：申请自动发帖，帖子关联服务器，问题求助帖关联
3. **用户体验统一**：统一设计风格，统一导航栏，统一登录状态

## 架构方案

**混合方案：渐进式整合**

- Phase 1：使用现有 `shared-styles` 完成设计风格统一 + 论坛显示服务器
- Phase 2：创建 `@mindproject/shared` npm 包，统一导航栏 + 申请流程
- Phase 3：统一登录状态 + 帖子关联服务器

保持两个项目独立部署，通过 API 互通数据和功能。

```
G:\MindProject\
├── shared-styles/                    # Phase 1: CSS 共享
│   ├── variables.css
│   ├── components.css
│   ├── utilities.css
│   └── theme-switch.js
│
├── shared/                           # Phase 2+: npm 共享包
│   ├── package.json                  # @mindproject/shared
│   ├── src/
│   │   ├── components/
│   │   │   ├── UnifiedHeader/
│   │   │   ├── ServerCard/
│   │   │   ├── ServerStatusBadge/
│   │   │   └── ServerApplyForm/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useServers.ts
│   │   │   └ useTheme.ts
│   │   ├── api/
│   │   │   ├── easymanager.ts
│   │   │   ├── mindauth.ts
│   │   └── types/
│   │       ├── server.ts
│   │       └ user.ts
│
├── MindFourm/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/
│   │   │   │   │   ├── servers/         # 新增
│   │   │   │   │   └── apply-server/    # 新增
│   │   │   │   ├── posts/
│   │   │   │   │    new/                # 增强: 关联服务器
│   │   │   │   ├── components/
│   │   │   │   │   ├── forum/
│   │   │   │   │   │   ├── header.tsx   # 改用 UnifiedHeader
│   │   │   │   │   │   ├── server-section.tsx  # 新增
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── server.ts           # 新增: EasyManager API 客户端
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── servers.js      # 新增: 服务器路由
│   │   │   │   ├── services/
│   │   │   │   │   ├── server-proxy.js # 新增: EasyManager API 代理
│
├── EasyManager/
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── servers/
│   │   │   │   ├── [id]/               # 增强: 显示关联帖子
│   │   │   ├── components/
│   │   │   │   ├── Layout/
│   │   │   │   │   ├── Header.jsx      # 改用 UnifiedHeader
│   │   │   │   ├── Server/
│   │   │   │   │   ├── RelatedPosts.jsx # 新增
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── forum.ts            # 新增: MindFourm API 客户端
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── forum.js            # 增强: 新增帖子查询
│   │   │   │   ├── servers.js          # 增强: 申请流程
│
├── MindAuth/                           # 保持独立
│   └── public/
│       ├── index.html                  # 引用 shared-styles
```

---

## Phase 1: 设计风格统一 + 论坛显示服务器

### 1.1 共享样式完善

**Why:** 确保 CSS 变量覆盖所有服务器相关组件，避免各项目重复定义

**How to apply:** 在 `shared-styles/components.css` 中添加服务器卡片、状态徽章样式

```css
/* shared-styles/components.css 新增 */

/* 服务器卡片 */
.server-card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

/* 服务器状态徽章 */
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

/* 服务器列表区域 */
.server-section {
  padding: 1rem;
  background: var(--bg);
}

.server-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
```

### 1.2 MindFourm 服务器 API 代理

**Why:** 论坛前端不能直接访问 EasyManager 后端（跨域、端口不同）

**How to apply:** MindFourm 后端新增 `/api/v1/servers` 路由，代理调用 EasyManager

```javascript
// MindFourm/backend/src/services/server-proxy.js

const EASYMANAGER_URL = process.env.EASYMANAGER_URL || 'http://localhost:5001';

class ServerProxyService {
  async getPublicServers() {
    const res = await fetch(`${EASYMANAGER_URL}/api/forum/servers/public`);
    return res.json();
  }

  async getServerById(id) {
    const res = await fetch(`${EASYMANAGER_URL}/api/forum/servers/${id}/basic`);
    return res.json();
  }

  async getUserServers(userId) {
    const res = await fetch(`${EASYMANAGER_URL}/api/forum/user/${userId}/servers`);
    return res.json();
  }
}

module.exports = new ServerProxyService();
```

```javascript
// MindFourm/backend/src/routes/v1/servers.js

const Router = require('@koa/router');
const serverProxy = require('../../services/server-proxy');
const Response = require('../../utils/response');

const router = new Router({ prefix: '/api/v1/servers' });

router.get('/', async ctx => {
  const result = await serverProxy.getPublicServers();
  Response.success(ctx, result.data);
});

router.get('/:id', async ctx => {
  const result = await serverProxy.getServerById(ctx.params.id);
  Response.success(ctx, result.data);
});

module.exports = router;
```

### 1.3 论坛首页服务器区域组件

**Why:** 用户访问论坛首页时能立即看到在线服务器

**How to apply:** 在首页帖子列表上方添加 ServerSection 组件

```tsx
// MindFourm/frontend/src/components/forum/server-section.tsx

'use client';

import { useEffect, useState } from 'react';
import { serverAPI } from '@/lib/api/server';

interface Server {
  id: number;
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'pending';
  version: string;
  owner_name?: string;
}

function ServerCard({ server }: { server: Server }) {
  return (
    <div className="server-card">
      <div className="server-card-header">
        <span className="server-name">{server.name}</span>
        <span className={`server-status server-status-${server.status}`}>
          {server.status === 'running' ? '在线' : server.status === 'stopped' ? '离线' : '待审批'}
        </span>
      </div>
      <div className="server-address">
        服务器地址: {process.env.NEXT_PUBLIC_EASYMANAGER_HOST || 'localhost'}:{server.port}
      </div>
      <div className="text-xs text-[var(--text-muted)]">
        版本: {server.version} | 所有者: {server.owner_name || '未知'}
      </div>
    </div>
  );
}

export function ServerSection() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serverAPI.getPublicServers().then(res => {
      if (res.success) setServers(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="server-section">加载中...</div>;
  
  const runningServers = servers.filter(s => s.status === 'running');
  if (runningServers.length === 0) return null;

  return (
    <section className="server-section">
      <h2 className="server-section-title">在线服务器 ({runningServers.length})</h2>
      <div className="server-grid">
        {runningServers.slice(0, 6).map(server => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
      <a href="/servers" className="text-sm text-[var(--primary)] mt-2 inline-block">
        查看全部服务器 →
      </a>
    </section>
  );
}
```

### 1.4 论坛服务器列表页面

**Why:** 提供完整的服务器浏览体验，包括筛选和搜索

**How to apply:** 创建 `/servers` 路由页面

```tsx
// MindFourm/frontend/src/app/(public)/servers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { serverAPI } from '@/lib/api/server';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serverAPI.getPublicServers().then(res => {
      if (res.success) setServers(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = servers.filter(s => {
    if (filter.status !== 'all' && s.status !== filter.status) return false;
    if (filter.search && !s.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">服务器列表</h1>
      
      {/* 筛选 */}
      <div className="flex gap-4 mb-4">
        <select 
          value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value })}
          className="input"
        >
          <option value="all">全部状态</option>
          <option value="running">在线</option>
          <option value="stopped">离线</option>
          <option value="pending">待审批</option>
        </select>
        <input
          type="text"
          placeholder="搜索服务器名称..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          className="input"
        />
        <a href="/apply-server" className="btn btn-primary">申请服务器</a>
      </div>

      {/* 列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div className="server-grid">
          {filtered.map(server => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 1.5 EasyManager API 确保

**Why:** 论坛需要获取完整的服务器信息

**How to apply:** 检查 `/api/forum/servers/public` 返回必要字段

确保返回字段：
- `id`, `name`, `port`, `status`, `version`
- `owner_name`（用户名）
- `players_count`（当前玩家数，可选）
- `created_at`（创建时间）

---

## Phase 2: 统一导航栏 + 申请流程

### 2.1 创建共享 npm 包

**Why:** 导航栏和申请表单需要跨项目复用，CSS 共享不足以表达逻辑

**How to apply:** 创建 `shared` 目录，发布为 `@mindproject/shared`

```json
// shared/package.json
{
  "name": "@mindproject/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "exports": {
    "./components": "./dist/components/index.js",
    "./hooks": "./dist/hooks/index.js",
    "./api": "./dist/api/index.js",
    "./types": "./dist/types/index.js"
  }
}
```

### 2.2 统一导航栏组件

**Why:** 用户在两个系统间切换时保持一致的导航体验

**How to apply:** `UnifiedHeader` 组件替代各项目的独立 Header

```tsx
// shared/src/components/UnifiedHeader/index.tsx

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface UnifiedHeaderProps {
  appName: 'MindBBS' | 'EasyManager';
  navItems: NavItem[];
  showServerApply?: boolean;
  showForumLink?: boolean;
  forumUrl?: string;
  easymanagerUrl?: string;
}

export function UnifiedHeader({
  appName,
  navItems,
  showServerApply,
  showForumLink,
  forumUrl = 'http://localhost:3000',
  easymanagerUrl = 'http://localhost:3001',
}: UnifiedHeaderProps) {
  const { theme, toggle } = useTheme();
  const { user, loading } = useAuth();

  return (
    <header className="h-[var(--header-height)] bg-[var(--bg)] border-b border-[var(--border)] backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-1 shrink-0">
          <span className="text-xl font-bold text-[var(--primary)]">{appName}</span>
          <span className="text-xs text-[var(--text-muted)]">(mdtbbs)</span>
        </a>

        {/* 导航 */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                item.active
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 跨系统链接 */}
          {showServerApply && (
            <a href="/apply-server" className="btn btn-primary btn-sm">
              申请服务器
            </a>
          )}
          {showForumLink && (
            <a href={forumUrl} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
              论坛
            </a>
          )}
          {appName === 'MindBBS' && (
            <a href={easymanagerUrl} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
              管理面板
            </a>
          )}

          {/* 主题切换 */}
          <button onClick={toggle} className="theme-toggle" aria-label="切换主题">
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          {/* 用户信息 */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)]" />
          ) : user ? (
            <a href="/user" className="flex items-center gap-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm">
                  {user.username[0]}
                </div>
              )}
            </a>
          ) : (
            <a href={`${process.env.NEXT_PUBLIC_MINDAUTH_URL}/#/login`} className="btn btn-secondary btn-sm">
              登录
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
```

### 2.3 论坛申请服务器页面

**Why:** 用户无需跳转到 EasyManager 即可申请服务器

**How to apply:** 创建 `/apply-server` 路由，表单提交到 EasyManager API

```tsx
// MindFourm/frontend/src/app/(auth)/apply-server/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { serverAPI } from '@/lib/api/server';
import { useAuth } from '@/hooks/useAuth';

export default function ApplyServerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    version: 'v146',
    description: '',
    linked_post_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('请先登录');
      return;
    }
    setLoading(true);
    setError('');

    const result = await serverAPI.applyServer({
      ...form,
      owner_id: user.id,
    });

    if (result.success) {
      router.push(`/servers?highlight=${result.data.id}`);
    } else {
      setError(result.message || '申请失败');
    }
    setLoading(false);
  };

  return (
    <div className="container py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">申请服务器</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">服务器名称</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="我的 Mindustry 服务器"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">服务器版本</label>
          <select
            value={form.version}
            onChange={e => setForm({ ...form, version: e.target.value })}
            className="input"
          >
            <option value="v146">v146 (最新)</option>
            <option value="v145">v145</option>
            <option value="v144">v144</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">服务器描述</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input min-h-[100px]"
            placeholder="描述你的服务器用途..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">关联帖子（可选）</label>
          <input
            type="text"
            value={form.linked_post_id}
            onChange={e => setForm({ ...form, linked_post_id: e.target.value })}
            className="input"
            placeholder="帖子 ID，用于说明服务器用途"
          />
        </div>

        {error && <div className="text-[var(--error)] text-sm">{error}</div>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? '提交中...' : '提交申请'}
        </button>

        <p className="text-sm text-[var(--text-muted)]">
          申请提交后需等待管理员审批。审批通过后会自动在论坛发布公告。
        </p>
      </form>
    </div>
  );
}
```

### 2.4 申请审批后自动发帖

**Why:** 让社区用户知道新服务器上线

**How to apply:** EasyManager 审批通过后调用 MindFourm API 创建帖子

```javascript
// EasyManager/backend/src/routes/admin.js (在审批逻辑中添加)

async function approveServer(serverId) {
  // 更新服务器状态
  await db.run('UPDATE servers SET status = ?, approval_status = ? WHERE id = ?', 
    ['approved', 'approved', serverId]);
  
  const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
  
  // 回调论坛创建帖子
  await fetch(`${MINDFOURM_URL}/api/v1/posts/auto-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'server_approved',
      server_id: server.id,
      server_name: server.name,
      server_port: server.port,
      owner_id: server.owner_id,
      owner_name: server.owner_name,
    }),
  });
}
```

```javascript
// MindFourm/backend/src/routes/v1/posts.js (新增自动创建路由)

router.post('/auto-create', async ctx => {
  const { type, server_id, server_name, server_port, owner_id, owner_name } = ctx.request.body;
  
  if (type === 'server_approved') {
    // 查找或创建 'servers' 分类
    const category = await db.get('SELECT id FROM categories WHERE slug = ?', ['servers']);
    
    const result = await db.run(
      `INSERT INTO posts (user_id, category_id, title, content, content_html, status, server_id, post_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_id,
        category?.id || 1,
        `【服务器公告】${server_name} 已上线`,
        `用户 ${owner_name} 的服务器已通过审批。\n\n服务器地址：${process.env.EASYMANAGER_HOST}:${server_port}\n版本：待补充`,
        `<p>用户 ${owner_name} 的服务器已通过审批。</p><p>服务器地址：<code>${process.env.EASYMANAGER_HOST}:${server_port}</code></p>`,
        'published',
        server_id,
        'server_announcement',
      ]
    );
    
    Response.success(ctx, { post_id: result.lastID });
  }
});
```

---

## Phase 3: 统一登录状态 + 帖子关联服务器

### 3.1 统一登录状态

**Why:** 用户登录一次即可访问所有系统

**How to apply:** 使用共享 cookie 名称，MindAuth 设置跨域 cookie

**方案：**

1. MindAuth 登录成功后设置 `mind_session` cookie
2. Cookie 属性：
   - `domain`: `.mindproject.local`（或实际生产域名）
   - `path`: `/`
   - `httpOnly`: true
   - `sameSite`: 'lax'

3. MindFourm 和 EasyManager 都读取 `mind_session` cookie
4. 验证流程不变：调用 MindAuth `/api/oauth/verify`

```javascript
// MindAuth 设置 cookie (假设使用 Express)

res.cookie('mind_session', sessionToken, {
  domain: '.mindproject.local',
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

```javascript
// MindFourm 后端读取 mind_session

// src/middleware/auth.js
const sessionToken = ctx.cookies.get('mind_session') || ctx.cookies.get('forum_session');
// 兼容旧 cookie，逐步迁移
```

### 3.2 帖子关联服务器

**Why:** 用户发帖时可关联自己的服务器，方便问题求助和服务器介绍

**How to apply:** 数据库扩展 + 发帖界面增强 + API 扩展

**数据库扩展：**

```sql
-- MindFourm/backend/src/database/schema.sql 新增

-- posts 表新增字段
ALTER TABLE posts ADD COLUMN server_id INTEGER NULL REFERENCES servers(id);
ALTER TABLE posts ADD COLUMN post_type VARCHAR(20) DEFAULT 'normal';

-- post_type 可选值：
-- 'normal': 普通帖子
-- 'server_announcement': 服务器公告（系统自动创建）
-- 'server_help': 服务器问题求助
-- 'server_intro': 服务器介绍
```

**发帖界面增强：**

```tsx
// MindFourm/frontend/src/app/(auth)/posts/new/page.tsx

// 新增服务器关联选项
<div className="form-group">
  <label>关联服务器（可选）</label>
  {userServers.length > 0 ? (
    <select name="server_id" className="input">
      <option value="">不关联</option>
      {userServers.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  ) : (
    <p className="text-sm text-[var(--text-muted)]">
      您还没有服务器，<a href="/apply-server">申请一个</a>
    </p>
  )}
</div>

<div className="form-group">
  <label>帖子类型</label>
  <select name="post_type" className="input">
    <option value="normal">普通帖子</option>
    <option value="server_help">服务器求助</option>
    <option value="server_intro">服务器介绍</option>
  </select>
</div>
```

**服务器详情页显示关联帖子：**

```tsx
// EasyManager/frontend/components/Server/RelatedPosts.jsx

'use client';

import { useState, useEffect } from 'react';
import { forumAPI } from '../../lib/api/forum';

export function RelatedPosts({ serverId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    forumAPI.getPostsByServer(serverId).then(res => {
      if (res.success) setPosts(res.data);
      setLoading(false);
    });
  }, [serverId]);

  if (loading) return <div className="text-sm text-[var(--text-muted)]">加载中...</div>;
  if (posts.length === 0) return null;

  const forumUrl = process.env.NEXT_PUBLIC_MINDFOURM_URL || 'http://localhost:3000';

  return (
    <div className="server-related-posts mt-4">
      <h3 className="text-sm font-semibold mb-2">相关帖子 ({posts.length})</h3>
      <div className="space-y-2">
        {posts.map(post => (
          <a
            key={post.id}
            href={`${forumUrl}/posts/${post.id}`}
            className="block p-2 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)]"
          >
            <div className="flex items-center gap-2">
              <span className={`badge ${
                post.post_type === 'server_announcement' ? 'badge-primary' :
                post.post_type === 'server_help' ? 'badge-warning' :
                'badge'
              }`}>
                {post.post_type === 'server_announcement' ? '公告' :
                 post.post_type === 'server_help' ? '求助' : '帖子'}
              </span>
              <span className="text-sm text-[var(--text)]">{post.title}</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {post.author_name} · {formatDate(post.created_at)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

### 3.3 API 扩展

```
MindFourm 新增/修改:
GET  /api/v1/posts?server_id=:id       # 查询关联服务器的帖子
GET  /api/v1/posts?post_type=:type     # 按帖子类型筛选
POST /api/v1/posts                     # 接收 server_id, post_type 字段
POST /api/v1/posts/auto-create         # EasyManager 回调创建帖子

EasyManager 新增:
GET  /api/forum/posts/by-server/:id    # 代理查询论坛帖子
```

---

## 系统交互图

```
┌──────────────────────────────────────────────────────────────────────┐
│                            用户浏览器                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│   │    MindFourm    │    │  EasyManager    │    │    MindAuth     │ │
│   │   (port 3000)   │    │   (port 3001)   │    │   (port 4001)   │ │
│   │                 │    │                 │    │                 │ │
│   │  ┌───────────┐  │    │  ┌───────────┐  │    │  登录/用户中心  │ │
│   │  │UnifiedHdr │◀─│────│─▶│UnifiedHdr │  │    │                 │ │
│   │  │(shared)   │  │    │  │(shared)   │  │    │                 │ │
│   │  └───────────┘  │    │  └───────────┘  │    │                 │ │
│   │                 │    │                 │    │                 │ │
│   │  首页服务器区域 │    │  服务器详情     │    │                 │ │
│   │  /servers 页面  │    │  关联帖子显示   │    │                 │ │
│   │  /apply-server  │    │                 │    │                 │ │
│   │  发帖关联服务器 │    │                 │    │                 │ │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                      │                      │           │
│           │ mind_session cookie   │ mind_session cookie   │           │
└───────────│──────────────────────│──────────────────────│───────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MindFourm     │    │  EasyManager    │    │    MindAuth     │
│   Backend       │    │   Backend       │    │   Backend       │
│   (port 4000)   │    │   (port 5001)   │    │   (OAuth API)   │
│                 │    │                 │    │                 │
│ /api/v1/posts   │    │ /api/servers    │    │ /api/oauth/     │
│ /api/v1/servers │◀───│─▶/api/forum/*   │───▶│   verify        │
│ (代理 EM API)   │    │                 │    │                 │
│                 │    │                 │    │                 │
│ 新增:           │    │ 新增:           │    │ 设置跨域 cookie │
│ POST /auto-create◀───│审批回调         │    │ mind_session    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 文件清单

### Phase 1 创建/修改文件

| 项目 | 文件 | 操作 |
|------|------|------|
| shared-styles | components.css | 修改：添加服务器组件样式 |
| MindFourm | src/routes/v1/servers.js | 创建：服务器路由 |
| MindFourm | src/services/server-proxy.js | 创建：EasyManager API 代理 |
| MindFourm | frontend/src/lib/api/server.ts | 创建：API 客户端 |
| MindFourm | frontend/src/components/forum/server-section.tsx | 创建：首页服务器区域 |
| MindFourm | frontend/src/app/(public)/servers/page.tsx | 创建：服务器列表页 |
| MindFourm | frontend/src/app/page.tsx | 修改：集成 ServerSection |
| EasyManager | src/routes/forum.js | 检查：确保返回 owner_name |

### Phase 2 创建/修改文件

| 项目 | 文件 | 操作 |
|------|------|------|
| shared | package.json | 创建 |
| shared | src/components/UnifiedHeader/index.tsx | 创建 |
| shared | src/hooks/useAuth.ts | 创建 |
| shared | src/hooks/useTheme.ts | 创建 |
| shared | src/api/easymanager.ts | 创建 |
| MindFourm | frontend/src/app/(auth)/apply-server/page.tsx | 创建 |
| MindFourm | frontend/src/components/forum/header.tsx | 修改：改用 UnifiedHeader |
| MindFourm | src/routes/v1/posts.js | 修改：添加 auto-create 路由 |
| EasyManager | frontend/components/Layout/Header.jsx | 修改：改用 UnifiedHeader |
| EasyManager | src/routes/admin.js | 修改：审批回调论坛 |

### Phase 3 创建/修改文件

| 项目 | 文件 | 操作 |
|------|------|------|
| MindFourm | src/database/schema.sql | 修改：添加 server_id, post_type |
| MindFourm | frontend/src/app/(auth)/posts/new/page.tsx | 修改：添加服务器关联选项 |
| MindFourm | src/routes/v1/posts.js | 修改：处理 server_id 查询 |
| EasyManager | frontend/components/Server/RelatedPosts.jsx | 创建 |
| EasyManager | src/routes/forum.js | 修改：添加帖子查询代理 |
| MindAuth | 登录回调逻辑 | 修改：设置跨域 cookie |

---

## How to apply

- Phase 1-3 按顺序实施，每个 Phase 完成后测试验证
- 共享包 `@mindproject/shared` 在 Phase 2 开始创建
- 各项目保持独立部署，通过环境变量配置跨系统 URL
- MindAuth 跨域 cookie 需要域名配置支持（本地开发可用 localhost）

---

## 环境变量配置

```bash
# MindFourm Backend .env
EASYMANAGER_URL=http://localhost:5001

# MindFourm Frontend .env.local
NEXT_PUBLIC_EASYMANAGER_URL=http://localhost:5001
NEXT_PUBLIC_EASYMANAGER_HOST=localhost

# EasyManager Backend .env
MINDFOURM_URL=http://localhost:4000

# EasyManager Frontend .env.local
NEXT_PUBLIC_MINDFOURM_URL=http://localhost:3000

# MindAuth（设置跨域 cookie）
COOKIE_DOMAIN=.mindproject.local
```