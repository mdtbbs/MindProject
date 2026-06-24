# MindProject 问题修复设计文档

**日期:** 2026-05-29
**主题:** MindProject 全问题修复方案 - 按服务模块垂直重构
**状态:** 待用户审核

---

## 一、背景与目标

### 问题概述

基于对 MindProject 代码库的全面审查，发现了 **56 个需要改进的问题**：

| 类别 | 高危 | 中危 | 低危 | 总计 |
|------|------|------|------|------|
| 性能问题 | 5 | 6 | 3 | 14 |
| 安全问题 | 7 | 12 | - | 19 |
| 代码质量 | 3 | 5 | 4 | 12 |
| 架构问题 | 3 | 5 | 3 | 11 |

### 修复目标

- 消除所有高危问题（18个）
- 解决中危问题（28个）
- 提升代码质量和可维护性
- 增强系统健壮性和测试覆盖

### 修复策略

- **方案选择:** 按服务模块垂直重构（方案 B）
- **执行方式:** 并行分服务执行，三个服务同时开工
- **验证策略:** 模块完成后验证，有问题继续修复
- **约束条件:** 开发测试阶段，接受模块级重构，无停机约束

---

## 二、整体架构

### 服务修复顺序

```
Phase 1: MindAuth → MindFourm → EasyManager → Shared (安全模块) → 验证
Phase 2: MindAuth → MindFourm → EasyManager (性能模块) → 验证
Phase 3: MindAuth → MindFourm → EasyManager → Shared (架构模块) → 验证
Phase 4: MindAuth → MindFourm → EasyManager → Shared (质量模块) → 验证
Phase 5: 最终集成验证
```

### 模块优先级

每个服务内部按以下优先级执行：
1. 安全模块优先 - 消除最关键风险
2. 性能模块次之 - 解决阻塞问题
3. 架构模块 - 增强健壮性
4. 质量模块最后 - 提升可维护性

---

## 三、MindAuth 重构设计

### 3.1 问题清单

| 类别 | 问题 | 文件 | 优先级 |
|------|------|------|--------|
| 🔴 安全 | 密码重置会话残留 | `routes/password.js` | P1 |
| 🔴 安全 | 硬编码测试密钥 | `tests/*.spec.js` | P1 |
| 🔴 安全 | SQL LIMIT/OFFSET注入 | `routes/admin/users.js` | P1 |
| 🟡 安全 | SameSite=Lax | `routes/auth.js` | P2 |
| 🔴 性能 | 内存泄漏 (rateLimit Map) | `middleware/rateLimit.js` | P0 |
| 🔴 架构 | 配置无验证 | `config/index.js` | P2 |
| 🟡 架构 | 无服务层 | 整体 | P3 |
| 🟡 架构 | 无迁移框架 | `db/schema-mysql.js` | P3 |
| 🟡 质量 | console.log 日志 | 30+处 | P3 |
| 🟡 质量 | oauth.js 501行 | `routes/oauth.js` | P3 |

### 3.2 安全模块修复

#### 修复项 1：密码重置会话清除

**文件:** `routes/password.js`

**修改内容:**
```javascript
async function resetPassword(token, newPassword) {
  const user = await verifyResetToken(token);
  const oldToken = user.session_token;
  
  // 更新 MySQL
  await db.query('UPDATE users SET session_token = NULL, password_hash = ? WHERE id = ?', 
    [hash, user.id]);
  
  // 清除 Redis 缓存（新增）
  if (oldToken) {
    await redis.del(`session:${oldToken}`);
  }
  
  // 删除重置令牌
  await redis.del(`reset:${token}`);
}
```

#### 修复项 2：测试密钥外部化

**新增文件:** `tests/.env.test`

```
ADMIN_SECRET=test_admin_secret_for_playwright
CLIENT_SECRET=test_oauth_client_secret_for_playwright
```

**修改文件:** `tests/specs/auth/auth.spec.js`, `tests/specs/oauth/oauth-flow.spec.js`

```javascript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
const ADMIN_SECRET = process.env.ADMIN_SECRET;
```

#### 修复项 3：SQL LIMIT/OFFSET 参数化

**文件:** `routes/admin/users.js`

**修改内容:**
```javascript
// 使用参数化查询
const effectiveLimit = Math.min(limit, maxLimit);
const offset = (page - 1) * effectiveLimit;

query += ' LIMIT ? OFFSET ?';
params.push(effectiveLimit, offset);
await pool.query(query, params);
```

#### 修复项 4：Cookie SameSite=Strict

**文件:** `routes/auth.js`

**修改内容:**
```javascript
res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE
});
```

### 3.3 性能模块修复

#### 修复项 5：Rate Limit 内存泄漏

**文件:** `middleware/rateLimit.js`

**修改内容:**
```javascript
const localRateLimitStore = new Map();
const LOCAL_STORE_MAX_SIZE = 10000;
const LOCAL_STORE_TTL = 60000;

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of localRateLimitStore) {
    if (now - entry.timestamp > LOCAL_STORE_TTL) {
      localRateLimitStore.delete(key);
    }
  }
  // 超过最大大小，删除最旧的
  if (localRateLimitStore.size > LOCAL_STORE_MAX_SIZE) {
    const entries = [...localRateLimitStore.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - LOCAL_STORE_MAX_SIZE);
    for (const [key] of toDelete) {
      localRateLimitStore.delete(key);
    }
  }
}, LOCAL_STORE_TTL);
```

### 3.4 架构模块修复

#### 修复项 6：配置验证系统

**新增文件:** `config/validation.js`

```javascript
import Joi from 'joi';

const configSchema = Joi.object({
  port: Joi.number().port().default(4001),
  adminSecret: Joi.string().min(16).required(),
  baseUrl: Joi.string().uri().required(),
  mysql: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().port().default(3306),
    user: Joi.string().required(),
    password: Joi.string().required(),
    database: Joi.string().required(),
    poolSize: Joi.number().min(1).max(100).default(10)
  }).required(),
  redis: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().port().default(6379),
    password: Joi.string().allow(''),
    db: Joi.number().min(0).max(15).default(0)
  }).required()
});

export function validateConfig(config) {
  const { error, value } = configSchema.validate(config, { 
    allowUnknown: true,
    abortEarly: false 
  });
  if (error) {
    console.error('配置验证失败:');
    error.details.forEach(d => console.error(`  - ${d.message}`));
    process.exit(1);
  }
  return value;
}
```

**修改文件:** `config/index.js`

```javascript
import { validateConfig } from './validation.js';
const rawConfig = { ... };
export const config = validateConfig(rawConfig);
```

#### 修复项 7：添加服务层

**新增目录:** `MindAuth/src/services/`

```
services/
├── auth.service.js     # 注册、登录、会话管理
├── oauth.service.js    # OAuth 授权流程
├── token.service.js    # 令牌生成、验证
├── email.service.js    # 邮件发送
├── session.service.js  # 会话缓存管理
└── user.service.js     # 用户 CRUD
```

### 3.5 质量模块修复

#### 修复项 8：结构化日志系统

**新增文件:** `utils/logger.js`

```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.cookie', 'req.headers.authorization']
});

export default logger;
```

#### 修复项 9：oauth.js 文件拆分

**拆分后目录:** `MindAuth/src/routes/oauth/`

```
oauth/
├── index.js          # 路由注册入口
├── authorize.js      # GET /authorize
├── token.js          # POST /token, /refresh
├── userinfo.js       # GET /userinfo
├── introspect.js     # POST /introspect
├── revoke.js         # POST /revoke
├── authorizations.js # GET /authorizations
└── errors.js         # OAuth 错误响应工具
```

### 3.6 MindAuth 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `routes/password.js` | 添加 Redis 会话清除 |
| 修改 | `middleware/rateLimit.js` | 添加 Map 清理机制 |
| 修改 | `routes/admin/users.js` | SQL 参数化 |
| 修改 | `routes/auth.js` | SameSite=strict |
| 修改 | `config/index.js` | 添加配置验证 |
| 新增 | `config/validation.js` | Joi 配置验证 |
| 新增 | `services/*.service.js` | 6个服务层文件 |
| 新增 | `utils/logger.js` | pino 日志 |
| 拆分 | `routes/oauth/` | oauth.js → 8个文件 |
| 新增 | `tests/.env.test` | 测试配置 |
| 修改 | `tests/*.spec.js` | 环境变量读取密钥 |

---

## 四、MindFourm 重构设计

### 4.1 问题清单

| 类别 | 问题 | 文件 | 优先级 |
|------|------|------|--------|
| 🔴 安全 | Markdown XSS 可绕过 | `utils/markdown.js` | P1 |
| 🔴 安全 | 附件下载无认证 | `routes/attachment.routes.js` | P1 |
| 🟡 安全 | 资源上传无 MIME 验证 | `routes/resource.routes.js` | P2 |
| 🟡 安全 | 用户搜索无速率限制 | `routes/user.routes.js` | P2 |
| 🟡 安全 | CORS 开发模式任意 Origin | `app.js` | P2 |
| 🔴 性能 | N+1 查询 (notification) | `services/notification.service.js` | P0 |
| 🔴 性能 | Redis KEYS 命令 | `stat.service.js`, `auth.service.js` | P0 |
| 🔴 性能 | 缓存 Map 无限制 | `frontend/lib/api/client.ts` | P1 |
| 🟡 性能 | 缓存过度清空 | `client.ts` | P2 |
| 🟡 性能 | 缺少设置缓存 | `services/setting.service.js` | P2 |
| 🔴 架构 | 无 E2E 测试 | `tests/` 空目录 | P2 |
| 🔴 架构 | 服务间无重试/超时 | `services/server.service.js` | P2 |
| 🟡 架构 | 缺少数据库索引 | `database/schema.sql` | P3 |
| 🔴 质量 | TypeScript `any` 类型 | 3处 | P1 |
| 🔴 质量 | 空 catch 块 | `frontend/app/layout.tsx` | P1 |
| 🟡 质量 | PostForm.tsx 352行 | `components/forum/` | P3 |
| 🟡 质量 | client.ts 556行 | `frontend/lib/api/` | P3 |

### 4.2 安全模块修复

#### 修复项 1：Markdown XSS - 使用 DOMPurify

**文件:** `utils/markdown.js`

**修改内容:**
```javascript
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

DOMPurify.setConfig({
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
});

DOMPurify.addHook('uponSanitizeAttribute', (node, attr) => {
  if (attr.attrName === 'href' && attr.attrValue?.startsWith('http')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function parseMarkdown(content) {
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml);
}
```

#### 修复项 2：附件下载添加认证

**文件:** `routes/attachment.routes.js`

**新增中间件:** `checkAttachmentAccess`

```javascript
async function checkAttachmentAccess(ctx, next) {
  const attachmentId = ctx.params.id;
  const attachment = await db.queryOne(`
    SELECT a.*, p.id as post_id, p.status as post_status
    FROM attachments a
    LEFT JOIN posts p ON a.post_id = p.id
    WHERE a.id = ?
  `, [attachmentId]);
  
  if (!attachment) {
    ctx.status = 404;
    return;
  }
  
  if (attachment.post_status === 'published') {
    return next();
  }
  
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status = 401;
    return;
  }
  
  return next();
}

router.get(`${basePath}/attachments/:id/download`, 
  authMiddleware, 
  checkAttachmentAccess, 
  AttachmentController.download
);
```

#### 修复项 3：资源上传 MIME 验证

**文件:** `controllers/resource.controller.js`

```javascript
const ALLOWED_RESOURCE_MIME_TYPES = [
  'application/pdf', 'application/zip',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'video/mp4', 'audio/mpeg'
];

async function uploadResource(ctx) {
  const file = ctx.request.files?.file;
  
  if (!ALLOWED_RESOURCE_MIME_TYPES.includes(file.mimetype)) {
    await fs.promises.unlink(file.filepath);
    return ctx.throw(400, `不支持的文件类型: ${file.mimetype}`);
  }
}
```

#### 修复项 4：用户搜索速率限制

**文件:** `routes/user.routes.js`

```javascript
import rateLimit from '../middleware/rate-limit.js';

const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: '搜索请求过于频繁，请稍后再试'
});

router.get(`${basePath}/users/search`, searchRateLimit, UserController.searchUsers);
```

#### 修复项 5：CORS 配置修复

**文件:** `app.js`

```javascript
app.use(cors({
  origin: (ctx) => {
    const requestOrigin = ctx.request.header.origin;
    const allowedOrigins = [config.frontendUrl, config.mindauthUrl].filter(Boolean);
    
    if (allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    
    if (process.env.NODE_ENV === 'development') {
      const localhostPattern = /^http:\/\/localhost:(\d+)$/;
      if (localhostPattern.test(requestOrigin)) {
        return requestOrigin;
      }
    }
    
    return false;
  },
  credentials: true
}));
```

### 4.3 性能模块修复

#### 修复项 6：N+1 查询修复

**文件:** `services/notification.service.js`

```javascript
export async function notifyMentionedUsers(postId, content, actorId) {
  const mentions = extractMentions(content);
  if (!mentions.length) return;
  
  // 批量查询用户
  const usernames = [...new Set(mentions.map(m => m.username))];
  const users = await db.query('SELECT id, email, username FROM users WHERE username IN (?)', [usernames]);
  const userMap = new Map(users.map(u => [u.username, u]));
  
  // 批量插入通知
  const notificationValues = mentions
    .filter(m => userMap.has(m.username))
    .map(m => [userMap.get(m.username).id, 'mention', actorId, postId, null]);
  
  if (notificationValues.length) {
    await db.query('INSERT INTO notifications (user_id, type, actor_id, post_id, reply_id) VALUES ?', [notificationValues]);
  }
}
```

#### 修复项 7：Redis KEYS 替换为 SCAN

**文件:** `services/auth.service.js`

```javascript
export async function destroyAllUserSessions(userId) {
  // 方案 B：维护用户-会话映射集
  const sessionKeys = await redis.smembers(`user:sessions:${userId}`);
  if (sessionKeys.length) {
    await redis.del(...sessionKeys.map(k => `session:${k}`));
    await redis.del(`user:sessions:${userId}`);
  }
}
```

**文件:** `services/stat.service.js`

```javascript
export async function getActiveUserCount() {
  return await redis.get('stats:active_users_24h') || 0;
}
// 登录时: INCR stats:active_users_24h
// 注销时: DECR stats:active_users_24h
```

#### 修复项 8：前端缓存优化

**文件:** `frontend/src/lib/api/client.ts`

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, { data: unknown; timestamp: number }>({
  max: 100,
  ttl: 30 * 1000
});

function invalidateCache(pattern: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

// 请求去重
const pendingRequests = new Map<string, Promise<unknown>>();

async function fetchWithDedup<T>(url: string, options?: RequestOptions): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached.data as T;
  
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }
  
  const promise = fetchJson(url, options).finally(() => {
    pendingRequests.delete(cacheKey);
  });
  pendingRequests.set(cacheKey, promise);
  
  const data = await promise;
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

#### 修复项 9：设置缓存

**文件:** `services/setting.service.js`

```javascript
const SETTINGS_CACHE_KEY = 'settings:all';
const SETTINGS_CACHE_TTL = 300;

export async function getSettings(category?: string) {
  const cached = await redis.get(SETTINGS_CACHE_KEY);
  if (cached) {
    const settings = JSON.parse(cached);
    return category ? settings[category] : settings;
  }
  
  const rows = await db.query('SELECT key, value, category FROM settings');
  const settings = {};
  for (const row of rows) {
    if (!settings[row.category]) settings[row.category] = {};
    settings[row.category][row.key] = row.value;
  }
  
  await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(settings));
  return category ? settings[category] : settings;
}
```

### 4.4 架构模块修复

#### 修复项 10：E2E 测试框架

**新增目录:** `MindFourm/tests/`

```
tests/
├── setup/
│   ├── global-setup.js
│   ├── global-teardown.js
│   └── test-helpers.js
├── specs/
│   ├── auth/login-flow.spec.js
│   ├── posts/create-post.spec.js
│   ├── posts/view-post.spec.js
│   ├── user/profile.spec.js
│   └── admin/dashboard.spec.js
└── fixtures/test-data.js
```

**新增文件:** `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:4000' }
});
```

#### 修复项 11：服务间通信健壮化

**新增文件:** `services/server-client.js`

```javascript
class ServiceClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number = 5000;
  private maxRetries: number = 3;

  async fetch(path: string, options?: RequestOptions): Promise<Response> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'X-Service-Key': this.apiKey },
          signal: AbortSignal.timeout(this.timeout)
        });
        if (response.ok) return response;
        if (response.status >= 500 && attempt < this.maxRetries) {
          await this.delay(attempt * 1000);
          continue;
        }
        throw new ServiceError(response.status, await response.text());
      } catch (err) {
        if (attempt === this.maxRetries) throw err;
        await this.delay(attempt * 1000);
      }
    }
  }
}
```

#### 修复项 12：数据库索引优化

**文件:** `database/schema.sql`

```sql
CREATE INDEX idx_posts_user_status ON posts(user_id, status, deleted_at);
CREATE INDEX idx_replies_user_deleted ON replies(user_id, deleted_at);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_resources_status_created ON resources(status, created_at DESC);
```

### 4.5 质量模块修复

#### 修复项 13：TypeScript any 类型修复

**文件:** `frontend/src/app/sitemap.ts`, `frontend/src/app/(public)/posts/[id]/page.tsx`, `frontend/src/components/admin/resource-category-manager.tsx`

```typescript
import { Post } from '@/types';
const postUrls = json.data.map((post: Post) => ...);

import { Reply } from '@/types';
{replies.map((reply: Reply, index: number) => ...)}
```

#### 修复项 14：空 catch 块修复

**文件:** `frontend/src/app/layout.tsx`

```typescript
} catch (e) {
  console.error('Failed to fetch settings:', e);
  settings = DEFAULT_SETTINGS;
}
```

#### 修复项 15：大型组件拆分

**拆分目录:** `frontend/src/components/forum/post-form/`

```
post-form/
├── index.tsx              # 主组件入口
├── PostFormContent.tsx    # 表单内容渲染
├── usePostForm.ts         # 表单状态 hook
├── useDraftPersistence.ts # 草稿保存 hook
├── useMentionInput.ts     # @mention 处理
├── ServerSelector.tsx     # 服务器选择器
├── MarkdownEditor.tsx     # Markdown 编辑器
├── validation.ts          # 表单验证逻辑
└── constants.ts           # 表单常量配置
```

### 4.6 MindFourm 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 重构 | `utils/markdown.js` | DOMPurify 替换 |
| 修改 | `routes/attachment.routes.js` | 认证中间件 |
| 修改 | `routes/resource.routes.js` | MIME 验证 |
| 修改 | `routes/user.routes.js` | 速率限制 |
| 修改 | `app.js` | CORS 白名单 |
| 重构 | `services/notification.service.js` | 批量查询 |
| 重构 | `services/auth.service.js` | SCAN 替代 KEYS |
| 重构 | `services/stat.service.js` | 计数器维护 |
| 重构 | `frontend/lib/api/client.ts` | LRU 缓存 |
| 修改 | `services/setting.service.js` | Redis 缓存 |
| 新增 | `tests/` 整个目录 | E2E 测试 |
| 新增 | `services/server-client.js` | 服务通信客户端 |
| 修改 | `database/schema.sql` | 5 个索引 |
| 修改 | `frontend/app/layout.tsx` | catch 日志 |
| 修改 | 3 处 TypeScript | 消除 any |
| 拆分 | `components/forum/post-form/` | PostForm 拆分 |

---

## 五、EasyManager 重构设计

### 5.1 问题清单

| 类别 | 问题 | 文件 | 优先级 |
|------|------|------|--------|
| 🔴 安全 | X-User-ID 头可伪造 | `middleware/requireServiceAuth.js` | P1 |
| 🔴 安全 | 弱默认 API Key | `config.js` | P1 |
| 🔴 性能 | WebSocket 广播效率 | `services/websocket.js` | P0 |
| 🔴 性能 | Docker 同步文件操作 | `services/docker.js` | P1 |
| 🔴 性能 | 内存泄漏 clientMap | `services/websocket.js` | P0 |
| 🟡 性能 | 缺少数据库索引 | `db/schema-mysql.sql` | P2 |
| 🔴 架构 | 端口分配竞态 | `utils/port.js` | P2 |
| 🔴 质量 | 权限检查重复 12次 | `routes/servers.js` | P1 |
| 🟡 质量 | console.log 日志 | 28+处 | P3 |
| 🟡 质量 | servers.js 453行 | `routes/servers.js` | P3 |
| 🟡 质量 | admin.js 400行 | `routes/admin.js` | P3 |

### 5.2 安全模块修复

#### 修复项 1：X-User-ID 验证机制

**文件:** `middleware/requireServiceAuth.js`

```javascript
export async function requireServiceAuth(ctx, next) {
  const serviceKey = ctx.headers['x-service-key'];
  if (serviceKey !== config.apiKey) {
    ctx.status = 401;
    return;
  }
  
  const userId = ctx.headers['x-user-id'];
  const userToken = ctx.headers['x-user-token'];
  
  if (userId && userToken) {
    const userInfo = await verifyTokenWithMindAuth(userToken);
    if (userInfo.sub !== userId) {
      ctx.status = 401;
      return;
    }
    ctx.state.user = { id: userId, ...userInfo };
  }
  
  return next();
}
```

#### 修复项 2：API Key 强制验证

**文件:** `config.js`

```javascript
const DANGER_API_KEYS = ['forum-service-key-dev', 'test', 'dev', 'default'];

function validateApiKey() {
  const apiKey = process.env.EASYMANAGER_API_KEY || config.apiKey;
  
  if (DANGER_API_KEYS.includes(apiKey.toLowerCase())) {
    if (process.env.NODE_ENV === 'production') {
      console.error('生产环境禁止使用默认 API Key!');
      process.exit(1);
    } else {
      const tempKey = crypto.randomBytes(32).toString('hex');
      config.apiKey = tempKey;
      console.warn('已生成临时 API Key:', tempKey);
    }
  }
  
  if (apiKey.length < 32) {
    console.error('API Key 长度不足');
    process.exit(1);
  }
}
```

### 5.3 性能模块修复

#### 修复项 3：WebSocket 广播重构

**文件:** `services/websocket.js`

**核心改进:**
- 按需广播替代全局轮询
- 变化检测避免重复发送
- 心跳检测清理僵尸连接
- LRU 缓存减少 Docker API 调用

```javascript
const clientMap = new Map();
const serverSubscribers = new Map();
const statsCache = new LRUCache({ max: 500, ttl: 5000 });

function handleSubscribe(clientId, serverId, ws) {
  if (!serverSubscribers.has(serverId)) {
    serverSubscribers.set(serverId, new Set());
  }
  serverSubscribers.get(serverId).add(clientId);
  
  sendCachedStats(ws, serverId);
  scheduleServerUpdate(serverId);
}

async function updateAndBroadcast(serverId) {
  const stats = await getServerStats(serverId);
  const statsJson = JSON.stringify(stats);
  
  if (prevStats.get(serverId) !== statsJson) {
    prevStats.set(serverId, statsJson);
    broadcast(serverId, { type: 'stats', serverId, data: stats });
  }
}
```

#### 修复项 4：Docker 文件操作异步化

**文件:** `services/docker.js`

```javascript
import { promises as fsPromises } from 'fs';

export async function createServerDirectories(serverId) {
  const serverDir = path.join(config.serversDir, serverId.toString());
  await fsPromises.mkdir(path.join(serverDir, 'config'), { recursive: true });
  await fsPromises.mkdir(path.join(serverDir, 'maps'), { recursive: true });
  await fsPromises.mkdir(path.join(serverDir, 'logs'), { recursive: true });
  await fsPromises.mkdir(path.join(serverDir, 'plugins'), { recursive: true });
  return serverDir;
}
```

#### 修复项 5：WebSocket clientMap 清理

**文件:** `services/websocket.js`

```javascript
const CLIENT_TIMEOUT = 60000;

function setupHeartbeat(ws, clientId) {
  let lastActivity = Date.now();
  
  ws.on('pong', () => { lastActivity = Date.now(); });
  
  const heartbeatInterval = setInterval(() => {
    if (Date.now() - lastActivity > CLIENT_TIMEOUT) {
      handleDisconnect(clientId);
      clearInterval(heartbeatInterval);
    } else {
      ws.ping();
    }
  }, 30000);
}

setInterval(() => {
  for (const [clientId, client] of clientMap) {
    if (client.ws.readyState !== WebSocket.OPEN) {
      handleDisconnect(clientId);
    }
  }
}, 60000);
```

#### 修复项 6：数据库索引优化

**文件:** `db/schema-mysql.sql`

```sql
CREATE INDEX idx_servers_owner_status_deleted ON servers(owner_id, status, deleted_at);
CREATE INDEX idx_servers_container ON servers(container_id);
CREATE INDEX idx_bandwidth_server_time ON bandwidth_logs(server_id, timestamp DESC);
CREATE INDEX idx_operation_logs_action_time ON operation_logs(action, created_at DESC);
CREATE INDEX idx_templates_active ON server_templates(is_active);
CREATE INDEX idx_versions_active ON server_versions(is_active);
```

### 5.4 架构模块修复

#### 修复项 7：端口分配原子化

**新增文件:** `utils/port-atomic.js`

```javascript
export async function initPortPool() {
  if (!await redis.exists(PORT_POOL_KEY)) {
    const ports = [];
    for (let port = PORT_RANGE_MIN; port <= PORT_RANGE_MAX; port++) {
      ports.push(port);
    }
    await redis.sadd(PORT_POOL_KEY, ...ports);
  }
}

export async function allocatePort(): Promise<number | null> {
  const port = await redis.spop(PORT_POOL_KEY);
  if (!port) return null;
  await redis.sadd(PORT_KEY, port);
  return parseInt(port);
}

export async function releasePort(port: number) {
  await redis.srem(PORT_KEY, port);
  await redis.sadd(PORT_POOL_KEY, port);
}
```

### 5.5 质量模块修复

#### 修复项 8：权限检查中间件提取

**新增文件:** `middleware/checkServerOwnership.js`

```javascript
export async function checkServerOwnership(ctx, next) {
  const serverId = parseInt(ctx.params.id);
  const server = await getServer(serverId);
  
  if (!server) {
    ctx.status = 404;
    return;
  }
  
  const quota = await getUserQuota(ctx.state.user.id);
  const isOwner = server.owner_id === ctx.state.user.id;
  const isAdmin = quota?.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    ctx.status = 403;
    return;
  }
  
  ctx.state.server = server;
  return next();
}
```

#### 修复项 9：结构化日志系统

**新增文件:** `utils/logger.js`

```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
```

#### 修复项 10：大文件拆分

**拆分目录:**
- `routes/servers/` - servers.js → 9 个文件
- `routes/admin/` - admin.js → 7 个文件

### 5.6 EasyManager 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 重构 | `middleware/requireServiceAuth.js` | Token 双重验证 |
| 修改 | `config.js` | API Key 强制验证 |
| 重构 | `services/websocket.js` | 按需广播 |
| 重构 | `services/docker.js` | 异步操作 |
| 新增 | `utils/port-atomic.js` | Redis 原子端口 |
| 修改 | `db/schema-mysql.sql` | 6 个索引 |
| 新增 | `middleware/checkServerOwnership.js` | 权限中间件 |
| 新增 | `services/query.js` | 共享查询 |
| 新增 | `utils/logger.js` | pino 日志 |
| 拆分 | `routes/servers/` | 9 个文件 |
| 拆分 | `routes/admin/` | 7 个文件 |

---

## 六、Shared Packages 修复设计

### 6.1 类型完善

**新增文件:** `shared/src/types/notification.ts`, `shared/src/types/post.ts`, `shared/src/types/api.ts`

**扩展文件:** `shared/src/types/user.ts`, `shared/src/types/server.ts`

### 6.2 Monorepo 工作区配置

**新增文件:** 根目录 `package.json`, `tsconfig.base.json`

```json
{
  "name": "mindproject",
  "private": true,
  "workspaces": [
    "MindAuth", "MindFourm", "MindFourm/frontend",
    "EasyManager/backend", "EasyManager/frontend", "shared"
  ]
}
```

---

## 七、执行计划

### 时间线

| Week | Phase | 内容 |
|------|-------|------|
| 1 | 安全模块 | MindAuth + MindFourm + EasyManager 安全修复 |
| 2 | 性能模块 | MindAuth + MindFourm + EasyManager 性能修复 |
| 3 | 架构模块 | MindAuth + MindFourm + EasyManager + Shared 架构修复 |
| 4 | 质量模块 | MindAuth + MindFourm + EasyManager + Shared 质量修复 |
| 5 | 集成验证 | 运行所有测试套件，最终验收 |

### 并行执行矩阵

| Phase | MindAuth | MindFourm | EasyManager | Shared |
|-------|----------|-----------|-------------|--------|
| 安全 | 4项 | 5项 | 2项 | - |
| 性能 | 1项 | 6项 | 4项 | - |
| 架构 | 2项 | 3项 | 2项 | 2项 |
| 质量 | 2项 | 4项 | 4项 | 5项 |

### 验证标准

**MindAuth:**
- `npm run dev` 启动成功
- `npx playwright test` 全通过
- 注册→登录→OAuth→密码重置流程

**MindFourm:**
- 后端/前端启动成功
- 新增 E2E 测试通过
- 发帖→回复→@mention→附件流程

**EasyManager:**
- 后端/前端启动成功
- WebSocket 连接正常
- 创建→审批→启动→停止→删除流程

**Shared:**
- `npm run build` 成功
- 类型导出正确
- 前端可正常引用

---

## 八、总修改统计

| 项目 | 新增 | 修改 | 删除 |
|------|------|------|------|
| MindAuth | 7 | 6 | 0 |
| MindFourm | 15+ | 12 | 0 |
| EasyManager | 4 | 3 | 0 |
| Shared | 6 | 2 | 0 |
| 根目录 | 2 | 0 | 0 |
| **总计** | ~34 | 23 | 0 |

---

## 九、依赖安装清单

| 服务 | 新依赖 |
|------|--------|
| MindAuth | `joi`, `pino`, `dotenv` |
| MindFourm | `isomorphic-dompurify`, `@playwright/test`, `lru-cache`, `joi` |
| EasyManager | `pino`, `lru-cache` |

---

**文档状态:** 待用户审核
**下一步:** 用户审核后调用 writing-plans 创建实施计划