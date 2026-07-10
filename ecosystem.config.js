/**
 * PM2 生产部署配置
 *
 * 使用方式：
 *   pm2 start ecosystem.config.js          # 启动所有服务
 *   pm2 reload ecosystem.config.js         # 重载（零停机）
 *   pm2 stop ecosystem.config.js           # 停止所有服务
 *   pm2 logs                               # 查看日志
 *   pm2 save && pm2 startup                # 保存并设置开机自启
 */

module.exports = {
  apps: [
    // ─── MindAuth (OAuth 服务) ───────────────────────────
    {
      name: 'mindauth',
      cwd: './MindAuth',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: './.env',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/mindauth-error.log',
      out_file: '../logs/mindauth-out.log',
    },

    // ─── MindFourm API (NestJS) ──────────────────────────
    {
      name: 'mindforum-api',
      cwd: './MindFourm',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: './.env',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/mindforum-api-error.log',
      out_file: '../logs/mindforum-api-out.log',
    },

    // ─── MindFourm Frontend (Next.js) ────────────────────
    {
      name: 'mindforum-fe',
      cwd: './MindFourm/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4502',
      instances: 1,
      exec_mode: 'fork',
      env_file: './.env.local',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '768M',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../../logs/mindforum-fe-error.log',
      out_file: '../../logs/mindforum-fe-out.log',
    },

    // ─── EasyManager API (Koa) ───────────────────────────
    {
      name: 'easymanager-api',
      cwd: './EasyManager/backend',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: './.env',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../../logs/easymanager-api-error.log',
      out_file: '../../logs/easymanager-api-out.log',
    },

    // ─── EasyManager Frontend (Next.js) ──────────────────
    {
      name: 'easymanager-fe',
      cwd: './EasyManager/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 1,
      exec_mode: 'fork',
      env_file: './.env.local',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../../logs/easymanager-fe-error.log',
      out_file: '../../logs/easymanager-fe-out.log',
    },
  ],
};
