# MindFourm 服务修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 MindFourm 论坛系统的 17 个问题，包括安全漏洞、性能瓶颈、架构缺陷和代码质量问题。

**Architecture:** 按模块优先级执行：安全模块 → 性能模块 → 架构模块 → 质量模块。每个模块完成后验证。

**Tech Stack:** Koa.js, SQLite, Redis, Next.js 14, Playwright, DOMPurify, LRU-Cache

---

## 文件结构

```
MindFourm/
├── src/
│   ├── utils/
│   │   └── markdown.js       # 重构: DOMPurify 替换正则
│   ├── routes/
│   │   ├── attachment.routes.js  # 修改: 添加认证
│   │   ├── resource.routes.js    # 修改: MIME 验证
│   │   └── user.routes.js        # 修改: 速率限制
│   ├── services/
│   │   ├── notification.service.js  # 重构: 批量查询
│   │   ├── auth.service.js          # 重构: SCAN 替代 KEYS
│   │   ├── stat.service.js          # 重构: 计数器
│   │   ├── setting.service.js       # 修改: Redis 缓存
│   │   └── server-client.js         # 新增: 服务通信客户端
│   ├── app.js                # 修改: CORS 白名单
│   └── database/
│   │   └── schema.sql        # 修改: 添加索引
├── frontend/
│   ├── src/
│   │   ├── lib/api/
│   │   │   └── client.ts     # 重构: LRU 缓存 + 请求去重
│   │   ├── app/
│   │   │   ├── layout.tsx    # 修改: catch 块日志
│   │   │   ├── sitemap.ts    # 修改: 消除 any
│   │   │   └── (public)/posts/[id]/page.tsx  # 修改: 消除 any
│   │   ├── components/
│   │   │   ├── admin/resource-category-manager.tsx  # 修改: 消除 any
│   │   │   └── forum/post-form/  # 新增: 拆分目录
│   │   │       ├── index.tsx
│   │   │       ├── usePostForm.ts
│   │   │       ├── useDraftPersistence.ts
│   │   │       ├── useMentionInput.ts
│   │   │       ├── validation.ts
│   │   │       └── constants.ts
│   │   └── types/
│   │       └── index.ts      # 确保 Post, Reply 类型定义
├── tests/                    # 新增: E2E 测试目录
│   ├── setup/
│   │   ├── global-setup.js
│   │   ├── global-teardown.js
│   │   └── test-helpers.js
│   ├── specs/
│   │   ├── auth/login-flow.spec.js
│   │   ├── posts/create-post.spec.js
│   │   ├── posts/view-post.spec.js
│   │   └── user/profile.spec.js
│   └── fixtures/test-data.js
├── playwright.config.ts      # 新增: Playwright 配置
```

---

## Phase 1: 安全模块 (5项)

### Task 1: Markdown XSS - 使用 DOMPurify

**Files:**
- Modify: `MindFourm/src/utils/markdown.js`

- [ ] **Step 1: 安装 DOMPurify**

Run: `cd MindFourm && npm install isomorphic-dompurify`
Expected: isomorphic-dompurify 安装成功

- [ ] **Step 2: 重构 markdown.js**

完全替换正则过滤为 DOMPurify：

```javascript
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// 配置允许的标签
DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'a', 'img', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
});

// 自动给外链添加安全属性
DOMPurify.addHook('uponSanitizeAttribute', (node, attr) => {
  if (attr.attrName === 'href' && attr.attrValue?.startsWith('http')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function parseMarkdown(content) {
  if (!content) return '';
  const rawHtml = marked.parse(content, { breaks: true, gfm: true });
  return DOMPurify.sanitize(rawHtml);
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html);
}
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/utils/markdown.js MindFourm/package.json
git commit -m "fix(mindfourm): replace regex XSS filter with DOMPurify"
```

---

### Task 2: 附件下载添加认证

**Files:**
- Modify: `MindFourm/src/routes/attachment.routes.js`

- [ ] **Step 1: 读取 attachment.routes.js**

Run: `cat MindFourm/src/routes/attachment.routes.js`
Expected: 找到 download 路由定义

- [ ] **Step 2: 添加认证中间件**

```javascript
import authMiddleware from '../middleware/auth.js';

// 新增: 附件访问权限检查中间件
async function checkAttachmentAccess(ctx, next) {
  const attachmentId = ctx.params.id;
  
  // 获取附件信息
  const attachment = await db.queryOne(`
    SELECT a.*, 
      p.id as post_id, p.status as post_status, p.user_id as post_user_id,
      r.user_id as reply_user_id
    FROM attachments a
    LEFT JOIN posts p ON a.post_id = p.id
    LEFT JOIN replies r ON a.reply_id = r.id
    WHERE a.id = ?
  `, [attachmentId]);
  
  if (!attachment) {
    ctx.status = 404;
    ctx.body = { success: false, message: '附件不存在' };
    return;
  }
  
  // 公开帖子的附件可下载
  if (attachment.post_status === 'published') {
    return next();
  }
  
  // 非公开帖子需要验证用户
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status = 401;
    ctx.body = { success: false, message: '请先登录' };
    return;
  }
  
  // 检查是否是帖子作者或回复作者
  const isOwner = attachment.post_user_id === userId || attachment.reply_user_id === userId;
  if (!isOwner) {
    ctx.status = 403;
    ctx.body = { success: false, message: '无权访问此附件' };
    return;
  }
  
  return next();
}

// 修改 download 路由
router.get(`${basePath}/attachments/:id/download`, 
  authMiddleware,
  checkAttachmentAccess,
  AttachmentController.download
);
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/routes/attachment.routes.js
git commit -m "fix(mindfourm): add auth middleware to attachment download"
```

---

### Task 3: 资源上传 MIME 验证

**Files:**
- Modify: `MindFourm/src/controllers/resource.controller.js`

- [ ] **Step 1: 定义允许的 MIME 类型**

在文件顶部添加：

```javascript
const ALLOWED_RESOURCE_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'audio/ogg'
];
```

- [ ] **Step 2: 在 uploadResource 中添加验证**

```javascript
export async function uploadResource(ctx) {
  const file = ctx.request.files?.file;
  
  if (!file) {
    ctx.status = 400;
    ctx.body = { success: false, message: '请上传文件' };
    return;
  }
  
  // MIME 类型验证
  if (!ALLOWED_RESOURCE_MIME_TYPES.includes(file.mimetype)) {
    // 删除临时文件
    await fs.promises.unlink(file.filepath);
    ctx.status = 400;
    ctx.body = { success: false, message: `不支持的文件类型: ${file.mimetype}` };
    return;
  }
  
  // ... 继续原有逻辑
}
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/controllers/resource.controller.js
git commit -m "fix(mindfourm): add MIME type validation for resource uploads"
```

---

### Task 4: 用户搜索速率限制

**Files:**
- Modify: `MindFourm/src/routes/user.routes.js`

- [ ] **Step 1: 找到用户搜索路由**

Run: `grep -n "users/search" MindFourm/src/routes/user.routes.js`
Expected: 找到搜索路由

- [ ] **Step 2: 添加速率限制中间件**

```javascript
import rateLimit from '../middleware/rate-limit.js';

const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20,             // 每分钟最多20次搜索
  message: '搜索请求过于频繁，请稍后再试'
});

// 在搜索路由上应用
router.get(`${basePath}/users/search`, searchRateLimit, UserController.searchUsers);
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/routes/user.routes.js
git commit -m "fix(mindfourm): add rate limit to user search endpoint"
```

---

### Task 5: CORS 配置修复

**Files:**
- Modify: `MindFourm/src/app.js`

- [ ] **Step 1: 找到 CORS 配置**

Run: `grep -n "cors" MindFourm/src/app.js`
Expected: 找到 cors 中间件配置

- [ ] **Step 2: 修改为严格白名单**

```javascript
import cors from '@koa/cors';

app.use(cors({
  origin: (ctx) => {
    const requestOrigin = ctx.request.header.origin;
    
    // 配置允许的来源
    const allowedOrigins = [
      config.frontendUrl,      // http://localhost:3000
      config.mindauthUrl,      // http://localhost:4001
      config.easymanagerUrl    // http://localhost:3001
    ].filter(Boolean);
    
    // 白名单检查
    if (allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    
    // 开发模式允许 localhost 端口
    if (process.env.NODE_ENV === 'development') {
      const localhostPattern = /^http:\/\/localhost:(\d+)$/;
      if (localhostPattern.test(requestOrigin)) {
        return requestOrigin;
      }
    }
    
    // 拒绝其他来源
    return false;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Service-Key']
}));
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/app.js
git commit -m "fix(mindfourm): enforce CORS whitelist instead of allow-all in dev"
```

---

## Phase 1 验证

- [ ] **启动 MindFourm 后端**

Run: `cd MindFourm && npm run dev`
Expected: 服务正常启动

- [ ] **启动 MindFourm 前端**

Run: `cd MindFourm/frontend && npm run dev`
Expected: 前端正常启动

- [ ] **手动验证 Markdown 渲染**

创建帖子，包含：
- `<img src=x onerror=alert(1)>` 应被过滤
- `<a href="http://example.com">link</a>` 应有 target="_blank"

---

## Phase 2: 性能模块 (6项)

### Task 6: N+1 查询修复 - notification.service.js

**Files:**
- Modify: `MindFourm/src/services/notification.service.js`

- [ ] **Step 1: 找到 notifyMentionedUsers 函数**

Run: `grep -n "notifyMentionedUsers" MindFourm/src/services/notification.service.js`
Expected: 找到函数定义

- [ ] **Step 2: 重构为批量查询**

```javascript
export async function notifyMentionedUsers(postId, content, actorId) {
  const mentions = extractMentions(content);
  if (!mentions.length) return;
  
  // 批量查询用户（原：每个用户单独查询）
  const usernames = [...new Set(mentions.map(m => m.username))];
  const users = await db.query(
    'SELECT id, email, username FROM users WHERE username IN (?)',
    [usernames]
  );
  const userMap = new Map(users.map(u => [u.username, u]));
  
  // 单次查询帖子信息
  const post = await db.queryOne(`
    SELECT p.id, p.title, p.user_id, u.username as author_name
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [postId]);
  
  // 单次查询操作者信息
  const actor = await db.queryOne('SELECT username FROM users WHERE id = ?', [actorId]);
  
  // 批量插入通知
  const notificationValues = mentions
    .filter(m => userMap.has(m.username) && userMap.get(m.username).id !== actorId)
    .map(m => [userMap.get(m.username).id, 'mention', actorId, postId, null]);
  
  if (notificationValues.length) {
    await db.query(
      'INSERT INTO notifications (user_id, type, actor_id, post_id, reply_id) VALUES ?',
      [notificationValues]
    );
  }
  
  // 异步批量发送邮件
  const emailTasks = notificationValues.map(([userId]) => 
    sendNotificationEmail(userId, 'mention', { post, actor }).catch(() => {})
  );
  Promise.all(emailTasks); // 不阻塞
}
```

- [ ] **Step 3: 同样重构 notifyPostAuthor 和 notifyReplyMention**

应用相同的批量查询模式。

- [ ] **Step 4: Commit**

```bash
git add MindFourm/src/services/notification.service.js
git commit -m "fix(mindfourm): batch queries in notification service to fix N+1"
```

---

### Task 7: Redis KEYS 替换为 SCAN/Members

**Files:**
- Modify: `MindFourm/src/services/auth.service.js`
- Modify: `MindFourm/src/services/stat.service.js`

- [ ] **Step 1: 重构 auth.service.js - destroyAllUserSessions**

方案 A：维护用户-会话映射集

```javascript
export async function destroyAllUserSessions(userId) {
  // 使用 Set 替代 KEYS
  const sessionKeys = await redis.smembers(`user:sessions:${userId}`);
  
  if (sessionKeys.length) {
    // 批量删除会话
    await redis.del(...sessionKeys.map(k => `session:${k}`));
    // 删除映射集
    await redis.del(`user:sessions:${userId}`);
  }
}

// 在创建会话时添加映射
export async function createSession(userId, token) {
  await redis.setex(`session:${token}`, SESSION_TTL, JSON.stringify({ userId }));
  await redis.sadd(`user:sessions:${userId}`, token); // 新增
}
```

- [ ] **Step 2: 重构 stat.service.js - getActiveUserCount**

```javascript
// 方案：维护计数器
export async function getActiveUserCount() {
  return parseInt(await redis.get('stats:active_users_24h') || '0');
}

// 在登录时
export async function recordLogin(userId) {
  await redis.incr('stats:active_users_24h');
  await redis.expire('stats:active_users_24h', 24 * 60 * 60);
}

// 在注销时
export async function recordLogout(userId) {
  await redis.decr('stats:active_users_24h');
}
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/services/auth.service.js MindFourm/src/services/stat.service.js
git commit -m "fix(mindfourm): replace Redis KEYS with SCAN/members pattern"
```

---

### Task 8: 前端缓存优化 - LRU Cache

**Files:**
- Modify: `MindFourm/frontend/src/lib/api/client.ts`

- [ ] **Step 1: 安装 LRU-Cache**

Run: `cd MindFourm/frontend && npm install lru-cache`
Expected: lru-cache 安装成功

- [ ] **Step 2: 替换普通 Map 为 LRU Cache**

```typescript
import { LRUCache } from 'lru-cache';

// 替换
// const cache = new Map<string, { data: unknown; timestamp: number }>();
// 为
const cache = new LRUCache<string, { data: unknown; timestamp: number }>({
  max: 100,           // 最多100个条目
  ttl: 30 * 1000,     // 30秒过期
  updateAgeOnGet: true
});

// 修改 getCache
function getCache(key: string): unknown | undefined {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 30 * 1000) {
    return cached.data;
  }
  return undefined;
}

// 修改 setCache
function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}
```

- [ ] **Step 3: 实现选择性清除**

```typescript
function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

// 修改 clearCache 为选择性清除
// function clearCache(): void { cache.clear(); } // 删除

// 在 mutation 操作中使用
async function createPost(data: CreatePostData): Promise<Post> {
  const result = await fetchJson<Post>('/api/posts', { method: 'POST', body: data });
  invalidateCache('/api/posts');
  invalidateCache('/api/v1/posts');
  invalidateCache(`/api/users/${data.userId}/posts`);
  return result;
}
```

- [ ] **Step 4: 实现请求去重**

```typescript
const pendingRequests = new Map<string, Promise<unknown>>();

async function fetchWithDedup<T>(url: string, options?: RequestOptions): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options || {})}`;
  
  // 检查缓存
  const cached = getCache(cacheKey);
  if (cached !== undefined) {
    return cached as T;
  }
  
  // 检查是否已有相同请求进行中
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }
  
  // 发起新请求
  const promise = (async () => {
    try {
      const data = await fetchJson<T>(url, options);
      setCache(cacheKey, data);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();
  
  pendingRequests.set(cacheKey, promise);
  return promise;
}

// 替换原有 fetchJson 调用为 fetchWithDedup
```

- [ ] **Step 5: Commit**

```bash
git add MindFourm/frontend/src/lib/api/client.ts MindFourm/frontend/package.json
git commit -m "perf(mindfourm): replace cache Map with LRU cache and selective invalidation"
```

---

### Task 9: 设置缓存

**Files:**
- Modify: `MindFourm/src/services/setting.service.js`

- [ ] **Step 1: 添加 Redis 缓存**

```javascript
const SETTINGS_CACHE_KEY = 'settings:all';
const SETTINGS_CACHE_TTL = 300; // 5分钟

export async function getSettings(category) {
  // 检查 Redis 缓存
  const cached = await redis.get(SETTINGS_CACHE_KEY);
  if (cached) {
    const settings = JSON.parse(cached);
    return category ? settings[category] : settings;
  }
  
  // 从数据库加载
  const rows = await db.query('SELECT key, value, category FROM settings');
  const settings = {};
  
  for (const row of rows) {
    if (!settings[row.category]) settings[row.category] = {};
    settings[row.category][row.key] = row.value;
  }
  
  // 缓存
  await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(settings));
  
  return category ? settings[category] : settings;
}

export async function updateSetting(category, key, value) {
  await db.query(
    'UPDATE settings SET value = ?, updated_at = NOW() WHERE category = ? AND key = ?',
    [value, category, key]
  );
  
  // 清除缓存
  await redis.del(SETTINGS_CACHE_KEY);
}
```

- [ ] **Step 2: Commit**

```bash
git add MindFourm/src/services/setting.service.js
git commit -m "perf(mindfourm): add Redis cache for settings"
```

---

## Phase 2 验证

- [ ] **验证服务启动**

Run: `cd MindFourm && npm run dev`
Expected: 服务正常，无 Redis KEYS 调用

- [ ] **验证前端缓存**

打开浏览器 DevTools，验证：
- 相同请求不发重复
- mutation 后只清除相关缓存

---

## Phase 3: 架构模块 (3项)

### Task 10: E2E 测试框架搭建

**Files:**
- Create: `MindFourm/tests/setup/global-setup.js`
- Create: `MindFourm/tests/setup/global-teardown.js`
- Create: `MindFourm/tests/setup/test-helpers.js`
- Create: `MindFourm/tests/fixtures/test-data.js`
- Create: `MindFourm/tests/specs/auth/login-flow.spec.js`
- Create: `MindFourm/tests/specs/posts/create-post.spec.js`
- Create: `MindFourm/playwright.config.ts`

- [ ] **Step 1: 安装 Playwright**

Run: `cd MindFourm && npm install @playwright/test`
Run: `cd MindFourm && npx playwright install chromium`

- [ ] **Step 2: 创建 playwright.config.ts**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:4000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

- [ ] **Step 3: 创建 test-helpers.js**

```javascript
export async function login(page, username, password) {
  await page.goto('/login');
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|$)/);
}

export async function createTestUser() {
  // 调用 MindAuth API 创建测试用户
}
```

- [ ] **Step 4: 创建 login-flow.spec.js**

```javascript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should redirect to MindAuth on login click', async ({ page }) => {
    await page.goto('/');
    await page.click('text=登录');
    
    // 应重定向到 MindAuth
    await expect(page).toHaveURL(/localhost:4001/);
  });
  
  test('should show user info after OAuth login', async ({ page }) => {
    // 模拟 OAuth 回调
    await page.goto('/callback?code=test-code');
    
    // 应显示用户名
    await expect(page.locator('.user-name')).toBeVisible();
  });
});
```

- [ ] **Step 5: 创建 create-post.spec.js**

```javascript
import { test, expect } from '@playwright/test';
import { login } from '../setup/test-helpers.js';

test.describe('Create Post', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'testuser', 'testpass');
  });
  
  test('should create post with markdown content', async ({ page }) => {
    await page.goto('/posts/new');
    
    await page.fill('[name="title"]', 'Test Post Title');
    await page.fill('[name="content"]', '# Heading\n\nThis is **bold** text.');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/posts\/\d+/);
    await expect(page.locator('h1')).toContainText('Test Post Title');
  });
});
```

- [ ] **Step 6: Commit**

```bash
git add MindFourm/tests/ MindFourm/playwright.config.ts MindFourm/package.json
git commit -m "feat(mindfourm): add E2E test framework with Playwright"
```

---

### Task 11: 服务间通信健壮化

**Files:**
- Create: `MindFourm/src/services/server-client.js`

- [ ] **Step 1: 创建 ServiceClient 类**

```javascript
class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

class ServiceClient {
  constructor(baseUrl, apiKey, options = {}) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = options.timeout || 5000;
    this.maxRetries = options.retries || 3;
  }
  
  async fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'X-Service-Key': this.apiKey,
      ...options.headers
    };
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: AbortSignal.timeout(this.timeout)
        });
        
        if (response.ok) {
          return response;
        }
        
        // 5xx 错误重试
        if (response.status >= 500 && attempt < this.maxRetries) {
          await this.delay(attempt * 1000);
          continue;
        }
        
        throw new ServiceError(response.status, await response.text());
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new ServiceError(408, 'Request timeout');
        }
        
        if (attempt === this.maxRetries) {
          throw new ServiceError(503, `Service unavailable after ${this.maxRetries} retries`);
        }
        
        await this.delay(attempt * 1000);
      }
    }
  }
  
  async get(path) {
    const response = await this.fetch(path);
    return response.json();
  }
  
  async post(path, body) {
    const response = await this.fetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { ServiceClient, ServiceError };
```

- [ ] **Step 2: 修改 server.service.js 使用 ServiceClient**

```javascript
import { ServiceClient } from './server-client.js';

const easyManagerClient = new ServiceClient(
  config.easymanager.baseUrl,
  config.easymanager.apiKey,
  { timeout: 10000, retries: 3 }
);

export async function getPublicServers() {
  return easyManagerClient.get('/api/forum/servers/public');
}

export async function getUserServers(userId) {
  return easyManagerClient.get(`/api/forum/user/${userId}/servers`);
}
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/services/server-client.js MindFourm/src/services/server.service.js
git commit -m "feat(mindfourm): add robust service client with retry and timeout"
```

---

### Task 12: 数据库索引优化

**Files:**
- Modify: `MindFourm/src/database/schema.sql`

- [ ] **Step 1: 添加索引到 schema.sql**

在文件末尾添加：

```sql
-- 性能优化索引

-- 帖子列表查询优化
CREATE INDEX IF NOT EXISTS idx_posts_user_status 
ON posts(user_id, status, deleted_at);

-- 回复列表优化
CREATE INDEX IF NOT EXISTS idx_replies_user_deleted 
ON replies(user_id, deleted_at);

-- 通知查询优化
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- 消息对话优化
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(sender_id, recipient_id, created_at);

-- 资源中心优化
CREATE INDEX IF NOT EXISTS idx_resources_status_created 
ON resources(status, created_at DESC);
```

- [ ] **Step 2: 执行索引创建（如果数据库已存在）**

```bash
cd MindFourm
sqlite3 data/forum.db "CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status, deleted_at);"
sqlite3 data/forum.db "CREATE INDEX IF NOT EXISTS idx_replies_user_deleted ON replies(user_id, deleted_at);"
sqlite3 data/forum.db "CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);"
sqlite3 data/forum.db "CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at);"
sqlite3 data/forum.db "CREATE INDEX IF NOT EXISTS idx_resources_status_created ON resources(status, created_at DESC);"
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/src/database/schema.sql
git commit -m "perf(mindfourm): add database indexes for common queries"
```

---

## Phase 3 验证

- [ ] **运行 E2E 测试**

Run: `cd MindFourm && npx playwright test`
Expected: 测试框架正常运行（可能有失败，后续修复）

- [ ] **验证服务通信**

模拟 EasyManager 不可用，验证重试机制。

---

## Phase 4: 质量模块 (4项)

### Task 13: TypeScript `any` 类型修复

**Files:**
- Modify: `MindFourm/frontend/src/app/sitemap.ts`
- Modify: `MindFourm/frontend/src/app/(public)/posts/[id]/page.tsx`
- Modify: `MindFourm/frontend/src/components/admin/resource-category-manager.tsx`

- [ ] **Step 1: 确保 types/index.ts 有 Post 和 Reply 类型**

```typescript
// 确认或添加
export interface Post {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  content: string;
  content_html?: string;
  status: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  user?: User;
  category?: { id: number; name: string };
  reply_count?: number;
}

export interface Reply {
  id: number;
  post_id: number;
  user_id: number;
  parent_reply_id?: number;
  content: string;
  content_html?: string;
  status: string;
  created_at: string;
  user?: User;
}
```

- [ ] **Step 2: 修复 sitemap.ts**

```typescript
// 替换
// postUrls = json.data.map((post: any) => ({
// 为
import { Post } from '@/types';

postUrls = json.data.map((post: Post) => ({
  url: `https://mindustry.cn/posts/${post.id}`,
  lastModified: new Date(post.created_at),
}));
```

- [ ] **Step 3: 修复 posts/[id]/page.tsx**

```typescript
// 替换
// {replies.map((reply: any, index: number) => (
// 为
import { Reply } from '@/types';

{replies.map((reply: Reply, index: number) => (
  <ReplyItem key={reply.id} reply={reply} />
))}
```

- [ ] **Step 4: 修复 resource-category-manager.tsx**

```typescript
// 替换
// } catch (err: any) {
// 为
} catch (err) {
  if (err instanceof Error) {
    console.error('Failed to save category:', err.message);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add MindFourm/frontend/src/app/sitemap.ts MindFourm/frontend/src/app/(public)/posts/[id]/page.tsx MindFourm/frontend/src/components/admin/resource-category-manager.tsx MindFourm/frontend/src/types/index.ts
git commit -m "fix(mindfourm): remove TypeScript any types in frontend"
```

---

### Task 14: 空 catch 块修复

**Files:**
- Modify: `MindFourm/frontend/src/app/layout.tsx`

- [ ] **Step 1: 找到空 catch 块**

Run: `grep -n "catch(e) {}" MindFourm/frontend/src/app/layout.tsx`
Expected: 找到空 catch

- [ ] **Step 2: 添加日志记录**

```typescript
// 替换
// } catch(e) {}
// 为
} catch (e) {
  console.error('Failed to fetch settings:', e);
  // 使用默认设置
  settings = {
    siteName: 'Mindustry Forum',
    siteDescription: '',
    ...DEFAULT_SETTINGS
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/app/layout.tsx
git commit -m "fix(mindfourm): add error logging in layout catch block"
```

---

### Task 15: PostForm 组件拆分

**Files:**
- Create: `MindFourm/frontend/src/components/forum/post-form/index.tsx`
- Create: `MindFourm/frontend/src/components/forum/post-form/usePostForm.ts`
- Create: `MindFourm/frontend/src/components/forum/post-form/useDraftPersistence.ts`
- Create: `MindFourm/frontend/src/components/forum/post-form/validation.ts`

- [ ] **Step 1: 创建 post-form 目录**

Run: `mkdir -p MindFourm/frontend/src/components/forum/post-form`

- [ ] **Step 2: 创建 usePostForm.ts**

```typescript
import { useState } from 'react';
import { useDraftPersistence } from './useDraftPersistence';

export interface FormErrors {
  title?: string;
  content?: string;
  categoryId?: string;
}

export function usePostForm(initialData?: { title?: string; content?: string }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const { saveDraft, loadDraft, clearDraft } = useDraftPersistence('post-form');
  
  // 初始化加载草稿
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      if (draft.categoryId) setCategoryId(draft.categoryId);
    }
  }, []);
  
  // 自动保存草稿
  useEffect(() => {
    saveDraft({ title, content, categoryId });
  }, [title, content, categoryId]);
  
  const validate = () => {
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = '标题不能为空';
    if (title.length > 100) newErrors.title = '标题过长';
    if (!content.trim()) newErrors.content = '内容不能为空';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return {
    title, setTitle,
    content, setContent,
    categoryId, setCategoryId,
    errors,
    validate,
    clearDraft
  };
}
```

- [ ] **Step 3: 创建 useDraftPersistence.ts**

```typescript
import { useCallback } from 'react';

const DRAFT_KEY_PREFIX = 'draft:';

export function useDraftPersistence(formId: string) {
  const key = `${DRAFT_KEY_PREFIX}${formId}`;
  
  const saveDraft = useCallback((data: Record<string, unknown>) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key]);
  
  const loadDraft = useCallback(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }, [key]);
  
  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);
  
  return { saveDraft, loadDraft, clearDraft };
}
```

- [ ] **Step 4: 创建 validation.ts**

```typescript
export const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  content: {
    required: true,
    minLength: 1
  },
  categoryId: {
    required: true
  }
};

export function validateField(field: string, value: unknown): string | undefined {
  const rules = VALIDATION_RULES[field];
  if (!rules) return undefined;
  
  if (rules.required && !value) {
    return `${field}不能为空`;
  }
  
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${field}长度不足`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${field}过长`;
    }
  }
  
  return undefined;
}
```

- [ ] **Step 5: 创建 index.tsx 入口**

```typescript
import { usePostForm } from './usePostForm';
import { PostFormContent } from './PostFormContent';

export default function PostForm({ initialData }: PostFormProps) {
  const form = usePostForm(initialData);
  
  return <PostFormContent form={form} />;
}
```

- [ ] **Step 6: 更新原 PostForm.tsx 引用**

修改使用原 post-form.tsx 的地方，改为引用新目录：

```typescript
// 替换
// import PostForm from './PostForm';
// 为
import PostForm from './post-form';
```

- [ ] **Step 7: Commit**

```bash
git add MindFourm/frontend/src/components/forum/post-form/
git commit -m "refactor(mindfourm): split PostForm into hooks and focused files"
```

---

## Phase 4 验证

- [ ] **运行 TypeScript 类型检查**

Run: `cd MindFourm/frontend && npx tsc --noEmit`
Expected: 无 any 类型错误

- [ ] **运行 E2E 测试**

Run: `cd MindFourm && npx playwright test`
Expected: 新增测试可运行

---

## 最终验证清单

- [ ] MindFourm 后端正常启动
- [ ] MindFourm 前端正常启动
- [ ] Markdown XSS 已修复
- [ ] 附件下载需认证
- [ ] 资源上传 MIME 验证
- [ ] 用户搜索有速率限制
- [ ] CORS 白名单生效
- [ ] N+1 查询已修复
- [ ] 无 Redis KEYS 命令
- [ ] 前端缓存使用 LRU
- [ ] 设置有 Redis 缓存
- [ ] E2E 测试框架可用
- [ ] 服务通信有重试
- [ ] 数据库索引已添加
- [ ] TypeScript 无 any
- [ ] catch 块有日志
- [ ] PostForm 已拆分

---

## 依赖安装汇总

```bash
# 后端
cd MindFourm && npm install isomorphic-dompurify joi

# 前端
cd MindFourm/frontend && npm install lru-cache

# 测试
cd MindFourm && npm install @playwright/test --save-dev
cd MindFourm && npx playwright install chromium
```