# EasyManager 服务修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 EasyManager 服务器托管管理的 11 个问题，包括安全漏洞、性能瓶颈、架构缺陷和代码质量问题。

**Architecture:** 按模块优先级执行：安全模块 → 性能模块 → 架构模块 → 质量模块。每个模块完成后验证。

**Tech Stack:** Koa.js, MySQL, Redis, Dockerode, WebSocket, Pino, LRU-Cache

---

## 文件结构

```
EasyManager/backend/
├── src/
│   ├── middleware/
│   │   ├── requireServiceAuth.js  # 重构: Token 双重验证
│   │   └── checkServerOwnership.js # 新增: 权限中间件
│   ├── services/
│   │   ├── websocket.js       # 重构: 按需广播 + 心跳
│   │   ├── docker.js          # 重构: 异步操作
│   │   └── query.js           # 新增: 共享查询
│   ├── utils/
│   │   ├── port.js            # 修改: Redis 原子分配
│   │   ├── port-atomic.js     # 新增: 原子端口分配
│   │   └── logger.js          # 新增: pino 日志
│   ├── config.js              # 修改: API Key 验证
│   ├── routes/
│   │   ├── servers/           # 拆分: servers.js → 9文件
│   │   │   ├── index.js
│   │   │   ├── list.js
│   │   │   ├── create.js
│   │   │   ├── detail.js
│   │   │   ├── operations.js
│   │   │   ├── delete.js
│   │   │   ├── status.js
│   │   │   ├── logs.js
│   │   │   └── bandwidth.js
│   │   └── admin/             # 拆分: admin.js → 7文件
│   │   │   ├── index.js
│   │   │   ├── users.js
│   │   │   ├── servers.js
│   │   │   ├── templates.js
│   │   │   ├── versions.js
│   │   │   ├── stats.js
│   │   │   └── logs.js
│   └── db/
│   │   └── schema-mysql.sql   # 修改: 添加索引
```

---

## Phase 1: 安全模块 (2项)

### Task 1: X-User-ID Token 双重验证

**Files:**
- Modify: `EasyManager/backend/src/middleware/requireServiceAuth.js`

- [ ] **Step 1: 读取 requireServiceAuth.js**

Run: `cat EasyManager/backend/src/middleware/requireServiceAuth.js`
Expected: 找到当前验证逻辑

- [ ] **Step 2: 增强 Token 验证**

```javascript
import { verifyTokenWithMindAuth } from '../services/mindauth.js';

export async function requireServiceAuth(ctx, next) {
  const serviceKey = ctx.headers['x-service-key'];
  
  // 1. 验证 API Key
  if (serviceKey !== config.apiKey) {
    ctx.status = 401;
    ctx.body = { success: false, message: '无效的服务密钥' };
    return;
  }
  
  // 2. 如果有 X-User-ID，要求 Token 验证
  const userId = ctx.headers['x-user-id'];
  const userToken = ctx.headers['x-user-token'];
  
  if (userId) {
    // 必须提供 Token
    if (!userToken) {
      ctx.status = 401;
      ctx.body = { success: false, message: '缺少用户令牌验证' };
      return;
    }
    
    // 验证 Token 与 userId 匹配
    try {
      const userInfo = await verifyTokenWithMindAuth(userToken);
      
      if (userInfo.sub !== userId) {
        ctx.status = 401;
        ctx.body = { success: false, message: '用户身份不匹配' };
        return;
      }
      
      ctx.state.user = { id: userId, ...userInfo };
    } catch (err) {
      ctx.status = 401;
      ctx.body = { success: false, message: '用户令牌验证失败' };
      return;
    }
  }
  
  return next();
}
```

- [ ] **Step 3: 更新 MindFourm 调用添加 X-User-Token**

在 MindFourm server.service.js 中添加：

```javascript
// 调用 EasyManager 时添加用户 token
async function getUserServers(userId, userToken) {
  return easyManagerClient.get(`/api/forum/user/${userId}/servers`, {
    headers: { 'X-User-Token': userToken }
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add EasyManager/backend/src/middleware/requireServiceAuth.js
git commit -m "fix(easymanager): require token verification for X-User-ID header"
```

---

### Task 2: API Key 强制验证

**Files:**
- Modify: `EasyManager/backend/src/config.js`

- [ ] **Step 1: 添加危险 API Key 检测**

在 config.js 中添加：

```javascript
import crypto from 'crypto';

const DANGER_API_KEYS = [
  'forum-service-key-dev',
  'test',
  'dev',
  'default',
  'changeme'
];

function validateApiKey() {
  const apiKey = process.env.EASYMANAGER_API_KEY || config.apiKey;
  
  // 检查是否为危险默认值
  if (DANGER_API_KEYS.includes(apiKey.toLowerCase())) {
    if (process.env.NODE_ENV === 'production') {
      console.error('!!! 生产环境禁止使用默认 API Key !!!');
      console.error('请设置环境变量: EASYMANAGER_API_KEY=<your-secret-key>');
      process.exit(1);
    } else {
      // 开发环境警告并生成临时密钥
      console.warn('\x1b[33m警告: 使用默认 API Key，请勿在生产环境使用!\x1b[0m');
      
      const tempKey = crypto.randomBytes(32).toString('hex');
      config.apiKey = tempKey;
      
      console.log(`已生成临时 API Key: ${tempKey}`);
      console.log('请在 .env 中设置 EASYMANAGER_API_KEY=<新密钥>');
    }
  }
  
  // 检查长度
  if (apiKey.length < 32) {
    console.error('API Key 长度不足，至少需要 32 字符');
    process.exit(1);
  }
  
  config.apiKey = apiKey;
}

// 在导出前调用
validateApiKey();

export default config;
```

- [ ] **Step 2: 在 app.js 启动时调用**

确保验证在服务启动前执行：

```javascript
import config from './config.js'; // 配置验证在此执行
```

- [ ] **Step 3: Commit**

```bash
git add EasyManager/backend/src/config.js
git commit -m "fix(easymanager): enforce API key validation, reject dangerous defaults"
```

---

## Phase 1 验证

- [ ] **启动 EasyManager 后端**

Run: `cd EasyManager/backend && npm run dev`
Expected: 服务正常启动，API Key 验证生效

- [ ] **验证默认 API Key 警告**

不设置 EASYMANAGER_API_KEY，启动应显示警告并生成临时密钥。

---

## Phase 2: 性能模块 (4项)

### Task 3: WebSocket 广播重构

**Files:**
- Modify: `EasyManager/backend/src/services/websocket.js`

- [ ] **Step 1: 安装 LRU-Cache**

Run: `cd EasyManager/backend && npm install lru-cache`
Expected: lru-cache 安装成功

- [ ] **Step 2: 重构连接管理**

```javascript
import { LRUCache } from 'lru-cache';
import WebSocket from 'ws';

// 连接管理
const clientMap = new Map();             // clientId -> { ws, subscriptions }
const serverSubscribers = new Map();     // serverId -> Set<clientId>
const statsCache = new LRUCache({ max: 500, ttl: 5000 });
const prevStats = new Map();             // 用于变化检测

export function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    handleConnection(ws, req);
  });
  
  return wss;
}

function handleConnection(ws, req) {
  const clientId = generateClientId();
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'subscribe') {
        handleSubscribe(clientId, msg.serverId, ws);
      } else if (msg.type === 'unsubscribe') {
        handleUnsubscribe(clientId, msg.serverId);
      }
    } catch (err) {
      logger.error({ clientId, err }, 'Invalid WebSocket message');
    }
  });
  
  ws.on('close', () => handleDisconnect(clientId));
  ws.on('error', () => handleDisconnect(clientId));
  
  clientMap.set(clientId, { ws, subscriptions: new Set() });
  
  // 设置心跳
  setupHeartbeat(ws, clientId);
}
```

- [ ] **Step 3: 实现订阅管理**

```javascript
function handleSubscribe(clientId, serverId, ws) {
  // 记录订阅
  if (!serverSubscribers.has(serverId)) {
    serverSubscribers.set(serverId, new Set());
  }
  serverSubscribers.get(serverId).add(clientId);
  clientMap.get(clientId).subscriptions.add(serverId);
  
  // 立即发送当前状态
  sendCachedStats(ws, serverId);
  
  // 触发按需更新
  scheduleServerUpdate(serverId);
}

function handleUnsubscribe(clientId, serverId) {
  const subs = serverSubscribers.get(serverId);
  if (subs) {
    subs.delete(clientId);
    if (subs.size === 0) {
      serverSubscribers.delete(serverId);
      cancelServerUpdate(serverId);
    }
  }
  clientMap.get(clientId)?.subscriptions.delete(serverId);
}

function handleDisconnect(clientId) {
  const client = clientMap.get(clientId);
  if (client) {
    for (const serverId of client.subscriptions) {
      handleUnsubscribe(clientId, serverId);
    }
    clientMap.delete(clientId);
  }
}
```

- [ ] **Step 4: 实现按需更新调度**

```javascript
const updateSchedulers = new Map();

function scheduleServerUpdate(serverId) {
  if (updateSchedulers.has(serverId)) return;
  
  const timeoutId = setTimeout(async () => {
    await updateAndBroadcast(serverId);
    
    // 如果还有订阅者，继续调度
    if (serverSubscribers.has(serverId) && serverSubscribers.get(serverId).size > 0) {
      updateSchedulers.set(serverId, setTimeout(() => scheduleServerUpdate(serverId), 5000));
    } else {
      updateSchedulers.delete(serverId);
    }
  }, 5000);
  
  updateSchedulers.set(serverId, timeoutId);
}

function cancelServerUpdate(serverId) {
  const timeoutId = updateSchedulers.get(serverId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    updateSchedulers.delete(serverId);
  }
}
```

- [ ] **Step 5: 实现变化检测广播**

```javascript
async function updateAndBroadcast(serverId) {
  try {
    const stats = await getServerStats(serverId);
    const statsJson = JSON.stringify(stats);
    
    // 只在数据变化时广播
    if (prevStats.get(serverId) !== statsJson) {
      prevStats.set(serverId, statsJson);
      statsCache.set(serverId, stats);
      broadcast(serverId, { type: 'stats', serverId, data: stats });
    }
  } catch (err) {
    logger.error({ serverId, err }, 'Failed to get server stats');
  }
}

async function getServerStats(serverId) {
  const cached = statsCache.get(serverId);
  if (cached) return cached;
  
  const container = await getContainer(serverId);
  if (!container) {
    return { status: 'stopped', cpu: 0, memory: 0, players: 0 };
  }
  
  const dockerStats = await container.stats({ stream: false });
  const playerStats = await getPlayerStats(serverId).catch(() => null);
  
  return {
    status: 'running',
    cpu: dockerStats.cpu_percent || 0,
    memory: dockerStats.memory_usage || 0,
    players: playerStats?.players || 0,
    timestamp: Date.now()
  };
}

function broadcast(serverId, message) {
  const subscribers = serverSubscribers.get(serverId);
  if (!subscribers) return;
  
  const messageStr = JSON.stringify(message);
  for (const clientId of subscribers) {
    const client = clientMap.get(clientId);
    if (client?.ws?.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

function sendCachedStats(ws, serverId) {
  const cached = statsCache.get(serverId);
  if (cached) {
    ws.send(JSON.stringify({ type: 'stats', serverId, data: cached }));
  }
}
```

- [ ] **Step 6: 实现心跳检测**

```javascript
const CLIENT_TIMEOUT = 60000;

function setupHeartbeat(ws, clientId) {
  let lastActivity = Date.now();
  
  ws.on('pong', () => {
    lastActivity = Date.now();
  });
  
  const heartbeatInterval = setInterval(() => {
    if (Date.now() - lastActivity > CLIENT_TIMEOUT) {
      handleDisconnect(clientId);
      clearInterval(heartbeatInterval);
    } else {
      ws.ping();
    }
  }, 30000);
  
  ws.on('close', () => clearInterval(heartbeatInterval));
}

// 定期清理僵尸连接
setInterval(() => {
  for (const [clientId, client] of clientMap) {
    if (client.ws.readyState !== WebSocket.OPEN) {
      handleDisconnect(clientId);
    }
  }
}, 60000);
```

- [ ] **Step 7: 删除原有的全局轮询代码**

删除 `setInterval` 全局轮询和 `KEYS` 命令使用。

- [ ] **Step 8: Commit**

```bash
git add EasyManager/backend/src/services/websocket.js EasyManager/backend/package.json
git commit -m "perf(easymanager): refactor WebSocket to on-demand broadcast with change detection"
```

---

### Task 4: Docker 文件操作异步化

**Files:**
- Modify: `EasyManager/backend/src/services/docker.js`

- [ ] **Step 1: 替换同步文件操作**

```javascript
import { promises as fsPromises } from 'fs';
import path from 'path';

// 替换 mkdirSync
export async function createServerDirectories(serverId) {
  const serverDir = path.join(config.serversDir, serverId.toString());
  
  await fsPromises.mkdir(path.join(serverDir, 'config'), { recursive: true });
  await fsPromises.mkdir(path.join(serverDir, 'maps'), { recursive: true });
  await fsPromises.mkdir(path.join(serverDir, 'logs'), { recursive: true });
  await fsPromises.mkdir(path.join(serverDir, 'plugins'), { recursive: true });
  
  return serverDir;
}

// 替换 writeFileSync
export async function writeServerConfig(serverId, configData) {
  const configPath = path.join(config.serversDir, serverId.toString(), 'config', 'server-config.json');
  await fsPromises.writeFile(configPath, JSON.stringify(configData, null, 2));
}

// 替换 readFileSync
export async function readServerLogs(serverId, lines = 100) {
  const logPath = path.join(config.serversDir, serverId.toString(), 'logs', 'server.log');
  
  try {
    const content = await fsPromises.readFile(logPath, 'utf-8');
    return content.split('\n').slice(-lines).join('\n');
  } catch {
    return '';
  }
}

// 替换 rmSync
export async function deleteServerFiles(serverId) {
  const serverDir = path.join(config.serversDir, serverId.toString());
  
  try {
    await fsPromises.rm(serverDir, { recursive: true, force: true });
  } catch (err) {
    logger.warn({ serverId, err }, 'Failed to delete server files');
  }
}

// 替换其他同步操作
export async function listServerMaps(serverId) {
  const mapsDir = path.join(config.serversDir, serverId.toString(), 'maps');
  
  try {
    const files = await fsPromises.readdir(mapsDir);
    return files.filter(f => f.endsWith('.msav'));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: 更新调用处使用 await**

在 routes/servers.js 中：

```javascript
// 替换
// docker.createServerDirectories(serverId);
// 为
await docker.createServerDirectories(serverId);

// 替换
// docker.writeServerConfig(serverId, config);
// 为
await docker.writeServerConfig(serverId, config);
```

- [ ] **Step 3: Commit**

```bash
git add EasyManager/backend/src/services/docker.js
git commit -m "perf(easymanager): replace sync file operations with async fs.promises"
```

---

### Task 5: WebSocket clientMap 清理

已在 Task 3 中实现心跳检测和定期清理。

---

### Task 6: 数据库索引优化

**Files:**
- Modify: `EasyManager/backend/src/db/schema-mysql.sql`

- [ ] **Step 1: 添加索引到 schema**

```sql
-- EasyManager 性能优化索引

-- 服务器列表查询优化
CREATE INDEX idx_servers_owner_status_deleted 
ON servers(owner_id, status, deleted_at);

-- 容器 ID 快速查找
CREATE INDEX idx_servers_container 
ON servers(container_id);

-- 带宽日志查询优化
CREATE INDEX idx_bandwidth_server_time 
ON bandwidth_logs(server_id, timestamp DESC);

-- 操作日志查询优化
CREATE INDEX idx_operation_logs_action_time 
ON operation_logs(action, created_at DESC);

-- 模板查询优化
CREATE INDEX idx_templates_active 
ON server_templates(is_active);

-- 版本查询优化
CREATE INDEX idx_versions_active 
ON server_versions(is_active);
```

- [ ] **Step 2: 执行索引创建**

```bash
cd EasyManager/backend
# 通过 MySQL 客户端执行
mysql -u root -p easymanager < src/db/schema-mysql.sql
```

或通过应用执行：

```javascript
// 在 db/index.js 中添加
async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_servers_owner_status_deleted ON servers(owner_id, status, deleted_at)',
    'CREATE INDEX IF NOT EXISTS idx_servers_container ON servers(container_id)',
    'CREATE INDEX IF NOT EXISTS idx_bandwidth_server_time ON bandwidth_logs(server_id, timestamp DESC)',
    'CREATE INDEX IF NOT EXISTS idx_operation_logs_action_time ON operation_logs(action, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_templates_active ON server_templates(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_versions_active ON server_versions(is_active)'
  ];
  
  for (const sql of indexes) {
    await pool.query(sql);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add EasyManager/backend/src/db/schema-mysql.sql
git commit -m "perf(easymanager): add database indexes for common queries"
```

---

## Phase 2 验证

- [ ] **启动 EasyManager 后端**

Run: `cd EasyManager/backend && npm run dev`
Expected: WebSocket 正常，无全局轮询

- [ ] **验证 WebSocket 按需更新**

订阅服务器，观察只在有订阅者时才更新。

- [ ] **验证文件操作异步**

创建服务器，验证不阻塞。

---

## Phase 3: 架构模块 (2项)

### Task 7: 端口分配原子化

**Files:**
- Create: `EasyManager/backend/src/utils/port-atomic.js`
- Modify: `EasyManager/backend/src/utils/port.js`

- [ ] **Step 1: 创建 port-atomic.js**

```javascript
import redis from '../db/redis.js';

const PORT_RANGE_MIN = 6567;
const PORT_RANGE_MAX = 7000;
const PORT_POOL_KEY = 'ports:available';
const PORT_KEY = 'ports:allocated';

// 初始化端口池
export async function initPortPool() {
  const exists = await redis.exists(PORT_POOL_KEY);
  
  if (!exists) {
    const ports = [];
    for (let port = PORT_RANGE_MIN; port <= PORT_RANGE_MAX; port++) {
      ports.push(port);
    }
    await redis.sadd(PORT_POOL_KEY, ...ports);
    logger.info(`Initialized port pool: ${ports.length} ports`);
  }
}

// 原子分配端口
export async function allocatePort() {
  // 从集合中随机取出一个端口（原子操作）
  const port = await redis.spop(PORT_POOL_KEY);
  
  if (!port) {
    logger.warn('No available ports in pool');
    return null;
  }
  
  // 记录到已分配集合
  await redis.sadd(PORT_KEY, port);
  
  // 额外验证端口实际可用
  const isAvailable = await checkPortActuallyAvailable(parseInt(port));
  if (!isAvailable) {
    // 端口被占用，继续分配下一个
    await redis.srem(PORT_KEY, port);
    return allocatePort();
  }
  
  logger.info(`Allocated port: ${port}`);
  return parseInt(port);
}

// 释放端口
export async function releasePort(port) {
  await redis.srem(PORT_KEY, port);
  await redis.sadd(PORT_POOL_KEY, port);
  logger.info(`Released port: ${port}`);
}

// 检查端口实际可用
async function checkPortActuallyAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// 获取已分配端口数
export async function getAllocatedCount() {
  return await redis.scard(PORT_KEY);
}
```

- [ ] **Step 2: 在 app.js 启动时初始化**

```javascript
import { initPortPool } from './utils/port-atomic.js';

// 在服务启动前
await initPortPool();
```

- [ ] **Step 3: 修改 servers.js 使用原子分配**

```javascript
import { allocatePort, releasePort } from '../utils/port-atomic.js';

// 创建服务器时
const port = await allocatePort();
if (!port) {
  ctx.status = 503;
  ctx.body = { success: false, message: '无可用端口' };
  return;
}

// 删除服务器时
await releasePort(server.port);
```

- [ ] **Step 4: Commit**

```bash
git add EasyManager/backend/src/utils/port-atomic.js EasyManager/backend/src/routes/servers.js
git commit -m "feat(easymanager): atomic port allocation using Redis sets"
```

---

## Phase 3 验证

- [ ] **验证端口分配原子性**

创建多个服务器并发，验证无端口冲突。

---

## Phase 4: 质量模块 (4项)

### Task 8: 权限检查中间件提取

**Files:**
- Create: `EasyManager/backend/src/middleware/checkServerOwnership.js`
- Create: `EasyManager/backend/src/services/query.js`

- [ ] **Step 1: 创建 query.js 共享查询**

```javascript
import db from '../db/index.js';

export async function getServer(serverId) {
  return await db.queryOne(`
    SELECT * FROM servers WHERE id = ? AND deleted_at IS NULL
  `, [serverId]);
}

export async function getUserQuota(userId) {
  return await db.queryOne(`
    SELECT * FROM user_quotas WHERE user_id = ?
  `, [userId]);
}

export async function getServerWithQuota(serverId, userId) {
  const server = await getServer(serverId);
  if (!server) return null;
  
  const quota = await getUserQuota(userId);
  return { server, quota };
}
```

- [ ] **Step 2: 创建 checkServerOwnership.js**

```javascript
import { getServer, getUserQuota } from '../services/query.js';

export async function checkServerOwnership(ctx, next) {
  const serverId = parseInt(ctx.params.id);
  
  if (!serverId || isNaN(serverId)) {
    ctx.status = 400;
    ctx.body = { success: false, message: '无效的服务器 ID' };
    return;
  }
  
  // 获取服务器
  const server = await getServer(serverId);
  
  if (!server) {
    ctx.status = 404;
    ctx.body = { success: false, message: '服务器不存在' };
    return;
  }
  
  // 获取用户配额/角色
  const quota = await getUserQuota(ctx.state.user.id);
  
  // 权限检查
  const isOwner = server.owner_id === ctx.state.user.id;
  const isAdmin = quota?.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    ctx.status = 403;
    ctx.body = { success: false, message: '无权操作此服务器' };
    return;
  }
  
  // 附加到 context 供后续使用
  ctx.state.server = server;
  ctx.state.quota = quota;
  ctx.state.isOwner = isOwner;
  ctx.state.isAdmin = isAdmin;
  
  return next();
}
```

- [ ] **Step 3: 在路由中使用中间件**

```javascript
import checkServerOwnership from '../middleware/checkServerOwnership.js';

// 替换所有重复的权限检查代码
router.get('/:id', checkServerOwnership, async (ctx) => {
  ctx.body = { success: true, data: ctx.state.server };
});

router.post('/:id/start', checkServerOwnership, async (ctx) => {
  await docker.startServer(ctx.state.server);
  ctx.body = { success: true };
});

router.post('/:id/stop', checkServerOwnership, async (ctx) => {
  await docker.stopServer(ctx.state.server);
  ctx.body = { success: true };
});

// 删除 12 处重复代码
```

- [ ] **Step 4: Commit**

```bash
git add EasyManager/backend/src/middleware/checkServerOwnership.js EasyManager/backend/src/services/query.js
git commit -m "refactor(easymanager): extract server ownership check to middleware"
```

---

### Task 9: 结构化日志系统

**Files:**
- Create: `EasyManager/backend/src/utils/logger.js`

- [ ] **Step 1: 安装 pino**

Run: `cd EasyManager/backend && npm install pino`
Expected: pino 安装成功

- [ ] **Step 2: 创建 logger.js**

```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    server: (server) => ({ id: server?.id, name: server?.name, status: server?.status }),
    user: (user) => ({ id: user?.id, username: user?.username }),
    container: (container) => ({ id: container?.id?.substring(0, 12) })
  },
  redact: ['req.headers.authorization', 'req.headers.cookie']
});

export default logger;
```

- [ ] **Step 3: 替换 console.log/error**

示例：

```javascript
import logger from '../utils/logger.js';

// 替换 console.error
// console.error('Failed to start container:', err);
logger.error({ err, serverId }, 'Failed to start container');

// 替换 console.log
// console.log('Server created:', serverId);
logger.info({ serverId, userId }, 'Server created');

// 替换 console.warn
// console.warn('Port already in use:', port);
logger.warn({ port }, 'Port already in use, retrying');
```

- [ ] **Step 4: Commit**

```bash
git add EasyManager/backend/src/utils/logger.js EasyManager/backend/package.json
git commit -m "feat(easymanager): add pino structured logging system"
```

---

### Task 10: servers.js 文件拆分

**Files:**
- Create: `EasyManager/backend/src/routes/servers/index.js`
- Create: `EasyManager/backend/src/routes/servers/list.js`
- Create: `EasyManager/backend/src/routes/servers/create.js`
- Create: `EasyManager/backend/src/routes/servers/detail.js`
- Create: `EasyManager/backend/src/routes/servers/operations.js`
- Create: `EasyManager/backend/src/routes/servers/delete.js`
- Create: `EasyManager/backend/src/routes/servers/status.js`
- Create: `EasyManager/backend/src/routes/servers/logs.js`
- Create: `EasyManager/backend/src/routes/servers/bandwidth.js`

- [ ] **Step 1: 创建 servers 目录**

Run: `mkdir -p EasyManager/backend/src/routes/servers`

- [ ] **Step 2: 创建 index.js 入口**

```javascript
import Router from 'koa-router';
import listRoute from './list.js';
import createRoute from './create.js';
import detailRoute from './detail.js';
import operationsRoute from './operations.js';
import deleteRoute from './delete.js';
import statusRoute from './status.js';
import logsRoute from './logs.js';
import bandwidthRoute from './bandwidth.js';
import requireAuth from '../../middleware/requireAuth.js';

const router = new Router({ prefix: '/api/servers' });

// 所有路由需要认证
router.use(requireAuth);

router.get('/', listRoute);
router.post('/', createRoute);
router.get('/:id', detailRoute);
router.post('/:id/start', operationsRoute.start);
router.post('/:id/stop', operationsRoute.stop);
router.post('/:id/restart', operationsRoute.restart);
router.delete('/:id', deleteRoute);
router.get('/:id/status', statusRoute);
router.get('/:id/logs', logsRoute);
router.get('/:id/stats', bandwidthRoute);

export default router;
```

- [ ] **Step 3: 拆分各路由文件**

每个文件包含单一功能：

```javascript
// list.js
export default async function listServers(ctx) {
  const servers = await db.query(`
    SELECT * FROM servers WHERE owner_id = ? AND deleted_at IS NULL
  `, [ctx.state.user.id]);
  ctx.body = { success: true, data: servers };
}

// create.js
import { allocatePort } from '../../utils/port-atomic.js';
import docker from '../../services/docker.js';

export default async function createServer(ctx) {
  const { name, version, template_id } = ctx.request.body;
  
  const port = await allocatePort();
  if (!port) {
    ctx.status = 503;
    ctx.body = { success: false, message: '无可用端口' };
    return;
  }
  
  // ... 创建逻辑
}
```

- [ ] **Step 4: 更新路由注册**

```javascript
// routes/index.js
import serverRoutes from './servers/index.js';

router.use(serverRoutes.routes());
```

- [ ] **Step 5: Commit**

```bash
git add EasyManager/backend/src/routes/servers/
git commit -m "refactor(easymanager): split servers.js into 9 focused files"
```

---

### Task 11: admin.js 文件拆分

**Files:**
- Create: `EasyManager/backend/src/routes/admin/` 目录

类似 servers.js 拆分，创建 7 个文件：
- index.js
- users.js
- servers.js
- templates.js
- versions.js
- stats.js
- logs.js

- [ ] **Step 1-5: 同 Task 10 模式**

- [ ] **Step 6: Commit**

```bash
git add EasyManager/backend/src/routes/admin/
git commit -m "refactor(easymanager): split admin.js into 7 focused files"
```

---

## Phase 4 验证

- [ ] **运行服务**

Run: `cd EasyManager/backend && npm run dev`
Expected: 服务正常，日志结构化

- [ ] **验证权限中间件**

访问服务器，验证权限检查统一。

- [ ] **验证文件拆分**

代码组织清晰，单个文件可理解。

---

## 最终验证清单

- [ ] EasyManager 后端正常启动
- [ ] API Key 强制验证生效
- [ ] X-User-ID 需 Token 验证
- [ ] WebSocket 按需广播
- [ ] WebSocket 有心跳检测
- [ ] Docker 文件操作异步
- [ ] 数据库索引已添加
- [ ] 端口分配原子化
- [ ] 权限中间件统一
- [ ] 日志结构化输出
- [ ] servers.js 已拆分
- [ ] admin.js 已拆分

---

## 依赖安装汇总

```bash
cd EasyManager/backend && npm install pino lru-cache
```