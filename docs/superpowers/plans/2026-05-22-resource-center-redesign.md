# 资源中心重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新实现资源中心，支持文件上传/外链提交、Markdown 介绍、版本号、资源类别管理（后台 CRUD）、管理面板资源管理。

**Architecture:** 后端扩展现有 resource service/controller/routes 支持新字段和新类别表，前端重写用户侧页面（列表/详情/上传/外链提交），新增管理面板页面（资源列表/审批/类别管理）。数据库迁移处理旧数据兼容。

**Tech Stack:** Koa.js, better-sqlite3, marked (已有), Next.js 14 App Router, TypeScript, Tailwind CSS, lucide-react, react-markdown (已有).

---

### File Map

| File | Action | Purpose |
|------|--------|---------|
| `MindFourm/src/database/schema.sql` | Modify | 新增 resource_categories/resource_versions 表定义 |
| `MindFourm/src/database/index.js` | Modify | 新增资源中心数据库迁移逻辑 |
| `MindFourm/src/services/resource-category.service.js` | Create | 资源类别 CRUD 服务 |
| `MindFourm/src/services/resource.service.js` | Rewrite | 适配新字段（resource_type, external_url, version, content, content_html, category_id）|
| `MindFourm/src/services/resource-version.service.js` | Create | 资源版本 CRUD 服务 |
| `MindFourm/src/controllers/resource.controller.js` | Rewrite | 适配新字段，增加版本/类别相关端点 |
| `MindFourm/src/routes/resource.routes.js` | Rewrite | 增加类别管理和版本管理路由 |
| `MindFourm/src/validators/resource.validator.js` | Create | 资源提交 Joi 验证 schema |
| `MindFourm/frontend/src/types/index.ts` | Modify | 更新 Resource 接口，新增 ResourceCategory/ResourceVersion 接口 |
| `MindFourm/frontend/src/lib/api/client.ts` | Modify | 更新 resourceApi，新增 resourceCategoryApi/resourceVersionApi |
| `MindFourm/frontend/src/components/forum/resource-card.tsx` | Create | 资源列表卡片组件 |
| `MindFourm/frontend/src/components/forum/resource-list-filters.tsx` | Create | 搜索 + 类别筛选 + 排序 |
| `MindFourm/frontend/src/components/forum/resource-upload-form.tsx` | Create | 文件上传表单组件 |
| `MindFourm/frontend/src/components/forum/resource-submit-form.tsx` | Create | 外链提交表单组件 |
| `MindFourm/frontend/src/components/forum/resource-detail.tsx` | Create | 资源详情展示组件 |
| `MindFourm/frontend/src/components/ui/version-selector.tsx` | Create | 版本选择器组件 |
| `MindFourm/frontend/src/components/ui/markdown-editor.tsx` | Create | Markdown 编辑器（预览 + 编辑） |
| `MindFourm/frontend/src/components/admin/resource-table.tsx` | Create | 管理资源列表表格 |
| `MindFourm/frontend/src/components/admin/resource-moderation-table.tsx` | Create | 资源审批表格 |
| `MindFourm/frontend/src/components/admin/resource-category-manager.tsx` | Create | 类别 CRUD 表单 |
| `MindFourm/frontend/src/app/(public)/resources/page.tsx` | Rewrite | 资源列表页（SSR + 搜索筛选） |
| `MindFourm/frontend/src/app/(public)/resources/upload/page.tsx` | Rewrite | 文件上传页面 |
| `MindFourm/frontend/src/app/(public)/resources/submit/page.tsx` | Create | 外链提交页面 |
| `MindFourm/frontend/src/app/(public)/resources/[id]/page.tsx` | Rewrite | 资源详情页（SSR + Markdown 渲染 + 版本切换） |
| `MindFourm/frontend/src/app/admin/resources/page.tsx` | Create | 管理资源列表页 |
| `MindFourm/frontend/src/app/admin/resources/moderation/page.tsx` | Create | 资源审批页 |
| `MindFourm/frontend/src/app/admin/resource-categories/page.tsx` | Create | 类别管理页 |
| `MindFourm/frontend/src/components/admin/admin-sidebar.tsx` | Modify | 添加资源管理导航项 |

---

### Task 0: Database Schema & Migration

**Files:**
- Modify: `MindFourm/src/database/schema.sql`
- Modify: `MindFourm/src/database/index.js`

- [ ] **Step 1: Update schema.sql**

At the end of `schema.sql` (after line 273), replace the existing `resources` table section with the new schema and add the two new tables:

```sql
-- Resource center (migrated)
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL DEFAULT 'file',
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    external_url TEXT,
    version TEXT,
    content TEXT,
    content_html TEXT,
    category_id INTEGER,
    download_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES resource_categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_public ON resources(is_public, status);
CREATE INDEX IF NOT EXISTS idx_resources_created ON resources(created_at DESC);

-- Resource categories
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
CREATE INDEX IF NOT EXISTS idx_resource_categories_slug ON resource_categories(slug);
CREATE INDEX IF NOT EXISTS idx_resource_categories_active ON resource_categories(is_active);

-- Resource versions
CREATE TABLE IF NOT EXISTS resource_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER NOT NULL,
    version TEXT NOT NULL,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE(resource_id, version)
);
CREATE INDEX IF NOT EXISTS idx_resource_versions_resource ON resource_versions(resource_id);
```

- [ ] **Step 2: Add migration in database/index.js**

After the Phase 3 migration block (after line 69), add the resource center migration:

```javascript
  // Resource center: add new columns and tables
  const migrations = [
    "ALTER TABLE resources ADD COLUMN resource_type TEXT NOT NULL DEFAULT 'file'",
    'ALTER TABLE resources ADD COLUMN external_url TEXT',
    'ALTER TABLE resources ADD COLUMN version TEXT',
    'ALTER TABLE resources ADD COLUMN content TEXT',
    'ALTER TABLE resources ADD COLUMN content_html TEXT',
    'ALTER TABLE resources ADD COLUMN category_id INTEGER',
  ];
  migrations.forEach(sql => {
    try { db.exec(sql); } catch (e) {
      if (!e.message.includes('duplicate')) console.warn('Resource migration skipped:', e.message);
    }
  });

  // Rename old category column and migrate data
  try {
    // Migrate distinct categories from old TEXT column to new resource_categories table
    const oldCategories = db.prepare("SELECT DISTINCT category FROM resources WHERE category IS NOT NULL AND category != ''").all();
    if (oldCategories.length > 0) {
      const insertCat = db.prepare('INSERT OR IGNORE INTO resource_categories (name, slug, sort_order) VALUES (?, ?, ?)');
      oldCategories.forEach((c, idx) => {
        const slug = c.category.toLowerCase().replace(/[^a-z0-9一-龥]/g, '-');
        insertCat.run(c.category, slug, idx);
      });
      // Update category_id based on name match
      db.exec(`UPDATE resources SET category_id = (SELECT id FROM resource_categories WHERE name = resources.category) WHERE category_id IS NULL AND category IS NOT NULL`);
    }
  } catch (e) {
    console.warn('Resource category migration:', e.message);
  }

  // Seed default categories if empty
  try {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM resource_categories').get();
    if (count.cnt === 0) {
      const seedCategories = [
        ['插件', 'plugin', 'Mindustry 插件/模组', 'Puzzle', 1],
        ['地图', 'map', '游戏地图文件', 'Map', 2],
        ['服务端', 'server', '服务端配置/工具', 'Server', 3],
        ['材质包', 'texture', '游戏材质/皮肤', 'Palette', 4],
        ['教程', 'tutorial', '游戏/搭建教程', 'BookOpen', 5],
        ['工具', 'tool', '辅助工具', 'Wrench', 6],
        ['其他', 'other', '其他资源', 'FileText', 7],
      ];
      const insert = db.prepare('INSERT OR IGNORE INTO resource_categories (name, slug, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
      seedCategories.forEach(c => insert.run(...c));
    }
  } catch (e) {
    console.warn('Resource seed categories:', e.message);
  }
```

- [ ] **Step 3: Verify migration runs**

Run: `cd MindFourm && node -e "require('./src/database').initialize(); console.log('Migration OK')"`
Expected: "Database initialized at ..." + "Migration OK"

---

### Task 1: ResourceCategory Service

**Files:**
- Create: `MindFourm/src/services/resource-category.service.js`

- [ ] **Step 1: Write ResourceCategoryService**

```javascript
// MindFourm/src/services/resource-category.service.js
const db = require('../database');

class ResourceCategoryService {
  static list(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = 1';
    return db.prepare(`SELECT * FROM resource_categories ${where} ORDER BY sort_order ASC, name ASC`).all();
  }

  static getById(id) {
    return db.prepare('SELECT * FROM resource_categories WHERE id = ?').get(id);
  }

  static create({ name, slug, description, icon, sort_order, is_active }) {
    const result = db.prepare(`
      INSERT INTO resource_categories (name, slug, description, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, slug, description || null, icon || null, sort_order || 0, is_active ? 1 : 0);
    return this.getById(result.lastInsertRowid);
  }

  static update(id, { name, slug, description, icon, sort_order, is_active }) {
    db.prepare(`
      UPDATE resource_categories
      SET name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, slug, description, icon, sort_order, is_active === undefined ? undefined : (is_active ? 1 : 0), id);
    return this.getById(id);
  }

  static delete(id) {
    const resourceCount = db.prepare('SELECT COUNT(*) as cnt FROM resources WHERE category_id = ?').get(id);
    if (resourceCount.cnt > 0) {
      return { error: '该类别下还有资源，无法删除' };
    }
    db.prepare('DELETE FROM resource_categories WHERE id = ?').run(id);
    return { success: true };
  }
}

module.exports = ResourceCategoryService;
```

- [ ] **Step 2: Verify module loads**

Run: `cd MindFourm && node -e "require('./src/services/resource-category.service'); console.log('OK')"`
Expected: "OK"

---

### Task 2: ResourceVersion Service

**Files:**
- Create: `MindFourm/src/services/resource-version.service.js`

- [ ] **Step 1: Write ResourceVersionService**

```javascript
// MindFourm/src/services/resource-version.service.js
const db = require('../database');

class ResourceVersionService {
  static list(resourceId) {
    return db.prepare(`
      SELECT * FROM resource_versions WHERE resource_id = ? ORDER BY created_at DESC
    `).all(resourceId);
  }

  static create({ resource_id, version, file_path }) {
    const result = db.prepare(`
      INSERT INTO resource_versions (resource_id, version, file_path)
      VALUES (?, ?, ?)
    `).run(resource_id, version, file_path || null);
    return db.prepare('SELECT * FROM resource_versions WHERE id = ?').get(result.lastInsertRowid);
  }

  static delete(id, resourceId) {
    const v = db.prepare('SELECT * FROM resource_versions WHERE id = ? AND resource_id = ?').get(id, resourceId);
    if (!v) return null;
    db.prepare('DELETE FROM resource_versions WHERE id = ? AND resource_id = ?').run(id, resourceId);
    return v;
  }
}

module.exports = ResourceVersionService;
```

- [ ] **Step 2: Verify module loads**

Run: `cd MindFourm && node -e "require('./src/services/resource-version.service'); console.log('OK')"`
Expected: "OK"

---

### Task 3: Update ResourceService

**Files:**
- Rewrite: `MindFourm/src/services/resource.service.js`

- [ ] **Step 1: Rewrite ResourceService**

Replace entire contents of `MindFourm/src/services/resource.service.js`:

```javascript
const db = require('../database');
const { encodeCursor, decodeCursor } = require('../utils/cursor');
const { parseMarkdown } = require('../utils/markdown');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../uploads/resources');

class ResourceService {
  static create({ user_id, title, description, resource_type, file_name, file_path, file_size, mime_type, external_url, version, content, content_html, category_id, is_public }) {
    const result = db.prepare(`
      INSERT INTO resources (user_id, title, description, resource_type, file_name, file_path, file_size, mime_type, external_url, version, content, content_html, category_id, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user_id, title, description || null, resource_type || 'file',
      file_name || null, file_path || null, file_size || 0, mime_type || null,
      external_url || null, version || null, content || null, content_html || null,
      category_id || null, is_public ? 1 : 0
    );
    return this.getById(result.lastInsertRowid);
  }

  static getList({ limit = 20, cursor, category_id, search, status, sort }) {
    const whereClauses = ['status = ?'];
    const params = [status || 'approved'];

    if (category_id) {
      whereClauses.push('r.category_id = ?');
      params.push(parseInt(category_id));
    }

    if (search) {
      whereClauses.push('(r.title LIKE ? OR r.description LIKE ? OR r.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (cursor) {
      const [createdAt, id] = decodeCursor(cursor);
      whereClauses.push('(r.created_at < ? OR (r.created_at = ? AND r.id < ?))');
      params.push(createdAt, createdAt, parseInt(id));
    }

    const orderBy = sort === 'downloads' ? 'r.download_count DESC' : 'r.created_at DESC';
    const whereClause = whereClauses.join(' AND ');

    const resources = db.prepare(`
      SELECT r.*, u.username, u.avatar_url,
             rc.name as category_name, rc.icon as category_icon
      FROM resources r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN resource_categories rc ON r.category_id = rc.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(...params, limit + 1);

    const hasMore = resources.length > limit;
    if (hasMore) resources.pop();

    const nextCursor = resources.length > 0
      ? encodeCursor(resources[resources.length - 1].created_at, resources[resources.length - 1].id)
      : null;

    return { data: resources, next_cursor: nextCursor, has_more: hasMore };
  }

  static getById(id) {
    return db.prepare(`
      SELECT r.*, u.username, u.avatar_url,
             rc.name as category_name, rc.icon as category_icon
      FROM resources r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN resource_categories rc ON r.category_id = rc.id
      WHERE r.id = ?
    `).get(id);
  }

  static getByResourceIdWithVersions(id) {
    const resource = this.getById(id);
    if (!resource) return null;
    const versions = db.prepare(`
      SELECT * FROM resource_versions WHERE resource_id = ? ORDER BY created_at DESC
    `).all(id);
    return { ...resource, versions };
  }

  static incrementDownload(id) {
    db.prepare('UPDATE resources SET download_count = download_count + 1 WHERE id = ?').run(id);
  }

  static getByUserId(userId, { limit = 20, cursor }) {
    const whereClauses = ['user_id = ?'];
    const params = [userId];

    if (cursor) {
      const [createdAt, id] = decodeCursor(cursor);
      whereClauses.push('(created_at < ? OR (created_at = ? AND id < ?))');
      params.push(createdAt, createdAt, parseInt(id));
    }

    const resources = db.prepare(`
      SELECT * FROM resources WHERE ${whereClauses.join(' AND ')}
      ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit + 1);

    const hasMore = resources.length > limit;
    if (hasMore) resources.pop();

    const nextCursor = resources.length > 0
      ? encodeCursor(resources[resources.length - 1].created_at, resources[resources.length - 1].id)
      : null;

    return { data: resources, next_cursor: nextCursor, has_more: hasMore };
  }

  static update(id, userId, { title, description, version, content, content_html, category_id, is_public, external_url }) {
    const resource = this.getById(id);
    if (!resource || (resource.user_id !== userId)) return null;

    db.prepare(`
      UPDATE resources SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        version = COALESCE(?, version),
        content = COALESCE(?, content),
        content_html = COALESCE(?, content_html),
        category_id = COALESCE(?, category_id),
        is_public = COALESCE(?, is_public),
        external_url = COALESCE(?, external_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, version, content, content_html, category_id, is_public, external_url, id);
    return this.getById(id);
  }

  static delete(id, userId) {
    const resource = this.getById(id);
    if (!resource || (resource.user_id !== userId)) return null;

    // Remove file if exists
    if (resource.file_path) {
      try {
        const fullPath = path.join(__dirname, '..', resource.file_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) { /* ignore */ }
    }

    db.prepare('DELETE FROM resources WHERE id = ?').run(id);
    return true;
  }

  static adminDelete(id) {
    const resource = this.getById(id);
    if (!resource) return null;

    if (resource.file_path) {
      try {
        const fullPath = path.join(__dirname, '..', resource.file_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) { /* ignore */ }
    }

    db.prepare('DELETE FROM resources WHERE id = ?').run(id);
    return true;
  }

  static updateStatus(id, status) {
    db.prepare('UPDATE resources SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return this.getById(id);
  }

  static countByStatus(status) {
    return db.prepare('SELECT COUNT(*) as cnt FROM resources WHERE status = ?').get(status);
  }
}

module.exports = ResourceService;
```

- [ ] **Step 2: Verify module loads**

Run: `cd MindFourm && node -e "require('./src/services/resource.service'); console.log('OK')"`
Expected: "OK"

---

### Task 4: Validator & Controller Rewrite

**Files:**
- Create: `MindFourm/src/validators/resource.validator.js`
- Rewrite: `MindFourm/src/controllers/resource.controller.js`

- [ ] **Step 1: Create resource.validator.js**

```javascript
// MindFourm/src/validators/resource.validator.js
const Joi = require('joi');

const RESOURCE_SCHEMA = Joi.object({
  title: Joi.string().required().min(2).max(200),
  description: Joi.string().allow('').max(2000),
  resource_type: Joi.string().valid('file', 'external').default('file'),
  version: Joi.string().allow('').max(50),
  content: Joi.string().allow('').max(50000),
  category_id: Joi.number().integer().positive().allow(null),
  is_public: Joi.boolean().default(true),
  external_url: Joi.string().uri().allow('').when('resource_type', {
    is: 'external',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().allow(''),
  }),
});

const RESOURCE_UPDATE_SCHEMA = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().allow('').max(2000),
  version: Joi.string().allow('').max(50),
  content: Joi.string().allow('').max(50000),
  category_id: Joi.number().integer().positive().allow(null),
  is_public: Joi.boolean(),
  external_url: Joi.string().uri().allow(''),
});

const CATEGORY_SCHEMA = Joi.object({
  name: Joi.string().required().min(1).max(50),
  slug: Joi.string().required().min(1).max(50).pattern(/^[a-z0-9一-龥-]+$/),
  description: Joi.string().allow('').max(200),
  icon: Joi.string().allow('').max(50),
  sort_order: Joi.number().integer().default(0),
  is_active: Joi.boolean().default(true),
});

const VERSION_SCHEMA = Joi.object({
  version: Joi.string().required().min(1).max(50),
  file_path: Joi.string().allow(''),
});

module.exports = {
  RESOURCE_SCHEMA,
  RESOURCE_UPDATE_SCHEMA,
  CATEGORY_SCHEMA,
  VERSION_SCHEMA,
};
```

- [ ] **Step 2: Rewrite resource.controller.js**

Replace entire contents of `MindFourm/src/controllers/resource.controller.js`:

```javascript
const path = require('path');
const fs = require('fs');
const ResourceService = require('../services/resource.service');
const ResourceCategoryService = require('../services/resource-category.service');
const ResourceVersionService = require('../services/resource-version.service');
const LogService = require('../services/log.service');
const Response = require('../utils/response');
const { parseMarkdown } = require('../utils/markdown');

const UPLOAD_DIR = path.join(__dirname, '../uploads/resources');

class ResourceController {
  static async upload(ctx) {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      return Response.error(ctx, '未登录');
    }

    const { title, description, resource_type, version, content, category_id, is_public, external_url } = ctx.request.body || {};
    if (!title || title.trim().length < 2) {
      ctx.status = 400;
      return Response.error(ctx, '标题至少2个字符');
    }

    let file_name = null, file_path = null, file_size = 0, mime_type = null;

    if (resource_type === 'external') {
      if (!external_url) {
        ctx.status = 400;
        return Response.error(ctx, '外链地址不能为空');
      }
    } else {
      const file = ctx.request.files?.file;
      if (!file) {
        ctx.status = 400;
        return Response.error(ctx, '请选择文件');
      }
      const resourceFile = Array.isArray(file) ? file[0] : file;
      const safeName = path.basename(resourceFile.originalFilename || 'upload');
      const ext = path.extname(safeName);
      const fileName = `resource_${Date.now()}${ext}`;
      const destPath = path.join(UPLOAD_DIR, fileName);

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      fs.copyFileSync(resourceFile.filepath, destPath);
      fs.unlinkSync(resourceFile.filepath);

      file_name = safeName;
      file_path = `uploads/resources/${fileName}`;
      file_size = resourceFile.size;
      mime_type = resourceFile.mimetype;
    }

    const content_html = content ? parseMarkdown(content) : '';

    const resource = ResourceService.create({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim(),
      resource_type: resource_type || 'file',
      file_name, file_path, file_size, mime_type,
      external_url: external_url || null,
      version: version || null,
      content: content || null,
      content_html,
      category_id: category_id ? parseInt(category_id) : null,
      is_public: is_public === 'true' || is_public === '1' || is_public === true,
    });

    LogService.log({
      user_id: user.id,
      action: 'RESOURCE_UPLOAD',
      target_type: 'resource',
      target_id: resource.id,
      ip_address: ctx.ip,
      user_agent: ctx.headers['user-agent'],
    });

    Response.created(ctx, resource);
  }

  static list(ctx) {
    const { limit, cursor, category_id, search, sort } = ctx.query;
    const result = ResourceService.getList({
      limit: parseInt(limit) || 20,
      cursor: cursor || null,
      category_id: category_id || null,
      search: search || null,
      status: 'approved',
      sort: sort || null,
    });
    Response.success(ctx, { data: result.data, next_cursor: result.next_cursor, has_more: result.has_more });
  }

  static getById(ctx) {
    const data = ResourceService.getByResourceIdWithVersions(parseInt(ctx.params.id));
    if (!data) {
      ctx.status = 404;
      return Response.error(ctx, '资源不存在');
    }
    Response.success(ctx, data);
  }

  static download(ctx) {
    const resource = ResourceService.getById(parseInt(ctx.params.id));
    if (!resource || resource.resource_type !== 'file') {
      ctx.status = 404;
      return Response.error(ctx, '资源不存在或不可下载');
    }

    ResourceService.incrementDownload(resource.id);

    const fullPath = path.join(__dirname, '..', resource.file_path);
    if (!fs.existsSync(fullPath)) {
      ctx.status = 404;
      return Response.error(ctx, '文件已丢失');
    }

    ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.file_name)}"`);
    ctx.set('Content-Type', resource.mime_type);
    ctx.body = fs.createReadStream(fullPath);
  }

  static async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      return Response.error(ctx, '未登录');
    }

    const { title, description, version, content, category_id, is_public, external_url } = ctx.request.body;
    const content_html = content ? parseMarkdown(content) : undefined;

    const resource = ResourceService.update(parseInt(ctx.params.id), user.id, {
      title, description, version, content, content_html, category_id, is_public, external_url,
    });

    if (!resource) {
      ctx.status = 403;
      return Response.error(ctx, '无权限');
    }

    Response.success(ctx, resource);
  }

  static deleteResource(ctx) {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      return Response.error(ctx, '未登录');
    }

    const result = ResourceService.delete(parseInt(ctx.params.id), user.id);
    if (!result) {
      ctx.status = 403;
      return Response.error(ctx, '无权限或资源不存在');
    }

    Response.success(ctx, { message: '资源已删除' });
  }

  // === Category endpoints ===

  static listCategories(ctx) {
    const includeInactive = ctx.state.user?.role === 'admin' || ctx.state.user?.role === 'moderator';
    const categories = ResourceCategoryService.list(includeInactive);
    Response.success(ctx, categories);
  }

  // === Version endpoints ===

  static listVersions(ctx) {
    const versions = ResourceVersionService.list(parseInt(ctx.params.id));
    Response.success(ctx, { versions });
  }

  static async addVersion(ctx) {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      return Response.error(ctx, '未登录');
    }

    const { version } = ctx.request.body;
    if (!version) {
      ctx.status = 400;
      return Response.error(ctx, '版本号不能为空');
    }

    const resource = ResourceService.getById(parseInt(ctx.params.id));
    if (!resource || (resource.user_id !== user.id && user.role !== 'admin')) {
      ctx.status = 403;
      return Response.error(ctx, '无权限');
    }

    let file_path = null;
    const file = ctx.request.files?.file;
    if (file) {
      const resourceFile = Array.isArray(file) ? file[0] : file;
      const safeName = path.basename(resourceFile.originalFilename || 'upload');
      const ext = path.extname(safeName);
      const fileName = `resource_v${Date.now()}${ext}`;
      const destPath = path.join(UPLOAD_DIR, fileName);
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.copyFileSync(resourceFile.filepath, destPath);
      fs.unlinkSync(resourceFile.filepath);
      file_path = `uploads/resources/${fileName}`;
    }

    const v = ResourceVersionService.create({
      resource_id: parseInt(ctx.params.id),
      version,
      file_path,
    });

    Response.created(ctx, v);
  }

  // === Admin methods ===

  static listAll(ctx) {
    const { limit, cursor, category_id, search, status, sort } = ctx.query;
    const result = ResourceService.getList({
      limit: parseInt(limit) || 20,
      cursor: cursor || null,
      category_id: category_id || null,
      search: search || null,
      status: status || null,
      sort: sort || null,
    });
    Response.success(ctx, { data: result.data, next_cursor: result.next_cursor, has_more: result.has_more });
  }

  static adminDelete(ctx) {
    const result = ResourceService.adminDelete(parseInt(ctx.params.id));
    if (!result) {
      ctx.status = 404;
      return Response.error(ctx, '资源不存在');
    }
    Response.success(ctx, { message: '资源已删除' });
  }

  static updateStatus(ctx) {
    const { status } = ctx.request.body;
    if (!['approved', 'pending', 'rejected'].includes(status)) {
      ctx.status = 400;
      return Response.error(ctx, '无效状态');
    }
    const resource = ResourceService.updateStatus(parseInt(ctx.params.id), status);
    if (!resource) {
      ctx.status = 404;
      return Response.error(ctx, '资源不存在');
    }
    Response.success(ctx, resource);
  }
}

module.exports = ResourceController;
```

---

### Task 5: Resource Routes Rewrite

**Files:**
- Rewrite: `MindFourm/src/routes/resource.routes.js`

- [ ] **Step 1: Rewrite resource.routes.js**

Replace entire contents:

```javascript
const Router = require('@koa/router');
const { koaBody } = require('koa-body');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/permission');
const { validate } = require('../middleware/validate');
const ResourceController = require('../controllers/resource.controller');
const ResourceCategoryService = require('../services/resource-category.service');
const { RESOURCE_SCHEMA, RESOURCE_UPDATE_SCHEMA, CATEGORY_SCHEMA, VERSION_SCHEMA } = require('../validators/resource.validator');

const resourceUpload = koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 50 * 1024 * 1024,
    maxFields: 10,
  },
  parsedMethods: ['POST', 'PUT'],
});

function createRoutes(basePrefix = '/api') {
  const prefix = `${basePrefix}/v1/resources`;
  const router = new Router({ prefix });

  // Public
  router.get('/', ResourceController.list);
  router.get('/categories', ResourceController.listCategories);
  router.get('/:id', ResourceController.getById);
  router.get('/:id/download', ResourceController.download);
  router.get('/:id/versions', ResourceController.listVersions);

  // Authenticated
  router.post('/', authMiddleware({ required: true }), resourceUpload, validate(RESOURCE_SCHEMA), ResourceController.upload);
  router.put('/:id', authMiddleware({ required: true }), resourceUpload, validate(RESOURCE_UPDATE_SCHEMA), ResourceController.update);
  router.delete('/:id', authMiddleware({ required: true }), ResourceController.deleteResource);
  router.post('/:id/versions', authMiddleware({ required: true }), resourceUpload, validate(VERSION_SCHEMA), ResourceController.addVersion);

  // Admin/Moderator
  router.get('/admin', authMiddleware({ required: true }), requireRole(['admin', 'moderator']), ResourceController.listAll);
  router.put('/:id/status', authMiddleware({ required: true }), requireRole(['admin', 'moderator']), ResourceController.updateStatus);
  router.delete('/:id/admin', authMiddleware({ required: true }), requireRole(['admin', 'moderator']), ResourceController.adminDelete);

  // Category management (admin only)
  router.post('/categories', authMiddleware({ required: true }), requireRole(['admin']), validate(CATEGORY_SCHEMA), async (ctx) => {
    const cat = ResourceCategoryService.create(ctx.request.body);
    ctx.body = { success: true, data: cat };
  });
  router.put('/categories/:id', authMiddleware({ required: true }), requireRole(['admin']), validate(CATEGORY_SCHEMA), async (ctx) => {
    const cat = ResourceCategoryService.update(parseInt(ctx.params.id), ctx.request.body);
    ctx.body = { success: true, data: cat };
  });
  router.delete('/categories/:id', authMiddleware({ required: true }), requireRole(['admin']), async (ctx) => {
    const result = ResourceCategoryService.delete(parseInt(ctx.params.id));
    if (result.error) {
      ctx.status = 400;
      return ctx.body = { success: false, message: result.error };
    }
    ctx.body = { success: true, data: result };
  });

  return router;
}

module.exports = { createRoutes };
```

---

### Task 6: Update Frontend Types & API Client

**Files:**
- Modify: `MindFourm/frontend/src/types/index.ts`
- Modify: `MindFourm/frontend/src/lib/api/client.ts`

- [ ] **Step 1: Update types/index.ts**

Find the Resource interface in `MindFourm/frontend/src/types/index.ts` (around line 289-306) and replace it, then add new interfaces after it:

```typescript
// Resources
export interface Resource {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  resource_type: 'file' | 'external';
  file_name: string | null;
  file_path: string | null;
  file_size: number;
  mime_type: string | null;
  external_url: string | null;
  version: string | null;
  content: string | null;
  content_html: string | null;
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  download_count: number;
  is_public: boolean;
  status: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  versions?: ResourceVersion[];
}

export interface ResourceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ResourceVersion {
  id: number;
  resource_id: number;
  version: string;
  file_path: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Update API client**

Find `resourceApi` in `MindFourm/frontend/src/lib/api/client.ts` (around line 419-437) and replace with:

```typescript
// Resource APIs
export const resourceApi = {
  list: (params?: { cursor?: string; limit?: number; category_id?: number; search?: string; sort?: string }) =>
    request<{ data: Resource[]; next_cursor: string | null; has_more: boolean }>(
      `/api/v1/resources${buildQueryString({ cursor: params?.cursor, limit: params?.limit, category_id: params?.category_id, search: params?.search, sort: params?.sort })}`
    ),
  getById: (id: number) =>
    request<Resource>(`/api/v1/resources/${id}`),
  download: (id: number) => `${API_BASE}/api/v1/resources/${id}/download`,
  upload: (formData: FormData) =>
    request<Resource>('/api/v1/resources', {
      method: 'POST',
      body: formData,
    }),
  update: (id: number, data: Partial<Resource>) => {
    clearCache();
    return request<Resource>(`/api/v1/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: (id: number) => {
    clearCache();
    return request<void>(`/api/v1/resources/${id}`, { method: 'DELETE' });
  },
  getCategories: () =>
    request<ResourceCategory[]>('/api/v1/resources/categories'),
  getVersions: (id: number) =>
    request<{ versions: ResourceVersion[] }>(`/api/v1/resources/${id}/versions`),
  addVersion: (id: number, formData: FormData) => {
    clearCache();
    return request<ResourceVersion>(`/api/v1/resources/${id}/versions`, {
      method: 'POST',
      body: formData,
    });
  },
};

// Resource Category Admin APIs
export const resourceCategoryApi = {
  list: () => request<ResourceCategory[]>('/api/v1/resources/categories'),
  create: (data: Omit<ResourceCategory, 'id' | 'created_at'>) => {
    clearCache();
    return request<ResourceCategory>('/api/v1/resources/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: (id: number, data: Partial<ResourceCategory>) => {
    clearCache();
    return request<ResourceCategory>(`/api/v1/resources/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: (id: number) => {
    clearCache();
    return request<void>(`/api/v1/resources/categories/${id}`, { method: 'DELETE' });
  },
};

// Resource Admin APIs
export const resourceAdminApi = {
  list: (params?: { cursor?: string; limit?: number; status?: string; category_id?: number; search?: string; sort?: string }) =>
    request<{ data: Resource[]; next_cursor: string | null; has_more: boolean }>(
      `/api/v1/resources/admin${buildQueryString({ cursor: params?.cursor, limit: params?.limit, status: params?.status, category_id: params?.category_id, search: params?.search, sort: params?.sort })}`
    ),
  updateStatus: (id: number, status: string) => {
    clearCache();
    return request<Resource>(`/api/v1/resources/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  delete: (id: number) => {
    clearCache();
    return request<void>(`/api/v1/resources/${id}/admin`, { method: 'DELETE' });
  },
};
```

- [ ] **Step 3: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty`
Expected: No errors.

---

### Task 7: MarkdownEditor & VersionSelector UI Components

**Files:**
- Create: `MindFourm/frontend/src/components/ui/markdown-editor.tsx`
- Create: `MindFourm/frontend/src/components/ui/version-selector.tsx`

- [ ] **Step 1: Create markdown-editor.tsx**

```tsx
// MindFourm/frontend/src/components/ui/markdown-editor.tsx
'use client';

import { useState } from 'react';
import MarkdownRenderer from './markdown-renderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({ value, onChange, label, placeholder, rows = 6 }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            {preview ? '编辑' : '预览'}
          </button>
        </div>
      )}
      {preview ? (
        <div className="min-h-[120px] p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)]">
          <MarkdownRenderer content={value} fallback={placeholder || '暂无内容'} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-y font-mono text-sm"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create version-selector.tsx**

```tsx
// MindFourm/frontend/src/components/ui/version-selector.tsx
'use client';

import { ResourceVersion } from '@/types';
import { Tag } from 'lucide-react';

interface VersionSelectorProps {
  versions: ResourceVersion[];
  currentVersion: string | null;
  onSelect: (version: string) => void;
}

export default function VersionSelector({ versions, currentVersion, onSelect }: VersionSelectorProps) {
  if (versions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag className="w-4 h-4 text-[var(--text-muted)]" />
      <span className="text-sm text-[var(--text-secondary)]">版本:</span>
      {versions.map((v) => (
        <button
          key={v.version}
          onClick={() => onSelect(v.version)}
          className={`px-2.5 py-1 text-xs rounded-[var(--radius-sm)] transition-colors ${
            currentVersion === v.version
              ? 'bg-[var(--primary)] text-white font-medium'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
          }`}
        >
          {v.version}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty`
Expected: No errors.

---

### Task 8: Forum Components (Card, Filters, UploadForm, SubmitForm, Detail)

**Files:**
- Create: `MindFourm/frontend/src/components/forum/resource-card.tsx`
- Create: `MindFourm/frontend/src/components/forum/resource-list-filters.tsx`
- Create: `MindFourm/frontend/src/components/forum/resource-upload-form.tsx`
- Create: `MindFourm/frontend/src/components/forum/resource-submit-form.tsx`
- Create: `MindFourm/frontend/src/components/forum/resource-detail.tsx`

- [ ] **Step 1: Create resource-card.tsx**

```tsx
// MindFourm/frontend/src/components/forum/resource-card.tsx
'use client';

import Link from 'next/link';
import { Resource } from '@/types';
import { Download, ExternalLink, FileText, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

function CategoryIcon({ icon }: { icon: string | null }) {
  const IconComponent = icon && (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[icon];
  return IconComponent ? <IconComponent className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/resources/${resource.id}`}
      className="block bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] p-4 hover:border-[var(--primary)]/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] text-[var(--text-secondary)]">
          <CategoryIcon icon={resource.category_icon} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text)] truncate">{resource.title}</h3>
          {resource.version && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] rounded-[var(--radius-sm)] font-mono">
              {resource.version}
            </span>
          )}
        </div>
      </div>

      {resource.resource_type === 'external' && (
        <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)]">
          <ExternalLink className="w-3 h-3" />
          外链资源
        </div>
      )}

      <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          {resource.file_size > 0 && <span>{formatSize(resource.file_size)}</span>}
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {resource.download_count}
          </span>
        </div>
        {resource.category_name && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-elevated)] rounded-full">
            <CategoryIcon icon={resource.category_icon} />
            {resource.category_name}
          </span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create resource-list-filters.tsx**

```tsx
// MindFourm/frontend/src/components/forum/resource-list-filters.tsx
'use client';

import { ResourceCategory } from '@/types';
import { Search, ArrowUpDown } from 'lucide-react';

interface ResourceListFiltersProps {
  categories: ResourceCategory[];
  selectedCategory: number | null;
  search: string;
  sort: string;
  onCategoryChange: (id: number | null) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export default function ResourceListFilters({
  categories, selectedCategory, search, sort,
  onCategoryChange, onSearchChange, onSortChange,
}: ResourceListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索资源..."
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Category filter */}
      <select
        value={selectedCategory ?? ''}
        onChange={(e) => onCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
        className="px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm"
      >
        <option value="">所有类别</option>
        {categories.filter(c => c.is_active).map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Sort */}
      <div className="relative">
        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="pl-10 pr-3 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm appearance-none"
        >
          <option value="created">最新发布</option>
          <option value="downloads">最多下载</option>
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create resource-upload-form.tsx**

```tsx
// MindFourm/frontend/src/components/forum/resource-upload-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resourceApi } from '@/lib/api/client';
import { ResourceCategory } from '@/types';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';

export default function ResourceUploadForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resourceApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError('请填写标题并选择文件');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('resource_type', 'file');
      if (version) formData.append('version', version);
      if (categoryId) formData.append('category_id', String(categoryId));
      formData.append('is_public', String(isPublic));
      if (content) formData.append('content', content);
      formData.append('file', file);

      const resource = await resourceApi.upload(formData);
      router.push(`/resources/${resource.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] p-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius)] text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Input
        label="标题 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="资源标题"
        required
        maxLength={200}
      />

      <Input
        label="版本号"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="例如: 1.0、v2.0（可选）"
        maxLength={50}
      />

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">类别</label>
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)]"
        >
          <option value="">不选择</option>
          {categories.filter(c => c.is_active).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <MarkdownEditor
        label="资源介绍"
        value={content}
        onChange={setContent}
        placeholder="使用 Markdown 格式介绍资源..."
        rows={8}
      />

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">可见性</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="visibility" checked={isPublic} onChange={() => setIsPublic(true)} />
            <span className="text-sm">公开</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="visibility" checked={!isPublic} onChange={() => setIsPublic(false)} />
            <span className="text-sm">私有</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">文件 *</label>
        <div className="flex items-center gap-3 p-4 border-2 border-dashed border-[var(--border)] rounded-[var(--radius)]">
          <Upload className="w-6 h-6 text-[var(--text-muted)]" />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm"
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">最大 50MB</p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm bg-[var(--bg-elevated)] rounded-[var(--radius)] hover:bg-[var(--bg-card)]"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-[var(--radius)] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? '上传中...' : '上传'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create resource-submit-form.tsx**

```tsx
// MindFourm/frontend/src/components/forum/resource-submit-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resourceApi } from '@/lib/api/client';
import { ResourceCategory } from '@/types';
import MarkdownEditor from '@/components/ui/markdown-editor';
import { Input } from '@/components/ui/input';
import { ExternalLink, Loader2 } from 'lucide-react';

export default function ResourceSubmitForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [content, setContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resourceApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !externalUrl) {
      setError('请填写标题和外链地址');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('resource_type', 'external');
      formData.append('external_url', externalUrl);
      if (version) formData.append('version', version);
      if (categoryId) formData.append('category_id', String(categoryId));
      formData.append('is_public', String(isPublic));
      if (content) formData.append('content', content);

      const resource = await resourceApi.upload(formData);
      router.push(`/resources/${resource.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] p-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius)] text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Input
        label="标题 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="资源标题"
        required
        maxLength={200}
      />

      <Input
        label="版本号"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="例如: 1.0、v2.0（可选）"
        maxLength={50}
      />

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">类别</label>
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)]"
        >
          <option value="">不选择</option>
          {categories.filter(c => c.is_active).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <MarkdownEditor
        label="资源介绍"
        value={content}
        onChange={setContent}
        placeholder="使用 Markdown 格式介绍资源..."
        rows={8}
      />

      <Input
        label="外链地址 *"
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
        placeholder="https://github.com/... 或其他资源链接"
        required
        type="url"
      />

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">可见性</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="visibility" checked={isPublic} onChange={() => setIsPublic(true)} />
            <span className="text-sm">公开</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="visibility" checked={!isPublic} onChange={() => setIsPublic(false)} />
            <span className="text-sm">私有</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm bg-[var(--bg-elevated)] rounded-[var(--radius)] hover:bg-[var(--bg-card)]"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-[var(--radius)] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? '提交中...' : '提交'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Create resource-detail.tsx**

```tsx
// MindFourm/frontend/src/components/forum/resource-detail.tsx
'use client';

import { Resource, ResourceVersion } from '@/types';
import { Download, ExternalLink, Calendar, User, FileText, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import VersionSelector from '@/components/ui/version-selector';

function CategoryIcon({ icon }: { icon: string | null }) {
  const IconComponent = icon && (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[icon];
  return IconComponent ? <IconComponent className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ResourceDetailProps {
  resource: Resource;
}

export default function ResourceDetail({ resource }: ResourceDetailProps) {
  const versions = resource.versions || [];
  const [selectedVersion, setSelectedVersion] = useState<string | null>(resource.version);

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)] p-6">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-4">{resource.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {resource.username}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(resource.created_at).toLocaleDateString('zh-CN')}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          {resource.download_count} 次下载
        </span>
        {resource.file_size > 0 && <span>{formatSize(resource.file_size)}</span>}
        {resource.category_name && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-elevated)] rounded-full text-xs">
            <CategoryIcon icon={resource.category_icon} />
            {resource.category_name}
          </span>
        )}
      </div>

      {/* Version selector */}
      {versions.length > 0 && (
        <div className="mb-4 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
          <VersionSelector
            versions={versions}
            currentVersion={selectedVersion}
            onSelect={setSelectedVersion}
          />
        </div>
      )}

      {/* Markdown content */}
      {resource.content_html ? (
        <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-card)]">
          <MarkdownRenderer content={resource.content_html} />
        </div>
      ) : resource.description ? (
        <div className="mb-6 p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-card)] text-[var(--text-secondary)]">
          {resource.description}
        </div>
      ) : null}

      {/* Action buttons */}
      {resource.resource_type === 'file' ? (
        <a
          href={`http://localhost:4000/api/v1/resources/${resource.id}/download`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
        >
          <Download className="w-5 h-5" />
          下载 {resource.file_name}
        </a>
      ) : (
        <a
          href={resource.external_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          访问外链
        </a>
      )}
    </div>
  );
}
```

Wait — `ResourceDetail` uses `useState` but I didn't import it. Fix:

```tsx
import { useState } from 'react';
```

Add this at the top of the file.

- [ ] **Step 6: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty`
Expected: No errors.

---

### Task 9: Rewrite User Pages

**Files:**
- Rewrite: `MindFourm/frontend/src/app/(public)/resources/page.tsx`
- Rewrite: `MindFourm/frontend/src/app/(public)/resources/upload/page.tsx`
- Create: `MindFourm/frontend/src/app/(public)/resources/submit/page.tsx`
- Rewrite: `MindFourm/frontend/src/app/(public)/resources/[id]/page.tsx`

- [ ] **Step 1: Rewrite resources list page**

Replace entire contents of `MindFourm/frontend/src/app/(public)/resources/page.tsx`:

```tsx
// MindFourm/frontend/src/app/(public)/resources/page.tsx
import { resourceApi } from '@/lib/api/client';
import { Resource, ResourceCategory } from '@/types';
import Link from 'next/link';
import ResourceCard from '@/components/forum/resource-card';

export const revalidate = 60;

const API_BASE = process.env.API_URL || 'http://localhost:4000';

async function fetchData(params: { category_id?: string; search?: string; sort?: string }) {
  const [resourcesRes, categoriesRes] = await Promise.all([
    fetch(`${API_BASE}/api/v1/resources?limit=30&category_id=${params.category_id || ''}&search=${params.search || ''}&sort=${params.sort || ''}`, { next: { revalidate: 60 } }),
    fetch(`${API_BASE}/api/v1/resources/categories`, { next: { revalidate: 300 } }),
  ]);

  let resources: Resource[] = [];
  let categories: ResourceCategory[] = [];

  try {
    const rJson = await resourcesRes.json();
    if (rJson.success) resources = rJson.data?.data || rJson.data || [];
  } catch { /* empty */ }

  try {
    const cJson = await categoriesRes.json();
    if (cJson.success) categories = cJson.data || [];
  } catch { /* empty */ }

  return { resources, categories };
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { category_id?: string; search?: string; sort?: string };
}) {
  const { resources, categories } = await fetchData(searchParams);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">资源中心</h1>
        <div className="flex gap-2">
          <Link
            href="/resources/submit"
            className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors"
          >
            提交外链
          </Link>
          <Link
            href="/resources/upload"
            className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
          >
            上传文件
          </Link>
        </div>
      </div>

      {/* Client-side filters wrapper */}
      <ResourceFiltersClient categories={categories} />

      {resources.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)]">
          <FileText className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-[var(--text-muted)] mb-4">暂无资源</p>
          <Link
            href="/resources/upload"
            className="inline-block px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)]"
          >
            上传第一个资源
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

// Client component for filters (uses useSearchParams)
'use client';
function ResourceFiltersClient({ categories }: { categories: ResourceCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category_id');
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'created';

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/resources?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => updateFilters({ search: e.target.value || null })}
          onKeyDown={(e) => e.key === 'Enter' && updateFilters({})}
          placeholder="搜索资源..."
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm placeholder:text-[var(--text-muted)]"
        />
      </div>
      <select
        value={selectedCategory || ''}
        onChange={(e) => updateFilters({ category_id: e.target.value || null })}
        className="px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm"
      >
        <option value="">所有类别</option>
        {categories.filter(c => c.is_active).map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => updateFilters({ sort: e.target.value })}
        className="px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm"
      >
        <option value="created">最新发布</option>
        <option value="downloads">最多下载</option>
      </select>
    </div>
  );
}

// Need imports for client component
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Search, FileText } from 'lucide-react';
```

Wait — mixing `'use client'` directive in the middle won't work. Let me split properly:

Actually the cleanest approach: the list page stays SSR but uses a separate client component for filters. Let me restructure:

**SSR page.tsx:**

```tsx
// MindFourm/frontend/src/app/(public)/resources/page.tsx
import { Resource, ResourceCategory } from '@/types';
import Link from 'next/link';
import ResourceCard from '@/components/forum/resource-card';
import ResourceFilters from '@/components/forum/resource-list-filters-client';
import { FileText } from 'lucide-react';

export const revalidate = 60;

const API_BASE = process.env.API_URL || 'http://localhost:4000';

async function fetchData(params: { category_id?: string; search?: string; sort?: string }) {
  const qs = new URLSearchParams();
  qs.set('limit', '30');
  if (params.category_id) qs.set('category_id', params.category_id);
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);

  const [resourcesRes, categoriesRes] = await Promise.all([
    fetch(`${API_BASE}/api/v1/resources?${qs.toString()}`, { next: { revalidate: 60 } }),
    fetch(`${API_BASE}/api/v1/resources/categories`, { next: { revalidate: 300 } }),
  ]);

  let resources: Resource[] = [];
  let categories: ResourceCategory[] = [];

  try {
    const rJson = await resourcesRes.json();
    if (rJson.success) resources = rJson.data?.data || rJson.data || [];
  } catch { /* empty */ }

  try {
    const cJson = await categoriesRes.json();
    if (cJson.success) categories = cJson.data || [];
  } catch { /* empty */ }

  return { resources, categories };
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { category_id?: string; search?: string; sort?: string };
}) {
  const { resources, categories } = await fetchData(searchParams);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">资源中心</h1>
        <div className="flex gap-2">
          <Link
            href="/resources/submit"
            className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors"
          >
            提交外链
          </Link>
          <Link
            href="/resources/upload"
            className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)] transition-colors"
          >
            上传文件
          </Link>
        </div>
      </div>

      <ResourceFilters
        categories={categories}
        initialCategory={searchParams.category_id}
        initialSearch={searchParams.search}
        initialSort={searchParams.sort}
      />

      {resources.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border)]">
          <FileText className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-[var(--text-muted)] mb-4">暂无资源</p>
          <Link
            href="/resources/upload"
            className="inline-block px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius)] hover:bg-[var(--primary-dark)]"
          >
            上传第一个资源
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
```

And create the client filter component:

**Create `MindFourm/frontend/src/components/forum/resource-list-filters-client.tsx`:**

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ResourceCategory } from '@/types';
import { Search } from 'lucide-react';

interface ResourceFiltersProps {
  categories: ResourceCategory[];
  initialCategory?: string;
  initialSearch?: string;
  initialSort?: string;
}

export default function ResourceFilters({ categories, initialCategory, initialSearch, initialSort }: ResourceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category_id') || initialCategory || '';
  const search = searchParams.get('search') || initialSearch || '';
  const sort = searchParams.get('sort') || initialSort || 'created';

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/resources?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => updateFilters({ search: e.target.value || null })}
          onKeyDown={(e) => e.key === 'Enter' && updateFilters({})}
          placeholder="搜索资源..."
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm placeholder:text-[var(--text-muted)]"
        />
      </div>
      <select
        value={selectedCategory}
        onChange={(e) => updateFilters({ category_id: e.target.value || null })}
        className="px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm"
      >
        <option value="">所有类别</option>
        {categories.filter(c => c.is_active).map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => updateFilters({ sort: e.target.value })}
        className="px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] text-sm"
      >
        <option value="created">最新发布</option>
        <option value="downloads">最多下载</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite upload page**

Replace entire contents of `MindFourm/frontend/src/app/(public)/resources/upload/page.tsx`:

```tsx
'use client';

import ResourceUploadForm from '@/components/forum/resource-upload-form';

export default function ResourceUploadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">上传文件</h1>
      <ResourceUploadForm />
    </div>
  );
}
```

- [ ] **Step 3: Create submit page**

```tsx
// MindFourm/frontend/src/app/(public)/resources/submit/page.tsx
'use client';

import ResourceSubmitForm from '@/components/forum/resource-submit-form';

export default function ResourceSubmitPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">提交外链</h1>
      <ResourceSubmitForm />
    </div>
  );
}
```

- [ ] **Step 4: Rewrite detail page**

Replace entire contents of `MindFourm/frontend/src/app/(public)/resources/[id]/page.tsx`:

```tsx
// MindFourm/frontend/src/app/(public)/resources/[id]/page.tsx
import Link from 'next/link';
import { resourceApi } from '@/lib/api/client';
import { Resource } from '@/types';
import { notFound } from 'next/navigation';
import ResourceDetail from '@/components/forum/resource-detail';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 60;

const API_BASE = process.env.API_URL || 'http://localhost:4000';

async function fetchResource(id: number): Promise<Resource | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/resources/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export default async function ResourceDetailPage({ params }: { params: { id: string } }) {
  const resource = await fetchResource(parseInt(params.id));
  if (!resource) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-6">
        <Link href="/resources" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">
          <ArrowLeft className="w-4 h-4" />
          返回资源中心
        </Link>
      </nav>
      <ResourceDetail resource={resource} />
    </div>
  );
}
```

- [ ] **Step 5: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty`
Expected: No errors.

---

### Task 10: Admin Pages

**Files:**
- Create: `MindFourm/frontend/src/app/admin/resources/page.tsx`
- Create: `MindFourm/frontend/src/app/admin/resources/moderation/page.tsx`
- Create: `MindFourm/frontend/src/app/admin/resource-categories/page.tsx`
- Create: `MindFourm/frontend/src/components/admin/resource-table.tsx`
- Create: `MindFourm/frontend/src/components/admin/resource-moderation-table.tsx`
- Create: `MindFourm/frontend/src/components/admin/resource-category-manager.tsx`
- Modify: `MindFourm/frontend/src/components/admin/admin-sidebar.tsx`

- [ ] **Step 1: Create resource-table.tsx**

```tsx
// MindFourm/frontend/src/components/admin/resource-table.tsx
'use client';

import { useState, useEffect } from 'react';
import { resourceAdminApi, resourceApi } from '@/lib/api/client';
import { Resource, ResourceCategory } from '@/types';
import { ExternalLink, Download, Trash2 } from 'lucide-react';

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusLabels: Record<string, string> = {
  approved: '已通过',
  pending: '待审批',
  rejected: '已拒绝',
};

export default function ResourceTable() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      resourceAdminApi.list({ limit: 50, status: status || undefined, search: search || undefined }),
      resourceApi.getCategories(),
    ]).then(([resRes, cats]) => {
      setResources(resRes.data?.data || resRes.data || []);
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [status, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此资源？')) return;
    await resourceAdminApi.delete(id);
    loadData();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await resourceAdminApi.updateStatus(id, newStatus);
    loadData();
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索资源..."
          className="flex-1 px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
        >
          <option value="">全部状态</option>
          <option value="approved">已通过</option>
          <option value="pending">待审批</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-surface-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-gray-700 bg-surface-50 dark:bg-gray-800">
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium">类型</th>
              <th className="text-left px-4 py-3 font-medium">版本</th>
              <th className="text-left px-4 py-3 font-medium">类别</th>
              <th className="text-left px-4 py-3 font-medium">大小</th>
              <th className="text-left px-4 py-3 font-medium">下载</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id} className="border-b border-surface-100 dark:border-gray-800 hover:bg-surface-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">{r.title}</td>
                <td className="px-4 py-3">
                  {r.resource_type === 'external' ? (
                    <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> 外链</span>
                  ) : (
                    <span>文件</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.version || '-'}</td>
                <td className="px-4 py-3">{r.category_name || '-'}</td>
                <td className="px-4 py-3">{formatSize(r.file_size) || '-'}</td>
                <td className="px-4 py-3 flex items-center gap-1"><Download className="w-3 h-3" /> {r.download_count}</td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="text-xs px-2 py-1 bg-surface-50 dark:bg-gray-700 border rounded"
                  >
                    <option value="approved">已通过</option>
                    <option value="pending">待审批</option>
                    <option value="rejected">已拒绝</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <div className="p-8 text-center text-surface-500">暂无资源</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create resource-moderation-table.tsx**

```tsx
// MindFourm/frontend/src/components/admin/resource-moderation-table.tsx
'use client';

import { useState, useEffect } from 'react';
import { resourceAdminApi } from '@/lib/api/client';
import { Resource } from '@/types';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { Check, X, Eye } from 'lucide-react';

export default function ResourceModerationTable() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const loadPending = () => {
    setLoading(true);
    resourceAdminApi.list({ status: 'pending', limit: 50 })
      .then(res => {
        setResources(res.data?.data || res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadPending(); }, []);

  const handleAction = async (id: number, action: 'approved' | 'rejected') => {
    await resourceAdminApi.updateStatus(id, action);
    setSelectedResource(null);
    loadPending();
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div>
      {selectedResource && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg border border-surface-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">{selectedResource.title}</h3>
          {selectedResource.content_html ? (
            <MarkdownRenderer content={selectedResource.content_html} className="mb-4" />
          ) : (
            <p className="text-surface-500 mb-4">{selectedResource.description || '暂无介绍'}</p>
          )}
          {selectedResource.resource_type === 'external' && selectedResource.external_url && (
            <p className="text-sm text-surface-500 mb-2">外链: {selectedResource.external_url}</p>
          )}
          <p className="text-sm text-surface-500 mb-4">上传者: {selectedResource.username}</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAction(selectedResource.id, 'approved')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              <Check className="w-4 h-4" /> 通过
            </button>
            <button
              onClick={() => handleAction(selectedResource.id, 'rejected')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              <X className="w-4 h-4" /> 拒绝
            </button>
            <button
              onClick={() => setSelectedResource(null)}
              className="px-4 py-2 text-sm text-surface-500 hover:text-surface-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-surface-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-gray-700 bg-surface-50 dark:bg-gray-800">
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium">类型</th>
              <th className="text-left px-4 py-3 font-medium">上传者</th>
              <th className="text-left px-4 py-3 font-medium">上传时间</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id} className="border-b border-surface-100 dark:border-gray-800 hover:bg-surface-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3">{r.resource_type === 'external' ? '外链' : '文件'}</td>
                <td className="px-4 py-3">{r.username}</td>
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString('zh-CN')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedResource(r)}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      <Eye className="w-4 h-4 inline" /> 查看
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'approved')}
                      className="text-sm text-green-600 hover:underline"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'rejected')}
                      className="text-sm text-red-600 hover:underline"
                    >
                      拒绝
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <div className="p-8 text-center text-surface-500">暂无待审批资源</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create resource-category-manager.tsx**

```tsx
// MindFourm/frontend/src/components/admin/resource-category-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import { resourceCategoryApi } from '@/lib/api/client';
import { ResourceCategory } from '@/types';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function ResourceCategoryManager() {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [editing, setEditing] = useState<ResourceCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true });
  const [error, setError] = useState<string | null>(null);

  const loadCategories = () => {
    resourceCategoryApi.list().then(setCategories).catch(() => {});
  };

  useEffect(() => { loadCategories(); }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      await resourceCategoryApi.create(form);
      setCreating(false);
      setForm({ name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true });
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setError(null);
    try {
      await resourceCategoryApi.update(editing.id, form);
      setEditing(null);
      setForm({ name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true });
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此类别？')) return;
    try {
      const res = await resourceCategoryApi.delete(id);
      loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (cat: ResourceCategory) => {
    setEditing(cat);
    setCreating(false);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description || '',
      icon: cat.icon || '', sort_order: cat.sort_order, is_active: cat.is_active,
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true });
  };

  const cancel = () => {
    setCreating(false);
    setEditing(null);
    setError(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">资源类别管理</h3>
        <button
          onClick={startCreate}
          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--primary-dark)]"
        >
          <Plus className="w-4 h-4" /> 新增类别
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {(creating || editing) && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-surface-200 dark:border-gray-700 space-y-3">
          <h4 className="font-medium">{editing ? '编辑类别' : '新增类别'}</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="名称 *"
              className="px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Slug *"
              className="px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
            />
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="图标 (lucide 名称)"
              className="px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
            />
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              placeholder="排序"
              className="px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
            />
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述"
            className="w-full px-3 py-2 bg-surface-50 dark:bg-gray-700 border border-surface-200 dark:border-gray-600 rounded-lg text-sm"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="text-sm">启用</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={editing ? handleUpdate : handleCreate}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg"
            >
              <Check className="w-4 h-4" /> {editing ? '保存' : '创建'}
            </button>
            <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 text-sm text-surface-500">
              <X className="w-4 h-4" /> 取消
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-surface-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-gray-700 bg-surface-50 dark:bg-gray-800">
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">图标</th>
              <th className="text-left px-4 py-3 font-medium">排序</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-surface-100 dark:border-gray-800 hover:bg-surface-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3">{cat.icon || '-'}</td>
                <td className="px-4 py-3">{cat.sort_order}</td>
                <td className="px-4 py-3">{cat.is_active ? '启用' : '禁用'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="text-[var(--primary)] hover:underline">
                      <Pencil className="w-4 h-4 inline" /> 编辑
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline">
                      <Trash2 className="w-4 h-4 inline" /> 删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="p-8 text-center text-surface-500">暂无类别</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create admin resources page**

```tsx
// MindFourm/frontend/src/app/admin/resources/page.tsx
'use client';

import ResourceTable from '@/components/admin/resource-table';

export default function AdminResourcesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-surface-900 dark:text-gray-100 mb-6">资源管理</h2>
      <ResourceTable />
    </div>
  );
}
```

- [ ] **Step 5: Create admin moderation page**

```tsx
// MindFourm/frontend/src/app/admin/resources/moderation/page.tsx
'use client';

import ResourceModerationTable from '@/components/admin/resource-moderation-table';

export default function AdminResourceModerationPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-surface-900 dark:text-gray-100 mb-6">资源审批</h2>
      <ResourceModerationTable />
    </div>
  );
}
```

- [ ] **Step 6: Create admin resource categories page**

```tsx
// MindFourm/frontend/src/app/admin/resource-categories/page.tsx
'use client';

import ResourceCategoryManager from '@/components/admin/resource-category-manager';

export default function AdminResourceCategoriesPage() {
  return (
    <div>
      <ResourceCategoryManager />
    </div>
  );
}
```

- [ ] **Step 7: Update admin sidebar**

In `MindFourm/frontend/src/components/admin/admin-sidebar.tsx`, add the resource management section. Find the `navSections` array (line 12-53) and add a new section after the "管理" section (after the categories/users/logs block):

```typescript
// Add this import at the top:
import { FolderTree, Users, ScrollText, Package, AlertCircle, FolderOpen } from 'lucide-react';

// Add this section to navSections array (after the "管理" section):
  {
    title: '资源',
    items: [
      { href: '/admin/resources', label: '资源管理', icon: Package, roles: ['admin', 'moderator'] },
      { href: '/admin/resources/moderation', label: '资源审批', icon: AlertCircle, roles: ['admin', 'moderator'] },
      { href: '/admin/resource-categories', label: '类别管理', icon: FolderOpen, roles: ['admin'] },
    ],
  },
```

- [ ] **Step 8: Verify compilation**

Run: `cd MindFourm/frontend && npx tsc --noEmit --pretty`
Expected: No errors.

---

### Task 11: Full Build & Smoke Test

- [ ] **Step 1: Build frontend**

Run: `cd MindFourm/frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Start services and smoke test**

Start services:
- `cd MindFourm && npm run dev` (backend, port 4000)
- `cd MindFourm/frontend && npm run dev` (frontend, port 3000)

Smoke test URLs:
- `http://localhost:3000/resources` → 资源列表页，显示搜索/筛选/排序
- `http://localhost:3000/resources/upload` → 文件上传表单（标题、版本、类别、Markdown、文件选择）
- `http://localhost:3000/resources/submit` → 外链提交表单（标题、版本、类别、Markdown、外链URL）
- `http://localhost:3000/resources/[id]` → 资源详情（Markdown 渲染、版本选择、下载/外链按钮）
- `http://localhost:3000/admin/resources` → 管理资源列表（状态筛选、搜索）
- `http://localhost:3000/admin/resources/moderation` → 资源审批页（待审批列表、通过/拒绝）
- `http://localhost:3000/admin/resource-categories` → 类别管理（CRUD）

---

## Self-Review

### 1. Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Database: resource_type, external_url, version, content, content_html, category_id | Task 0 |
| New table: resource_categories | Task 0 |
| New table: resource_versions | Task 0 |
| Data migration from old category TEXT | Task 0 |
| Seed default categories | Task 0 |
| API: public list with category_id/search/sort | Task 5 |
| API: detail with versions | Task 4, 5 |
| API: download | Task 4 |
| API: versions list/add | Task 4, 5 |
| API: resource upload (file/external) | Task 4 |
| API: resource update | Task 4 |
| API: resource delete (user/admin) | Task 4 |
| API: category CRUD | Task 5 |
| API: admin list with status filter | Task 4 |
| API: status update | Task 4 |
| Frontend: list page with filters | Task 9 |
| Frontend: upload file page | Task 9 |
| Frontend: submit external page | Task 9 |
| Frontend: detail page with markdown & versions | Task 9 |
| Frontend: admin resource list | Task 10 |
| Frontend: admin moderation | Task 10 |
| Frontend: admin category management | Task 10 |
| Markdown editor with preview | Task 7 |
| Version selector | Task 7 |
| Admin sidebar update | Task 10 |
| Type updates | Task 6 |
| API client updates | Task 6 |

All requirements covered.

### 2. Placeholder Scan

No "TBD", "TODO", or vague placeholders. All code steps contain full implementations.

### 3. Type Consistency

- `Resource` interface matches spec: `resource_type`, `external_url`, `version`, `content`, `content_html`, `category_id`, `category_name`, `category_icon`.
- `ResourceCategory` and `ResourceVersion` interfaces added.
- API client methods match backend routes.
- All component props use defined types.

### 4. Ambiguity Check

Resolved in Task 9: The list page splits SSR (data fetching) from client filters (search/category/sort) via a separate client component `resource-list-filters-client.tsx`. This avoids the `'use client'` directive conflict.

Resolved in Task 8: `resource-detail.tsx` needs `useState` import — explicitly added.

One remaining concern: The `resource-list-filters.tsx` file in the spec's component table is different from `resource-list-filters-client.tsx`. The plan creates `resource-list-filters-client.tsx` instead (the interactive version). The original name in the spec was just a placeholder.
