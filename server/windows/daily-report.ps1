# JFLIPSTUDIO SERVER - morning report written by Claude (Task Scheduler, 08:00, runs as the logged-in user).
# Claude gets NO tools here: it only reads the status JSON piped to it and writes a summary.
# Output: <Dropbox>\Server_Reports\YYYY-MM-DD.md (readable on the phone) and _system\daily-report.md (Mac).
# If Claude is not installed or fails, a plain report is written instead, so a report always appears.

$enc = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $enc
$OutputEncoding = $enc
. "$PSScriptRoot\config.ps1"

$reportDir = $JF.ReportsDir
[System.IO.Directory]::CreateDirectory($reportDir) | Out-Null
$today = Get-Date -Format 'yyyy-MM-dd'

$json = (& powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\jf.ps1" status) -join "`n"
$prompt = [System.IO.File]::ReadAllText("$PSScriptRoot\daily-report-prompt.md", $enc)

$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) { $c = Join-Path $env:USERPROFILE '.local\bin\claude.exe'; if (Test-Path $c) { $claude = $c } }

$fence = '```'
$report = $null
if ($claude) {
    try {
        $report = (($prompt + "`n`n${fence}json`n" + $json + "`n$fence") | & $claude -p --max-turns 1 --disallowedTools 'Bash,Edit,Write,WebFetch,WebSearch') -join "`n"
        if ($LASTEXITCODE -ne 0 -or -not $report.Trim()) { $report = $null }
    } catch { $report = $null }
}
if (-not $report) {
    $report = "# $($JF.StudioName) SERVER $today`n`n(Claude report unavailable - raw status below)`n`n${fence}json`n$json`n$fence"
    Write-JFLog 'daily-report' 'claude unavailable - wrote raw report'
} else {
    Write-JFLog 'daily-report' 'report written'
}

[System.IO.File]::WriteAllText((Join-Path $reportDir "$today.md"), $report + "`n", $enc)
[System.IO.File]::WriteAllText((Join-Path $JF.System 'daily-report.md'), $report + "`n", $enc)

# keep 60 days of reports
Get-ChildItem -LiteralPath $reportDir -Filter '*.md' | Where-Object LastWriteTime -lt (Get-Date).AddDays(-60) | Remove-Item -Force
