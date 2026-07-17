#!/bin/bash
# ──────────────────────────────────────────────────────────
# MindProject 一键部署脚本
#
# 使用方式：
#   chmod +x deploy.sh
#   ./deploy.sh            # 完整部署（拉代码 + 安装 + 构建 + 重启）
#   ./deploy.sh --quick    # 快速部署（仅重启服务，不重新构建）
# ──────────────────────────────────────────────────────────

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Quick mode: skip build, just restart
if [ "$1" = "--quick" ]; then
    info "Quick reload..."
    cd "$PROJECT_DIR"
    pm2 reload ecosystem.config.js
    info "Done at $TIMESTAMP"
    exit 0
fi

# Create logs directory
mkdir -p "$LOG_DIR"

info "=== MindProject Deploy Start ($TIMESTAMP) ==="

# Pull latest code
info "Pulling latest code..."
cd "$PROJECT_DIR"
git pull

# Update active production submodules only
info "Updating active production submodules..."
git submodule update --init MindAuth MindFourm

# ─── MindAuth ─────────────────────────────────────────────
info "MindAuth: installing dependencies..."
cd "$PROJECT_DIR/MindAuth"
npm ci --production

# ─── MindFourm Backend ────────────────────────────────────
info "MindFourm API: installing dependencies & building..."
cd "$PROJECT_DIR/MindFourm"
npm ci
npm run build

# ─── MindFourm Frontend ──────────────────────────────────
info "MindFourm Frontend: installing dependencies & building..."
cd "$PROJECT_DIR/MindFourm/frontend"
npm ci
npm run build

# ─── EasyManager (暂停中) ─────────────────────────────────
# EasyManager 已暂停开发，如需恢复取消以下注释
# info "EasyManager API: installing dependencies..."
# cd "$PROJECT_DIR/EasyManager/backend"
# npm ci --production
#
# info "EasyManager Frontend: installing dependencies & building..."
# cd "$PROJECT_DIR/EasyManager/frontend"
# npm ci
# npm run build

# ─── Restart services ────────────────────────────────────
info "Reloading PM2 services..."
cd "$PROJECT_DIR"

# Start if not running, reload if already running
if pm2 describe mindauth > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js
else
    pm2 start ecosystem.config.js
    pm2 save
fi

info "=== Deploy Complete ==="
pm2 status
