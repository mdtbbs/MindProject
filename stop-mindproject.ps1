# 停止 MindProject 开发环境
# 使用: .\stop-mindproject.ps1

$env:PATH = "$env:LOCALAPPDATA\rmux\bin;$env:PATH"

Write-Host "🛑 停止 MindProject 开发环境..." -ForegroundColor Yellow

# 检查会话是否存在
$session = rmux ls 2>$null | Select-String "mindproject"
if (-not $session) {
    Write-Host "⚠️  会话 'mindproject' 不存在" -ForegroundColor Yellow
    exit 0
}

# 停止所有窗口中运行的进程并发送 Ctrl+C
Write-Host "正在停止所有服务..."

# 发送 Ctrl+C 到所有面板
rmux send-keys -t mindproject:overview.0 C-c
rmux send-keys -t mindproject:overview.1 C-c
rmux send-keys -t mindproject:overview.2 C-c

Start-Sleep -Seconds 1

# 杀死会话
rmux kill-session -t mindproject

Write-Host "✅ 开发环境已停止" -ForegroundColor Green