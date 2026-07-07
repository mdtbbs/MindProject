# MindProject

Mindustry 社区平台 - 包含认证、论坛和服务器管理的完整解决方案。

## 项目组成

| 服务 | 端口 | 描述 |
|------|------|------|
| **MindAuth** | 4001 | OAuth 2.0 SSO 认证服务 |
| **MindFourm** | 4000 (API) / 3000 (前端) | 论坛系统 |
| **EasyManager** | 5001 (API) / 5002 (WebSocket) / 3001 (前端) | Mindustry 服务器托管管理 |

## 架构概览

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
                              │
                    ┌─────────┴─────────┐
                    │                   │
               ┌────┴────┐        ┌────┴────┐
               │  MySQL  │        │  Redis  │
               │ (数据)  │        │ (缓存)  │
               └─────────┘        └─────────┘
```

**集成流程**：
1. 所有服务使用 MindAuth 进行 OAuth SSO 登录
2. MindFourm 通过 `/api/forum/*` 展示 EasyManager 服务器列表
3. 用户可通过 MindFourm 申请服务器，由 EasyManager 管理
4. EasyManager 审批通过时回调 MindFourm 自动发布公告

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- Redis 7.0+
- Docker (EasyManager 后端需要)

### 启动所有服务

```bash
# 1. MindAuth (认证服务)
cd MindAuth
npm install
npm run dev        # 端口 4001

# 2. MindFourm 后端
cd MindFourm
npm install
npm run dev        # 端口 4000

# 3. MindFourm 前端
cd MindFourm/frontend
npm install
npm run dev        # 端口 3000

# 4. EasyManager 后端
cd EasyManager/backend
npm install
npm run dev        # 端口 5001

# 5. EasyManager 前端
cd EasyManager/frontend
npm install
npm run dev        # 端口 3001

# 6. 共享组件构建
cd shared
npm install
npm run build
```

### 访问地址

| 地址 | 描述 |
|------|------|
| http://localhost:4001 | MindAuth 用户中心 |
| http://localhost:4001/admin.html | MindAuth 管理后台 |
| http://localhost:3000 | MindFourm 论坛 |
| http://localhost:3001 | EasyManager 服务器管理 |

## 数据库

所有服务使用 MySQL + Redis：

| 服务 | MySQL 数据库 | Redis 用途 |
|------|-------------|-----------|
| MindAuth | `mindauth` | Session 缓存、OAuth Token、限流 |
| MindFourm | `mindfourm` | Session 存储、限流、缓存 |
| EasyManager | `easymanager` | WebSocket 订阅、端口分配、带宽统计 |

## 共享资源

### `shared/` - TypeScript 共享组件包

| 组件 | 描述 |
|------|------|
| `UnifiedHeader` | 统一导航头（搜索、通知、主题切换） |
| `AdminSidebar` | 管理后台侧边栏（支持分组模式） |
| `LoginLayout` | 分屏登录布局 |
| `UserCard` | 用户信息卡片 |
| `ServerCard` | 服务器信息卡片 |
| `StatsGrid` | 统计网格 |
| `ActivityChart` | 24小时活跃图 |
| `Tabs` | 标签页导航 |
| `DataTable` | 通用数据表格 |
| `Medal` | 用户勋章 |
| `Title` | 用户称号 |

### `shared-styles/` - CSS 设计系统

- `variables.css` - 主题变量（浅色/深色）
- `components.css` - 组件样式（50+ 组件类）
- `utilities.css` - 工具类

## 文档

- [MindAuth README](MindAuth/README.md)
- [MindFourm README](MindFourm/README.md)
- [EasyManager README](EasyManager/README.md)
- [MindAuth OAuth 接入文档](MindAuth/docs/third-party-integration.md)

## 许可证

MIT
