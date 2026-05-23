---
name: resource-center-redesign
description: 重新设计实现资源中心功能，支持文件上传/外链提交、Markdown 介绍、版本号、资源类别管理（后台 CRUD）、管理面板资源审批
metadata:
  type: project
---

# 资源中心重设计 Design Spec

## 概述

重新设计实现 MindFourm 资源中心，替换现有类别写死、无版本号、无外链、无管理面板的旧实现。

## 数据库

### 改造 `resources` 表

现有字段保留 + 新增字段：

```sql
-- 改造后的字段（新增）
ALTER TABLE resources ADD COLUMN resource_type TEXT NOT NULL DEFAULT 'file';
ALTER TABLE resources ADD COLUMN external_url TEXT;
ALTER TABLE resources ADD COLUMN version TEXT;
ALTER TABLE resources ADD COLUMN content TEXT;
ALTER TABLE resources ADD COLUMN content_html TEXT;
ALTER TABLE resources ADD COLUMN category_id INTEGER REFERENCES resource_categories(id);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `resource_type` | TEXT | `'file'` 或 `'external'` |
| `external_url` | TEXT | 外链地址，外链类型时使用 |
| `file_path` | TEXT | 本地文件路径，文件类型时使用 |
| `version` | TEXT | 自由输入版本号 |
| `content` | TEXT | Markdown 原始内容 |
| `content_html` | TEXT | 渲染后的 HTML |
| `category_id` | INTEGER | 关联 resource_categories 表 |

### 新增 `resource_categories` 表

```sql
CREATE TABLE IF NOT EXISTS resource_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resource_categories_slug ON resource_categories(slug);
CREATE INDEX idx_resource_categories_active ON resource_categories(is_active);
```

### 新增 `resource_versions` 表

同一资源的多版本管理（主要用于文件类型资源的版本迭代）：

```sql
CREATE TABLE IF NOT EXISTS resource_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    file_path TEXT,                     -- 新版本文件路径
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, version)
);

CREATE INDEX idx_resource_versions_resource ON resource_versions(resource_id);
```

外链资源暂不支持多版本（外链通常只有一个目标 URL）。如需版本迭代，用户可直接修改主资源的 `version` 和 `external_url` 字段。

### 数据库迁移

迁移逻辑：
1. 备份现有 `resources` 表数据
2. 创建新 `resources` 表（含新字段）
3. 将 `file_path` 不为空的旧记录的 `resource_type` 设为 `'file'`
4. 将旧 `category` TEXT 值迁移到 `resource_categories` 表（如"文档"、"教程"等）
5. 更新 `category_id` 关联
6. 删除旧表，重命名新表

## API 路由

### 公开路由（无需认证）

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/v1/resources` | 列表（category_id, search, cursor 分页） |
| GET | `/api/v1/resources/:id` | 详情（含版本列表） |
| GET | `/api/v1/resources/:id/download` | 下载（file 类型，递增下载计数） |
| GET | `/api/v1/resources/:id/versions` | 版本列表 |
| GET | `/api/v1/resource-categories` | 启用类别列表 |

### 用户路由（需登录）

| 方法 | 路由 | 功能 |
|------|------|------|
| POST | `/api/v1/resources` | 提交新资源（file 或 external） |
| POST | `/api/v1/resources/:id/versions` | 添加新版本 |
| PUT | `/api/v1/resources/:id` | 编辑自己的资源 |
| DELETE | `/api/v1/resources/:id` | 删除自己的资源 |

### 管理员路由（admin/moderator）

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/v1/resources/admin` | 全部资源列表（状态筛选） |
| PUT | `/api/v1/resources/:id/status` | 审批/拒绝 |
| PUT | `/api/v1/resources/:id` | 管理员编辑资源（覆盖原权限） |
| DELETE | `/api/v1/resources/:id` | 管理员强制删除 |
| GET | `/api/v1/resource-categories` | 类别列表（含非启用） |
| POST | `/api/v1/resource-categories` | 创建类别 |
| PUT | `/api/v1/resource-categories/:id` | 更新类别 |
| DELETE | `/api/v1/resource-categories/:id` | 删除类别 |

## 前端页面

### 用户侧

| 页面 | 路由 | 状态 |
|------|------|------|
| 资源列表 | `/resources` | 重写 |
| 上传文件 | `/resources/upload` | 重写 |
| 提交外链 | `/resources/submit` | 新增 |
| 资源详情 | `/resources/[id]` | 重写 |

### 管理侧

| 页面 | 路由 | 状态 |
|------|------|------|
| 资源管理 | `/admin/resources` | 新增 |
| 资源审批 | `/admin/resources/moderation` | 新增 |
| 类别管理 | `/admin/resource-categories` | 新增 |

## 前端组件

| 组件 | 文件 | 用途 |
|------|------|------|
| ResourceCard | `components/forum/resource-card.tsx` | 列表页资源卡片 |
| ResourceUploadForm | `components/forum/resource-upload-form.tsx` | 文件上传表单（标题、版本、类别、Markdown、文件） |
| ResourceSubmitForm | `components/forum/resource-submit-form.tsx` | 外链提交表单（标题、版本、类别、Markdown、外链URL） |
| ResourceDetail | `components/forum/resource-detail.tsx` | 详情页（Markdown 渲染、版本切换、下载/外链按钮） |
| VersionSelector | `components/ui/version-selector.tsx` | 版本选择/切换 |
| ResourceListFilters | `components/forum/resource-list-filters.tsx` | 搜索 + 类别筛选 + 排序 |
| ResourceCategoryManager | `components/admin/resource-category-manager.tsx` | 类别 CRUD 表单 |
| ResourceModerationTable | `components/admin/resource-moderation-table.tsx` | 审批列表 |
| ResourceTable | `components/admin/resource-table.tsx` | 资源管理表格 |

## 数据流

```
用户提交流程：
  用户 → /resources/upload 或 /resources/submit
    → 填写表单（标题、版本、类别、Markdown 介绍、文件/外链）
    → POST /api/v1/resources
    → 后端：验证 → 保存文件/记录外链 → 渲染 Markdown HTML → INSERT DB（status='approved'，默认自动通过）
    → 返回资源详情页面

管理员审批流程：
  管理员可选择将某个资源从 approved 改为 pending/rejected（如用户举报后）
  管理员 → /admin/resources/moderation
    → 查看待审批资源列表（status='pending'）
    → 点击单个资源查看详情 + Markdown 预览
    → 批准 → PUT /api/v1/resources/:id/status { status: 'approved' }
    → 拒绝 → PUT /api/v1/resources/:id/status { status: 'rejected' }
  注：新资源默认 status='approved'（自动通过），无需管理员逐个审批。管理面板用于处理举报/手动标记的资源。

类别管理流程：
  管理员 → /admin/resource-categories
    → 创建/编辑/删除类别
    → POST/PUT/DELETE /api/v1/resource-categories
```

## Markdown 处理

- 前端：使用现有 `markdown-renderer.tsx` 做实时预览
- 后端：在 controller 中使用已有的 Markdown 渲染工具（如果有）或 `marked`/`markdown-it` 库生成 `content_html`
- 存储：同时保存 `content`（原始 Markdown）和 `content_html`（渲染后 HTML），详情展示用 `content_html`

## 错误处理

- 上传：文件大小限制（50MB）、不支持的文件类型、服务器存储失败
- 外链：URL 格式验证、无效链接检查（可选 HEAD 请求）
- 类别：slug 唯一性、删除前检查是否有资源关联
- 审批：防止重复审批、状态机（pending → approved/rejected）
- 版本：同一资源版本号不可重复

## 设计原则

- 复用现有 CSS 变量和 UI 组件
- 复用 lucide-react 图标系统
- 类别 icon 字段存储 lucide 图标名称字符串
- 保持与论坛首页一致的视觉风格
- SSR 用于列表/详情页（SEO 友好），客户端组件用于交互（表单、筛选）
