# MindProject

Mindustry 社区平台 - 当前包含认证、论坛、文件服务集成；服务器托管管理（EasyManager）代码保留但暂停运行。

## 项目组成

| 服务 | 端口 | 描述 | 状态 |
|------|------|------|------|
| **MindAuth** | 4001 | OAuth 2.0 SSO 认证服务 | ✅ Active |
| **MindFourm** | 4000 (API) / 3000 (前端) | 论坛系统 | ✅ Active |
| **EasyManager** | 5001 (API) / 5002 (WebSocket) / 3001 (前端) | Mindustry 服务器托管管理 | ⏸ Paused（代码保留） |
| **MindFileList** | 3000 | 文件托管与下载服务（外部仓库 `download-site`） | ✅ Active |

> EasyManager 当前暂停：不在 workspace、PM2、部署脚本、开发启动脚本中启动。MindFourm 服务器功能默认关闭（后端 `EASYMANAGER_ENABLED=false`，前端 `feature_servers_enabled=false`）。

## 架构概览

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
                              │
                    ┌─────────┴─────────┐
                    │                   │
               ┌────┴────┐        ┌────┴────┐
               │  MySQL  │        │  Redis  │
               │ (数据)  │        │ (缓存)  │
               └─────────┘        └─────────┘
```

**集成流程**：
1. MindFourm 使用 MindAuth 进行 OAuth SSO 登录
2. MindFourm 上传资源文件到 MindFileList，由 MFL 管理文件存储与下载限制
3. EasyManager 服务器列表/申请/回调功能已暂停；相关代码保留，API 默认优雅返回空数据

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- Redis 7.0+
- Docker（仅恢复 EasyManager 时需要）

### 启动当前活跃服务

```bash
# 1. 共享组件构建
cd shared
npm install
npm run build

# 2. MindAuth (认证服务)
cd ../MindAuth
npm install
npm run dev        # 端口 4001

# 3. MindFourm 后端
cd ../MindFourm
npm install
npm run dev        # 端口以 MindFourm/.env PORT 为准

# 4. MindFourm 前端
cd frontend
npm install
npm run dev        # 端口以 frontend/package.json / 脚本为准
```

根目录脚本：

```bash
npm run build:shared
npm run dev:auth
npm run dev:forum-api
npm run dev:forum-ui
```

### 访问地址

| 地址 | 描述 |
|------|------|
| http://localhost:4001 | MindAuth 用户中心 |
| http://localhost:4001/admin.html | MindAuth 管理后台 |
| http://localhost:3000 | MindFourm 论坛（默认端口，实际以启动输出为准） |

## 数据库

当前活跃服务使用 MySQL + Redis：

| 服务 | MySQL 数据库 | Redis 用途 |
|------|-------------|-----------|
| MindAuth | `mindauth` | Session 缓存、OAuth Token、限流 |
| MindFourm | `mindfourm` | Session 存储、限流、缓存 |
| EasyManager | `easymanager` | ⏸ 暂停，仅恢复时使用 |

## 共享资源

### `shared/` - TypeScript 共享组件包

| 组件 | 描述 |
|------|------|
| `UnifiedHeader` | 统一导航头（搜索、通知、主题切换） |
| `AdminSidebar` | 管理后台侧边栏（支持分组模式） |
| `LoginLayout` | 分屏登录布局 |
| `UserCard` | 用户信息卡片 |
| `ServerCard` | 服务器信息卡片（EasyManager 恢复时可用） |
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

## 恢复 EasyManager

EasyManager 代码保留在 `EasyManager/`。如需恢复：

1. 取消 `package.json` 中 EasyManager workspaces/scripts 的注释或重新加入
2. 取消 `ecosystem.config.js`、`deploy.sh`、`start-mindproject.ps1`、`stop-mindproject.ps1` 中 EasyManager 相关配置的注释
3. 在 MindAuth 中恢复 EasyManager OAuth client seed
4. 设置 MindFourm 后端 `EASYMANAGER_ENABLED=true`
5. 在 MindFourm 管理后台开启 `feature_servers_enabled`
6. 安装并启动 `EasyManager/backend` 与 `EasyManager/frontend`

## 文档

- [MindAuth README](MindAuth/README.md)
- [MindFourm README](MindFourm/README.md)
- [EasyManager README](EasyManager/README.md)（暂停服务，代码保留）
- [MindAuth OAuth 接入文档](MindAuth/docs/third-party-integration.md)

## 许可证

MIT
