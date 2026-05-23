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
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  MindFourm   │────▶│   MindAuth   │────▶│ EasyManager  │
│  (论坛)      │     │  (OAuth SSO) │     │ (服务器管理) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
                            │
                   ┌────────┴────────┐
                   │  共享资源       │
                   │  shared/        │
                   │  shared-styles/ │
                   └─────────────────┘
```

**集成流程**：
1. 所有服务使用 MindAuth 进行 OAuth SSO 登录
2. MindFourm 通过 `/api/servers/*` 展示 EasyManager 服务器列表
3. 用户可通过 MindFourm 申请服务器，由 EasyManager 管理

## 快速开始

### 环境要求

- Node.js 18+
- Docker (EasyManager 后端需要)
- SQLite3

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

所有服务使用 SQLite (better-sqlite3)，WAL 模式：

- `MindAuth/users.db` - 用户、OAuth 客户端、会话
- `MindFourm/data/forum.db` - 帖子、回复、书签、通知
- `EasyManager/data/easymanager.db` - 服务器、配额、模板

## 共享资源

### `shared/`

TypeScript 共享组件包：
- `components/UnifiedHeader` - 统一导航头
- `hooks/useTheme` - 主题切换
- `types/` - 共享类型定义

### `shared-styles/`

CSS 设计系统：
- `variables.css` - 主题变量（浅色/深色）
- `components.css` - 组件样式
- `utilities.css` - 工具类

## 文档

- [MindAuth README](MindAuth/README.md)
- [MindFourm CLAUDE.md](MindFourm/CLAUDE.md) - 架构详情
- [EasyManager CLAUDE.md](EasyManager/CLAUDE.md) - 架构详情
- [MindAuth OAuth 接入文档](MindAuth/docs/third-party-integration.md)

## 开发计划

各项目开发计划位于 `docs/superpowers/plans/` 目录：
- 统一设计系统
- MindForum-EasyManager 深度集成

## 许可证

MIT