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
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  MindFourm   │────▶│   MindAuth   │────▶│ EasyManager  │
│  (Forum)     │     │  (OAuth SSO) │     │ (Servers)    │
│  port 3000   │     │  port 4001   │     │  port 3001   │
│  port 4000   │     │              │     │  port 5001   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
                            │
                   ┌────────┴────────┐
                   │     shared      │
                   │   (Components)  │
                   │  shared-styles  │
                   └─────────────────┘
```

### Integration Flow
1. All services use MindAuth for OAuth SSO login
2. MindFourm displays EasyManager server listings via service-layer `/api/forum/*` proxy routes
3. Users can apply for servers through MindFourm, managed by EasyManager

## Commands

### Development (All Services)
```bash
# MindAuth
cd MindAuth && npm run dev        # Port 4001

# MindFourm Backend
cd MindFourm && npm run dev       # Port 4000

# MindFourm Frontend
cd MindFourm/frontend && npm run dev  # Port 3000

# EasyManager Backend
cd EasyManager/backend && npm run dev  # Port 5001

# EasyManager Frontend
cd EasyManager/frontend && npm run dev # Port 3001

# Shared package
cd shared && npm run build        # Build TypeScript
```

### E2E Tests
```bash
cd MindFourm && npx playwright test              # Run all tests
cd MindFourm && npx playwright test --ui         # Interactive mode
cd MindAuth && npx playwright test               # MindAuth tests
```

## Shared Packages

### `shared/`
TypeScript package with shared React components and utilities:
- `components/UnifiedHeader` - Unified navigation header across services
- `hooks/useTheme` - Theme switching hook
- `types/` - Shared type definitions (user, server)

Build: `npm run build` (outputs to `dist/`)

### `shared-styles/`
CSS design system (no build step):
- `variables.css` - Theme variables (light/dark), brand colors
- `components.css` - Component styles
- `utilities.css` - Utility classes

Import directly in Next.js/Tailwind configs.

## Database Architecture

All services use SQLite with better-sqlite3:
- MindAuth: `MindAuth/users.db` (users, OAuth clients, sessions)
- MindFourm: `MindFourm/data/forum.db` (posts, replies, bookmarks, notifications)
- EasyManager: `EasyManager/data/easymanager.db` (servers, quotas, templates)

All databases: WAL mode, foreign keys enabled.

## Key Integration Points

### MindAuth OAuth Flow
```
Third-party → /authorize?client_id=... → (login if needed) → redirect with code → /token → access_token
```

Token verification: POST `/api/verify` with `{ session_token }`

### MindFourm ↔ EasyManager
Service-layer proxy calls (uses `X-Service-Key` header):
- `/api/forum/servers/public` - Public server list
- `/api/forum/user/:id/servers` - User's servers (service key + user ID)
- `/api/forum/apply` - Apply for new server
- `/api/forum/servers/:id/basic` - Basic server info for forum display

## Environment Setup

Each service has its own `.env`:
- MindAuth: `PORT=4001`, `ADMIN_SECRET`, `BASE_URL`
- MindFourm: `PORT=4000`, `MINDAUTH_URL=http://localhost:4001`, `FRONTEND_URL=http://localhost:3000`
- EasyManager: `PORT=5001`, `MINDAUTH_URL=http://localhost:4001`, `DOCKER_HOST=127.0.0.1`

See individual CLAUDE.md files in each project directory for detailed architecture.