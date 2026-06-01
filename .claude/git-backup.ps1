<#
  git-backup.ps1 - add + commit + push for this project.

  Two modes:
   - No args      : auto-backup. Commits "auto-backup: <date>". Used by the Stop hook.
   - -MessageFile : manual commit. Reads the full message from a UTF-8 file
                    (git commit -F), so quotes/$/backticks never break it.

  Guards three recurring PowerShell/git pitfalls:
   1. git not on session PATH  : refreshes PATH from Machine + User.
   2. here-string mangles commit messages with quotes : commit -F from file.
   3. missing identity on first commit : sets a fallback.

  NOTE: keep this file ASCII-only. PowerShell 5.1 reads UTF-8-without-BOM as the
  system codepage and corrupts non-ASCII chars, which breaks parsing.
#>
param(
  [string] $MessageFile
)

$projectPath = "D:\claude\vibeclaude\AI vs Human"

# 1. Refresh PATH so git resolves even if the session predates the install.
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH", "User")

Set-Location $projectPath

# 2. Identity guard (first-commit safety).
if (-not (git config user.name)) {
  git config user.name  "Fl00ky"
  git config user.email "Fl00ky@users.noreply.github.com"
}

# 3. Stage; skip if nothing changed.
$changes = git status --porcelain
if (-not $changes) {
  Write-Output "nothing to commit - working tree clean"
  return
}
git add -A

# 4. Commit - from file if provided (manual), else timestamped (auto-backup).
if ($MessageFile -and (Test-Path $MessageFile)) {
  git commit -F $MessageFile
} else {
  $date = Get-Date -Format "yyyy-MM-dd HH:mm"
  git commit -m "auto-backup: $date"
}
if ($LASTEXITCODE -ne 0) { Write-Output "git commit failed"; return }

$hash = git rev-parse --short HEAD

# 5. Push. git push prints progress to stderr (not an error) - judge by exit code.
$pushOut = git push 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
  Write-Output "committed $hash but PUSH FAILED:`n$pushOut"
  return
}
Write-Output "OK committed $hash and pushed"
