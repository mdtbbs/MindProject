# MindAuth 服务修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 MindAuth OAuth 认证中心的 10 个问题，包括安全漏洞、性能问题、架构缺陷和代码质量问题。

**Architecture:** 按模块优先级执行：安全模块 → 性能模块 → 架构模块 → 质量模块。每个模块完成后验证。

**Tech Stack:** Express.js, MySQL, Redis, Joi, Pino, Playwright

---

## 文件结构

```
MindAuth/
├── src/
│   ├── config/
│   │   ├── index.js          # 修改: 添加验证调用
│   │   └── validation.js     # 新增: Joi 配置验证
│   ├── middleware/
│   │   └── rateLimit.js      # 修改: 添加 Map 清理
│   ├── routes/
│   │   ├── auth.js           # 修改: SameSite=strict
│   │   ├── password.js       # 修改: Redis 会话清除
│   │   ├── admin/
│   │   │   └── users.js      # 修改: SQL 参数化
│   │   └── oauth/            # 新增目录: 拆分 oauth.js
│   │       ├── index.js
│   │       ├── authorize.js
│   │       ├── token.js
│   │       ├── userinfo.js
│   │       ├── introspect.js
│   │       ├── revoke.js
│   │       ├── authorizations.js
│   │       └── errors.js
│   ├── services/             # 新增目录: 服务层
│   │   ├── auth.service.js
│   │   ├── oauth.service.js
│   │   ├── token.service.js
│   │   ├── email.service.js
│   │   ├── session.service.js
│   │   └── user.service.js
│   └── utils/
│   │   └── logger.js         # 新增: pino 日志
├── tests/
│   ├── .env.test             # 新增: 测试配置
│   └── specs/
│   │   ├── auth/auth.spec.js        # 修改
│   │   └── oauth/oauth-flow.spec.js # 修改
```

---

## Phase 1: 安全模块 (4项)

### Task 1: 密码重置会话清除

**Files:**
- Modify: `MindAuth/src/routes/password.js`

- [ ] **Step 1: 读取 password.js 找到 resetPassword 函数**

Run: `cat MindAuth/src/routes/password.js`
Expected: 找到 reset 或 resetPassword 函数位置

- [ ] **Step 2: 添加 Redis 会话清除代码**

在密码重置成功后添加 Redis 缓存清除：

```javascript
// 在 resetPassword 函数中，密码更新后添加
const oldToken = user.session_token;

// 更新 MySQL (原有代码)
await db.query('UPDATE users SET session_token = NULL, password_hash = ? WHERE id = ?', [hash, user.id]);

// 清除 Redis 缓存（新增）
if (oldToken) {
  await redis.del(`session:${oldToken}`);
}

// 删除重置令牌 (原有代码)
await redis.del(`reset:${token}`);
```

- [ ] **Step 3: 验证修改正确**

Run: `cd MindAuth && npm run dev`
Expected: 服务正常启动，无语法错误

- [ ] **Step 4: Commit**

```bash
git add MindAuth/src/routes/password.js
git commit -m "fix(mindauth): clear Redis session cache on password reset"
```

---

### Task 2: 测试密钥外部化

**Files:**
- Create: `MindAuth/tests/.env.test`
- Modify: `MindAuth/tests/specs/auth/auth.spec.js`
- Modify: `MindAuth/tests/specs/oauth/oauth-flow.spec.js`

- [ ] **Step 1: 创建测试环境配置文件**

```bash
cat > MindAuth/tests/.env.test << 'EOF'
ADMIN_SECRET=test_admin_secret_for_playwright
CLIENT_SECRET=test_oauth_client_secret_for_playwright
EOF
```

- [ ] **Step 2: 修改 auth.spec.js 使用环境变量**

在文件顶部添加：

```javascript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// 替换硬编码
// const ADMIN_SECRET = 'admin123'; // 删除此行
const ADMIN_SECRET = process.env.ADMIN_SECRET;
```

- [ ] **Step 3: 修改 oauth-flow.spec.js 使用环境变量**

在文件顶部添加：

```javascript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// 替换硬编码
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
```

- [ ] **Step 4: 安装 dotenv 依赖**

Run: `cd MindAuth && npm install dotenv --save-dev`
Expected: dotenv 安装成功

- [ ] **Step 5: 验证测试仍能运行**

Run: `cd MindAuth && npx playwright test --reporter=list`
Expected: 测试正常执行（可能需要配置其他测试环境）

- [ ] **Step 6: Commit**

```bash
git add MindAuth/tests/.env.test MindAuth/tests/specs/auth/auth.spec.js MindAuth/tests/specs/oauth/oauth-flow.spec.js MindAuth/package.json
git commit -m "fix(mindauth): externalize test secrets to env file"
```

---

### Task 3: SQL LIMIT/OFFSET 参数化

**Files:**
- Modify: `MindAuth/src/routes/admin/users.js`

- [ ] **Step 1: 读取 users.js 找到 SQL 查询位置**

Run: `grep -n "LIMIT.*OFFSET" MindAuth/src/routes/admin/users.js`
Expected: 找到直接拼接的 LIMIT/OFFSET 代码

- [ ] **Step 2: 修改为参数化查询**

将直接拼接改为参数化：

```javascript
// 找到类似这样的代码
// query += ` LIMIT ${effectiveLimit} OFFSET ${offset}`;

// 改为
query += ' LIMIT ? OFFSET ?';
params.push(effectiveLimit, offset);

// 执行查询保持不变
await pool.query(query, params);
```

- [ ] **Step 3: 验证修改正确**

Run: `cd MindAuth && npm run dev`
Expected: 服务正常启动

- [ ] **Step 4: Commit**

```bash
git add MindAuth/src/routes/admin/users.js
git commit -m "fix(mindauth): parameterize SQL LIMIT/OFFSET to prevent injection"
```

---

### Task 4: Cookie SameSite=Strict

**Files:**
- Modify: `MindAuth/src/routes/auth.js`

- [ ] **Step 1: 找到 cookie 设置位置**

Run: `grep -n "res.cookie" MindAuth/src/routes/auth.js`
Expected: 找到 session cookie 设置

- [ ] **Step 2: 修改 SameSite 为 strict**

```javascript
// 找到登录时设置 cookie 的代码
res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',  // 改为 'strict'（原为 'lax'）
  maxAge: SESSION_MAX_AGE
});

// 同样修改 admin session cookie
res.cookie('admin_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: ADMIN_SESSION_MAX_AGE
});
```

- [ ] **Step 3: Commit**

```bash
git add MindAuth/src/routes/auth.js
git commit -m "fix(mindauth): set SameSite=strict for session cookies"
```

---

## Phase 1 验证

- [ ] **运行 MindAuth Playwright 测试**

Run: `cd MindAuth && npx playwright test`
Expected: 所有测试通过

- [ ] **手动验证注册登录流程**

启动服务，验证：
1. 注册新用户
2. 登录
3. OAuth 授权
4. 密码重置

---

## Phase 2: 性能模块 (1项)

### Task 5: Rate Limit 内存泄漏修复

**Files:**
- Modify: `MindAuth/src/middleware/rateLimit.js`

- [ ] **Step 1: 读取 rateLimit.js 找到 localRateLimitStore**

Run: `cat MindAuth/src/middleware/rateLimit.js`
Expected: 找到 `localRateLimitStore = new Map()`

- [ ] **Step 2: 添加清理机制常量**

在文件顶部添加：

```javascript
const LOCAL_STORE_MAX_SIZE = 10000;
const LOCAL_STORE_TTL = 60000; // 1分钟
```

- [ ] **Step 3: 添加定期清理逻辑**

在 `localRateLimitStore` 定义后添加：

```javascript
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

- [ ] **Step 4: 确保 entry 包含 timestamp**

检查 rate limit 记录时是否存储 timestamp：

```javascript
// 在 rate limit check 时确保存储 timestamp
localRateLimitStore.set(key, { count: currentCount, timestamp: Date.now() });
```

- [ ] **Step 5: Commit**

```bash
git add MindAuth/src/middleware/rateLimit.js
git commit -m "fix(mindauth): add cleanup mechanism for rate limit Map to prevent memory leak"
```

---

## Phase 2 验证

- [ ] **验证服务启动正常**

Run: `cd MindAuth && npm run dev`
Expected: 服务正常，无内存警告

---

## Phase 3: 架构模块 (2项)

### Task 6: 配置验证系统

**Files:**
- Create: `MindAuth/src/config/validation.js`
- Modify: `MindAuth/src/config/index.js`

- [ ] **Step 1: 安装 Joi 依赖**

Run: `cd MindAuth && npm install joi`
Expected: Joi 安装成功

- [ ] **Step 2: 创建 validation.js**

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

- [ ] **Step 3: 修改 config/index.js 调用验证**

```javascript
// 在文件顶部添加 import
import { validateConfig } from './validation.js';

// 在配置对象定义后添加验证
const rawConfig = {
  port: parseInt(process.env.PORT, 10) || 4001,
  adminSecret: process.env.ADMIN_SECRET,
  baseUrl: process.env.BASE_URL,
  mysql: { ... },
  redis: { ... }
};

// 替换 export
export const config = validateConfig(rawConfig);
```

- [ ] **Step 4: Commit**

```bash
git add MindAuth/src/config/validation.js MindAuth/src/config/index.js MindAuth/package.json
git commit -m "feat(mindauth): add Joi config validation on startup"
```

---

### Task 7: 添加服务层

**Files:**
- Create: `MindAuth/src/services/auth.service.js`
- Create: `MindAuth/src/services/session.service.js`
- Create: `MindAuth/src/services/token.service.js`

- [ ] **Step 1: 创建 services 目录**

Run: `mkdir -p MindAuth/src/services`

- [ ] **Step 2: 创建 session.service.js**

```javascript
import db from '../db/index.js';
import redis from '../redis/index.js';
import { generateToken } from '../utils/token.js';

const SESSION_TTL = 24 * 60 * 60; // 24小时

export async function createSession(userId) {
  const token = generateToken();
  
  await db.query('UPDATE users SET session_token = ? WHERE id = ?', [token, userId]);
  await redis.setex(`session:${token}`, SESSION_TTL, JSON.stringify({ userId }));
  
  return token;
}

export async function invalidateSession(token) {
  await db.query('UPDATE users SET session_token = NULL WHERE session_token = ?', [token]);
  await redis.del(`session:${token}`);
}

export async function validateSession(token) {
  const cached = await redis.get(`session:${token}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await db.queryOne('SELECT * FROM users WHERE session_token = ?', [token]);
  if (user) {
    await redis.setex(`session:${token}`, SESSION_TTL, JSON.stringify({ userId: user.id }));
    return { userId: user.id };
  }
  
  return null;
}
```

- [ ] **Step 3: 创建 token.service.js**

```javascript
import crypto from 'crypto';

export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export function generateAuthCode() {
  return generateToken(16);
}

export function hashPassword(password) {
  const bcrypt = require('bcrypt');
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  const bcrypt = require('bcrypt');
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 4: 创建 auth.service.js**

```javascript
import db from '../db/index.js';
import { hashPassword, verifyPassword } from './token.service.js';
import { createSession } from './session.service.js';

export async function registerUser(username, email, password) {
  const hash = await hashPassword(password);
  
  const result = await db.query(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, hash, 'user']
  );
  
  return { id: result.insertId, username, email };
}

export async function loginUser(username, password) {
  const user = await db.queryOne('SELECT * FROM users WHERE username = ?', [username]);
  
  if (!user || !await verifyPassword(password, user.password_hash)) {
    return null;
  }
  
  const token = await createSession(user.id);
  return { token, user };
}
```

- [ ] **Step 5: Commit**

```bash
git add MindAuth/src/services/
git commit -m "feat(mindauth): add service layer for auth, session, token"
```

---

## Phase 3 验证

- [ ] **验证服务启动**

Run: `cd MindAuth && npm run dev`
Expected: 配置验证通过，服务正常启动

---

## Phase 4: 质量模块 (2项)

### Task 8: 结构化日志系统

**Files:**
- Create: `MindAuth/src/utils/logger.js`

- [ ] **Step 1: 安装 pino 依赖**

Run: `cd MindAuth && npm install pino`
Expected: pino 安装成功

- [ ] **Step 2: 创建 logger.js**

```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.cookie', 'req.headers.authorization']
});

export default logger;
```

- [ ] **Step 3: 在关键路由中使用 logger**

示例（routes/auth.js）：

```javascript
import logger from '../utils/logger.js';

// 替换 console.error
// console.error('Login failed:', err);
logger.error({ err, username }, 'Login failed');

// 替换 console.log
// console.log('User registered:', userId);
logger.info({ userId }, 'User registered');
```

- [ ] **Step 4: Commit**

```bash
git add MindAuth/src/utils/logger.js MindAuth/package.json
git commit -m "feat(mindauth): add pino structured logging system"
```

---

### Task 9: oauth.js 文件拆分

**Files:**
- Create: `MindAuth/src/routes/oauth/index.js`
- Create: `MindAuth/src/routes/oauth/errors.js`
- Move: oauth.js 内容到各个子文件

- [ ] **Step 1: 创建 oauth 目录**

Run: `mkdir -p MindAuth/src/routes/oauth`

- [ ] **Step 2: 创建 errors.js**

```javascript
export function oauthError(res, statusCode, error, description) {
  return res.status(statusCode).json({
    error,
    error_description: description
  });
}

export const OAuthErrors = {
  INVALID_REQUEST: 'invalid_request',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  ACCESS_DENIED: 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  INVALID_SCOPE: 'invalid_scope',
  SERVER_ERROR: 'server_error',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable'
};
```

- [ ] **Step 3: 创建 index.js 路由入口**

```javascript
import express from 'express';
import authorizeRoute from './authorize.js';
import tokenRoute from './token.js';
import userinfoRoute from './userinfo.js';
import introspectRoute from './introspect.js';
import revokeRoute from './revoke.js';
import authorizationsRoute from './authorizations.js';

const router = express.Router();

router.get('/authorize', authorizeRoute);
router.post('/token', tokenRoute.token);
router.post('/refresh', tokenRoute.refresh);
router.get('/userinfo', userinfoRoute);
router.post('/introspect', introspectRoute);
router.post('/revoke', revokeRoute);
router.get('/authorizations', authorizationsRoute);
router.delete('/authorizations/:client_id', authorizationsRoute.revoke);

export default router;
```

- [ ] **Step 4: 拆分 authorize.js**

从原 oauth.js 提取 `/authorize` 端点逻辑。

- [ ] **Step 5: 拆分 token.js**

从原 oauth.js 提取 `/token` 和 `/refresh` 端点逻辑。

- [ ] **Step 6: 拆分 userinfo.js**

从原 oauth.js 提取 `/userinfo` 端点逻辑。

- [ ] **Step 7: 拆分 introspect.js**

从原 oauth.js 提取 `/introspect` 端点逻辑。

- [ ] **Step 8: 拆分 revoke.js**

从原 oauth.js 提取 `/revoke` 端点逻辑。

- [ ] **Step 9: 拆分 authorizations.js**

从原 oauth.js 提取 `/authorizations` 端点逻辑。

- [ ] **Step 10: 更新 server.js 引用**

```javascript
// 替换
// import oauthRoutes from './routes/oauth.js';
import oauthRoutes from './routes/oauth/index.js';
```

- [ ] **Step 11: Commit**

```bash
git add MindAuth/src/routes/oauth/
git rm MindAuth/src/routes/oauth.js  # 删除原文件
git commit -m "refactor(mindauth): split oauth.js into 8 focused files"
```

---

## Phase 4 验证

- [ ] **运行完整测试**

Run: `cd MindAuth && npx playwright test`
Expected: 所有测试通过

- [ ] **启动服务验证**

Run: `cd MindAuth && npm run dev`
Expected: 服务正常，日志输出结构化

---

## 最终验证清单

- [ ] MindAuth 服务正常启动
- [ ] Playwright 测试全部通过
- [ ] 密码重置后旧会话失效
- [ ] 测试密钥不再硬编码
- [ ] SQL 查询参数化
- [ ] Cookie SameSite=strict
- [ ] Rate limit Map 有清理机制
- [ ] 配置启动时验证
- [ ] 服务层已创建
- [ ] 日志结构化输出
- [ ] oauth.js 已拆分

---

## 依赖安装汇总

```bash
cd MindAuth && npm install joi pino dotenv --save
cd MindAuth && npm install dotenv --save-dev
```