# 服务器中心统一化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace standalone `servers.html` and fragmented server routes with a single `/servers` Server Center page featuring sidebar navigation.

**Architecture:** Single client-side page at `/servers` with URL-query-driven section switching (`?section=my|apply|public`). Sidebar provides navigation. Three section components rendered conditionally. Old routes redirect to new page.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, existing `serverApi` client, `useAuth` context.

---

### File Map

| File | Action | Purpose |
|------|--------|---------|
| `MindFourm/frontend/src/types/index.ts` | Modify | Add `approval_status` to Server interface |
| `MindFourm/frontend/src/components/ui/server-status-badge.tsx` | Create | Reusable approval status badge component |
| `MindFourm/frontend/src/components/forum/server-sidebar.tsx` | Create | Server center sidebar navigation |
| `MindFourm/frontend/src/components/forum/my-servers-list.tsx` | Create | User's server list table |
| `MindFourm/frontend/src/components/forum/server-apply-form.tsx` | Create | Server application form (extracted from existing page) |
| `MindFourm/frontend/src/components/forum/public-server-grid.tsx` | Create | Public server grid with header |
| `MindFourm/frontend/src/app/(public)/servers/page.tsx` | Rewrite | Server center main page (client shell) |
| `MindFourm/frontend/src/app/(public)/servers/loading.tsx` | Create | Loading state for /servers |
| `MindFourm/frontend/src/app/(auth)/servers/apply/page.tsx` | Rewrite | Redirect to `/servers?section=apply` |
| `MindFourm/frontend/src/app/(auth)/apply-server/page.tsx` | Rewrite | Redirect to `/servers?section=apply` |
| `MindFourm/public/servers.html` | Delete | Remove standalone HTML |

---

### Task 0: Add `approval_status` to Server Type

**Files:**
- Modify: `MindFourm/frontend/src/types/index.ts:309-322`

- [ ] **Step 1: Add approval_status field to Server interface**

In `MindFourm/frontend/src/types/index.ts`, find the Server interface and add `approval_status`:

```typescript
// Servers (EasyManager integration)
export interface Server {
  id: number;
  name: string;
  description: string | null;
  port: number;
  version: string;
  status: string;
  approval_status?: string;  // pending | approved | rejected
  owner_id: number;
  players: number;
  playerList: { name: string; id: number; team: number }[];
  mapName: string;
  wave: number;
  created_at: string;
}
```

The EasyManager `/user/:id/servers` endpoint returns both `status` (runtime: running/stopped) and `approval_status` (pending/approved/rejected). The frontend type was missing `approval_status`.

- [ ] **Step 2: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "types"`
Expected: No errors.

---

### Task 1: ServerStatusBadge Component

**Files:**
- Create: `MindFourm/frontend/src/components/ui/server-status-badge.tsx`

- [ ] **Step 1: Write ServerStatusBadge component**

```tsx
// MindFourm/frontend/src/components/ui/server-status-badge.tsx
'use client';

interface ServerStatusBadgeProps {
  status: string;
  label?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'server-status-pending' },
  approved: { label: '已批准', className: 'server-status-running' },
  rejected: { label: '已拒绝', className: 'server-status-rejected' },
  running: { label: '运行中', className: 'server-status-running' },
  stopped: { label: '已停止', className: 'server-status-stopped' },
};

export default function ServerStatusBadge({ status, label }: ServerStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'server-status-stopped' };
  return (
    <span className={`server-status ${config.className}`}>
      {label || config.label}
    </span>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "server-status-badge"`
Expected: No errors.

---

### Task 2: ServerSidebar Component

**Files:**
- Create: `MindFourm/frontend/src/components/forum/server-sidebar.tsx`

- [ ] **Step 1: Write ServerSidebar component**

```tsx
// MindFourm/frontend/src/components/forum/server-sidebar.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Server, Plus, Globe, Lock } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
}

const navItems: NavItem[] = [
  { key: 'my', label: '我的服务器', icon: <Server className="w-4 h-4" />, requiresAuth: true },
  { key: 'apply', label: '申请服务器', icon: <Plus className="w-4 h-4" />, requiresAuth: true },
  { key: 'public', label: '公开服务器', icon: <Globe className="w-4 h-4" />, requiresAuth: false },
];

export default function ServerSidebar() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || (isAuthenticated ? 'my' : 'public');

  return (
    <aside className="w-64 shrink-0">
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] p-4 sticky top-20">
        <h3 className="font-semibold text-[var(--text)] mb-3">服务器管理</h3>
        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive = currentSection === item.key;
            const isLocked = item.requiresAuth && !isAuthenticated;

            if (isLocked) {
              return (
                <Link
                  key={item.key}
                  href="/login"
                  className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  <Lock className="w-3.5 h-3.5" />
                </Link>
              );
            }

            return (
              <Link
                key={item.key}
                href={`/servers?section=${item.key}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "server-sidebar"`
Expected: No errors.

---

### Task 3: MyServersList Component

**Files:**
- Create: `MindFourm/frontend/src/components/forum/my-servers-list.tsx`

- [ ] **Step 1: Write MyServersList component**

```tsx
// MindFourm/frontend/src/components/forum/my-servers-list.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { serverApi } from '@/lib/api/client';
import { Server } from '@/types';
import ServerStatusBadge from '@/components/ui/server-status-badge';
import { Loader2, Server as ServerIcon, Plus } from 'lucide-react';

export default function MyServersList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServers = () => {
    setLoading(true);
    setError(null);
    serverApi.getUserServers()
      .then(res => {
        setServers(res.servers || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadServers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-[var(--text-secondary)]">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--error)] mb-3">{error}</p>
        <button
          onClick={loadServers}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-[var(--radius)] hover:bg-[var(--primary-dark)]"
        >
          重试
        </button>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)]">
        <ServerIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
        <p className="text-[var(--text-secondary)] mb-4">暂无服务器</p>
        <Link
          href="/servers?section=apply"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          申请服务器
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">名称</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">版本</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">端口</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">状态</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">创建时间</th>
          </tr>
        </thead>
        <tbody>
          {servers.map(server => (
            <tr key={server.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]">
              <td className="px-4 py-3 font-medium text-[var(--text)]">{server.name}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">v{server.version}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)] font-mono">{server.port}</td>
              <td className="px-4 py-3">
                <ServerStatusBadge
                  status={server.approval_status || server.status}
                />
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">
                {new Date(server.created_at).toLocaleDateString('zh-CN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Key design decision: The status badge uses `server.approval_status` first (pending/approved/rejected) and falls back to `server.status` (running/stopped). This ensures pending servers show "待审批" even though their runtime status might not be set yet.

- [ ] **Step 2: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "my-servers-list"`
Expected: No errors.

---

### Task 4: ServerApplyForm Component

**Files:**
- Create: `MindFourm/frontend/src/components/forum/server-apply-form.tsx`

- [ ] **Step 1: Write ServerApplyForm component**

```tsx
// MindFourm/frontend/src/components/forum/server-apply-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { serverApi } from '@/lib/api/client';
import { ServerVersion, ServerTemplate } from '@/types';
import { Send, Loader2 } from 'lucide-react';

interface ServerApplyFormProps {
  onSuccess?: () => void;
}

export default function ServerApplyForm({ onSuccess }: ServerApplyFormProps) {
  const [versions, setVersions] = useState<ServerVersion[]>([]);
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    version: 'v146',
    template_id: 0
  });

  useEffect(() => {
    serverApi.getVersions().then(res => setVersions(res.versions || [])).catch(() => {});
    serverApi.getTemplates().then(res => setTemplates(res.templates || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await serverApi.applyServer({
        name: form.name,
        description: form.description || undefined,
        version: form.version,
        template_id: form.template_id || undefined
      });

      if (result.server_id) {
        setSuccess(`服务器申请已提交（ID: ${result.server_id}），等待管理员审批`);
        setForm({ name: '', description: '', version: 'v146', template_id: 0 });
        onSuccess?.();
      } else {
        setError(result.message || '申请失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '申请失败');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] p-6">
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-[var(--radius)] text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-[var(--radius)] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            服务器名称 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="我的服务器"
            required
            minLength={2}
            maxLength={50}
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            描述
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="服务器简介..."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            版本 *
          </label>
          <select
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            required
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            {versions.length === 0 ? (
              <option value="v146">v146 (正式版)</option>
            ) : (
              versions.map(v => (
                <option key={v.version} value={v.version}>
                  {v.version} {v.is_stable ? '(稳定版)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            模板（可选）
          </label>
          <select
            value={form.template_id}
            onChange={(e) => setForm({ ...form, template_id: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="0">无模板</option>
            {templates.filter(t => t.is_public).map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.version})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !form.name || !form.version}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            提交申请
          </button>
        </div>
      </form>

      <div className="mt-4 text-sm text-[var(--text-muted)]">
        <p className="mb-1">申请说明：</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>每个用户默认最多可申请 2 个服务器</li>
          <li>申请提交后需管理员审批</li>
          <li>审批通过后可在 EasyManager 管理面板操作服务器</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "server-apply-form"`
Expected: No errors.

---

### Task 5: PublicServerGrid Component

**Files:**
- Create: `MindFourm/frontend/src/components/forum/public-server-grid.tsx`

- [ ] **Step 1: Write PublicServerGrid component**

```tsx
// MindFourm/frontend/src/components/forum/public-server-grid.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { serverApi } from '@/lib/api/client';
import { Server } from '@/types';
import { Server as ServerIcon, Users, MapPin, Waves, Loader2 } from 'lucide-react';

export default function PublicServerGrid() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    serverApi.getPublicServers()
      .then(res => {
        setServers(res.servers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-[var(--text-secondary)]">加载服务器...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--error)] mb-3">加载失败</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-[var(--radius)]"
        >
          刷新
        </button>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)]">
        <ServerIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
        <p className="text-[var(--text-muted)]">暂无在线服务器</p>
      </div>
    );
  }

  return (
    <div>
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

      {/* Info section */}
      <div className="mt-8 bg-[var(--bg-elevated)] rounded-[var(--radius)] p-4 text-sm text-[var(--text-secondary)]">
        <p className="mb-2">
          <strong className="text-[var(--text)]">连接方式:</strong> 在 Mindustry 游戏中使用 <code className="bg-[var(--bg)] px-1 rounded-[var(--radius-sm)]">IP:端口</code> 连接
        </p>
        <p>
          <strong className="text-[var(--text)]">申请服务器:</strong> 登录后可申请创建自己的游戏服务器，经管理员审批后即可使用
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "public-server-grid"`
Expected: No errors.

---

### Task 6: Rewrite /servers Main Page

**Files:**
- Rewrite: `MindFourm/frontend/src/app/(public)/servers/page.tsx`
- Create: `MindFourm/frontend/src/app/(public)/servers/loading.tsx`

- [ ] **Step 1: Create loading.tsx**

```tsx
// MindFourm/frontend/src/app/(public)/servers/loading.tsx
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite page.tsx as ServerCenter**

Replace the entire contents of `MindFourm/frontend/src/app/(public)/servers/page.tsx`:

```tsx
// MindFourm/frontend/src/app/(public)/servers/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import ServerSidebar from '@/components/forum/server-sidebar';
import MyServersList from '@/components/forum/my-servers-list';
import ServerApplyForm from '@/components/forum/server-apply-form';
import PublicServerGrid from '@/components/forum/public-server-grid';
import { Lock, Server as ServerIcon } from 'lucide-react';

function AuthRequiredSection() {
  return (
    <div className="text-center py-16 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)]">
      <Lock className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
      <p className="text-[var(--text-secondary)] mb-4">请先登录后查看此内容</p>
      <a
        href="/login"
        className="inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
      >
        登录
      </a>
    </div>
  );
}

function SectionContent({ section, isAuthenticated }: { section: string; isAuthenticated: boolean }) {
  switch (section) {
    case 'my':
      return isAuthenticated ? <MyServersList /> : <AuthRequiredSection />;
    case 'apply':
      return isAuthenticated ? <ServerApplyForm /> : <AuthRequiredSection />;
    case 'public':
      return <PublicServerGrid />;
    default:
      return isAuthenticated ? <MyServersList /> : <PublicServerGrid />;
  }
}

export default function ServersPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const section = searchParams.get('section') || '';

  const currentSection = section || (isAuthenticated ? 'my' : 'public');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <ServerSidebar />
        <div className="flex-1 min-w-0">
          <SectionContent section={currentSection} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </div>
  );
}
```

Note: The page is `'use client'` — it uses `useSearchParams()` and `useAuth()`. This replaces the previous SSR page. The `(public)` layout still wraps it with Header/Footer.

- [ ] **Step 3: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "servers/page"`
Expected: No errors.

---

### Task 7: Redirect Old Routes

**Files:**
- Rewrite: `MindFourm/frontend/src/app/(auth)/servers/apply/page.tsx`
- Rewrite: `MindFourm/frontend/src/app/(auth)/apply-server/page.tsx`

- [ ] **Step 1: Rewrite /servers/apply to redirect**

Replace entire contents of `MindFourm/frontend/src/app/(auth)/servers/apply/page.tsx`:

```tsx
// MindFourm/frontend/src/app/(auth)/servers/apply/page.tsx
import { redirect } from 'next/navigation';

export default function ApplyServerRedirect() {
  redirect('/servers?section=apply');
}
```

- [ ] **Step 2: Rewrite /apply-server to redirect**

Replace entire contents of `MindFourm/frontend/src/app/(auth)/apply-server/page.tsx`:

```tsx
// MindFourm/frontend/src/app/(auth)/apply-server/page.tsx
import { redirect } from 'next/navigation';

export default function ApplyServerAltRedirect() {
  redirect('/servers?section=apply');
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty`
Expected: No errors.

---

### Task 8: Delete servers.html

**Files:**
- Delete: `MindFourm/public/servers.html`

- [ ] **Step 1: Delete the standalone HTML file**

Run: `Remove-Item "G:\MindProject\MindFourm\public\servers.html"`

- [ ] **Step 2: Verify file is deleted**

Run: `Test-Path "G:\MindProject\MindFourm\public\servers.html"`
Expected: `False`

---

### Task 9: Full Build & Smoke Test

- [ ] **Step 1: Build frontend**

Run: `cd MindFourm/frontend && npm run build`
Expected: Build succeeds with no errors. Warnings are acceptable.

- [ ] **Step 2: Smoke test**

Start services (MindAuth, MindFourm backend, MindFourm frontend) and verify:
- `http://localhost:3000/servers` → Server center, default section based on auth status
- `http://localhost:3000/servers?section=my` → My servers (or login prompt)
- `http://localhost:3000/servers?section=apply` → Application form (or login prompt)
- `http://localhost:3000/servers?section=public` → Public server grid
- `http://localhost:3000/servers/apply` → Redirects to `/servers?section=apply`
- `http://localhost:3000/apply-server` → Redirects to `/servers?section=apply`

---

## Self-Review

### 1. Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| `/servers` → three-section server center | Task 6 |
| `/servers?section=my\|apply\|public` | Task 6 |
| `/servers/apply` → redirect | Task 7 |
| `/apply-server` → redirect | Task 7 |
| `public/servers.html` deleted | Task 8 |
| Sidebar navigation with auth locks | Task 2 |
| My servers list with status badges | Task 3 |
| Server apply form | Task 4 |
| Public server grid | Task 5 |
| ServerStatusBadge reusable component | Task 1 |
| Anonymous users see lock on auth sections | Task 2, Task 6 |
| Error handling (retry, empty states) | Tasks 3, 5 |
| Styling matches existing design system | All tasks use `var(--*)` CSS vars |
| Loading state | Task 6 (loading.tsx) |
| `approval_status` field for my servers | Task 0 |

All requirements covered.

### 2. Placeholder Scan

No "TBD", "TODO", or vague placeholders. All code steps contain full implementations.

### 3. Type Consistency

- `Server` interface now has `approval_status?: string` (Task 0).
- `serverApi` methods match existing signatures.
- `useAuth()` returns `{ isAuthenticated }` — matches context.
- `ServerStatusBadge` handles both `approval_status` and `status` values.

### 4. Ambiguity Check

Resolved: `status` vs `approval_status` — MyServersList uses `server.approval_status || server.status` for the badge. Public servers only show `status` (they're all approved+running). This is correct per the EasyManager forum.js routes.
