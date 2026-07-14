# MindProject - 3 Claude Overview
# Usage: .\start-mindproject.ps1

$ProjectRoot = "G:\MindProject"
$env:PATH = "$env:LOCALAPPDATA\rmux\bin;$env:PATH"

Write-Host "🚀 Starting MindProject (3 Claude Overview)..." -ForegroundColor Cyan

# Kill existing session
rmux kill-session -t mindproject 2>$null | Out-Null

# Create session with overview window
rmux new-session -d -s mindproject -n overview -c "$ProjectRoot"

# Split into 3 panes: MindAuth + MindFourm + shared
rmux split-window -h -t mindproject:overview -c "$ProjectRoot\MindAuth"
rmux split-window -v -t mindproject:overview.1 -c "$ProjectRoot\MindFourm"

# Start Claude in each pane
rmux send-keys -t mindproject:overview.0 "cd $ProjectRoot\MindAuth" Enter
rmux send-keys -t mindproject:overview.0 "claude" Enter

rmux send-keys -t mindproject:overview.1 "cd $ProjectRoot\MindFourm" Enter
rmux send-keys -t mindproject:overview.1 "claude" Enter

rmux send-keys -t mindproject:overview.2 "cd $ProjectRoot\shared" Enter
rmux send-keys -t mindproject:overview.2 "claude" Enter

Write-Host "✅ Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Layout: 3 Claude in one screen (EasyManager paused)" -ForegroundColor White
Write-Host "Switch pane: Ctrl+A h/j/k/l" -ForegroundColor White
Write-Host "Zoom pane:  Ctrl+A z (toggle)" -ForegroundColor White
Write-Host "Detach:     Ctrl+A d" -ForegroundColor White
Write-Host ""

rmux attach -t mindproject
