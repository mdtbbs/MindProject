# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindProject is a monorepo containing a Mindustry community platform with three integrated services:

| Service | Port | Description |
|---------|------|-------------|
| **MindAuth** | 4001 | OAuth 2.0 SSO authentication service |
| **MindFourm** | 4000 (API) / 3000 (Frontend) | Forum system |
| **EasyManager** | 5001 (API) / 5002 (WS) / 3001 (Frontend) | Mindustry server hosting manager |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              User Browser                                  │
└──────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MindFourm  │     │   MindAuth  │     │ EasyManager │     │   Shared    │
│  (Forum)    │────▶│  (OAuth)    │────▶│  (Servers)  │     │ (Components)│
│  Port 3000  │     │  Port 4001  │     │  Port 3001  │     │  Port N/A   │
│  Port 4000  │     │             │     │  Port 5001  │     │             │
└─────────────┘     └─────────────┘     │  Port 5002  │     └─────────────┘
        │                   │           └─────────────┘            │
        │                   │                    │                 │
        └───────────────────┴────────────────────┘                 │
                             │                                     │
                    ┌────────┴────────┐                           │
                    │  shared-styles  │◀──────────────────────────┘
                    │  (CSS Design)   │
                    └─────────────────┘
```

### Integration Flow
1. All services use MindAuth for OAuth SSO login
2. MindFourm displays EasyManager server listings via `/api/forum/*` proxy routes
3. Users can apply for servers through MindFourm, managed by EasyManager
4. EasyManager notifies MindFourm when servers are approved (auto-post callback)

## Commands

### Development (All Services)
```bash
# MindAuth (OAuth Service)
cd MindAuth && npm run dev        # Port 4001

# MindFourm (Forum)
cd MindFourm && npm run dev       # Port 4000 (API)
cd MindFourm/frontend && npm run dev  # Port 3000 (Frontend)

# EasyManager (Server Manager)
cd EasyManager/backend && npm run dev  # Port 5001 (API)
cd EasyManager/frontend && npm run dev # Port 3001 (Frontend)

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

### MindFourm ↔ EasyManager Integration

**MindFourm calls EasyManager** (`X-Service-Key` header):
| Endpoint | Purpose |
|----------|---------|
| `GET /api/forum/servers/public` | Public server list |
| `GET /api/forum/user/:id/servers` | User's servers |
| `POST /api/forum/apply` | Apply for new server |
| `GET /api/forum/servers/:id/basic` | Basic server info |

**EasyManager callback to MindFourm**:
- `POST /api/auto-post/server-approved` - Auto-create announcement post when server approved

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
EASYMANAGER_URL=http://localhost:5001
EASYMANAGER_API_KEY=<key>
```

### EasyManager (`EasyManager/backend/.env`)
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
| **Backend** | Express.js (MindAuth), NestJS (MindFourm), Koa (EasyManager) |
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
- [EasyManager Details](EasyManager/CLAUDE.md)

---
*Last updated: 2026-07-05*