# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindProject is a monorepo containing a Mindustry community platform with four integrated services:

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **MindAuth** | 4001 | OAuth 2.0 SSO authentication service | ✅ Active |
| **MindFourm** | 4000 (API) / 3000 (Frontend) | Forum system | ✅ Active |
| **EasyManager** | 5001 (API) / 5002 (WS) / 3001 (Frontend) | Mindustry server hosting manager | ⏸ Paused (code preserved) |
| **MindFileList** | 3000 | File hosting & download service (external repo: `download-site`) | ✅ Active |

> **Note:** EasyManager is currently paused. Its code is preserved in `EasyManager/` but is not started or deployed. MindFourm's server features are disabled by default via `feature_servers_enabled` setting and `EASYMANAGER_ENABLED=false` backend config. See [Restoring EasyManager](#restoring-easymanager) at the bottom.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              User Browser                                  │
└──────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MindFourm  │     │   MindAuth  │     │ EasyManager │     │   Shared    │
│  (Forum)    │────▶│  (OAuth)    │     │  (Paused)   │     │ (Components)│
│  Port 3000  │     │  Port 4001  │     │  Preserved  │     │  Port N/A   │
│  Port 4000  │     │             │     │  Code Only  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
        │                   │                                     │
        └───────────────────┘                                     │
                             │                                     │
                    ┌────────┴────────┐                           │
                    │  shared-styles  │◀──────────────────────────┘
                    │  (CSS Design)   │
                    └─────────────────┘
```

### Integration Flow
1. MindFourm uses MindAuth for OAuth SSO login
2. MindFourm uploads resource files to MindFileList; MFL manages file storage and enforces download restrictions based on moderation status
3. EasyManager server listings/applications/callbacks are ⏸ paused; related code is preserved and disabled by default (`EASYMANAGER_ENABLED=false`, `feature_servers_enabled=false`)

## Commands

### Development (All Services)
```bash
# MindAuth (OAuth Service)
cd MindAuth && npm run dev        # Port 4001

# MindFourm (Forum)
cd MindFourm && npm run dev       # Port 4000 (API)
cd MindFourm/frontend && npm run dev  # Port 3000 (Frontend)

# EasyManager (Server Manager) — ⏸ PAUSED
# cd EasyManager/backend && npm run dev  # Port 5001 (API)
# cd EasyManager/frontend && npm run dev # Port 3001 (Frontend)

# MindFileList (File Hosting)
cd ../download-site && node src/app.js  # Port 3000

# Shared package build
cd shared && npm run build        # Build TypeScript to dist/
```

### E2E Tests
```bash
cd MindAuth && npx playwright test               # MindAuth tests
cd MindFourm && npx playwright test              # MindFourm tests
```

### Documentation Sync
```bash
npm run docs:check    # Detect staged changes
npm run docs:confirm  # AI analysis for updates
npm run docs:apply    # Apply documentation updates
npm run docs:status   # Check pending updates
```

## Shared Packages

### `shared/` - TypeScript React Components

**Components** (11 total):
| Component | Description |
|-----------|-------------|
| `UnifiedHeader` | Navigation header with search, notifications, theme toggle |
| `AdminSidebar` | Admin panel sidebar with collapse mode and groups support |
| `LoginLayout` | Split login layout with brand animation |
| `UserCard` | User profile card with medal/title display |
| `ServerCard` | Server info card with status/players/latency |
| `StatsGrid` | Statistics grid (2-5 columns, normal/compact) |
| `ActivityChart` | 24-hour activity bar chart |
| `Tabs` | Tab navigation (underline/pill styles) |
| `DataTable` | Generic data table with custom columns |
| `Medal` | User medal badge (Lv1-4 with pulse animation) |
| `Title` | User title badge (active/core/mod/admin/contributor) |

**Hooks**:
- `useTheme` - Theme context with light/dark toggle and transition animation

**Types** (`src/types/`):
- `user.ts` - User, UserRole, UserQuota, UserProfile, UserMedal, UserTitle
- `server.ts` - Server, ServerStatusType, ServerStats, ServerTemplate
- `post.ts` - Post, Reply, Category, Tag, Bookmark
- `notification.ts` - Notification, NotificationType
- `api.ts` - ApiResponse, PaginatedResponse, ApiError

**Utils**:
- `cn` - Tailwind class merge utility (clsx + tailwind-merge)

Build: `npm run build` → outputs to `dist/`

### `shared-styles/` - CSS Design System

**Variables** (`variables.css`):
| Category | Variables |
|----------|-----------|
| Brand | `--primary: #ff6b35`, `--accent: #ffc107` |
| Light Theme | `--bg: #fafafa`, `--bg-card: #ffffff`, `--text: #333333` |
| Dark Theme | `[data-theme="dark"]` overrides |
| Status | `--success`, `--warning`, `--error`, `--info` |
| Layout | `--header-height: 56px`, `--sidebar-width: 200px` |
| Medal | `--badge-lv1` to `--badge-lv4` gradients |
| Title | `--title-active`, `--title-core`, `--title-mod` |

**Components** (`components.css`): 50+ component classes including:
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- Cards: `.card`, `.card-lg`, `.server-card`, `.user-card`
- Forms: `.input`, `.input-error`, `.badge`
- Navigation: `.header`, `.admin-sidebar`, `.tabs`
- Feedback: `.toast`, `.toast-success`, `.toast-error`
- Data: `.data-table`, `.stats-grid`, `.activity-chart`

**Utilities** (`utilities.css`):
- Layout: `.flex`, `.flex-col`, `.items-center`, `.justify-between`
- Spacing: `.gap-1/2/3/4`, `.p-2/3/4`, `.m-0`, `.mt-2/4`
- Typography: `.text-primary/secondary/muted`, `.font-medium/semibold/bold`
- Responsive: `.hidden-mobile`, `.hidden-desktop`

## Database Architecture

| Service | Database | Tables |
|---------|----------|--------|
| MindAuth | MySQL + Redis | users, clients, authorizations, refresh_tokens, login_logs, email_config, system_config |
| MindFourm | MySQL + Redis | users, posts, replies, categories, tags, bookmarks, notifications, messages, attachments, resources, settings, bans |
| EasyManager | MySQL + Redis | servers, user_quotas, server_templates, bandwidth_logs, server_versions, operation_logs, admin_logs |

**Redis Usage**:
- MindAuth: Session cache, OAuth tokens, rate limiting
- MindFourm: Session storage, rate limiting
- EasyManager: WebSocket subscribers, port allocation, bandwidth stats, quota cache

## Key Integration Points

### MindAuth OAuth 2.0 Flow
```
Third-party → /authorize?client_id=... → Login → Redirect with code → /token → access_token
```

Token verification: `POST /api/verify` with `{ session_token }`

### MindFourm ↔ EasyManager Integration — ⏸ Paused

EasyManager integration is preserved but disabled by default. MindFourm backend uses `EASYMANAGER_ENABLED=false`; frontend server UI is hidden by `feature_servers_enabled=false`.

When disabled, MindFourm does not connect to EasyManager:
| Forum Endpoint | Disabled behavior |
|----------|-------------------|
| `GET /api/servers/public` | Returns an empty server list |
| `GET /api/servers/versions` | Returns an empty version list |
| `GET /api/servers/templates` | Returns an empty template list |
| `POST /api/servers/apply` | Returns a server feature disabled error |

Preserved callback endpoint:
- `POST /api/auto-post/server-approved` - Auto-create announcement post when EasyManager is restored and server approval callback is enabled

### MindFourm ↔ MindFileList Integration

MindFourm uploads resource files to MindFileList (MFL) via API. MFL stores files and serves downloads; MindFourm manages resource metadata and moderation.

| MFL Endpoint | Called By | Purpose |
|-------------|-----------|---------|
| `POST /api/v1/files/upload` | MindFourm | Upload file with `approval_status=pending` |
| `PUT /api/v1/files/:id/approval` | MindFourm | Sync moderation status (approved/rejected) |
| `GET /download/:id` | Users (via redirect) | File download — blocked if pending/rejected |

Download restriction: MFL checks `approval_status` on each download request and returns 403 with a styled error page if the file is pending or rejected.

## Environment Setup

### MindAuth (`MindAuth/.env`)
```bash
PORT=4001
BASE_URL=http://localhost:4001
ADMIN_SECRET=<32+ chars>
MYSQL_HOST=localhost
MYSQL_DATABASE=mindauth
REDIS_HOST=localhost
```

### MindFourm (`MindFourm/.env`)
```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
MINDAUTH_URL=http://localhost:4001
MINDAUTH_CLIENT_ID=forum
MINDAUTH_CLIENT_SECRET=<secret>
# EasyManager — 暂停中，默认关闭
EASYMANAGER_ENABLED=false
EASYMANAGER_URL=http://localhost:5001
EASYMANAGER_API_KEY=<key>
```

### EasyManager (`EasyManager/backend/.env`) — ⏸ PAUSED
```bash
PORT=5001
WS_PORT=5002
MINDAUTH_URL=http://localhost:4001
MYSQL_DATABASE=easymanager
REDIS_HOST=localhost
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Express.js (MindAuth, MindFileList), NestJS (MindFourm), Koa (EasyManager) |
| **Database** | MySQL 8 + Redis 7 |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS + shared-styles CSS variables |
| **Animation** | Framer Motion |
| **UI Components** | shadcn/ui + custom shared components |
| **Testing** | Playwright |
| **Container** | Docker (Mindustry servers) |

## Security Notes

- Helmet CSP with appropriate directives
- bcrypt password hashing (cost=10)
- CSRF double-submit cookie protection
- Rate limiting with Redis + memory fallback
- Timing-safe comparison for secrets
- Trusted proxy IP validation for CDN support
- Foreign keys enabled in MySQL

## Related Documentation

- [MindAuth Details](MindAuth/CLAUDE.md)
- [MindFourm Details](MindFourm/CLAUDE.md)
- [EasyManager Details](EasyManager/CLAUDE.md) ⏸ *(paused)*

## Restoring EasyManager

EasyManager is currently paused. All code is preserved in `EasyManager/`. To restore:

1. **MindAuth** — Uncomment the EasyManager OAuth client in `MindAuth/src/db/schema-mysql.js`
2. **MindFourm backend** — Set `EASYMANAGER_ENABLED=true` in `MindFourm/.env`
3. **MindFourm frontend** — Set `feature_servers_enabled` to `true` in admin settings (站点设置 → 功能管理)
4. **Root configs** — Uncomment EasyManager entries in:
   - `package.json` (workspaces + scripts)
   - `ecosystem.config.js` (PM2 apps)
   - `deploy.sh` (build steps)
   - `start-mindproject.ps1` / `stop-mindproject.ps1` (tmux panes)
   - `scripts/doc-sync/sync.js` (doc mapping)
5. **Start EasyManager** — `cd EasyManager/backend && npm install && npm run dev`

---
*Last updated: 2026-07-13*