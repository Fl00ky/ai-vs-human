$projectPath = "D:\claude\vibeclaude\AI vs Human"
Set-Location $projectPath

$changes = git status --porcelain 2>&1
if ($changes) {
    git add -A
    $date = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "auto-backup: $date"
    git push
}
