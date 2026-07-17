# MindProject 生产环境部署清单

## 部署前检查

### 服务器要求
- [ ] Node.js >= 18.0.0
- [ ] MySQL 8.0+
- [ ] Redis 7.0+
- [ ] PM2 全局安装 (`npm install -g pm2`)
- [ ] Nginx (反向代理 + HTTPS)
- [ ] Git

### 域名配置
- [ ] `forum.example.com` → 论坛前端 + API
- [ ] `auth.example.com` → MindAuth OAuth 服务
- [ ] `files.example.com` → MindFileList 文件托管（可选）

---

## 1. 代码部署

```bash
# 克隆代码
git clone https://cnb.cool/mdtbbs/MindProject.git mindproject
cd mindproject

# 初始化当前生产主链路子模块
git submodule update --init MindAuth MindFourm

# 当前生产部署链路只需要初始化 `MindAuth` 和 `MindFourm`。
# `EasyManager` 仍为暂停模块，不属于默认生产拉取流程；`download-site` 继续独立部署。

# 安装依赖
npm install
```

---

## 2. 数据库初始化

### MySQL
```sql
-- 创建数据库
CREATE DATABASE mindauth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE mindforum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（生产环境使用独立用户）
CREATE USER 'mindauth'@'localhost' IDENTIFIED BY '<strong-password>';
CREATE USER 'mindforum'@'localhost' IDENTIFIED BY '<strong-password>';

GRANT ALL ON mindauth.* TO 'mindauth'@'localhost';
GRANT ALL ON mindforum.* TO 'mindforum'@'localhost';
FLUSH PRIVILEGES;
```

### Redis
```bash
# 配置 Redis 密码
redis-cli
> CONFIG SET requirepass "<strong-password>"
> CONFIG REWRITE
```

---

## 3. 环境配置

### MindAuth (`MindAuth/.env`)
```bash
NODE_ENV=production
PORT=4001
BASE_URL=https://auth.example.com

# 生成密钥: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_SECRET=<64-char-random-string>

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=mindauth
MYSQL_PASSWORD=<db-password>
MYSQL_DATABASE=mindauth

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
REDIS_DB=0

# 邮件配置（可选，可在后台配置）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=<smtp-password>
SMTP_FROM=noreply@example.com

# 跨域配置
ALLOWED_ORIGINS=https://forum.example.com
```

### MindFourm Backend (`MindFourm/.env`)
```bash
NODE_ENV=production
PORT=4000

FRONTEND_URL=https://forum.example.com
API_URL=https://forum.example.com

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=mindforum
MYSQL_PASSWORD=<db-password>
MYSQL_DATABASE=mindforum

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
REDIS_DB=1

MINDAUTH_URL=https://auth.example.com
MINDAUTH_CLIENT_ID=forum
MINDAUTH_CLIENT_SECRET=<generate-random-secret>
MINDAUTH_CALLBACK_URL=https://forum.example.com/api/auth/callback
MINDAUTH_SERVICE_KEY=<same-as-forum-api-key>

# EasyManager — 已暂停
EASYMANAGER_ENABLED=false
EASYMANAGER_URL=https://manager.example.com
EASYMANAGER_API_KEY=<not-used>

# MindFileList 集成
MFL_BASE_URL=https://files.example.com
MFL_API_KEY=<mfl-api-key-with-write-permission>

SESSION_SECRET=<32-char-random-string>
FORUM_API_KEY=<service-key-for-internal-calls>
```

### MindFourm Frontend (`MindFourm/frontend/.env.production`)
```bash
# API 代理 — 留空，由 Next.js rewrites 代理到后端（不要设为 /api，会导致双 /api 路径）
NEXT_PUBLIC_API_URL=
API_URL=http://127.0.0.1:4000

NEXT_PUBLIC_MINDAUTH_URL=https://auth.example.com
NEXT_PUBLIC_MINDAUTH_CLIENT_ID=forum

NEXT_PUBLIC_SITE_URL=https://forum.example.com
NEXT_PUBLIC_FRONTEND_URL=https://forum.example.com

# 可选：CDN
# NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

### MindFileList (`../download-site/.env`)
```bash
PORT=3000
NODE_ENV=production

DOWNLOAD_DIR=./downloads
DB_PATH=./data/stats.db
MAX_FILE_SIZE=104857600

# OAuth 配置（可选，如需登录下载）
OAUTH_AUTHORIZE_URL=https://auth.example.com/oauth/authorize
OAUTH_TOKEN_URL=https://auth.example.com/oauth/token
OAUTH_USERINFO_URL=https://auth.example.com/oauth/userinfo
OAUTH_CLIENT_ID=<register-in-mindauth>
OAUTH_CLIENT_SECRET=<register-in-mindauth>
OAUTH_CALLBACK_URL=https://files.example.com/auth/callback

SESSION_SECRET=<32-char-random-string>
SESSION_MAX_AGE=86400000

ALLOWED_EXTENSIONS=.zip,.iso,.pdf,.txt,.png,.jpg,.jpeg,.gz,.tar,.7z,.doc,.docx,.xlsx,.md

LOG_LEVEL=info
```

---

## 4. 构建生产版本

```bash
# 构建 shared 包
npm run build:shared

# 构建 MindFourm 后端
cd MindFourm
npm run build

# 构建 MindFourm 前端
cd frontend
npm run build
cd ../..

# MindAuth 和 MindFileList 不需要构建步骤
```

---

## 5. OAuth 客户端注册

### 在 MindAuth 注册 MindFourm 客户端
```bash
# 启动 MindAuth 后，通过 API 或管理后台创建客户端
# 或使用初始化脚本

# 方法 1: 通过管理后台
# 访问 https://auth.example.com/admin
# 使用 ADMIN_SECRET 创建管理员
# 添加 OAuth 客户端:
#   - name: MindFourm
#   - client_id: forum
#   - client_secret: <random-secret>
#   - redirect_uri: https://forum.example.com/api/auth/callback

# 方法 2: 通过 API
curl -X POST https://auth.example.com/api/admin/clients \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MindFourm",
    "client_id": "forum",
    "client_secret": "<random-secret>",
    "redirect_uri": "https://forum.example.com/api/auth/callback"
  }'
```

### 在 MindAuth 注册 MindFileList 客户端（可选）
```bash
# 如果 MindFileList 需要 OAuth 登录
curl -X POST https://auth.example.com/api/admin/clients \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MindFileList",
    "client_id": "mindfilelist",
    "client_secret": "<random-secret>",
    "redirect_uri": "https://files.example.com/auth/callback"
  }'
```

---

## 6. 启动服务

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令

# 检查状态
pm2 status
```

**预期输出：**
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ mode        │ status  │ ↺       │ cpu      │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ mindauth       │ fork        │ online  │ 0       │ 0%       │
│ 1   │ mindforum-api  │ fork        │ online  │ 0       │ 0%       │
│ 2   │ mindforum-fe   │ fork        │ online  │ 0       │ 0%       │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

---

## 7. Nginx 配置

### 示例配置 (`/etc/nginx/sites-available/mindproject`)
```nginx
# MindAuth
server {
    listen 80;
    server_name auth.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.example.com;

    ssl_certificate /etc/letsencrypt/live/auth.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# MindFourm — 统一代理模式
# 所有请求转发到 Next.js，Next.js 内部代理 /api/* 和 /uploads/* 到后端
server {
    listen 80;
    server_name forum.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name forum.example.com;

    ssl_certificate /etc/letsencrypt/live/forum.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forum.example.com/privkey.pem;

    client_max_body_size 60M;

    # 所有请求转发到 Next.js
    # Next.js rewrites 会自动代理 /api/* 和 /uploads/* 到后端
    location / {
        proxy_pass http://127.0.0.1:4502;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE 实时通知支持（/api/notifications/events 通过 Next.js 代理到后端）
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }

    # Next.js 静态资源 — 长期缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:4502;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# MindFileList（可选）
server {
    listen 80;
    server_name files.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name files.example.com;

    ssl_certificate /etc/letsencrypt/live/files.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/files.example.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/mindproject /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 申请 SSL 证书
sudo certbot --nginx -d auth.example.com -d forum.example.com -d files.example.com
```

---

## 8. 部署后验证

### 基础检查
```bash
# 检查服务状态
pm2 status

# 检查日志
pm2 logs --lines 50

# 检查端口监听
sudo netstat -tlnp | grep -E '4001|4000|4502|3000'
```

### 功能验证
- [ ] 访问 `https://auth.example.com` → 登录页面正常
- [ ] 访问 `https://forum.example.com` → 论坛首页正常
- [ ] 注册新用户 → 邮件验证正常
- [ ] OAuth 登录 → 从论坛跳转到 MindAuth 再返回
- [ ] 发布帖子 → 创建成功
- [ ] 上传资源 → 本地上传正常
- [ ] 上传资源（勾选 MFL）→ 文件上传到 MindFileList
- [ ] 管理员审核 → 通过/拒绝资源，MFL 状态同步

### 性能检查
```bash
# 检查响应时间
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://forum.example.com/api/health

# 检查数据库连接
mysql -u mindforum -p -e "SELECT COUNT(*) FROM mindforum.posts;"

# 检查 Redis 连接
redis-cli -a <password> ping
```

---

## 9. 备份策略

### MySQL 自动备份
```bash
# 创建备份脚本 /usr/local/bin/backup-mindproject.sh
#!/bin/bash
BACKUP_DIR="/backup/mindproject"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份 MindAuth
mysqldump -u mindauth -p<password> mindauth | gzip > $BACKUP_DIR/mindauth_$DATE.sql.gz

# 备份 MindFourm
mysqldump -u mindforum -p<password> mindforum | gzip > $BACKUP_DIR/mindforum_$DATE.sql.gz

# 保留最近 30 天
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# 添加 crontab
crontab -e
# 每天凌晨 2 点备份
0 2 * * * /usr/local/bin/backup-mindproject.sh
```

### MindFileList 文件备份
```bash
# 备份下载文件目录
rsync -av /path/to/download-site/downloads/ /backup/mindproject/files/
```

---

## 10. 监控和告警

### PM2 监控
```bash
# 安装 PM2 Plus（可选）
pm2 plus

# 或使用简单监控
pm2 monit
```

### 日志管理
```bash
# 查看实时日志
pm2 logs

# 查看特定服务日志
pm2 logs mindforum-api

# 日志轮转（已配置在 ecosystem.config.js）
```

### 健康检查
```bash
# MindAuth 健康检查
curl https://auth.example.com/api/health

# MindFourm 健康检查
curl https://forum.example.com/api/health
```

---

## 11. 常见问题

### EasyManager 已暂停
EasyManager 服务当前已暂停，代码保留在 `EasyManager/` 目录但未启动。
- 后端 API 返回空数据
- 前端服务器功能已隐藏（`feature_servers_enabled=false`）
- 如需恢复，参见根目录 `CLAUDE.md` 的 "Restoring EasyManager" 章节

### MindFileList 未配置
如果未配置 MFL：
- 资源上传时勾选"上传到 MindFileList"会报错
- 本地上传功能正常
- 需要在 `MindFourm/.env` 配置 `MFL_BASE_URL` 和 `MFL_API_KEY`

### 功能开关
以下功能可通过管理后台 `/admin/settings/features` 控制：
- `feature_resources_enabled` - 资源中心
- `feature_servers_enabled` - 游戏服务器（已禁用）
- `feature_groups_enabled` - 用户组
- `feature_leaderboard_enabled` - 积分排行
- `feature_shop_enabled` - 积分商店

---

## 12. 回滚计划

如果部署出现问题：

```bash
# 1. 停止服务
pm2 stop all

# 2. 回滚代码
cd /path/to/mindproject
git checkout <previous-tag-or-commit>
git submodule update --init MindAuth MindFourm

# 3. 重新构建
npm run build:shared
cd MindFourm && npm run build
cd frontend && npm run build
cd ../..

# 4. 恢复数据库（如需要）
mysql -u mindauth -p mindauth < /backup/mindproject/mindauth_YYYYMMDD_HHMMSS.sql.gz
mysql -u mindforum -p mindforum < /backup/mindproject/mindforum_YYYYMMDD_HHMMSS.sql.gz

# 5. 重启服务
pm2 start all
```

---

## 13. 安全加固

- [ ] 修改所有默认密码和密钥
- [ ] 启用 HTTPS（Let's Encrypt）
- [ ] 配置防火墙（仅开放 80/443）
- [ ] 禁用 MySQL root 远程登录
- [ ] 配置 Redis 密码认证
- [ ] 定期更新系统包 (`apt update && apt upgrade`)
- [ ] 配置 fail2ban 防止暴力破解
- [ ] 启用日志审计

---

## 部署完成检查清单

- [ ] 所有服务在线 (`pm2 status`)
- [ ] HTTPS 证书有效
- [ ] OAuth 登录流程正常
- [ ] 邮件发送正常
- [ ] 文件上传正常
- [ ] 备份任务已配置
- [ ] 监控告警已设置
- [ ] 文档已更新

---

**部署联系人：** <your-email>
**部署日期：** <date>
**版本号：** <git-commit-hash>
