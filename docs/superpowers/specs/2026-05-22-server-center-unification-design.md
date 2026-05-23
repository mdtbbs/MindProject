---
name: server-center-unification
description: Unify server application list, my servers, and public server list into a single forum page at /servers with sidebar navigation
metadata:
  type: project
---

# Server Center Unification Design

## Purpose

Replace the standalone `public/servers.html` and fragmented `/servers`, `/servers/apply`, `/apply-server` routes with a single unified "Server Center" page at `/servers`.

## Problem

- `public/servers.html` is a standalone HTML file outside the React SPA, inconsistent with the rest of the forum UI
- Server functionality is split across three routes: `/servers` (public list), `/servers/apply` (application form), `/apply-server` (duplicate application form)
- User must navigate between multiple pages to manage servers

## Solution

A single `/servers` page with sidebar navigation and three sections:

### Route Structure

| Route | Behavior |
|-------|----------|
| `/servers` | Server center landing (defaults to "我的服务器" for logged-in, "公开服务器" for anonymous) |
| `/servers?section=my` | My servers list |
| `/servers?section=apply` | Server application form |
| `/servers?section=public` | Public server grid |
| `/servers/apply` | 301 redirect → `/servers?section=apply` (backward compat) |
| `/apply-server` | 301 redirect → `/servers?section=apply` (cleanup) |
| `public/servers.html` | Deleted |

### Layout

```
┌──────────────────────────────────────────────────┐
│                   Header (existing)               │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌───────────┐   ┌──────────────────────────┐     │
│ │ Sidebar   │   │ Main Content             │     │
│ │ w-64      │   │ Dynamic section view     │     │
│ │           │   │                          │     │
│ │ ● 我的    │   │ - Section title          │     │
│ │   服务器  │   │ - Section content        │     │
│ │           │   │                          │     │
│ │ ○ 申请    │   │                          │     │
│ │   服务器  │   │                          │     │
│ │           │   │                          │     │
│ │ ○ 公开    │   │                          │     │
│ │   服务器  │   │                          │     │
│ └───────────┘   └──────────────────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Sections

#### 1. 我的服务器 (`?section=my`)

- Requires authentication. Shows lock icon + login prompt for anonymous users.
- Fetches `GET /api/servers/my` via `serverApi.getUserServers()`.
- Displays table of user's servers: name, version, port, approval_status badge, created_at.
- Status badges: pending (黄色), approved (绿色), rejected (红色), running (蓝色).
- Empty state: "暂无服务器" with link to apply section.

#### 2. 申请服务器 (`?section=apply`)

- Requires authentication. Shows lock icon for anonymous users.
- Reuses existing form logic from `servers/apply/page.tsx`: name, description, version select, template select.
- POST to `POST /api/servers/apply` via `serverApi.applyServer()`.
- On success: show success toast, refresh "我的服务器" section.

#### 3. 公开服务器 (`?section=public`)

- No authentication required.
- Fetches `GET /api/servers/public` via `serverApi.getPublicServers()`.
- Grid of ServerCard components (reuse from `server-section.tsx`).
- "申请服务器" button in header area.

### Access Control

- Anonymous users: sidebar items "我的服务器" and "申请服务器" show a lock icon (🔒). Clicking redirects to login flow.
- Public servers always accessible.
- Auth check uses existing `useAuth()` context.

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `ServerCenter` | `app/(public)/servers/page.tsx` | Main page: SSR shell wrapper + client component for section switching |
| `ServerSidebar` | `components/forum/server-sidebar.tsx` | Sidebar nav with section links |
| `MyServersList` | `components/forum/my-servers-list.tsx` | User's server table |
| `ServerApplyForm` | `components/forum/server-apply-form.tsx` | Application form (extracted from existing page) |
| `PublicServerGrid` | `components/forum/public-server-grid.tsx` | Public server grid |
| `ServerStatusBadge` | `components/ui/server-status-badge.tsx` | Reusable status badge |

### Styling

- Consistent with existing forum design system (CSS variables from `shared-styles`).
- Sidebar: `w-64`, same visual style as forum `Sidebar` component.
- Server cards: reuse existing `.server-card` CSS classes.

### Data Flow

```
User → /servers → ServerCenter (client component)
  ├─ reads ?section= from URL
  ├─ ServerSidebar renders nav with active state
  ├─ Main content switches section component
  ├─ MyServersList → serverApi.getUserServers() → GET /api/servers/my
  ├─ ServerApplyForm → serverApi.applyServer() → POST /api/servers/apply
  └─ PublicServerGrid → serverApi.getPublicServers() → GET /api/servers/public
```

### Error Handling

- API failures: show error banner with retry button.
- No servers: show empty state with contextual CTA.
- Auth failures: redirect to login (existing OAuth flow).
- Rate limiting: existing server-side rate limits on `/api/servers/apply`.
