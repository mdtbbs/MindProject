# MindProject - 4 Claude Overview
# Usage: .\start-mindproject.ps1

$ProjectRoot = "G:\MindProject"
$env:PATH = "$env:LOCALAPPDATA\rmux\bin;$env:PATH"

Write-Host "🚀 Starting MindProject (4 Claude Overview)..." -ForegroundColor Cyan

# Kill existing session
rmux kill-session -t mindproject 2>$null | Out-Null

# Create session with overview window
rmux new-session -d -s mindproject -n overview -c "$ProjectRoot"

# Split into 4 panes: 2 columns x 2 rows
rmux split-window -h -t mindproject:overview -c "$ProjectRoot\MindAuth"
rmux split-window -v -t mindproject:overview.1 -c "$ProjectRoot\MindFourm"
rmux split-window -v -t mindproject:overview.0 -c "$ProjectRoot\EasyManager"

# Start Claude in each pane
rmux send-keys -t mindproject:overview.0 "cd $ProjectRoot\MindAuth" Enter
rmux send-keys -t mindproject:overview.0 "claude" Enter

rmux send-keys -t mindproject:overview.1 "cd $ProjectRoot\MindFourm" Enter
rmux send-keys -t mindproject:overview.1 "claude" Enter

rmux send-keys -t mindproject:overview.2 "cd $ProjectRoot\EasyManager" Enter
rmux send-keys -t mindproject:overview.2 "claude" Enter

rmux send-keys -t mindproject:overview.3 "cd $ProjectRoot\shared" Enter
rmux send-keys -t mindproject:overview.3 "claude" Enter

Write-Host "✅ Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Layout: 4 Claude in one screen" -ForegroundColor White
Write-Host "Switch pane: Ctrl+A h/j/k/l" -ForegroundColor White
Write-Host "Zoom pane:  Ctrl+A z (toggle)" -ForegroundColor White
Write-Host "Detach:     Ctrl+A d" -ForegroundColor White
Write-Host ""

rmux attach -t mindproject